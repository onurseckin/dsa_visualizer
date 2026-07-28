import json
import subprocess
import sys
import unittest
from pathlib import Path


RUNNER_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNNER_DIRECTORY))

from execution_harness import execute_request  # noqa: E402


def request_for(
    code,
    cases,
    *,
    entrypoint="solve",
    invocation=None,
    case_ids=None,
    limits=None,
):
    request = {
        "runId": "run-1",
        "code": code,
        "spec": {
            "runtime": "server",
            "entrypoint": entrypoint,
            "invocation": invocation
            or {
                "kind": "function",
                "arguments": [{"from": "input", "path": []}],
            },
            "packages": [],
            "cases": cases,
        },
    }
    if case_ids is not None:
        request["caseIds"] = case_ids
    if limits is not None:
        request["spec"]["limits"] = limits
    return request


def case(case_id, value, expected, comparison="deep-equal", tolerance=None):
    value_case = {
        "id": case_id,
        "label": case_id,
        "input": value,
        "expected": expected,
        "comparison": comparison,
    }
    if tolerance is not None:
        value_case["tolerance"] = tolerance
    return value_case


class ExecutionHarnessTests(unittest.TestCase):
    def test_invokes_authored_function_bindings_in_a_fresh_namespace(self):
        result = execute_request(
            request_for(
                "def solve(left, right):\n    return left + right",
                [case("sum", {"values": [2, 5]}, 7)],
                invocation={
                    "kind": "function",
                    "arguments": [
                        {"from": "input", "path": ["values", 0]},
                        {"from": "input", "path": ["values", 1]},
                    ],
                },
            )
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["cases"][0]["actual"], 7)
        self.assertEqual(result["runtime"], "server")

    def test_invokes_authored_class_method_with_constructor_and_method_arguments(self):
        result = execute_request(
            request_for(
                (
                    "class Accumulator:\n"
                    "    def __init__(self, base):\n"
                    "        self.base = base\n"
                    "    def add(self, value):\n"
                    "        return self.base + value"
                ),
                [case("class", {"base": 10, "value": 4}, 14)],
                entrypoint="Accumulator",
                invocation={
                    "kind": "class-method",
                    "constructor": [{"from": "input", "path": ["base"]}],
                    "method": "add",
                    "arguments": [{"from": "input", "path": ["value"]}],
                },
            )
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["cases"][0]["actual"], 14)

    def test_invokes_stdin_script_and_compares_stdout(self):
        result = execute_request(
            request_for(
                "value = input()\nprint(value.upper())",
                [case("stdin", "machine learning\n", "MACHINE LEARNING\n", "stdout")],
                entrypoint="main",
                invocation={"kind": "stdin", "output": "text"},
            )
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["cases"][0]["actual"], "MACHINE LEARNING\n")
        self.assertEqual(result["stdout"], "MACHINE LEARNING\n")

    def test_supports_deep_unordered_float_and_stdout_comparisons(self):
        code = (
            "def solve(value):\n"
            "    if value == 'unordered': return [3, {'a': [2, 1]}, 3]\n"
            "    if value == 'float': return 0.1 + 0.2\n"
            "    if value == 'stdout': print('observable')\n"
            "    return {'nested': [1, {'ok': True}]}"
        )
        result = execute_request(
            request_for(
                code,
                [
                    case("deep", "deep", {"nested": [1, {"ok": True}]}),
                    case("unordered", "unordered", [3, 3, {"a": [1, 2]}], "unordered"),
                    case("float", "float", 0.3, "float", 1e-9),
                    case("stdout", "stdout", "observable\n", "stdout"),
                ],
            )
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual([item["status"] for item in result["cases"]], ["passed"] * 4)

    def test_captures_stdout_stderr_and_respects_selected_cases(self):
        result = execute_request(
            request_for(
                (
                    "import sys\n"
                    "def solve(value):\n"
                    "    print(f'out:{value}')\n"
                    "    print(f'err:{value}', file=sys.stderr)\n"
                    "    return value"
                ),
                [case("skip", 1, 1), case("run", 2, 2)],
                case_ids=["run"],
            )
        )

        self.assertEqual([item["id"] for item in result["cases"]], ["run"])
        self.assertEqual(result["cases"][0]["stdout"], "out:2\n")
        self.assertEqual(result["cases"][0]["stderr"], "err:2\n")
        self.assertEqual(result["stdout"], "out:2\n")
        self.assertEqual(result["stderr"], "err:2\n")

    def test_normalizes_syntax_runtime_and_non_json_results(self):
        syntax = execute_request(request_for("def solve(:\n  pass", [case("syntax", 1, 1)]))
        runtime = execute_request(
            request_for("def solve(value):\n    raise ValueError('broken')", [case("runtime", 1, 1)])
        )
        non_json = execute_request(
            request_for("def solve(value):\n    return {value}", [case("json", 1, [1])])
        )

        self.assertEqual(syntax["status"], "error")
        self.assertIn("SyntaxError", syntax["cases"][0]["stderr"])
        self.assertEqual(runtime["status"], "error")
        self.assertIn("ValueError: broken", runtime["cases"][0]["stderr"])
        self.assertEqual(non_json["status"], "error")
        self.assertIn("JSON-serializable", non_json["cases"][0]["stderr"])
        self.assertNotIn("actual", non_json["cases"][0])

    def test_truncates_captured_streams_and_oversized_results_by_utf8_bytes(self):
        result = execute_request(
            request_for(
                (
                    "import sys\n"
                    "def solve(value):\n"
                    "    print('🙂' * 20)\n"
                    "    print('error-' * 20, file=sys.stderr)\n"
                    "    return 'x' * 200"
                ),
                [case("large", 1, "unused")],
                limits={"maxOutputBytes": 24, "maxResultBytes": 32},
            )
        )

        self.assertEqual(result["status"], "error")
        self.assertLessEqual(len(result["stdout"].encode("utf-8")), 24)
        self.assertLessEqual(len(result["stderr"].encode("utf-8")), 24)
        self.assertIn("truncated", result["stdout"])
        self.assertNotIn("actual", result["cases"][0])

    def test_applies_the_result_byte_budget_across_all_selected_cases(self):
        result = execute_request(
            request_for(
                "def solve(value):\n    return 'x' * value",
                [case("first", 12, "x" * 12), case("second", 12, "x" * 12)],
                limits={"maxResultBytes": 20},
            )
        )

        self.assertEqual(result["cases"][0]["status"], "passed")
        self.assertIn("actual", result["cases"][0])
        self.assertEqual(result["cases"][1]["status"], "error")
        self.assertNotIn("actual", result["cases"][1])
        self.assertIn("maxResultBytes", result["cases"][1]["stderr"])

    def test_command_line_protocol_reads_and_writes_exactly_one_json_document(self):
        request = request_for("def solve(value):\n    return value * 2", [case("cli", 3, 6)])
        completed = subprocess.run(
            [sys.executable, "-I", str(RUNNER_DIRECTORY / "execution_harness.py")],
            input=json.dumps(request),
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0)
        self.assertEqual(json.loads(completed.stdout)["status"], "passed")
        self.assertEqual(completed.stderr, "")


if __name__ == "__main__":
    unittest.main()
