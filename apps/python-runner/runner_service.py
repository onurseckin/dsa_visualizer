"""Internal HTTP parent for the per-request Python execution harness."""

from __future__ import annotations

import json
import os
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from execution_harness import json_encoded_size


DEFAULT_MAX_BODY_BYTES = 5 * 1024 * 1024
DEFAULT_READ_TIMEOUT_SECONDS = 2.0
DEFAULT_MAX_ACTIVE = 2
DEFAULT_MAX_REQUEST_THREADS = 8
MAX_PROTOCOL_RESPONSE_BYTES = 5 * 1024 * 1024
MAX_PROTOCOL_STDERR_BYTES = 64 * 1024
DEFAULT_CANCELLATION_TOMBSTONE_TTL_SECONDS = 5.0
DEFAULT_MAX_CANCELLATION_TOMBSTONES = 256
POLICY_DEFAULTS = {
    "wallTimeMs": 10_000,
    "maxSourceBytes": 64 * 1024,
    "maxInputBytes": 256 * 1024,
    "maxOutputBytes": 64 * 1024,
    "maxResultBytes": 256 * 1024,
    "maxCases": 100,
}
POLICY_CEILINGS = {
    "wallTimeMs": 30_000,
    "maxSourceBytes": 256 * 1024,
    "maxInputBytes": 1024 * 1024,
    "maxOutputBytes": 256 * 1024,
    "maxResultBytes": 1024 * 1024,
    "maxCases": 250,
}
HARNESS_PATH = Path(__file__).with_name("execution_harness.py").resolve()


class _RunControl:
    def __init__(self) -> None:
        self.cancelled = threading.Event()
        self._lock = threading.Lock()
        self._process: subprocess.Popen[bytes] | None = None

    def attach(self, process: subprocess.Popen[bytes]) -> None:
        with self._lock:
            self._process = process
            if self.cancelled.is_set():
                _kill_process_tree(process)

    def detach(self, process: subprocess.Popen[bytes]) -> None:
        with self._lock:
            if self._process is process:
                self._process = None

    def cancel(self) -> None:
        self.cancelled.set()
        with self._lock:
            process = self._process
            if process is not None:
                _kill_process_tree(process)


class _BoundedPipeCapture:
    def __init__(
        self,
        pipe: Any,
        *,
        limit: int,
        process: subprocess.Popen[bytes],
    ) -> None:
        self._pipe = pipe
        self._limit = max(0, limit)
        self._process = process
        self.data = bytearray()
        self.overflowed = False

    def read(self) -> None:
        try:
            while True:
                chunk = self._pipe.read(64 * 1024)
                if not chunk:
                    return
                remaining = self._limit - len(self.data)
                if remaining > 0:
                    self.data.extend(chunk[:remaining])
                if len(chunk) > remaining:
                    self.overflowed = True
                    _kill_process_tree(self._process)
                    return
        finally:
            self._pipe.close()


