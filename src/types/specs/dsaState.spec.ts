import { describe, expect, it } from "vitest";
import { elementStateToken } from "../dsa";

describe("elementStateToken", () => {
  it.each([
    ["compared", "compare"],
    ["highlighted", "active"],
    ["decode", "active"],
    ["prefill", "active"],
    ["result", "sorted"],
    ["found", "sorted"],
    ["finished", "sorted"],
    ["inactive", "default"],
    ["waiting", "default"],
  ] as const)("maps semantic %s state to the %s visual token", (state, token) => {
    expect(elementStateToken(state)).toBe(token);
  });

  it("preserves canonical visual states", () => {
    expect(elementStateToken("queued")).toBe("queued");
    expect(elementStateToken("path")).toBe("path");
  });
});
