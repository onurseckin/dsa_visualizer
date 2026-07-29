import { afterEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

const initSqliteSync = vi.fn().mockResolvedValue(undefined);
const syncKeyToSqlite = vi.fn().mockResolvedValue(undefined);
const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));

vi.mock("./app/sqliteSync", () => ({ initSqliteSync, syncKeyToSqlite }));
vi.mock("react-dom/client", () => ({ default: { createRoot } }));

describe("application bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("waits for startup hydration before mounting the routed application", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    let settleHydration: (() => void) | undefined;
    initSqliteSync.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          settleHydration = resolve;
        }),
    );

    await act(async () => {
      await import("./main");
    });

    expect(initSqliteSync).toHaveBeenCalledTimes(1);
    expect(createRoot).not.toHaveBeenCalled();

    await act(async () => {
      settleHydration?.();
    });

    await waitFor(() => {
      expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  it("mounts after a failed startup hydration attempt", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    initSqliteSync.mockRejectedValueOnce(new Error("network error"));

    await act(async () => {
      await import("./main");
    });

    await waitFor(() => {
      expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
      expect(render).toHaveBeenCalledTimes(1);
    });
  });
});
