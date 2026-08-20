import { execSync } from "child_process";
import net from "net";

/**
 * Checks if a TCP port is currently occupied on localhost.
 */
export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, "127.0.0.1");
  });
}

/**
 * Finds process IDs (PIDs) listening on the target port across macOS, Linux, and Windows.
 */
export function getPidsForPort(port: number): number[] {
  const pids = new Set<number>();
  const isWindows = process.platform === "win32";

  try {
    if (isWindows) {
      const output = execSync(`netstat -ano -p tcp`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const lines = output.split("\n");
      const portRegex = new RegExp(`:${port}\\s+`, "i");

      for (const line of lines) {
        if (portRegex.test(line)) {
          const parts = line.trim().split(/\s+/);
          const pidStr = parts[parts.length - 1];
          const pid = parseInt(pidStr, 10);
          if (!isNaN(pid) && pid > 0 && pid !== process.pid) {
            pids.add(pid);
          }
        }
      }
    } else {
      const output = execSync(`lsof -i :${port} -t`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const lines = output.trim().split("\n");

      for (const line of lines) {
        const pid = parseInt(line.trim(), 10);
        if (!isNaN(pid) && pid > 0 && pid !== process.pid) {
          pids.add(pid);
        }
      }
    }
  } catch {
    // Command returns exit code 1 if no process is occupying the port
  }

  return Array.from(pids);
}

/**
 * Terminates a process by PID cross-platform.
 */
export function killPid(pid: number): boolean {
  const isWindows = process.platform === "win32";
  try {
    if (isWindows) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGKILL");
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Inspects a target port and kills any process occupying it.
 */
export async function freePort(port: number): Promise<void> {
  const busy = await isPortInUse(port);
  if (!busy) {
    console.log(`[free-port] Port ${port} is clear.`);
    return;
  }

  console.log(`[free-port] Port ${port} is in use. Locating processes...`);
  const pids = getPidsForPort(port);

  if (pids.length === 0) {
    console.log(`[free-port] Port ${port} is busy, but no external PIDs were found.`);
    return;
  }

  for (const pid of pids) {
    console.log(`[free-port] Terminating process (PID: ${pid}) holding port ${port}...`);
    killPid(pid);
  }

  await new Promise((resolve) => setTimeout(resolve, 150));

  const stillBusy = await isPortInUse(port);
  if (stillBusy) {
    console.warn(`[free-port] Warning: Port ${port} could not be completely freed.`);
  } else {
    console.log(`[free-port] Port ${port} successfully freed.`);
  }
}

/**
 * CLI execution entrypoint.
 */
export async function main(args = process.argv.slice(2)): Promise<void> {
  const portsToClear =
    args.length > 0
      ? args.map((arg) => parseInt(arg, 10)).filter((p) => !isNaN(p) && p > 0)
      : [42000, 42173];

  for (const port of portsToClear) {
    await freePort(port);
  }
}

// Run CLI if invoked directly via bun or node
if (process.argv[1]?.includes("freePort")) {
  main().catch((err) => {
    console.error("[free-port] Error clearing ports:", err);
    process.exit(1);
  });
}
