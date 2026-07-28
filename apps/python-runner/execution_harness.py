"""Trusted protocol harness for one authored Python exercise request.

The surrounding service and Docker container provide the process boundary. This
module deliberately does not claim to turn Python ``exec`` into a hostile-code
sandbox.
"""

from __future__ import annotations

import contextlib
import io
import json
import math
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

    case_results = [
        _execute_case(code, spec, test_case, limits)
        for test_case in cases[: limits["maxCases"]]
        if isinstance(test_case, Mapping)
    ]
    _apply_result_budget(case_results, limits["maxResultBytes"], limits["maxOutputBytes"])
    status = _overall_status(case_results)
    stdout = _truncate_text(
        "".join(str(result.get("stdout", "")) for result in case_results),
        limits["maxOutputBytes"],
    )
    stderr = _truncate_text(
        "".join(str(result.get("stderr", "")) for result in case_results),
        limits["maxOutputBytes"],
    )
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
    limits: Mapping[str, int],
) -> dict[str, Any]:
    started = time.monotonic()
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    case_id = str(test_case.get("id", "unknown"))
    result: dict[str, Any] = {
        "id": case_id,
        "status": "error",
        "stdout": "",
        "stderr": "",
        "durationMs": 0,
    }

    try:
        with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
            actual = _invoke(code, spec, test_case.get("input"))
        canonical_actual = _json_value(actual)
        comparison = test_case.get("comparison")
        expected = test_case.get("expected")
        compared_actual = stdout_buffer.getvalue() if comparison == "stdout" else canonical_actual
        passed = _compare(
            compared_actual,
            expected,
            str(comparison),
            test_case.get("tolerance"),
        )
        result["status"] = "passed" if passed else "failed"
        result["actual"] = compared_actual
    except BaseException:
        stderr_buffer.write(traceback.format_exc())

    stdout = _truncate_text(stdout_buffer.getvalue(), limits["maxOutputBytes"])
    stderr = _truncate_text(stderr_buffer.getvalue(), limits["maxOutputBytes"])

    if "actual" in result:
        serialized_actual = _encoded_json(result["actual"])
        if serialized_actual is None:
            result.pop("actual", None)
            result["status"] = "error"
            stderr = _append_error(
                stderr,
                "Result must be JSON-serializable.",
                limits["maxOutputBytes"],
            )
        elif len(serialized_actual) > limits["maxResultBytes"]:
            result.pop("actual", None)
            result["status"] = "error"
            stderr = _append_error(
                stderr,
                "Result exceeds maxResultBytes.",
                limits["maxOutputBytes"],
            )

    result["stdout"] = stdout
    result["stderr"] = stderr
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
        return target(*_bound_values(invocation.get("arguments"), case_input))
    if kind == "class-method":
        instance = target(*_bound_values(invocation.get("constructor"), case_input))
        method_name = invocation.get("method")
        method = getattr(instance, method_name)
        return method(*_bound_values(invocation.get("arguments"), case_input))
    raise ValueError(f"Unsupported invocation kind: {kind!r}.")


def _bound_values(bindings: Any, case_input: Any) -> list[Any]:
    if not isinstance(bindings, Sequence) or isinstance(bindings, (str, bytes)):
        raise ValueError("Bindings must be an array.")
    values = []
    for binding in bindings:
        if not isinstance(binding, Mapping) or binding.get("from") != "input":
            raise ValueError("Only authored input bindings are supported.")
        value = case_input
        for segment in binding.get("path", []):
            value = value[segment]
        values.append(value)
    return values


def _compare(actual: Any, expected: Any, comparison: str, tolerance: Any) -> bool:
    if comparison in ("deep-equal", "stdout"):
        return actual == expected
    if comparison == "unordered":
        return _unordered_signature(actual) == _unordered_signature(expected)
    if comparison == "float":
        if isinstance(actual, bool) or not isinstance(actual, (int, float)):
            return False
        if isinstance(expected, bool) or not isinstance(expected, (int, float)):
            return False
        if not math.isfinite(actual) or not math.isfinite(expected):
            return False
        return abs(actual - expected) <= float(tolerance)
    raise ValueError(f"Unsupported comparison: {comparison!r}.")


def _unordered_signature(value: Any) -> Any:
    if isinstance(value, list):
        signatures = [_unordered_signature(item) for item in value]
        return ("list", tuple(sorted(signatures, key=repr)))
    if isinstance(value, dict):
        return (
            "dict",
            tuple(
                sorted(
                    ((key, _unordered_signature(item)) for key, item in value.items()),
                    key=repr,
                )
            ),
        )
    return ("value", value)


def _json_value(value: Any) -> Any:
    encoded = _encoded_json(value)
    if encoded is None:
        raise TypeError("Result must be JSON-serializable.")
    return json.loads(encoded)


def _encoded_json(value: Any) -> bytes | None:
    try:
        return json.dumps(
            value,
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
    except (TypeError, ValueError, OverflowError):
        return None


def _limits(overrides: Any) -> dict[str, int]:
    limits = dict(DEFAULT_LIMITS)
    if isinstance(overrides, Mapping):
        for name, default in DEFAULT_LIMITS.items():
            value = overrides.get(name)
            if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
                limits[name] = int(value)
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


def _apply_result_budget(
    case_results: Sequence[dict[str, Any]],
    max_result_bytes: int,
    max_output_bytes: int,
) -> None:
    remaining = max_result_bytes
    for result in case_results:
        if "actual" not in result:
            continue
        encoded = _encoded_json(result["actual"])
        size = len(encoded) if encoded is not None else max_result_bytes + 1
        if size <= remaining:
            remaining -= size
            continue
        result.pop("actual", None)
        result["status"] = "error"
        result["stderr"] = _append_error(
            str(result.get("stderr", "")),
            "Combined results exceed maxResultBytes.",
            max_output_bytes,
        )


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


def _append_error(existing: str, message: str, max_bytes: int) -> str:
    separator = "" if not existing or existing.endswith("\n") else "\n"
    return _truncate_text(f"{existing}{separator}{message}", max_bytes)


def _truncate_text(text: str, max_bytes: int) -> str:
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text
    marker = "\n...[truncated]"
    marker_bytes = marker.encode("utf-8")
    if max_bytes <= len(marker_bytes):
        return marker_bytes[:max_bytes].decode("utf-8", errors="ignore")
    prefix = encoded[: max_bytes - len(marker_bytes)]
    return prefix.decode("utf-8", errors="ignore") + marker


def main() -> int:
    started = time.monotonic()
    try:
        request = json.load(sys.stdin)
        if not isinstance(request, Mapping):
            raise ValueError("Run request must be an object.")
        result = execute_request(request)
    except BaseException:
        result = _request_error("unknown", traceback.format_exc(), started)
    json.dump(result, sys.stdout, allow_nan=False, ensure_ascii=False, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
