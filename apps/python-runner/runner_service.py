"""Internal HTTP parent for the per-request Python execution harness."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024
DEFAULT_WALL_TIME_MS = 10_000
MAX_WALL_TIME_MS = 30_000
HARNESS_PATH = Path(__file__).with_name("execution_harness.py").resolve()


def run_in_subprocess(request: dict[str, Any]) -> dict[str, Any]:
    """Run one request in a fresh isolated-mode child and temporary cwd."""

    started = time.monotonic()
    run_id = request.get("runId") if isinstance(request.get("runId"), str) else "unknown"
    timeout_ms = _wall_time_ms(request)
    payload = json.dumps(request, allow_nan=False, ensure_ascii=False, separators=(",", ":"))
    try:
        with tempfile.TemporaryDirectory(prefix="dsa-python-run-") as working_directory:
            completed = subprocess.run(
                [sys.executable, "-I", str(HARNESS_PATH)],
                input=payload,
                text=True,
                capture_output=True,
                cwd=working_directory,
                timeout=timeout_ms / 1_000,
                check=False,
            )
    except subprocess.TimeoutExpired:
        return _execution_error(
            run_id,
            "timeout",
            f"Execution exceeded the {timeout_ms} ms time limit.",
            started,
        )
    except (OSError, ValueError) as error:
        return _execution_error(run_id, "error", f"Runner failed: {error}", started)

    if completed.returncode != 0:
        detail = completed.stderr.strip() or f"Runner exited with code {completed.returncode}."
        return _execution_error(run_id, "error", detail, started)
    try:
        result = json.loads(completed.stdout)
    except (json.JSONDecodeError, TypeError):
        return _execution_error(run_id, "error", "Runner returned invalid JSON.", started)
    if not _looks_like_result(result, run_id):
        return _execution_error(run_id, "error", "Runner returned an invalid result.", started)
    return result


def create_server(
    host: str,
    port: int,
    *,
    max_body_bytes: int = DEFAULT_MAX_BODY_BYTES,
) -> ThreadingHTTPServer:
    handler = _handler_class(max_body_bytes)
    return ThreadingHTTPServer((host, port), handler)


def _handler_class(max_body_bytes: int) -> type[BaseHTTPRequestHandler]:
    class RunnerRequestHandler(BaseHTTPRequestHandler):
        server_version = "DSAPythonRunner/1"

        def do_GET(self) -> None:
            if self.path == "/health":
                self._write_json(HTTPStatus.OK, {"ok": True, "service": "python-runner"})
                return
            if self.path == "/run":
                self._error(
                    HTTPStatus.METHOD_NOT_ALLOWED,
                    "method_not_allowed",
                    "Method GET is not allowed for this route.",
                    allow="POST",
                )
                return
            self._error(HTTPStatus.NOT_FOUND, "not_found", "Route not found.")

        def do_POST(self) -> None:
            if self.path != "/run":
                self._error(HTTPStatus.NOT_FOUND, "not_found", "Route not found.")
                return
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
                return
            if length > max_body_bytes:
                self._error(
                    HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                    "body_too_large",
                    f"Request body exceeds the {max_body_bytes} byte limit.",
                )
                return
            body = self.rfile.read(length)
            try:
                request = json.loads(body)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._error(
                    HTTPStatus.BAD_REQUEST,
                    "invalid_json",
                    "Request body must be valid JSON.",
                )
                return
            if not isinstance(request, dict):
                self._error(
                    HTTPStatus.BAD_REQUEST,
                    "invalid_request",
                    "Run request must be an object.",
                )
                return
            self._write_json(HTTPStatus.OK, run_in_subprocess(request))

        def do_OPTIONS(self) -> None:
            self._error(
                HTTPStatus.METHOD_NOT_ALLOWED,
                "method_not_allowed",
                "Method OPTIONS is not allowed for this route.",
            )

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
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            if allow is not None:
                self.send_header("Allow", allow)
            self.end_headers()
            self.wfile.write(body)

    return RunnerRequestHandler


def _wall_time_ms(request: dict[str, Any]) -> int:
    spec = request.get("spec")
    limits = spec.get("limits") if isinstance(spec, dict) else None
    value = limits.get("wallTimeMs") if isinstance(limits, dict) else None
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
        return min(round(value), MAX_WALL_TIME_MS)
    return DEFAULT_WALL_TIME_MS


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
    max_body_bytes = _positive_integer(
        os.environ.get("RUNNER_MAX_BODY_BYTES"),
        DEFAULT_MAX_BODY_BYTES,
    )
    server = create_server(host, port, max_body_bytes=max_body_bytes)
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
