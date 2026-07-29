"""Restart the development runner whenever its source files change."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).parent
POLL_INTERVAL_SECONDS = 0.5


def source_signature() -> tuple[tuple[str, int], ...]:
    return tuple(
        sorted(
            (str(path.relative_to(ROOT)), path.stat().st_mtime_ns)
            for path in ROOT.rglob("*.py")
            if path.is_file()
        )
    )


def stop(process: subprocess.Popen[object]) -> None:
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()


def main() -> int:
    process = subprocess.Popen([sys.executable, "runner_service.py"], cwd=ROOT)
    previous_signature = source_signature()

    def shutdown(_signal: int, _frame: object) -> None:
        stop(process)
        raise SystemExit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    while True:
        if process.poll() is not None:
            return process.returncode or 0
        time.sleep(POLL_INTERVAL_SECONDS)
        current_signature = source_signature()
        if current_signature != previous_signature:
            stop(process)
            process = subprocess.Popen([sys.executable, "runner_service.py"], cwd=ROOT)
            previous_signature = current_signature


if __name__ == "__main__":
    raise SystemExit(main())
