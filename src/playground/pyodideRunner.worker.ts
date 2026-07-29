import { loadPyodide, version as installedPyodideVersion } from "pyodide";
import {
  validatePythonRunRequest,
  type PythonRunRequest,
  type PythonRunResult,
} from "@dsa-visualizer/execution-contracts";
import { PYTHON_RUNNER_INFRASTRUCTURE_ERRORS } from "./types";

export const PYODIDE_VERSION = "314.0.3";
export const PYODIDE_CORE_BASE_PATH = `assets/pyodide/${PYODIDE_VERSION}/`;
export const PYODIDE_PACKAGE_BASE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/";

interface Destroyable {
  destroy(): void;
}

interface PythonGlobals extends Destroyable {
  set(name: string, value: unknown): void;
}

interface PythonResultProxy extends Destroyable {
  toString(): string;
}

export interface BrowserPyodide {
  readonly globals: {
    get(name: "dict"): () => PythonGlobals;
  };
  loadPackage(packageName: "numpy"): Promise<unknown>;
  runPythonAsync(
    code: string,
    options: { readonly globals: PythonGlobals },
  ): Promise<PythonResultProxy | string>;
  // Sets a SharedArrayBuffer that Pyodide polls; writing 2 raises KeyboardInterrupt.
  setInterruptBuffer(buffer: Uint8Array | null): void;
}

interface WorkerRunMessage {
  readonly type: "run";
  readonly request: PythonRunRequest;
  readonly token: string;
}

