import { afterEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

const initSqliteSync = vi.fn().mockResolvedValue(undefined);
const syncKeyToSqlite = vi.fn().mockResolvedValue(undefined);

vi.mock("./app/sqliteSync", () => ({ initSqliteSync, syncKeyToSqlite }));

describe("application bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("starts persistence synchronization and mounts the routed application", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    await act(async () => {
      await import("./main");
    });

    expect(initSqliteSync).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(document.getElementById("root")).not.toBeEmptyDOMElement();
    });
  });
});