class ExecutionManager:
    """Bounded registry of active process groups, keyed by canonical run ID."""

    def __init__(
        self,
        *,
        max_active: int = DEFAULT_MAX_ACTIVE,
        cancellation_tombstone_ttl_seconds: float = DEFAULT_CANCELLATION_TOMBSTONE_TTL_SECONDS,
        max_cancellation_tombstones: int = DEFAULT_MAX_CANCELLATION_TOMBSTONES,
    ) -> None:
        self._slots = threading.BoundedSemaphore(max(1, max_active))
        self._lock = threading.Lock()
        self._idle = threading.Condition(self._lock)
        self._active: dict[str, _RunControl] = {}
        self._cancellation_tombstone_ttl_seconds = max(
            0.01,
            cancellation_tombstone_ttl_seconds,
        )
        self._max_cancellation_tombstones = max(1, max_cancellation_tombstones)
        self._cancellation_tombstones: dict[str, float] = {}

    def run(self, request: dict[str, Any]) -> dict[str, Any]:
        started = time.monotonic()
        run_id = _run_id(request)
        validation_error = _validate_request_policy(request)
        if validation_error is not None:
            return _execution_error(run_id, "error", validation_error, started)
        with self._lock:
            if self._consume_cancellation_tombstone(run_id):
                return _execution_error(
                    run_id,
                    "error",
                    "Python execution was cancelled.",
                    started,
                )
        if not self._slots.acquire(blocking=False):
            return _execution_error(
                run_id,
                "error",
                "Python runner is at capacity.",
                started,
            )

        control = _RunControl()
        with self._lock:
            if self._consume_cancellation_tombstone(run_id):
                self._slots.release()
                return _execution_error(
                    run_id,
                    "error",
                    "Python execution was cancelled.",
                    started,
                )
            if run_id in self._active:
                self._slots.release()
                return _execution_error(
                    run_id,
                    "error",
                    "A Python run with this runId is already active.",
                    started,
                )
            self._active[run_id] = control
        try:
            return _run_child(request, control, started)
        finally:
            with self._idle:
                if self._active.get(run_id) is control:
                    self._active.pop(run_id, None)
                self._idle.notify_all()
            self._slots.release()

    def cancel(self, run_id: str) -> bool:
        with self._lock:
            self._prune_cancellation_tombstones()
            control = self._active.get(run_id)
            if control is None:
                self._cancellation_tombstones.pop(run_id, None)
                while len(self._cancellation_tombstones) >= self._max_cancellation_tombstones:
                    self._cancellation_tombstones.pop(next(iter(self._cancellation_tombstones)))
                self._cancellation_tombstones[run_id] = (
                    time.monotonic() + self._cancellation_tombstone_ttl_seconds
                )
        if control is None:
            return True
        control.cancel()
        return True

    def _consume_cancellation_tombstone(self, run_id: str) -> bool:
        self._prune_cancellation_tombstones()
        return self._cancellation_tombstones.pop(run_id, None) is not None

    def _prune_cancellation_tombstones(self) -> None:
        now = time.monotonic()
        expired = [
            run_id
            for run_id, expires_at in self._cancellation_tombstones.items()
            if expires_at <= now
        ]
        for run_id in expired:
            self._cancellation_tombstones.pop(run_id, None)

    def cancel_all(self) -> None:
        with self._lock:
            controls = list(self._active.values())
        for control in controls:
            control.cancel()

    def active_run_ids(self) -> tuple[str, ...]:
        with self._lock:
            return tuple(sorted(self._active))

    def wait_for_idle(self, timeout: float) -> bool:
        with self._idle:
            return self._idle.wait_for(lambda: not self._active, timeout=timeout)


class RunnerHttpServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self,
        address: tuple[str, int],
        handler: type[BaseHTTPRequestHandler],
        *,
        max_active: int,
        max_request_threads: int,
        read_timeout_seconds: float,
    ) -> None:
        self.execution_manager = ExecutionManager(max_active=max_active)
        request_threads = max(1, max_request_threads)
        self.request_slots = threading.BoundedSemaphore(request_threads)
        self.control_slots = threading.BoundedSemaphore(2)
        self.read_timeout_seconds = max(0.01, read_timeout_seconds)
        self.max_connection_threads = request_threads + 2
        self._connection_slots = threading.BoundedSemaphore(self.max_connection_threads)
        self._connection_count_lock = threading.Lock()
        self._active_connection_count = 0
        self.peak_connection_count = 0
        super().__init__(address, handler)

    @property
    def active_connection_count(self) -> int:
        with self._connection_count_lock:
            return self._active_connection_count

    def process_request(self, request: socket.socket, client_address: Any) -> None:
        if not self._connection_slots.acquire(blocking=False):
            self.shutdown_request(request)
            return
        try:
            request.settimeout(self.read_timeout_seconds)
            with self._connection_count_lock:
                self._active_connection_count += 1
                self.peak_connection_count = max(
                    self.peak_connection_count,
                    self._active_connection_count,
                )
            super().process_request(request, client_address)
        except BaseException:
            self._release_connection_slot()
            raise

    def process_request_thread(self, request: socket.socket, client_address: Any) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._release_connection_slot()

    def _release_connection_slot(self) -> None:
        with self._connection_count_lock:
            self._active_connection_count -= 1
        self._connection_slots.release()

    def server_close(self) -> None:
        self.execution_manager.cancel_all()
        self.execution_manager.wait_for_idle(timeout=2)
        super().server_close()


def run_in_subprocess(request: dict[str, Any]) -> dict[str, Any]:
    """Run one request through the same bounded manager used by HTTP."""

    return ExecutionManager(max_active=1).run(request)


