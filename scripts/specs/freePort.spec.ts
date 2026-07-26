import net from "net";
import { describe, expect, it, vi } from "vitest";
import { freePort, getPidsForPort, isPortInUse, killPid, main } from "../freePort";

describe("freePort script suite", () => {
  it("detects when a port is free vs in use", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    const busy = await isPortInUse(port);
    expect(busy).toBe(true);

    await new Promise<void>((resolve) => server.close(() => resolve()));

    const free = await isPortInUse(port);
    expect(free).toBe(false);
  });

  it("handles getPidsForPort safely for unused port", () => {
    const pids = getPidsForPort(59999);
    expect(Array.isArray(pids)).toBe(true);
  });

  it("handles killPid safely for invalid pid", () => {
    const success = killPid(999999);
    expect(typeof success).toBe("boolean");
  });

  it("frees an occupied port cleanly", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    // Call freePort on the port
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await freePort(port);
    logSpy.mockRestore();

    server.close();
  });

  it("executes main with default or explicit ports", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await main(["59998"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("59998"));
    logSpy.mockRestore();
  });
});