export const BROWSER_EXECUTION_HARNESS = String.raw`
import contextlib
import io
import json
import math
import sys
import time
import traceback
from collections.abc import Mapping, Sequence

_DEFAULT_LIMITS = {
    "maxOutputBytes": 64 * 1024,
    "maxResultBytes": 256 * 1024,
    "maxCases": 100,
}
_POLICY_CEILINGS = {
    "maxOutputBytes": 256 * 1024,
    "maxResultBytes": 1024 * 1024,
    "maxCases": 250,
}
_TRUNCATION_MARKER = "\n...[truncated]"
_INVOCATION_MAX_PATH_SEGMENTS = 32
_INVOCATION_MAX_SETUP_STEPS = 32
_INVOCATION_MAX_GRAPH_DEPTH = 64
_INVOCATION_MAX_GRAPH_NODES = 10000

class _SafeNamespace:
    __slots__ = ("_values",)

    def __init__(self, values):
        object.__setattr__(self, "_values", dict(values))

    def __getattr__(self, name):
        _require_public_name(name)
        values = object.__getattribute__(self, "_values")
        try:
            return values[name]
        except KeyError as error:
            raise AttributeError(name) from error

    def __setattr__(self, name, value):
        _require_public_name(name)
        object.__getattribute__(self, "_values")[name] = value

    def public_value(self, name):
        _require_public_name(name)
        return object.__getattribute__(self, "_values")[name]

    def public_items(self):
        return object.__getattribute__(self, "_values").items()

def _limits(overrides):
    limits = dict(_DEFAULT_LIMITS)
    if isinstance(overrides, Mapping):
        for name, default in _DEFAULT_LIMITS.items():
            value = overrides.get(name)
            if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0:
                limits[name] = min(int(value), _POLICY_CEILINGS[name])
            else:
                limits[name] = default
    return limits

class _OutputBudget:
    def __init__(self, capacity):
        self.capacity = max(0, capacity)
        self.used = 0
        self.writers = []

    @property
    def remaining(self):
        return max(0, self.capacity - self.used)

    def register(self, writer):
        self.writers.append(writer)

    def consume(self, size):
        accepted = min(max(0, size), self.remaining)
        self.used += accepted
        return accepted

    def release(self, size):
        self.used = max(0, self.used - max(0, size))

    def reclaim_for_diagnostic(self, target, required):
        target.clear()
        if self.remaining >= required:
            return
        for writer in self.writers:
            if writer is target:
                continue
            writer.clear()
            if self.remaining >= required:
                return

class _ExpectedStdoutComparator:
    def __init__(self, expected):
        self.expected = expected.encode("utf-8")
        self.offset = 0
        self.equal = True
        self.overflowed = False

    def write_text(self, value):
        for offset in range(0, len(value), 1024):
            self.write_bytes(value[offset:offset + 1024].encode("utf-8"))

    def write_bytes(self, value):
        remaining = len(self.expected) - self.offset
        compared = min(len(value), max(0, remaining))
        if value[:compared] != self.expected[self.offset:self.offset + compared]:
            self.equal = False
        self.offset += compared
        if len(value) > compared:
            self.overflowed = True

    @property
    def matches(self):
        return self.equal and not self.overflowed and self.offset == len(self.expected)

class _CappedBinaryWriter:
    def __init__(self, text_writer):
        self.text_writer = text_writer

    def write(self, value):
        return self.text_writer.write_bytes(bytes(value))

    def flush(self):
        return

class _CappedWriter(io.TextIOBase):
    def __init__(self, budget, stdout_comparator=None):
        super().__init__()
        self.budget = budget
        self.stdout_comparator = stdout_comparator
        self.data = bytearray()
        self.binary = _CappedBinaryWriter(self)
        self.truncated = False
        budget.register(self)

    @property
    def encoding(self):
        return "utf-8"

    @property
    def buffer(self):
        return self.binary

    def writable(self):
        return True

    def write(self, value):
        if not isinstance(value, str):
            raise TypeError("write() argument must be str")
        if self.stdout_comparator is not None:
            self.stdout_comparator.write_text(value)
        encoded, complete = _utf8_prefix(value, self.budget.remaining)
        accepted = self.budget.consume(len(encoded))
        self.data.extend(encoded[:accepted])
        if not complete:
            self._mark_truncated()
        return len(value)

    def write_bytes(self, value):
        if self.stdout_comparator is not None:
            self.stdout_comparator.write_bytes(value)
        accepted = self.budget.consume(len(value))
        self.data.extend(value[:accepted])
        if accepted < len(value):
            self._mark_truncated()
        return len(value)

    def flush(self):
        return

    def clear(self):
        self.budget.release(len(self.data))
        self.data.clear()
        self.truncated = False

    def set_diagnostic(self, diagnostic, reclaim_other_streams=True):
        encoded = _capped_diagnostic_bytes(diagnostic, self.budget.capacity)
        self.set_diagnostic_bytes(encoded, reclaim_other_streams)

    def set_exception(self, exception_info):
        self.set_diagnostic_bytes(_exception_diagnostic(exception_info, self.budget.capacity))

    def set_diagnostic_bytes(self, encoded, reclaim_other_streams=True):
        self.clear()
        if reclaim_other_streams:
            self.budget.reclaim_for_diagnostic(self, len(encoded))
        elif len(encoded) > self.budget.remaining:
            encoded = _capped_bytes_suffix(encoded, self.budget.remaining)
        accepted = self.budget.consume(len(encoded))
        self.data.extend(encoded[:accepted])
        self.truncated = len(encoded) > accepted

    def getvalue(self):
        return bytes(self.data).decode("utf-8", errors="ignore")

    def _mark_truncated(self):
        if self.truncated:
            return
        self.truncated = True
        marker = _TRUNCATION_MARKER.encode("utf-8")
        if self.budget.remaining >= len(marker):
            self.budget.consume(len(marker))
            self.data.extend(marker)
            return
        reclaim = len(marker) - self.budget.remaining
        if reclaim > len(self.data):
            return
        if reclaim:
            target_size = len(self.data) - reclaim
            prefix = bytes(self.data[:target_size]).decode("utf-8", errors="ignore").encode("utf-8")
            released = len(self.data) - len(prefix)
            self.data[:] = prefix
            self.budget.release(released)
        accepted = self.budget.consume(len(marker))
        self.data.extend(marker[:accepted])

class _DiagnosticTailWriter(io.TextIOBase):
    def __init__(self, capacity):
        super().__init__()
        self.capacity = max(0, capacity)
        self.data = bytearray()
        self.truncated = False

    def writable(self):
        return True

    def write(self, value):
        if not isinstance(value, str):
            raise TypeError("write() argument must be str")
        encoded, complete = _utf8_suffix(value, self.capacity)
        if not complete:
            self.truncated = True
            self.data[:] = encoded
            return len(value)
        combined = bytes(self.data) + encoded
        if len(combined) > self.capacity:
            self.truncated = True
            combined = _capped_bytes_suffix(combined, self.capacity)
        self.data[:] = combined
        return len(value)

    def flush(self):
        return

    def getvalue(self):
        if not self.truncated:
            return bytes(self.data)
        marker = _TRUNCATION_MARKER.encode("utf-8")
        if self.capacity == 0:
            return b""
        if self.capacity <= len(marker):
            return marker[-self.capacity:]
        return marker + _capped_bytes_suffix(bytes(self.data), self.capacity - len(marker))

def _bound_values(bindings, case_input, instance=None):
    if not isinstance(bindings, Sequence) or isinstance(bindings, (str, bytes)):
        raise ValueError("Bindings must be an array.")
    values = []
    for binding in bindings:
        if not isinstance(binding, Mapping):
            raise ValueError("Each binding must be an object.")
        source = binding.get("from")
        if source == "input":
            value = _value_at_path(case_input, binding.get("path"), False)
            if binding.get("convert") == "namespace":
                value = _to_safe_namespace(value)
            elif binding.get("convert") is not None:
                raise ValueError("Unsupported input conversion.")
        elif source == "instance" and instance is not None:
            if binding.get("convert") is not None:
                raise ValueError("Instance bindings cannot convert values.")
            value = _value_at_path(instance, binding.get("path"), True)
        else:
            raise ValueError("Only authored input and instance bindings are supported.")
        values.append(value)
    return values

def _select_invocation_result(invocation, returned, case_input, instance):
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
    value = _value_at_path(value, selection.get("path"), allow_learner_objects)
    if selection.get("project") == "json":
        return _project_safe_json(value)
    if selection.get("project") is not None:
        raise ValueError("Unsupported result projection.")
    return value

def _value_at_path(value, path, allow_learner_objects):
    if not isinstance(path, Sequence) or isinstance(path, (str, bytes)):
        raise ValueError("Binding paths must be arrays.")
    if len(path) > _INVOCATION_MAX_PATH_SEGMENTS:
        raise ValueError("Binding path exceeds the segment limit.")
    current = value
    for segment in path:
        if isinstance(segment, str):
            _require_public_name(segment)
            if isinstance(current, Mapping):
                current = current[segment]
            elif isinstance(current, _SafeNamespace):
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

def _public_method(instance, name):
    _require_public_name(name)
    method = getattr(instance, name)
    if not callable(method):
        raise TypeError("Authored method {!r} is not callable.".format(name))
    return method

def _require_public_name(name):
    if (
        not isinstance(name, str)
        or not name
        or name.startswith("_")
        or not name.isidentifier()
    ):
        raise ValueError("Authored names and paths must use public identifiers.")

def _to_safe_namespace(value):
    return _convert_safe_namespace(value, 0, set(), [0])

def _convert_safe_namespace(value, depth, active, count):
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
            return _SafeNamespace(converted)
        finally:
            active.remove(identity)
    raise ValueError("Namespace conversion accepts only JSON primitives.")

def _project_safe_json(value):
    return _convert_safe_json(value, 0, set(), [0])

def _convert_safe_json(value, depth, active, count):
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
    if isinstance(value, _SafeNamespace):
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

def _consume_graph_node(depth, count):
    if depth > _INVOCATION_MAX_GRAPH_DEPTH:
        raise ValueError("Safe namespace graph exceeds the depth limit.")
    count[0] += 1
    if count[0] > _INVOCATION_MAX_GRAPH_NODES:
        raise ValueError("Safe namespace graph exceeds the node limit.")

def _enter_graph(identity, active):
    if identity in active:
        raise ValueError("Safe namespace graph must not contain cycles.")
    active.add(identity)

def _invoke(code, spec, case_input):
    invocation = spec.get("invocation")
    if not isinstance(invocation, Mapping):
        raise ValueError("Invocation must be an object.")
    kind = invocation.get("kind")
    namespace = {"__name__": "__learner__"}

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
        raise NameError("Entrypoint {!r} was not defined.".format(entrypoint))

    if kind == "function":
        returned = target(*_bound_values(invocation.get("arguments"), case_input))
        return _select_invocation_result(invocation, returned, case_input, None)
    if kind == "class-method":
        instance = target(*_bound_values(invocation.get("constructor"), case_input))
        setup = invocation.get("setup", [])
        if not isinstance(setup, Sequence) or isinstance(setup, (str, bytes)):
            raise ValueError("Setup must be an array.")
        if len(setup) > _INVOCATION_MAX_SETUP_STEPS:
            raise ValueError("Setup exceeds the authored step limit.")
        for step in setup:
            if not isinstance(step, Mapping):
                raise ValueError("Each setup step must be an object.")
            method = _public_method(instance, step.get("method"))
            method(*_bound_values(step.get("arguments"), case_input, instance))
        method = _public_method(instance, invocation.get("method"))
        returned = method(*_bound_values(invocation.get("arguments"), case_input, instance))
        return _select_invocation_result(invocation, returned, case_input, instance)
    raise ValueError("Unsupported invocation kind: {!r}.".format(kind))

def _is_json_array(value):
    return isinstance(value, (list, tuple))

def _json_equal(actual, expected):
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

def _unordered_signature(value):
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
            tuple(sorted(
                ((key, _unordered_signature(item)) for key, item in value.items()),
                key=repr,
            )),
        )
    return ("invalid", type(value).__name__)

def _ordered_signature(value):
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
            tuple(sorted(
                ((key, _ordered_signature(item)) for key, item in value.items()),
                key=repr,
            )),
        )
    return ("invalid", type(value).__name__)

def _unordered_outer_signature(value):
    if not _is_json_array(value):
        return ("invalid-outer", type(value).__name__)
    signatures = [_ordered_signature(item) for item in value]
    return ("array", tuple(sorted(signatures, key=repr)))

def _compare(actual, expected, comparison, tolerance):
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
    raise ValueError("Unsupported comparison: {!r}.".format(comparison))

def _elapsed_ms(started):
    return max(0, round((time.monotonic() - started) * 1000))

def _utf8_prefix(value, max_bytes):
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

def _utf8_suffix(value, max_bytes):
    if max_bytes <= 0:
        return b"", value == ""
    candidate = value[-max_bytes:]
    encoded = candidate.encode("utf-8")
    complete = len(candidate) == len(value) and len(encoded) <= max_bytes
    if len(encoded) > max_bytes:
        encoded = _capped_bytes_suffix(encoded, max_bytes)
    return encoded, complete

def _capped_bytes_suffix(value, max_bytes):
    if max_bytes <= 0:
        return b""
    if len(value) <= max_bytes:
        return value
    return value[-max_bytes:].decode("utf-8", errors="ignore").encode("utf-8")

def _capped_diagnostic_bytes(value, max_bytes):
    encoded, complete = _utf8_suffix(value, max_bytes)
    if complete:
        return encoded
    if max_bytes <= 0:
        return b""
    marker = _TRUNCATION_MARKER.encode("utf-8")
    if max_bytes <= len(marker):
        return marker[-max_bytes:]
    return marker + _capped_bytes_suffix(encoded, max_bytes - len(marker))

def _exception_diagnostic(exception_info, max_bytes):
    diagnostic = _DiagnosticTailWriter(max_bytes)
    try:
        traceback.print_exception(*exception_info, file=diagnostic)
    except BaseException:
        diagnostic.write("{}: traceback formatting failed".format(exception_info[0].__name__))
    return diagnostic.getvalue()

def _json_encoded_size(value, limit):
    try:
        return _measure_json(value, max(0, limit), set())
    except (RecursionError, TypeError, ValueError, OverflowError, UnicodeError):
        return None

def _measure_json(value, limit, active):
    if value is None:
        return 4
    if isinstance(value, bool):
        return 4 if value else 5
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and not math.isfinite(value):
            return None
        return len(json.dumps(
            value,
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8"))
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

def _measure_json_string(value, limit):
    size = 2
    for offset in range(0, len(value), 1024):
        encoded = json.dumps(
            value[offset:offset + 1024],
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        size += len(encoded) - 2
        if size > limit:
            return limit + 1
    return size

def _execute_case(code, spec, test_case, output_budget):
    started = time.monotonic()
    comparison = str(test_case.get("comparison"))
    expected = test_case.get("expected")
    stdout_comparator = (
        _ExpectedStdoutComparator(expected)
        if comparison == "stdout" and isinstance(expected, str)
        else None
    )
    stdout_writer = _CappedWriter(output_budget, stdout_comparator)
    stderr_writer = _CappedWriter(output_budget)
    result = {
        "id": str(test_case.get("id", "unknown")),
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
            else _compare(
                compared_actual,
                expected,
                comparison,
                test_case.get("tolerance"),
            )
        )
        result["status"] = (
            "passed"
            if passed
            else "failed"
        )
        result["actual"] = compared_actual
    except BaseException:
        stderr_writer.set_exception(sys.exc_info())
    result["durationMs"] = _elapsed_ms(started)
    return result

def _apply_result_budget(case_results, max_result_bytes):
    remaining = max_result_bytes
    for result in case_results:
        if "actual" not in result:
            continue
        size = _json_encoded_size(result["actual"], remaining)
        if size is not None and size <= remaining:
            remaining -= size
            continue
        result.pop("actual", None)
        result["status"] = "error"
        message = (
            "Result must be JSON-serializable."
            if size is None
            else "Combined results exceed maxResultBytes."
        )
        result["_stderrWriter"].set_diagnostic(message, False)

def _materialize_streams(case_results):
    for result in case_results:
        stdout_writer = result.pop("_stdoutWriter")
        stderr_writer = result.pop("_stderrWriter")
        result["stdout"] = stdout_writer.getvalue()
        result["stderr"] = stderr_writer.getvalue()

def _expected_stdout_budget_error(cases, max_output_bytes):
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

def _request_error(run_id, message, started):
    return {
        "runId": run_id,
        "status": "error",
        "stdout": "",
        "stderr": message,
        "cases": [],
        "durationMs": _elapsed_ms(started),
        "runtime": "browser",
    }

def _execute_browser_request(request):
    started = time.monotonic()
    run_id = request.get("runId") if isinstance(request, Mapping) else "unknown"
    if not isinstance(request, Mapping):
        return _request_error("unknown", "Execution request must be an object.", started)
    spec = request.get("spec")
    code = request.get("code")
    if not isinstance(spec, Mapping) or not isinstance(code, str):
        return _request_error(run_id, "Execution request is invalid.", started)
    limits = _limits(spec.get("limits"))
    cases = spec.get("cases")
    if not isinstance(cases, Sequence) or isinstance(cases, (str, bytes)):
        cases = []
    selected_ids = request.get("caseIds")
    if isinstance(selected_ids, list):
        selected = set(selected_ids)
        cases = [test_case for test_case in cases if test_case.get("id") in selected]
    expected_stdout_error = _expected_stdout_budget_error(cases, limits["maxOutputBytes"])
    if expected_stdout_error is not None:
        return _request_error(run_id, expected_stdout_error, started)
    output_budget = _OutputBudget(limits["maxOutputBytes"])
    case_results = [
        _execute_case(code, spec, test_case, output_budget)
        for test_case in cases[:limits["maxCases"]]
        if isinstance(test_case, Mapping)
    ]
    _apply_result_budget(case_results, limits["maxResultBytes"])
    _materialize_streams(case_results)
    statuses = {result.get("status") for result in case_results}
    status = "error" if "error" in statuses else "failed" if "failed" in statuses else "passed"
    return {
        "runId": run_id,
        "status": status,
        "stdout": "".join(str(result.get("stdout", "")) for result in case_results),
        "stderr": "".join(str(result.get("stderr", "")) for result in case_results),
        "cases": case_results,
        "durationMs": _elapsed_ms(started),
        "runtime": "browser",
    }

_dsa_result_json = json.dumps(
    _execute_browser_request(json.loads(_dsa_request_json)),
    allow_nan=False,
    ensure_ascii=False,
    separators=(",", ":"),
)
`;

