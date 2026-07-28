import { loadPyodide, version as installedPyodideVersion } from "pyodide";
import type { PythonRunRequest, PythonRunResult } from "@dsa-visualizer/execution-contracts";

export const PYODIDE_VERSION = "314.0.3";
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
}

interface WorkerRunMessage {
  readonly type: "run";
  readonly request: PythonRunRequest;
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

class _CappedWriter(io.TextIOBase):
    def __init__(self, capacity):
        super().__init__()
        self.capacity = max(0, capacity)
        self.data = bytearray()
        self.truncated = False

    @property
    def encoding(self):
        return "utf-8"

    def writable(self):
        return True

    def write(self, value):
        if not isinstance(value, str):
            raise TypeError("write() argument must be str")
        encoded = value.encode("utf-8")
        remaining = max(0, self.capacity - len(self.data))
        if len(encoded) <= remaining:
            self.data.extend(encoded)
        else:
            self.truncated = True
            self.data.extend(encoded[:remaining].decode("utf-8", errors="ignore").encode("utf-8"))
        return len(value)

    def getvalue(self):
        value = bytes(self.data).decode("utf-8", errors="ignore")
        if not self.truncated or self.capacity == 0:
            return value
        marker = _TRUNCATION_MARKER
        while len((value + marker).encode("utf-8")) > self.capacity and value:
            value = value[:-1]
        if len(marker.encode("utf-8")) > self.capacity:
            return marker.encode("utf-8")[-self.capacity:].decode("utf-8", errors="ignore")
        return value + marker

def _bound_values(bindings, case_input):
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
        return target(*_bound_values(invocation.get("arguments"), case_input))
    if kind == "class-method":
        instance = target(*_bound_values(invocation.get("constructor"), case_input))
        method = getattr(instance, invocation.get("method"))
        return method(*_bound_values(invocation.get("arguments"), case_input))
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

def _compare(actual, expected, comparison, tolerance):
    if comparison in ("deep-equal", "stdout"):
        return _json_equal(actual, expected)
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
    raise ValueError("Unsupported comparison: {!r}.".format(comparison))

def _elapsed_ms(started):
    return max(0, round((time.monotonic() - started) * 1000))

def _execute_case(code, spec, test_case, output_limit):
    started = time.monotonic()
    stdout_writer = _CappedWriter(output_limit)
    stderr_writer = _CappedWriter(output_limit)
    result = {
        "id": str(test_case.get("id", "unknown")),
        "status": "error",
        "stdout": "",
        "stderr": "",
        "durationMs": 0,
    }
    comparison = str(test_case.get("comparison"))
    try:
        with contextlib.redirect_stdout(stdout_writer), contextlib.redirect_stderr(stderr_writer):
            actual = _invoke(code, spec, test_case.get("input"))
        compared_actual = stdout_writer.getvalue() if comparison == "stdout" else actual
        result["status"] = (
            "passed"
            if _compare(
                compared_actual,
                test_case.get("expected"),
                comparison,
                test_case.get("tolerance"),
            )
            else "failed"
        )
        json.dumps(compared_actual, allow_nan=False, ensure_ascii=False)
        result["actual"] = compared_actual
    except BaseException:
        stderr_writer = _CappedWriter(output_limit)
        stderr_writer.write(traceback.format_exc())
    result["stdout"] = stdout_writer.getvalue()
    result["stderr"] = stderr_writer.getvalue()
    result["durationMs"] = _elapsed_ms(started)
    return result

def _apply_result_budget(case_results, max_result_bytes):
    remaining = max_result_bytes
    for result in case_results:
        if "actual" not in result:
            continue
        try:
            encoded = json.dumps(
                result["actual"],
                allow_nan=False,
                ensure_ascii=False,
                separators=(",", ":"),
            ).encode("utf-8")
        except (TypeError, ValueError, OverflowError):
            result.pop("actual", None)
            result["status"] = "error"
            result["stderr"] = "Result must be JSON-serializable."
            continue
        if len(encoded) <= remaining:
            remaining -= len(encoded)
            continue
        result.pop("actual", None)
        result["status"] = "error"
        result["stderr"] = "Combined results exceed maxResultBytes."

def _execute_browser_request(request):
    started = time.monotonic()
    run_id = request.get("runId") if isinstance(request, Mapping) else "unknown"
    if not isinstance(request, Mapping):
        return {
            "runId": "unknown",
            "status": "error",
            "stdout": "",
            "stderr": "Execution request must be an object.",
            "cases": [],
            "durationMs": _elapsed_ms(started),
            "runtime": "browser",
        }
    spec = request.get("spec")
    code = request.get("code")
    if not isinstance(spec, Mapping) or not isinstance(code, str):
        return {
            "runId": run_id,
            "status": "error",
            "stdout": "",
            "stderr": "Execution request is invalid.",
            "cases": [],
            "durationMs": _elapsed_ms(started),
            "runtime": "browser",
        }
    limits = _limits(spec.get("limits"))
    cases = spec.get("cases")
    if not isinstance(cases, Sequence) or isinstance(cases, (str, bytes)):
        cases = []
    selected_ids = request.get("caseIds")
    if isinstance(selected_ids, list):
        selected = set(selected_ids)
        cases = [test_case for test_case in cases if test_case.get("id") in selected]
    case_results = [
        _execute_case(code, spec, test_case, limits["maxOutputBytes"])
        for test_case in cases[:limits["maxCases"]]
        if isinstance(test_case, Mapping)
    ]
    _apply_result_budget(case_results, limits["maxResultBytes"])
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
  }
}

async function getPyodide(): Promise<BrowserPyodide> {
  if (installedPyodideVersion !== PYODIDE_VERSION) {
    throw new Error(
      `Pyodide package version ${installedPyodideVersion} does not match ${PYODIDE_VERSION}.`,
    );
  }
  pyodidePromise ??= loadPyodide({
    indexURL: `${import.meta.env.BASE_URL}assets/pyodide/`,
    packageBaseUrl: PYODIDE_PACKAGE_BASE_URL,
  }) as unknown as Promise<BrowserPyodide>;
  return pyodidePromise;
}

function browserError(request: PythonRunRequest): PythonRunResult {
  return {
    runId: request.runId,
    status: "error",
    stdout: "",
    stderr: "Browser Python runtime is unavailable.",
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
    const { request } = event.data;
    void getPyodide()
      .then((pyodide) => executePythonRequestInPyodide(request, pyodide))
      .then((result) => {
        workerScope.postMessage?.({
          type: "result",
          runId: request.runId,
          result,
        });
      })
      .catch(() => {
        workerScope.postMessage?.({
          type: "result",
          runId: request.runId,
          result: browserError(request),
        });
      });
  });
}
