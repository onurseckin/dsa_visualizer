import json
import os
import socket
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path


RUNNER_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNNER_DIRECTORY))

from runner_service import (  # noqa: E402
    DEFAULT_MAX_BODY_BYTES,
    ExecutionManager,
    create_server,
    run_in_subprocess,
)


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
    def test_body_envelope_matches_the_shared_five_mebibyte_policy(self):
        self.assertEqual(DEFAULT_MAX_BODY_BYTES, 5 * 1024 * 1024)

    def test_runs_in_an_isolated_child_with_an_empty_temporary_working_directory(self):
        request = request_for(
            "import os\ndef solve(value):\n    return [os.listdir('.'), value * 2]"
        )
        request["spec"]["cases"][0]["expected"] = [[], 4]

        result = run_in_subprocess(request)

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["cases"][0]["actual"], [[], 4])

    def test_cleans_the_temporary_working_directory_after_each_run(self):
        with tempfile.TemporaryDirectory() as temporary_root:
            previous_tempdir = tempfile.tempdir
            tempfile.tempdir = temporary_root
            try:
                result = run_in_subprocess(
                    request_for("def solve(value):\n    return value * 2")
                )
            finally:
                tempfile.tempdir = previous_tempdir

            self.assertEqual(result["status"], "passed")
            self.assertEqual(os.listdir(temporary_root), [])

    def test_stops_the_child_at_the_authored_hard_timeout(self):
        result = run_in_subprocess(
            request_for("def solve(value):\n    while True:\n        pass", wall_time_ms=40)
        )

        self.assertEqual(result["runId"], "service-run")
        self.assertEqual(result["status"], "timeout")
        self.assertEqual(result["cases"], [])
        self.assertIn("time limit", result["stderr"])

    @unittest.skipUnless(os.name == "posix", "process-group assertion requires POSIX")
    def test_timeout_kills_and_reaps_a_learner_spawned_descendant(self):
        with tempfile.TemporaryDirectory() as directory:
            pid_path = Path(directory) / "descendant.pid"
            code = (
                "import pathlib, subprocess, sys\n"
                "def solve(value):\n"
                f"    child = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'])\n"
                f"    pathlib.Path({str(pid_path)!r}).write_text(str(child.pid))\n"
                "    while True: pass"
            )
            result = run_in_subprocess(request_for(code, wall_time_ms=250))
            descendant_pid = int(pid_path.read_text())

            self.assertEqual(result["status"], "timeout")
            self.assertTrue(wait_until_dead(descendant_pid), f"descendant {descendant_pid} survived")

    def test_rejects_limits_above_the_shared_policy_ceiling_without_spawning(self):
        request = request_for("def solve(value):\n    return value * 2")
        request["spec"]["limits"] = {"wallTimeMs": 30_001}

        result = run_in_subprocess(request)

        self.assertEqual(result["status"], "error")
        self.assertIn("policy ceiling", result["stderr"])

    def test_execution_manager_cancels_a_running_process_and_cleans_its_registry(self):
        manager = ExecutionManager(max_active=1)
        result_box = {}
        thread = threading.Thread(
            target=lambda: result_box.setdefault(
                "result",
                manager.run(
                    request_for("def solve(value):\n    while True: pass", wall_time_ms=5_000)
                ),
            )
        )
        thread.start()
        self.assertTrue(wait_until(lambda: manager.active_run_ids() == ("service-run",)))

        self.assertTrue(manager.cancel("service-run"))
        thread.join(timeout=2)

        self.assertFalse(thread.is_alive())
        self.assertEqual(result_box["result"]["status"], "error")
        self.assertIn("cancelled", result_box["result"]["stderr"])
        self.assertTrue(manager.wait_for_idle(timeout=1))
        self.assertEqual(manager.active_run_ids(), ())

    def test_execution_manager_consumes_cancel_requested_before_run_registration(self):
        manager = ExecutionManager(max_active=1)
        request = request_for("def solve(value):\n    return value * 2")

        self.assertTrue(manager.cancel("service-run"))

        cancelled = manager.run(request)
        next_run = manager.run(request)

        self.assertEqual(cancelled["status"], "error")
        self.assertIn("cancelled", cancelled["stderr"])
        self.assertEqual(next_run["status"], "passed")

    def test_execution_manager_bounds_pending_cancellation_tombstones(self):
        manager = ExecutionManager(max_active=1, max_cancellation_tombstones=2)
        request = request_for("def solve(value):\n    return value * 2")

        self.assertTrue(manager.cancel("oldest"))
        self.assertTrue(manager.cancel("middle"))
        self.assertTrue(manager.cancel("newest"))

        request["runId"] = "oldest"
        self.assertEqual(manager.run(request)["status"], "passed")
        request["runId"] = "middle"
        self.assertIn("cancelled", manager.run(request)["stderr"])
        request["runId"] = "newest"
        self.assertIn("cancelled", manager.run(request)["stderr"])

    def test_execution_manager_expires_pending_cancellation_tombstones(self):
        manager = ExecutionManager(
            max_active=1,
            cancellation_tombstone_ttl_seconds=0.01,
        )
        request = request_for("def solve(value):\n    return value * 2")

        self.assertTrue(manager.cancel("service-run"))
        time.sleep(0.02)

        self.assertEqual(manager.run(request)["status"], "passed")

    def test_execution_manager_normalizes_capacity_without_starting_an_extra_child(self):
        manager = ExecutionManager(max_active=1)
        first_box = {}
        thread = threading.Thread(
            target=lambda: first_box.setdefault(
                "result",
                manager.run(
                    request_for("def solve(value):\n    while True: pass", wall_time_ms=5_000)
                ),
            )
        )
        thread.start()
        self.assertTrue(wait_until(lambda: manager.active_run_ids() == ("service-run",)))
        second = request_for("def solve(value):\n    return value * 2")
        second["runId"] = "second-run"

        overloaded = manager.run(second)
        manager.cancel("service-run")
        thread.join(timeout=2)

        self.assertEqual(overloaded["status"], "error")
        self.assertIn("capacity", overloaded["stderr"])
        self.assertEqual(manager.active_run_ids(), ())