let pyodidePromise: Promise<BrowserPyodide> | undefined;
const loadedPackages = new Set<string>();

export async function executePythonRequestInPyodide(
  request: PythonRunRequest,
  pyodide: BrowserPyodide,
  onReady: (interruptBuffer: Uint8Array | null) => void = () => undefined,
): Promise<PythonRunResult> {
  for (const packageName of request.spec.packages) {
    if (packageName !== "numpy") {
      throw new Error(`Unsupported browser package: ${packageName}`);
    }
    if (!loadedPackages.has(packageName)) {
      await pyodide.loadPackage(packageName);
      loadedPackages.add(packageName);
    }
  }

  // Create a 1-byte SharedArrayBuffer interrupt buffer if available. Writing 2
  // into it causes Pyodide to raise KeyboardInterrupt inside Python, interrupting
  // infinite loops without having to terminate the entire worker.
  let interruptBuffer: Uint8Array | null = null;
  try {
    if (typeof SharedArrayBuffer !== "undefined") {
      interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
      interruptBuffer[0] = 0;
      pyodide.setInterruptBuffer(interruptBuffer);
    }
  } catch {
    interruptBuffer = null;
  }

  onReady(interruptBuffer);

  const globalsFactory = pyodide.globals.get("dict");
  const globals = globalsFactory();
  let rawResult: PythonResultProxy | string | undefined;
  try {
    globals.set("_dsa_request_json", JSON.stringify(request));
    rawResult = await pyodide.runPythonAsync(`${BROWSER_EXECUTION_HARNESS}\n_dsa_result_json`, {
      globals,
    });
    const serialized = typeof rawResult === "string" ? rawResult : rawResult.toString();
    return JSON.parse(serialized) as PythonRunResult;
  } finally {
    if (typeof rawResult !== "string") rawResult?.destroy();
    globals.destroy();
    // Clear the interrupt buffer so it doesn't linger for the next run.
    try {
      pyodide.setInterruptBuffer(null);
    } catch {
      // ignore — older Pyodide or SAB unavailable
    }
  }
}