def create_server(
    host: str,
    port: int,
    *,
    max_body_bytes: int = DEFAULT_MAX_BODY_BYTES,
    read_timeout_seconds: float = DEFAULT_READ_TIMEOUT_SECONDS,
    max_active: int = DEFAULT_MAX_ACTIVE,
    max_request_threads: int = DEFAULT_MAX_REQUEST_THREADS,
) -> RunnerHttpServer:
    handler = _handler_class(max_body_bytes)
    return RunnerHttpServer(
        (host, port),
        handler,
        max_active=max_active,
        max_request_threads=max_request_threads,
        read_timeout_seconds=read_timeout_seconds,
    )


def _run_child(
    request: dict[str, Any],
    control: _RunControl,
    started: float,
) -> dict[str, Any]:
    run_id = _run_id(request)
    timeout_ms = _effective_limits(request)["wallTimeMs"]
    try:
        payload = json.dumps(
            request,
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
    except (TypeError, ValueError, OverflowError, UnicodeEncodeError):
        return _execution_error(run_id, "error", "Run request must be valid JSON.", started)

    process: subprocess.Popen[bytes] | None = None
    try:
        with tempfile.TemporaryDirectory(prefix="dsa-python-run-") as working_directory:
            process = subprocess.Popen(
                [sys.executable, "-I", str(HARNESS_PATH)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=working_directory,
                start_new_session=os.name == "posix",
            )
            control.attach(process)
            try:
                stdout, stderr, protocol_overflow = _communicate_owned_process(
                    process,
                    payload,
                    timeout=timeout_ms / 1_000,
                    control=control,
                )
            except subprocess.TimeoutExpired:
                if control.cancelled.is_set():
                    return _execution_error(
                        run_id,
                        "error",
                        "Python execution was cancelled.",
                        started,
                    )
                return _execution_error(
                    run_id,
                    "timeout",
                    f"Execution exceeded the {timeout_ms} ms time limit.",
                    started,
                )
            if protocol_overflow is not None:
                stream_name, byte_limit = protocol_overflow
                return _execution_error(
                    run_id,
                    "error",
                    f"Runner protocol {stream_name} byte limit of {byte_limit} was exceeded.",
                    started,
                )
            if control.cancelled.is_set():
                return _execution_error(
                    run_id,
                    "error",
                    "Python execution was cancelled.",
                    started,
                )
    except (OSError, ValueError) as error:
        if process is not None and process.returncode is None:
            _kill_process_tree(process)
            control.detach(process)
            try:
                process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        return _execution_error(run_id, "error", f"Runner failed: {error}", started)
    finally:
        if process is not None:
            control.detach(process)

    if process.returncode != 0:
        detail = _bounded_decode(stderr, 64 * 1024).strip()
        if not detail:
            detail = f"Runner exited with code {process.returncode}."
        return _execution_error(run_id, "error", detail, started)
    try:
        result = json.loads(stdout)
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
        return _execution_error(run_id, "error", "Runner returned invalid JSON.", started)
    if not _looks_like_result(result, run_id):
        return _execution_error(run_id, "error", "Runner returned an invalid result.", started)
    return result


def _handler_class(max_body_bytes: int) -> type[BaseHTTPRequestHandler]:
    class RunnerRequestHandler(BaseHTTPRequestHandler):
        server_version = "DSAPythonRunner/1"

        @property
        def runner_server(self) -> RunnerHttpServer:
            return self.server  # type: ignore[return-value]

        def do_GET(self) -> None:
            self._with_request_slot(self._do_get)

        def do_POST(self) -> None:
            self._with_request_slot(self._do_post)

        def do_OPTIONS(self) -> None:
            self._with_request_slot(
                lambda: self._error(
                    HTTPStatus.METHOD_NOT_ALLOWED,
                    "method_not_allowed",
                    "Method OPTIONS is not allowed for this route.",
                )
            )

        def _do_get(self) -> None:
            if self.path == "/health":
                self._write_json(HTTPStatus.OK, {"ok": True, "service": "python-runner"})
                return
            if self.path in {"/run", "/cancel"}:
                self._error(
                    HTTPStatus.METHOD_NOT_ALLOWED,
                    "method_not_allowed",
                    f"Method GET is not allowed for {self.path}.",
                    allow="POST",
                )
                return
            self._error(HTTPStatus.NOT_FOUND, "not_found", "Route not found.")

        def _do_post(self) -> None:
            if self.path not in {"/run", "/cancel"}:
                self._error(HTTPStatus.NOT_FOUND, "not_found", "Route not found.")
                return
            body = self._read_json_body(max_body_bytes)
            if body is None:
                return
            if self.path == "/cancel":
                run_id = body.get("runId") if isinstance(body, dict) else None
                if not isinstance(run_id, str) or not run_id:
                    self._error(
                        HTTPStatus.BAD_REQUEST,
                        "invalid_request",
                        "Cancel request requires a non-empty runId.",
                    )
                    return
                cancelled = self.runner_server.execution_manager.cancel(run_id)
                self._write_json(
                    HTTPStatus.OK,
                    {"ok": True, "cancelled": cancelled, "runId": run_id},
                )
                return
            if not isinstance(body, dict):
                self._error(
                    HTTPStatus.BAD_REQUEST,
                    "invalid_request",
                    "Run request must be an object.",
                )
                return
            result = self.runner_server.execution_manager.run(body)
            self._write_json(HTTPStatus.OK, result)

        def _read_json_body(self, body_limit: int) -> Any | None:
            declared = self.headers.get("Content-Length")
            try:
                length = int(declared) if declared is not None else -1
            except ValueError:
                length = -1
            if length < 0:
                self._error(
                    HTTPStatus.LENGTH_REQUIRED,
                    "length_required",
                    "Content-Length is required.",
                )
                return None
            if length > body_limit:
                self._error(
                    HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                    "body_too_large",
                    f"Request body exceeds the {body_limit} byte limit.",
                )
                return None
            previous_timeout = self.connection.gettimeout()
            self.connection.settimeout(self.runner_server.read_timeout_seconds)
            try:
                body = self.rfile.read(length)
            except (TimeoutError, socket.timeout):
                self.close_connection = True
                self._error(
                    HTTPStatus.REQUEST_TIMEOUT,
                    "read_timeout",
                    "Request body read timed out.",
                )
                return None
            finally:
                self.connection.settimeout(previous_timeout)
            if len(body) != length:
                self._error(
                    HTTPStatus.BAD_REQUEST,
                    "incomplete_body",
                    "Request body ended before Content-Length bytes were received.",
                )
                return None
            try:
                return json.loads(body)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._error(
                    HTTPStatus.BAD_REQUEST,
                    "invalid_json",
                    "Request body must be valid JSON.",
                )
                return None

        def _with_request_slot(self, operation: Any) -> None:
            slots = (
                self.runner_server.control_slots
                if self.path == "/cancel"
                else self.runner_server.request_slots
            )
            if not slots.acquire(blocking=False):
                self._error(
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    "runner_overloaded",
                    "Runner request capacity is exhausted.",
                )
                return
            try:
                operation()
            finally:
                slots.release()

        def log_message(self, format: str, *args: object) -> None:
            return

        def _error(
            self,
            status: HTTPStatus,
            code: str,
            message: str,
            *,
            allow: str | None = None,
        ) -> None:
            self._write_json(status, {"error": {"code": code, "message": message}}, allow=allow)

        def _write_json(
            self,
            status: HTTPStatus,
            value: Any,
            *,
            allow: str | None = None,
        ) -> None:
            body = json.dumps(
                value,
                allow_nan=False,
                ensure_ascii=False,
                separators=(",", ":"),
            ).encode("utf-8")
            try:
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                if allow is not None:
                    self.send_header("Allow", allow)
                self.end_headers()
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError, OSError):
                self.close_connection = True

    return RunnerRequestHandler


def _validate_request_policy(request: dict[str, Any]) -> str | None:
    if not isinstance(request.get("runId"), str) or not request["runId"]:
        return "Run request requires a non-empty runId."
    code = request.get("code")
    spec = request.get("spec")
    if not isinstance(code, str) or not isinstance(spec, dict):
        return "Run request requires code and spec."
    if spec.get("runtime") != "server":
        return "Runner only accepts the server runtime."

    limits = spec.get("limits")
    if limits is not None and not isinstance(limits, dict):
        return "Execution limits must be an object."
    if isinstance(limits, dict):
        for name, value in limits.items():
            if name not in POLICY_CEILINGS:
                return f"Unsupported execution limit: {name}."
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not value > 0
            ):
                return f"Execution limit {name} must be positive."
            if value > POLICY_CEILINGS[name]:
                return f"Execution limit {name} exceeds the runner policy ceiling."
            if name == "maxCases" and not float(value).is_integer():
                return "Execution limit maxCases must be an integer."

    effective = _effective_limits(request)
    try:
        source_size = len(code.encode("utf-8"))
    except UnicodeEncodeError:
        return "Learner code must be valid UTF-8."
    if source_size > effective["maxSourceBytes"]:
        return "Learner code exceeds maxSourceBytes."
    cases = spec.get("cases")
    if not isinstance(cases, list) or not cases:
        return "Execution cases must be a non-empty array."
    if len(cases) > effective["maxCases"]:
        return "Execution cases exceed maxCases."
    input_size = 0
    expected_size = 0
    expected_stdout_size = 0
    selected_ids = request.get("caseIds")
    selected = set(selected_ids) if isinstance(selected_ids, list) else None
    for test_case in cases:
        if not isinstance(test_case, dict):
            return "Each execution case must be an object."
        input_size += _json_size(test_case.get("input"), effective["maxInputBytes"] - input_size)
        expected_size += _json_size(
            test_case.get("expected"),
            effective["maxResultBytes"] - expected_size,
        )
        if input_size > effective["maxInputBytes"]:
            return "Execution inputs exceed maxInputBytes."
        if expected_size > effective["maxResultBytes"]:
            return "Expected results exceed maxResultBytes."
        if (
            test_case.get("comparison") == "stdout"
            and (selected is None or test_case.get("id") in selected)
        ):
            expected_stdout = test_case.get("expected")
            if not isinstance(expected_stdout, str):
                return "Each expected stdout value must be a string."
            try:
                expected_stdout_size += len(expected_stdout.encode("utf-8"))
            except UnicodeEncodeError:
                return "Expected stdout must be valid UTF-8."
            if expected_stdout_size > effective["maxOutputBytes"]:
                return "Combined expected stdout exceeds maxOutputBytes."
    return None


