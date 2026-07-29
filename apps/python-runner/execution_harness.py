"""Trusted protocol harness for one authored Python exercise request.

The service and Docker container provide the process boundary. This module
adds stability containment for authored exercises, including process-creation
blocking, but deliberately does not claim to turn Python ``exec`` into a
hostile-code sandbox.
"""

from __future__ import annotations

import contextlib
import io
import json
import math
import os
import secrets
import sys
import time
import traceback
from collections.abc import Mapping, Sequence
from typing import Any


DEFAULT_LIMITS = {
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
TRUNCATION_MARKER = b"\n...[truncated]"
BLOCKED_PROCESS_AUDIT_EVENTS = frozenset(
    {
        "os.exec",
        "os.fork",
        "os.forkpty",
        "os.kill",
        "os.killpg",
        "os.posix_spawn",
        "os.spawn",
        "os.system",
        "pty.spawn",
        "subprocess.Popen",
    }
)
BLOCKED_CTYPES_PROCESS_SYMBOLS = frozenset(
    {
        "daemon",
        "dlmopen",
        "dlopen",
        "dlsym",
        "dlvsym",
        "getprocaddress",
        "kill",
        "killpg",
        "login_tty",
        "loadlibrarya",
        "loadlibraryex",
        "loadlibraryw",
        "nsaddressofsymbol",
        "nslookupsymbolinimage",
        "pidfd_open",
        "pidfd_send_signal",
        "process_vm_readv",
        "process_vm_writev",
        "ptrace",
        "setns",
        "setpgid",
        "setpgrp",
        "setsid",
        "syscall",
        "system",
        "tgkill",
        "tkill",
        "unshare",
        "wordexp",
    }
)
BLOCKED_CTYPES_PROCESS_TOKENS = ("clone", "exec", "fork", "popen", "spawn")
BLOCKED_OS_PROCESS_NAMES = frozenset(
    {
        "daemon",
        "fork",
        "forkpty",
        "kill",
        "killpg",
        "popen",
        "posix_spawn",
        "posix_spawnp",
        "setpgid",
        "setpgrp",
        "setsid",
        "system",
    }
)
INVOCATION_MAX_PATH_SEGMENTS = 32
INVOCATION_MAX_SETUP_STEPS = 32
INVOCATION_MAX_GRAPH_DEPTH = 64
INVOCATION_MAX_GRAPH_NODES = 10_000


class SafeNamespace:
    """Attribute view created only from authored JSON object primitives."""

    __slots__ = ("_values",)

    def __init__(self, values: Mapping[str, Any]) -> None:
        object.__setattr__(self, "_values", dict(values))

    def __getattr__(self, name: str) -> Any:
        _require_public_name(name)
        values = object.__getattribute__(self, "_values")
        try:
            return values[name]
        except KeyError as error:
            raise AttributeError(name) from error

    def __setattr__(self, name: str, value: Any) -> None:
        _require_public_name(name)
        values = object.__getattribute__(self, "_values")
        values[name] = value

    def public_value(self, name: str) -> Any:
        _require_public_name(name)
        return object.__getattribute__(self, "_values")[name]

    def public_items(self) -> Any:
        return object.__getattribute__(self, "_values").items()


class OutputBudget:
    """One aggregate retained-output budget shared by every case and stream."""

    def __init__(self, capacity: int) -> None:
        self.capacity = max(0, capacity)
        self.used = 0
        self.writers: list[CappedTextWriter] = []

    @property
    def remaining(self) -> int:
        return max(0, self.capacity - self.used)

    def register(self, writer: "CappedTextWriter") -> None:
        self.writers.append(writer)

    def consume(self, size: int) -> int:
        accepted = min(max(0, size), self.remaining)
        self.used += accepted
        return accepted

    def release(self, size: int) -> None:
        self.used = max(0, self.used - max(0, size))

    def reclaim_for_diagnostic(self, target: "CappedTextWriter", required: int) -> None:
        target.clear()
        if self.remaining >= required:
            return
        for writer in self.writers:
            if writer is target:
                continue
            writer.clear()
            if self.remaining >= required:
                return


class ExpectedStdoutComparator:
    """Compare semantic stdout incrementally without retaining learner output."""

    def __init__(self, expected: str) -> None:
        self._expected = expected.encode("utf-8")
        self._offset = 0
        self._matches = True
        self._overflowed = False

    def write_text(self, value: str) -> None:
        for offset in range(0, len(value), 1_024):
            self.write_bytes(value[offset : offset + 1_024].encode("utf-8"))

    def write_bytes(self, value: bytes) -> None:
        remaining = len(self._expected) - self._offset
        compared = min(len(value), max(0, remaining))
        if value[:compared] != self._expected[self._offset : self._offset + compared]:
            self._matches = False
        self._offset += compared
        if len(value) > compared:
            self._overflowed = True

    @property
    def matches(self) -> bool:
        return (
            self._matches
            and not self._overflowed
            and self._offset == len(self._expected)
        )


class CappedBinaryWriter:
    def __init__(self, text_writer: "CappedTextWriter") -> None:
        self._text_writer = text_writer

    def write(self, value: bytes | bytearray) -> int:
        return self._text_writer.write_bytes(bytes(value))

    def flush(self) -> None:
        return


class CappedTextWriter(io.TextIOBase):
    """UTF-8-aware writer that never retains more than its shared budget."""

    def __init__(
        self,
        budget: OutputBudget,
        *,
        stdout_comparator: ExpectedStdoutComparator | None = None,
    ) -> None:
        super().__init__()
        self._budget = budget
        self._stdout_comparator = stdout_comparator
        self._data = bytearray()
        self._binary = CappedBinaryWriter(self)
        self._truncated = False
        budget.register(self)

    @property
    def encoding(self) -> str:
        return "utf-8"

    @property
    def buffer(self) -> CappedBinaryWriter:
        return self._binary

    def writable(self) -> bool:
        return True

    def write(self, value: str) -> int:
        if not isinstance(value, str):
            raise TypeError("write() argument must be str")
        if self._stdout_comparator is not None:
            self._stdout_comparator.write_text(value)
        available = self._budget.remaining
        encoded, complete = _utf8_prefix(value, available)
        accepted = self._budget.consume(len(encoded))
        self._data.extend(encoded[:accepted])
        if not complete:
            self._mark_truncated()
        return len(value)

    def write_bytes(self, value: bytes) -> int:
        if self._stdout_comparator is not None:
            self._stdout_comparator.write_bytes(value)
        accepted = self._budget.consume(len(value))
        self._data.extend(value[:accepted])
        if accepted < len(value):
            self._mark_truncated()
        return len(value)

    def flush(self) -> None:
        return

    def clear(self) -> None:
        self._budget.release(len(self._data))
        self._data.clear()
        self._truncated = False

    def set_diagnostic(self, diagnostic: str, *, reclaim_other_streams: bool = True) -> None:
        encoded = _capped_diagnostic_bytes(diagnostic, self._budget.capacity)
        self.set_diagnostic_bytes(encoded, reclaim_other_streams=reclaim_other_streams)

    def set_exception(
        self,
        exception_info: tuple[type[BaseException], BaseException, Any],
    ) -> None:
        self.set_diagnostic_bytes(_exception_diagnostic(exception_info, self._budget.capacity))

    def set_diagnostic_bytes(
        self,
        encoded: bytes,
        *,
        reclaim_other_streams: bool = True,
    ) -> None:
        self.clear()
        if reclaim_other_streams:
            self._budget.reclaim_for_diagnostic(self, len(encoded))
        elif len(encoded) > self._budget.remaining:
            encoded = _capped_bytes_suffix(encoded, self._budget.remaining)
        accepted = self._budget.consume(len(encoded))
        self._data.extend(encoded[:accepted])
        self._truncated = len(encoded) > accepted

    def getvalue(self) -> str:
        return bytes(self._data).decode("utf-8", errors="ignore")

    def _mark_truncated(self) -> None:
        if self._truncated:
            return
        self._truncated = True
        required = len(TRUNCATION_MARKER)
        if self._budget.remaining >= required:
            self._budget.consume(required)
            self._data.extend(TRUNCATION_MARKER)
            return
        reclaim = required - self._budget.remaining
        if reclaim > len(self._data):
            return
        if reclaim:
            target_size = len(self._data) - reclaim
            prefix = bytes(self._data[:target_size]).decode("utf-8", errors="ignore").encode("utf-8")
            released = len(self._data) - len(prefix)
            self._data[:] = prefix
            self._budget.release(released)
        accepted = self._budget.consume(required)
        self._data.extend(TRUNCATION_MARKER[:accepted])


class DiagnosticTailWriter(io.TextIOBase):
    """Retain only the tail of incrementally formatted exception diagnostics."""

    def __init__(self, capacity: int) -> None:
        super().__init__()
        self._capacity = max(0, capacity)
        self._data = bytearray()
        self._truncated = False

    def writable(self) -> bool:
        return True

    def write(self, value: str) -> int:
        if not isinstance(value, str):
            raise TypeError("write() argument must be str")
        encoded, complete = _utf8_suffix(value, self._capacity)
        if not complete:
            self._truncated = True
            self._data[:] = encoded
            return len(value)
        combined = bytes(self._data) + encoded
        if len(combined) > self._capacity:
            self._truncated = True
            combined = _capped_bytes_suffix(combined, self._capacity)
        self._data[:] = combined
        return len(value)

    def flush(self) -> None:
        return

    def getvalue(self) -> bytes:
        if not self._truncated:
            return bytes(self._data)
        if self._capacity == 0:
            return b""
        if self._capacity <= len(TRUNCATION_MARKER):
            return TRUNCATION_MARKER[-self._capacity :]
        suffix = _capped_bytes_suffix(
            bytes(self._data),
            self._capacity - len(TRUNCATION_MARKER),
        )
        return TRUNCATION_MARKER + suffix


def execute_request(request: Mapping[str, Any]) -> dict[str, Any]:
    """Execute selected authored cases and return a JSON-compatible result."""

    started = time.monotonic()
    run_id = _run_id(request)
    spec = request.get("spec")
    if not isinstance(spec, Mapping):
        return _request_error(run_id, "Execution spec must be an object.", started)
    code = request.get("code")
    if not isinstance(code, str):
        return _request_error(run_id, "Learner code must be a string.", started)

    limits = _limits(spec.get("limits"))
    cases = spec.get("cases")
    if not isinstance(cases, Sequence) or isinstance(cases, (str, bytes)):
        return _request_error(run_id, "Execution cases must be an array.", started)
    selected_ids = request.get("caseIds")
    if isinstance(selected_ids, list):
        selected = set(selected_ids)
        cases = [test_case for test_case in cases if test_case.get("id") in selected]

    expected_stdout_error = _expected_stdout_budget_error(
        cases,
        limits["maxOutputBytes"],
    )
    if expected_stdout_error is not None:
        return _request_error(run_id, expected_stdout_error, started)

    output_budget = OutputBudget(limits["maxOutputBytes"])
    case_results = [
        _execute_case(code, spec, test_case, output_budget)
        for test_case in cases[: limits["maxCases"]]
        if isinstance(test_case, Mapping)
    ]
    _apply_result_budget(case_results, limits["maxResultBytes"])
    _materialize_streams(case_results)
    status = _overall_status(case_results)
    stdout = "".join(str(result.get("stdout", "")) for result in case_results)
    stderr = "".join(str(result.get("stderr", "")) for result in case_results)
    return {
        "runId": run_id,
        "status": status,
        "stdout": stdout,
        "stderr": stderr,
        "cases": case_results,
        "durationMs": _elapsed_ms(started),
        "runtime": "server",
    }


def _execute_case(
    code: str,
    spec: Mapping[str, Any],
    test_case: Mapping[str, Any],
    output_budget: OutputBudget,
) -> dict[str, Any]:
    started = time.monotonic()
    comparison = str(test_case.get("comparison"))
    expected = test_case.get("expected")
    stdout_comparator = (
        ExpectedStdoutComparator(expected)
        if comparison == "stdout" and isinstance(expected, str)
        else None
    )
    stdout_writer = CappedTextWriter(
        output_budget,
        stdout_comparator=stdout_comparator,
    )
    stderr_writer = CappedTextWriter(output_budget)
    case_id = str(test_case.get("id", "unknown"))
    result: dict[str, Any] = {
        "id": case_id,
        "status": "error",
        "durationMs": 0,
        "_stdoutWriter": stdout_writer,
        "_stderrWriter": stderr_writer,
    }

    try:
        with contextlib.redirect_stdout(stdout_writer), contextlib.redirect_stderr(stderr_writer):
            actual = _invoke(code, spec, test_case.get("input"))
        compared_actual = stdout_writer.getvalue() if comparison == "stdout" else actual
        passed = (
            stdout_comparator.matches
            if stdout_comparator is not None
            else _compare(compared_actual, expected, comparison, test_case.get("tolerance"))
        )
        result["status"] = "passed" if passed else "failed"
        result["actual"] = compared_actual
    except BaseException:
        stderr_writer.set_exception(sys.exc_info())

    result["durationMs"] = _elapsed_ms(started)
    return result


def _invoke(code: str, spec: Mapping[str, Any], case_input: Any) -> Any:
    invocation = spec.get("invocation")
    if not isinstance(invocation, Mapping):
        raise ValueError("Invocation must be an object.")
    kind = invocation.get("kind")
    namespace: dict[str, Any] = {"__name__": "__learner__"}

    if kind == "stdin":
        previous_stdin = sys.stdin
        try:
            sys.stdin = io.StringIO(case_input)
            exec(compile(code, "<learner>", "exec"), namespace, namespace)
        finally:
            sys.stdin = previous_stdin
        return None

    exec(compile(code, "<learner>", "exec"), namespace, namespace)
    entrypoint = spec.get("entrypoint")
    target = namespace.get(entrypoint)
    if target is None:
        raise NameError(f"Entrypoint {entrypoint!r} was not defined.")

    if kind == "function":
        returned = target(*_bound_values(invocation.get("arguments"), case_input))
        return _select_invocation_result(invocation, returned, case_input, None)
    if kind == "class-method":
        instance = target(*_bound_values(invocation.get("constructor"), case_input))
        setup = invocation.get("setup", [])
        if not isinstance(setup, Sequence) or isinstance(setup, (str, bytes)):
            raise ValueError("Setup must be an array.")
        if len(setup) > INVOCATION_MAX_SETUP_STEPS:
            raise ValueError("Setup exceeds the authored step limit.")
        for step in setup:
            if not isinstance(step, Mapping):
                raise ValueError("Each setup step must be an object.")
            method = _public_method(instance, step.get("method"))
            method(*_bound_values(step.get("arguments"), case_input, instance))
        method_name = invocation.get("method")
        method = _public_method(instance, method_name)
        returned = method(*_bound_values(invocation.get("arguments"), case_input, instance))
        return _select_invocation_result(invocation, returned, case_input, instance)
    raise ValueError(f"Unsupported invocation kind: {kind!r}.")


def _bound_values(bindings: Any, case_input: Any, instance: Any = None) -> list[Any]:
    if not isinstance(bindings, Sequence) or isinstance(bindings, (str, bytes)):
        raise ValueError("Bindings must be an array.")
    values = []
    for binding in bindings:
        if not isinstance(binding, Mapping):
            raise ValueError("Each binding must be an object.")
        source = binding.get("from")
        if source == "input":
            value = _value_at_path(case_input, binding.get("path"), allow_learner_objects=False)
            if binding.get("convert") == "namespace":
                value = _to_safe_namespace(value)
            elif binding.get("convert") is not None:
                raise ValueError("Unsupported input conversion.")
        elif source == "instance" and instance is not None:
            if binding.get("convert") is not None:
                raise ValueError("Instance bindings cannot convert values.")
            value = _value_at_path(instance, binding.get("path"), allow_learner_objects=True)
        else:
            raise ValueError("Only authored input and instance bindings are supported.")
        values.append(value)
    return values


def _select_invocation_result(
    invocation: Mapping[str, Any],
    returned: Any,
    case_input: Any,
    instance: Any,
) -> Any:
    selection = invocation.get("result")
    if selection is None:
        return returned
    if not isinstance(selection, Mapping):
        raise ValueError("Result selection must be an object.")
    source = selection.get("from")
    if source == "return":
        value = returned
        allow_learner_objects = True
    elif source == "input":
        value = case_input
        allow_learner_objects = False
    elif source == "instance" and instance is not None:
        value = instance
        allow_learner_objects = True
    else:
        raise ValueError("Unsupported result source.")
    value = _value_at_path(
        value,
        selection.get("path"),
        allow_learner_objects=allow_learner_objects,
    )
    if selection.get("project") == "json":
        return _project_safe_json(value)
    if selection.get("project") is not None:
        raise ValueError("Unsupported result projection.")
    return value


def _value_at_path(value: Any, path: Any, *, allow_learner_objects: bool) -> Any:
    if not isinstance(path, Sequence) or isinstance(path, (str, bytes)):
        raise ValueError("Binding paths must be arrays.")
    if len(path) > INVOCATION_MAX_PATH_SEGMENTS:
        raise ValueError("Binding path exceeds the segment limit.")
    current = value
    for segment in path:
        if isinstance(segment, str):
            _require_public_name(segment)
            if isinstance(current, Mapping):
                current = current[segment]
            elif isinstance(current, SafeNamespace):
                current = current.public_value(segment)
            elif allow_learner_objects:
                values = object.__getattribute__(current, "__dict__")
                if not isinstance(values, Mapping):
                    raise ValueError("Learner object fields must use a plain attribute dictionary.")
                current = values[segment]
            else:
                raise ValueError("String paths require an object value.")
        elif isinstance(segment, int) and not isinstance(segment, bool) and segment >= 0:
            if not isinstance(current, (list, tuple)):
                raise ValueError("Numeric paths require an array value.")
            current = current[segment]
        else:
            raise ValueError("Binding path segments must be public strings or non-negative integers.")
    return current


def _public_method(instance: Any, name: Any) -> Any:
    _require_public_name(name)
    method = getattr(instance, name)
    if not callable(method):
        raise TypeError(f"Authored method {name!r} is not callable.")
    return method


def _require_public_name(name: Any) -> None:
    if (
        not isinstance(name, str)
        or not name
        or name.startswith("_")
        or not name.isidentifier()
    ):
        raise ValueError("Authored names and paths must use public identifiers.")


def _to_safe_namespace(value: Any) -> Any:
    return _convert_safe_namespace(value, 0, set(), [0])


def _convert_safe_namespace(
    value: Any,
    depth: int,
    active: set[int],
    count: list[int],
) -> Any:
    _consume_graph_node(depth, count)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        identity = id(value)
        _enter_graph(identity, active)
        try:
            return [
                _convert_safe_namespace(item, depth + 1, active, count)
                for item in value
            ]
        finally:
            active.remove(identity)
    if isinstance(value, Mapping):
        if not all(isinstance(key, str) for key in value):
            raise ValueError("Namespace conversion requires string object keys.")
        identity = id(value)
        _enter_graph(identity, active)
        try:
            converted = {}
            for key, item in value.items():
                _require_public_name(key)
                converted[key] = _convert_safe_namespace(item, depth + 1, active, count)
            return SafeNamespace(converted)
        finally:
            active.remove(identity)
    raise ValueError("Namespace conversion accepts only JSON primitives.")


def _project_safe_json(value: Any) -> Any:
    return _convert_safe_json(value, 0, set(), [0])


def _convert_safe_json(
    value: Any,
    depth: int,
    active: set[int],
    count: list[int],
) -> Any:
    _consume_graph_node(depth, count)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        identity = id(value)
        _enter_graph(identity, active)
        try:
            return [_convert_safe_json(item, depth + 1, active, count) for item in value]
        finally:
            active.remove(identity)
    if isinstance(value, SafeNamespace):
        identity = id(value)
        _enter_graph(identity, active)
        try:
            return {
                key: _convert_safe_json(item, depth + 1, active, count)
                for key, item in value.public_items()
            }
        finally:
            active.remove(identity)
    if type(value) is dict:
        if not all(isinstance(key, str) for key in value):
            raise ValueError("Safe JSON projection requires string object keys.")
        identity = id(value)
        _enter_graph(identity, active)
        try:
            return {
                key: _convert_safe_json(item, depth + 1, active, count)
                for key, item in value.items()
            }
        finally:
            active.remove(identity)
    raise ValueError("JSON projection accepts only safe namespace, list, and dict primitives.")


def _consume_graph_node(depth: int, count: list[int]) -> None:
    if depth > INVOCATION_MAX_GRAPH_DEPTH:
        raise ValueError("Safe namespace graph exceeds the depth limit.")
    count[0] += 1
    if count[0] > INVOCATION_MAX_GRAPH_NODES:
        raise ValueError("Safe namespace graph exceeds the node limit.")


def _enter_graph(identity: int, active: set[int]) -> None:
    if identity in active:
        raise ValueError("Safe namespace graph must not contain cycles.")
    active.add(identity)


def _compare(actual: Any, expected: Any, comparison: str, tolerance: Any) -> bool:
    if comparison in ("deep-equal", "stdout"):
        return _json_equal(actual, expected)
    if comparison == "unordered":
        return _unordered_signature(actual) == _unordered_signature(expected)
    if comparison == "unordered-outer":
        return _unordered_outer_signature(actual) == _unordered_outer_signature(expected)
    if comparison == "float":
        if isinstance(actual, bool) or not isinstance(actual, (int, float)):
            return False
        if isinstance(expected, bool) or not isinstance(expected, (int, float)):
            return False
        if not math.isfinite(actual) or not math.isfinite(expected):
            return False
        return abs(actual - expected) <= float(tolerance)
    raise ValueError(f"Unsupported comparison: {comparison!r}.")


def _json_equal(actual: Any, expected: Any) -> bool:
    if actual is None or expected is None:
        return actual is None and expected is None
    if isinstance(actual, bool) or isinstance(expected, bool):
        return isinstance(actual, bool) and isinstance(expected, bool) and actual is expected
    if isinstance(actual, (int, float)) or isinstance(expected, (int, float)):
        return (
            isinstance(actual, (int, float))
            and not isinstance(actual, bool)
            and isinstance(expected, (int, float))
            and not isinstance(expected, bool)
            and math.isfinite(actual)
            and math.isfinite(expected)
            and actual == expected
        )
    if isinstance(actual, str) or isinstance(expected, str):
        return isinstance(actual, str) and isinstance(expected, str) and actual == expected
    if _is_json_array(actual) or _is_json_array(expected):
        return (
            _is_json_array(actual)
            and _is_json_array(expected)
            and len(actual) == len(expected)
            and all(_json_equal(left, right) for left, right in zip(actual, expected))
        )
    if isinstance(actual, Mapping) or isinstance(expected, Mapping):
        return (
            isinstance(actual, Mapping)
            and isinstance(expected, Mapping)
            and all(isinstance(key, str) for key in actual)
            and all(isinstance(key, str) for key in expected)
            and actual.keys() == expected.keys()
            and all(_json_equal(actual[key], expected[key]) for key in actual)
        )
    return False


def _unordered_signature(value: Any) -> Any:
    if value is None:
        return ("null",)
    if isinstance(value, bool):
        return ("boolean", value)
    if isinstance(value, (int, float)) and math.isfinite(value):
        return ("number", value)
    if isinstance(value, str):
        return ("string", value)
    if _is_json_array(value):
        signatures = [_unordered_signature(item) for item in value]
        return ("array", tuple(sorted(signatures, key=repr)))
    if isinstance(value, Mapping) and all(isinstance(key, str) for key in value):
        return (
            "object",
            tuple(
                sorted(
                    ((key, _unordered_signature(item)) for key, item in value.items()),
                    key=repr,
                )
            ),
        )
    return ("invalid", type(value).__name__)


def _ordered_signature(value: Any) -> Any:
    if value is None:
        return ("null",)
    if isinstance(value, bool):
        return ("boolean", value)
    if isinstance(value, (int, float)) and math.isfinite(value):
        return ("number", value)
    if isinstance(value, str):
        return ("string", value)
    if _is_json_array(value):
        return ("array", tuple(_ordered_signature(item) for item in value))
    if isinstance(value, Mapping) and all(isinstance(key, str) for key in value):
        return (
            "object",
            tuple(
                sorted(
                    ((key, _ordered_signature(item)) for key, item in value.items()),
                    key=repr,
                )
            ),
        )
    return ("invalid", type(value).__name__)


def _unordered_outer_signature(value: Any) -> Any:
    if not _is_json_array(value):
        return ("invalid-outer", type(value).__name__)
    signatures = [_ordered_signature(item) for item in value]
    return ("array", tuple(sorted(signatures, key=repr)))


def _is_json_array(value: Any) -> bool:
    return isinstance(value, (list, tuple))


def _apply_result_budget(case_results: Sequence[dict[str, Any]], max_result_bytes: int) -> None:
    remaining = max_result_bytes
    for result in case_results:
        if "actual" not in result:
            continue
        size = json_encoded_size(result["actual"], remaining)
        if size is not None and size <= remaining:
            remaining -= size
            continue
        result.pop("actual", None)
        result["status"] = "error"
        stderr_writer = result["_stderrWriter"]
        message = (
            "Result must be JSON-serializable."
            if size is None
            else "Combined results exceed maxResultBytes."
        )
        stderr_writer.set_diagnostic(message, reclaim_other_streams=False)


def json_encoded_size(value: Any, limit: int) -> int | None:
    """Measure JSON incrementally and stop as soon as ``limit`` is exceeded."""

    try:
        return _measure_json(value, max(0, limit), set())
    except (RecursionError, TypeError, ValueError, OverflowError, UnicodeError):
        return None


def _measure_json(value: Any, limit: int, active: set[int]) -> int | None:
    if value is None:
        return 4
    if isinstance(value, bool):
        return 4 if value else 5
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and not math.isfinite(value):
            return None
        return len(
            json.dumps(value, allow_nan=False, ensure_ascii=False, separators=(",", ":")).encode(
                "utf-8"
            )
        )
    if isinstance(value, str):
        return _measure_json_string(value, limit)
    if _is_json_array(value):
        identity = id(value)
        if identity in active:
            return None
        active.add(identity)
        size = 2
        try:
            for index, item in enumerate(value):
                if index:
                    size += 1
                if size > limit:
                    return limit + 1
                item_size = _measure_json(item, max(0, limit - size), active)
                if item_size is None:
                    return None
                size += item_size
                if size > limit:
                    return limit + 1
            return size
        finally:
            active.remove(identity)
    if isinstance(value, Mapping):
        if not all(isinstance(key, str) for key in value):
            return None
        identity = id(value)
        if identity in active:
            return None
        active.add(identity)
        size = 2
        try:
            for index, (key, item) in enumerate(value.items()):
                if index:
                    size += 1
                key_size = _measure_json_string(key, max(0, limit - size))
                size += key_size + 1
                if size > limit:
                    return limit + 1
                item_size = _measure_json(item, max(0, limit - size), active)
                if item_size is None:
                    return None
                size += item_size
                if size > limit:
                    return limit + 1
            return size
        finally:
            active.remove(identity)
    return None


def _measure_json_string(value: str, limit: int) -> int:
    size = 2
    for offset in range(0, len(value), 1_024):
        encoded = json.dumps(
            value[offset : offset + 1_024],
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        size += len(encoded) - 2
        if size > limit:
            return limit + 1
    return size


def _materialize_streams(case_results: Sequence[dict[str, Any]]) -> None:
    for result in case_results:
        stdout_writer = result.pop("_stdoutWriter")
        stderr_writer = result.pop("_stderrWriter")
        result["stdout"] = stdout_writer.getvalue()
        result["stderr"] = stderr_writer.getvalue()


def _limits(overrides: Any) -> dict[str, int]:
    limits = dict(DEFAULT_LIMITS)
    if isinstance(overrides, Mapping):
        for name, default in DEFAULT_LIMITS.items():
            value = overrides.get(name)
            if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
                limits[name] = min(int(value), POLICY_CEILINGS[name])
            else:
                limits[name] = default
    return limits


def _overall_status(case_results: Sequence[Mapping[str, Any]]) -> str:
    statuses = {result.get("status") for result in case_results}
    if "error" in statuses:
        return "error"
    if "failed" in statuses:
        return "failed"
    return "passed"


def _expected_stdout_budget_error(cases: Sequence[Any], max_output_bytes: int) -> str | None:
    size = 0
    for test_case in cases:
        if not isinstance(test_case, Mapping) or test_case.get("comparison") != "stdout":
            continue
        expected = test_case.get("expected")
        if not isinstance(expected, str):
            return "Each expected stdout value must be a string."
        try:
            size += len(expected.encode("utf-8"))
        except UnicodeEncodeError:
            return "Expected stdout must be valid UTF-8."
        if size > max_output_bytes:
            return "Combined expected stdout exceeds maxOutputBytes."
    return None


def _request_error(run_id: str, message: str, started: float) -> dict[str, Any]:
    return {
        "runId": run_id,
        "status": "error",
        "stdout": "",
        "stderr": message,
        "cases": [],
        "durationMs": _elapsed_ms(started),
        "runtime": "server",
    }


def _run_id(request: Any) -> str:
    if isinstance(request, Mapping) and isinstance(request.get("runId"), str):
        return request["runId"]
    return "unknown"


def _elapsed_ms(started: float) -> int:
    return max(0, round((time.monotonic() - started) * 1_000))


def _utf8_prefix(value: str, max_bytes: int) -> tuple[bytes, bool]:
    if max_bytes <= 0:
        return b"", value == ""
    candidate = value[:max_bytes]
    encoded = candidate.encode("utf-8")
    if len(encoded) <= max_bytes and len(candidate) == len(value):
        return encoded, True
    if len(encoded) > max_bytes:
        encoded = encoded[:max_bytes]
        encoded = encoded.decode("utf-8", errors="ignore").encode("utf-8")
    return encoded, len(candidate) == len(value) and len(encoded) == len(value.encode("utf-8"))


def _capped_diagnostic_bytes(value: str, max_bytes: int) -> bytes:
    encoded, complete = _utf8_suffix(value, max_bytes)
    if complete:
        return encoded
    if max_bytes <= 0:
        return b""
    if max_bytes <= len(TRUNCATION_MARKER):
        return TRUNCATION_MARKER[-max_bytes:]
    suffix = _capped_bytes_suffix(encoded, max_bytes - len(TRUNCATION_MARKER))
    return TRUNCATION_MARKER + suffix


def _utf8_suffix(value: str, max_bytes: int) -> tuple[bytes, bool]:
    if max_bytes <= 0:
        return b"", value == ""
    candidate = value[-max_bytes:]
    encoded = candidate.encode("utf-8")
    complete = len(candidate) == len(value) and len(encoded) <= max_bytes
    if len(encoded) > max_bytes:
        encoded = _capped_bytes_suffix(encoded, max_bytes)
    return encoded, complete


def _capped_bytes_suffix(value: bytes, max_bytes: int) -> bytes:
    if max_bytes <= 0:
        return b""
    if len(value) <= max_bytes:
        return value
    return value[-max_bytes:].decode("utf-8", errors="ignore").encode("utf-8")


def _exception_diagnostic(
    exception_info: tuple[type[BaseException], BaseException, Any],
    max_bytes: int,
) -> bytes:
    diagnostic = DiagnosticTailWriter(max_bytes)
    try:
        traceback.print_exception(*exception_info, file=diagnostic)
    except BaseException:
        diagnostic.write(f"{exception_info[0].__name__}: traceback formatting failed")
    return diagnostic.getvalue()


def _apply_os_resource_limits(limits: Mapping[str, int]) -> None:
    if os.name != "posix":
        return
    try:
        import resource

        cpu_seconds = max(1, math.ceil(limits["wallTimeMs"] / 1_000) + 1)
        _set_resource_limit(resource, resource.RLIMIT_CPU, cpu_seconds)
        _set_resource_limit(resource, resource.RLIMIT_FSIZE, 16 * 1024 * 1024)
        _set_resource_limit(resource, resource.RLIMIT_NOFILE, 256)
        if sys.platform.startswith("linux"):
            address_space = 4 * 1024 * 1024 * 1024
            _set_resource_limit(resource, resource.RLIMIT_AS, address_space)
    except (ImportError, OSError, ValueError):
        return


def _install_stability_audit_hook() -> None:
    def reject_process_creation(event: str, arguments: tuple[Any, ...]) -> None:
        if event == "ctypes.call_function":
            raise PermissionError(
                "Native function-pointer calls are disabled in the exercise runner."
            )
        if event in BLOCKED_PROCESS_AUDIT_EVENTS or event.startswith("os.spawn"):
            raise PermissionError(
                f"Python process creation is disabled in the exercise runner ({event})."
            )
        if (
            event in {"ctypes.dlsym", "ctypes.dlsym/handle"}
            and arguments
            and _is_blocked_ctypes_process_symbol(arguments[-1])
        ):
            raise PermissionError(
                "Native process/session APIs are disabled in the exercise runner "
                f"({arguments[-1]})."
            )

    sys.addaudithook(reject_process_creation)
    _disable_process_os_apis()


def _is_blocked_ctypes_process_symbol(value: Any) -> bool:
    if isinstance(value, bytes):
        symbol = value.decode("ascii", errors="ignore")
    elif isinstance(value, str):
        symbol = value
    else:
        return False
    normalized = symbol.lower().lstrip("_")
    if normalized.startswith("libc_"):
        normalized = normalized.removeprefix("libc_")
    return normalized in BLOCKED_CTYPES_PROCESS_SYMBOLS or any(
        token in normalized for token in BLOCKED_CTYPES_PROCESS_TOKENS
    )


def _disable_process_os_apis() -> None:
    modules = [os]
    native_os_module = sys.modules.get(os.name)
    if native_os_module is not None and native_os_module is not os:
        modules.append(native_os_module)
    for module in modules:
        for name in dir(module):
            if not _is_blocked_os_process_name(name):
                continue

            def blocked(*_args: Any, _name: str = name, **_kwargs: Any) -> Any:
                raise PermissionError(
                    f"Python process/session API is disabled in the exercise runner ({_name})."
                )

            setattr(module, name, blocked)


def _is_blocked_os_process_name(name: str) -> bool:
    normalized = name.lower()
    return (
        normalized in BLOCKED_OS_PROCESS_NAMES
        or normalized.startswith("exec")
        or normalized.startswith("spawn")
    )


def _set_resource_limit(resource_module: Any, name: int, requested: int) -> None:
    _soft, hard = resource_module.getrlimit(name)
    if hard == resource_module.RLIM_INFINITY:
        bounded = requested
    else:
        bounded = min(requested, hard)
    resource_module.setrlimit(name, (bounded, bounded))


def _open_protocol_stream() -> io.TextIOWrapper:
    sys.stdout.flush()
    sys.stderr.flush()
    if os.name == "posix":
        import fcntl

        minimum_fd = 64 + secrets.randbelow(128)
        protocol_fd = fcntl.fcntl(
            sys.stdout.fileno(),
            fcntl.F_DUPFD_CLOEXEC,
            minimum_fd,
        )
    else:
        protocol_fd = os.dup(sys.stdout.fileno())
        os.set_inheritable(protocol_fd, False)
    if hasattr(os, "register_at_fork"):
        os.register_at_fork(after_in_child=lambda: _close_file_descriptor(protocol_fd))
    null_fd = os.open(os.devnull, os.O_WRONLY)
    try:
        os.dup2(null_fd, 1)
        os.dup2(null_fd, 2)
    finally:
        os.close(null_fd)
    return os.fdopen(protocol_fd, "w", encoding="utf-8", closefd=True)


def _close_file_descriptor(file_descriptor: int) -> None:
    try:
        os.close(file_descriptor)
    except OSError:
        pass


def main() -> int:
    started = time.monotonic()
    protocol = _open_protocol_stream()
    try:
        try:
            request = json.load(sys.stdin)
            if not isinstance(request, Mapping):
                raise ValueError("Run request must be an object.")
            spec = request.get("spec")
            limits = _limits(spec.get("limits") if isinstance(spec, Mapping) else None)
            _apply_os_resource_limits(limits)
            _install_stability_audit_hook()
            result = execute_request(request)
        except BaseException:
            diagnostic = _exception_diagnostic(
                sys.exc_info(),
                DEFAULT_LIMITS["maxOutputBytes"],
            )
            result = _request_error(
                "unknown",
                diagnostic.decode("utf-8", errors="ignore"),
                started,
            )
        json.dump(result, protocol, allow_nan=False, ensure_ascii=False, separators=(",", ":"))
        protocol.flush()
    finally:
        protocol.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