async function getPyodide(): Promise<BrowserPyodide> {
  if (installedPyodideVersion !== PYODIDE_VERSION) {
    throw new Error(
      `Pyodide package version ${installedPyodideVersion} does not match ${PYODIDE_VERSION}.`,
    );
  }
  if (!pyodidePromise) {
    const initialization = loadPyodide({
      indexURL: `${import.meta.env.BASE_URL}${PYODIDE_CORE_BASE_PATH}`,
      packageBaseUrl: PYODIDE_PACKAGE_BASE_URL,
    }) as unknown as Promise<BrowserPyodide>;
    pyodidePromise = initialization.catch((error: unknown) => {
      pyodidePromise = undefined;
      loadedPackages.clear();
      throw error;
    });
  }
  return pyodidePromise;
}

function browserError(
  request: unknown,
  message: string = PYTHON_RUNNER_INFRASTRUCTURE_ERRORS.browserUnavailable,
): PythonRunResult {
  const runId =
    typeof request === "object" &&
    request !== null &&
    typeof (request as { readonly runId?: unknown }).runId === "string"
      ? String((request as { readonly runId: string }).runId)
      : "unknown";
  return {
    runId,
    status: "error",
    stdout: "",
    stderr: message,
    cases: [],
    durationMs: 0,
    runtime: "browser",
  };
}