def _effective_limits(request: dict[str, Any]) -> dict[str, int]:
    spec = request.get("spec")
    overrides = spec.get("limits") if isinstance(spec, dict) else None
    limits = dict(POLICY_DEFAULTS)
    if isinstance(overrides, dict):
        for name in limits:
            value = overrides.get(name)
            if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
                limits[name] = min(int(value), POLICY_CEILINGS[name])
    return limits


def _json_size(value: Any, remaining: int) -> int:
    size = json_encoded_size(value, max(0, remaining))
    return max(0, remaining) + 1 if size is None else size


def _communicate_owned_process(
    process: subprocess.Popen[bytes],
    payload: bytes,
    *,
    timeout: float,
    control: _RunControl,
) -> tuple[bytes, bytes, tuple[str, int] | None]:
    if os.name == "posix" and (not hasattr(os, "waitid") or not hasattr(os, "WNOWAIT")):
        raise OSError("POSIX runner requires waitid with WNOWAIT support.")
    if process.stdin is None or process.stdout is None or process.stderr is None:
        raise ValueError("Runner process pipes were not created.")
    stdout_capture = _BoundedPipeCapture(
        process.stdout,
        limit=MAX_PROTOCOL_RESPONSE_BYTES,
        process=process,
    )
    stderr_capture = _BoundedPipeCapture(
        process.stderr,
        limit=MAX_PROTOCOL_STDERR_BYTES,
        process=process,
    )
    reader_threads = [
        threading.Thread(target=stdout_capture.read, daemon=True),
        threading.Thread(target=stderr_capture.read, daemon=True),
    ]

    def write_request() -> None:
        try:
            process.stdin.write(payload)
            process.stdin.flush()
        except (BrokenPipeError, OSError, ValueError):
            pass
        finally:
            try:
                process.stdin.close()
            except OSError:
                pass

    writer_thread = threading.Thread(target=write_request, daemon=True)
    for thread in reader_threads:
        thread.start()
    writer_thread.start()
    pending_error: BaseException | None = None
    wait_without_reaping = os.name == "posix"
    try:
        if wait_without_reaping:
            _wait_without_reaping(process, timeout)
        else:
            process.wait(timeout=timeout)
    except BaseException as error:
        pending_error = error
    finally:
        # On POSIX the session leader remains an unreaped zombie here, so its
        # owned PGID cannot be reused between termination and synchronized detach.
        _kill_process_tree(process)
        control.detach(process)
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        writer_thread.join(timeout=1)
        for thread in reader_threads:
            thread.join(timeout=1)

    if pending_error is not None:
        raise pending_error
    overflow = None
    if stdout_capture.overflowed:
        overflow = ("stdout", MAX_PROTOCOL_RESPONSE_BYTES)
    elif stderr_capture.overflowed:
        overflow = ("stderr", MAX_PROTOCOL_STDERR_BYTES)
    return bytes(stdout_capture.data), bytes(stderr_capture.data), overflow


