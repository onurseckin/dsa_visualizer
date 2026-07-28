import json
import sys
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path


RUNNER_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNNER_DIRECTORY))

from runner_service import create_server, run_in_subprocess  # noqa: E402


def request_for(code, *, wall_time_ms=1_000):
    return {
        "runId": "service-run",
        "code": code,
        "spec": {
            "runtime": "server",
            "entrypoint": "solve",
            "invocation": {
                "kind": "function",
                "arguments": [{"from": "input", "path": []}],
            },
            "packages": [],
            "cases": [
                {
                    "id": "case",
                    "label": "case",
                    "input": 2,
                    "expected": 4,
                    "comparison": "deep-equal",
                }
            ],
            "limits": {"wallTimeMs": wall_time_ms},
        },
    }


class SubprocessRunnerTests(unittest.TestCase):
    def test_runs_in_an_isolated_child_with_an_empty_temporary_working_directory(self):
        request = request_for(
            "import os\ndef solve(value):\n    return [os.listdir('.'), value * 2]"
        )
        request["spec"]["cases"][0]["expected"] = [[], 4]

        result = run_in_subprocess(request)

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["cases"][0]["actual"], [[], 4])

    def test_stops_the_child_at_the_authored_hard_timeout(self):
        result = run_in_subprocess(
            request_for("def solve(value):\n    while True:\n        pass", wall_time_ms=40)
        )

        self.assertEqual(result["runId"], "service-run")
        self.assertEqual(result["status"], "timeout")
        self.assertEqual(result["cases"], [])
        self.assertIn("time limit", result["stderr"])


class RunnerHttpServiceTests(unittest.TestCase):
    def setUp(self):
        self.server = create_server("127.0.0.1", 0, max_body_bytes=1_024)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=1)

    def request(self, path, *, method="GET", body=None):
        data = None if body is None else body.encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=2) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            try:
                return error.code, json.loads(error.read())
            finally:
                error.close()

    def test_exposes_health_and_run_endpoints(self):
        health_status, health = self.request("/health")
        run_status, result = self.request(
            "/run",
            method="POST",
            body=json.dumps(request_for("def solve(value):\n    return value * 2")),
        )

        self.assertEqual((health_status, health), (200, {"ok": True, "service": "python-runner"}))
        self.assertEqual(run_status, 200)
        self.assertEqual(result["status"], "passed")

    def test_rejects_unknown_methods_invalid_json_and_oversized_bodies(self):
        method_status, method = self.request("/run")
        invalid_status, invalid = self.request("/run", method="POST", body="{")
        large_status, large = self.request("/run", method="POST", body="x" * 1_025)

        self.assertEqual(method_status, 405)
        self.assertEqual(method["error"]["code"], "method_not_allowed")
        self.assertEqual(invalid_status, 400)
        self.assertEqual(invalid["error"]["code"], "invalid_json")
        self.assertEqual(large_status, 413)
        self.assertEqual(large["error"]["code"], "body_too_large")


if __name__ == "__main__":
    unittest.main()
