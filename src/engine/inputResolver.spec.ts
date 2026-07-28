import { describe, expect, it } from "vitest";
import { resolveInput } from "./inputResolver";

describe("resolveInput", () => {
  it("keeps a provided non-string input and restores the default for absent text", () => {
    const defaultInput = { values: [1, 2] };
    const provided = { values: [3, 4] };

    expect(resolveInput(provided, defaultInput)).toBe(provided);
    expect(resolveInput(null, defaultInput)).toBe(defaultInput);
    expect(resolveInput(undefined, defaultInput)).toBe(defaultInput);
    expect(resolveInput("   ", defaultInput)).toBe(defaultInput);
  });

  it("parses bracketed arrays and falls back when their content is malformed", () => {
    expect(resolveInput("values = [1, 2, 3]", [0])).toEqual([1, 2, 3]);
    expect(resolveInput("values = [not-json]", [0])).toEqual([0]);
  });

  it("updates recognized object fields while retaining the remaining defaults", () => {
    expect(
      resolveInput("target = 01, label = 'chosen'", { target: 0, label: "default", keep: true }),
    ).toEqual({ target: 1, label: "chosen", keep: true });
  });

  it("parses number and string defaults before attempting generic JSON", () => {
    expect(resolveInput("value: -2.5", 0)).toBe(-2.5);
    expect(resolveInput("name = 'Ada'", "default")).toBe("Ada");
    expect(resolveInput("Ada", "default")).toBe("Ada");
    expect(resolveInput('{"enabled":true}', false)).toEqual({ enabled: true });
    expect(resolveInput("not-json", false)).toBe(false);
  });
});