def _wait_without_reaping(process: subprocess.Popen[bytes], timeout: float) -> None:
    deadline = time.monotonic() + timeout
    flags = os.WEXITED | os.WNOHANG | os.WNOWAIT
    while True:
        try:
            status = os.waitid(os.P_PID, process.pid, flags)
        except InterruptedError:
            continue
        if status is not None:
            return
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise subprocess.TimeoutExpired(process.args, timeout)
        time.sleep(min(0.005, remaining))


def _kill_process_tree(process: subprocess.Popen[bytes]) -> None:
    if os.name == "posix":
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except (ProcessLookupError, OSError):
            pass
        return
    try:
        if process.poll() is None:
            process.kill()
    except (ProcessLookupError, OSError):
        try:
            process.kill()
        except (ProcessLookupError, OSError):
            pass


def _bounded_decode(value: bytes, max_bytes: int) -> str:
    return value[:max_bytes].decode("utf-8", errors="replace")


def _run_id(request: dict[str, Any]) -> str:
    value = request.get("runId")
    return value if isinstance(value, str) and value else "unknown"


def _looks_like_result(value: Any, run_id: str) -> bool:
    return (
        isinstance(value, dict)
        and value.get("runId") == run_id
        and value.get("status") in {"passed", "failed", "error", "timeout"}
        and value.get("runtime") == "server"
        and isinstance(value.get("stdout"), str)
        and isinstance(value.get("stderr"), str)
        and isinstance(value.get("cases"), list)
        and isinstance(value.get("durationMs"), (int, float))
    )