class RunnerHttpServiceTests(unittest.TestCase):
    def setUp(self):
        self.server = create_server(
            "127.0.0.1",
            0,
            max_body_bytes=1_024,
            read_timeout_seconds=0.1,
            max_active=1,
            max_request_threads=3,
        )
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

    def test_cancel_endpoint_stops_the_registered_run(self):
        result_box = {}
        run_thread = threading.Thread(
            target=lambda: result_box.setdefault(
                "response",
                self.request(
                    "/run",
                    method="POST",
                    body=json.dumps(
                        request_for(
                            "def solve(value):\n    while True: pass",
                            wall_time_ms=5_000,
                        )
                    ),
                ),
            )
        )
        run_thread.start()
        self.assertTrue(
            wait_until(lambda: self.server.execution_manager.active_run_ids() == ("service-run",))
        )

        cancel_status, cancel = self.request(
            "/cancel",
            method="POST",
            body=json.dumps({"runId": "service-run"}),
        )
        run_thread.join(timeout=2)

        self.assertEqual(cancel_status, 200)
        self.assertEqual(cancel, {"ok": True, "cancelled": True, "runId": "service-run"})
        self.assertFalse(run_thread.is_alive())
        self.assertEqual(result_box["response"][1]["status"], "error")
        self.assertEqual(self.server.execution_manager.active_run_ids(), ())

    def test_partial_body_read_times_out_with_a_normalized_error(self):
        connection = socket.create_connection(self.server.server_address, timeout=1)
        try:
            connection.sendall(
                b"POST /run HTTP/1.1\r\n"
                b"Host: runner\r\n"
                b"Content-Type: application/json\r\n"
                b"Content-Length: 100\r\n\r\n"
                b"{"
            )
            response = receive_until_closed(connection)
        finally:
            connection.close()

        self.assertIn(b"408 Request Timeout", response)
        self.assertIn(b'"code":"read_timeout"', response)

    def test_slow_headers_cannot_create_unbounded_request_threads(self):
        server = create_server(
            "127.0.0.1",
            0,
            read_timeout_seconds=0.1,
            max_active=1,
            max_request_threads=1,
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connections = []
        try:
            for _ in range(20):
                connection = socket.create_connection(server.server_address, timeout=1)
                connection.sendall(b"POST /run HTTP/1.1\r\nHost: runner\r\n")
                connections.append(connection)

            self.assertTrue(wait_until(lambda: server.active_connection_count > 0))
            self.assertLessEqual(
                server.active_connection_count,
                server.max_connection_threads,
            )
            self.assertLessEqual(server.peak_connection_count, server.max_connection_threads)
            self.assertTrue(wait_until(lambda: server.active_connection_count == 0))
        finally:
            for connection in connections:
                connection.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=1)


def wait_until(predicate, timeout=2.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(0.01)
    return predicate()


def wait_until_dead(pid, timeout=2.0):
    def dead():
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return True
        return False

    return wait_until(dead, timeout)


def receive_until_closed(connection):
    chunks = []
    connection.settimeout(2)
    while True:
        try:
            chunk = connection.recv(4_096)
        except socket.timeout:
            break
        if not chunk:
            break
        chunks.append(chunk)
    return b"".join(chunks)


if __name__ == "__main__":
    unittest.main()