const workerScope = globalThis as typeof globalThis & {
  readonly document?: unknown;
  addEventListener?: (
    type: "message",
    listener: (event: MessageEvent<WorkerRunMessage>) => void,
  ) => void;
  postMessage?: (value: unknown) => void;
};

if (
  workerScope.document === undefined &&
  typeof workerScope.addEventListener === "function" &&
  typeof workerScope.postMessage === "function"
) {
  workerScope.addEventListener("message", (event) => {
    if (event.data?.type !== "run") return;
    const { request, token } = event.data;
    const validation = validatePythonRunRequest(request);
    if (!validation.ok || validation.value.spec.runtime !== "browser") {
      workerScope.postMessage?.({
        type: "result",
        runId: request?.runId ?? "unknown",
        token,
        result: browserError(request, "Python execution request is invalid."),
      });
      return;
    }
    void getPyodide()
      .then((pyodide) =>
        executePythonRequestInPyodide(validation.value, pyodide, (interruptBuffer) => {
          workerScope.postMessage?.({
            type: "ready",
            runId: validation.value.runId,
            token,
            // SharedArrayBuffer is shared memory — no transfer needed.
            interruptBuffer,
          });
        }),
      )
      .then((result) => {
        workerScope.postMessage?.({
          type: "result",
          runId: validation.value.runId,
          token,
          result,
        });
      })
      .catch(() => {
        workerScope.postMessage?.({
          type: "result",
          runId: validation.value.runId,
          token,
          result: browserError(validation.value),
        });
      });
  });
}