def _execution_error(
    run_id: str,
    status: str,
    stderr: str,
    started: float,
) -> dict[str, Any]:
    return {
        "runId": run_id,
        "status": status,
        "stdout": "",
        "stderr": stderr,
        "cases": [],
        "durationMs": max(0, round((time.monotonic() - started) * 1_000)),
        "runtime": "server",
    }


def main() -> int:
    host = os.environ.get("RUNNER_HOST", "0.0.0.0")
    port = _positive_integer(os.environ.get("RUNNER_PORT"), 8080)
    max_body_bytes = max(
        DEFAULT_MAX_BODY_BYTES,
        _positive_integer(
            os.environ.get("RUNNER_MAX_BODY_BYTES"),
            DEFAULT_MAX_BODY_BYTES,
        ),
    )
    max_active = _positive_integer(
        os.environ.get("RUNNER_MAX_ACTIVE"),
        DEFAULT_MAX_ACTIVE,
    )
    max_request_threads = _positive_integer(
        os.environ.get("RUNNER_MAX_REQUEST_THREADS"),
        DEFAULT_MAX_REQUEST_THREADS,
    )
    read_timeout_ms = _positive_integer(
        os.environ.get("RUNNER_READ_TIMEOUT_MS"),
        round(DEFAULT_READ_TIMEOUT_SECONDS * 1_000),
    )
    server = create_server(
        host,
        port,
        max_body_bytes=max_body_bytes,
        read_timeout_seconds=read_timeout_ms / 1_000,
        max_active=max_active,
        max_request_threads=max_request_threads,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


def _positive_integer(raw: str | None, fallback: int) -> int:
    try:
        value = int(raw) if raw is not None else fallback
    except ValueError:
        return fallback
    return value if value > 0 else fallback


if __name__ == "__main__":
    raise SystemExit(main())
