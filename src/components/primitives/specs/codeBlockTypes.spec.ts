import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  splitIndent,
  readExplainEnabled,
  writeExplainEnabled,
  EXPLAIN_LINES_STORAGE_KEY,
  DEFAULT_EXPLAIN_LINES_ENABLED,
} from "../code_block/codeBlockTypes";

describe("codeBlockTypes helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("splitIndent", () => {
    it("splits leading whitespace from line content", () => {
      expect(splitIndent("    def foo():")).toEqual({
        indent: "    ",
        content: "def foo():",
      });
      expect(splitIndent("\t\tx = 1")).toEqual({
        indent: "\t\t",
        content: "x = 1",
      });
    });

    it("returns empty indent for lines without leading whitespace", () => {
      expect(splitIndent("return True")).toEqual({
        indent: "",
        content: "return True",
      });
    });

    it("handles empty line", () => {
      expect(splitIndent("")).toEqual({
        indent: "",
        content: "",
      });
    });

    it("handles regex match returning null fallback branch", () => {
      vi.spyOn(RegExp.prototype, "exec").mockReturnValueOnce(null);
      expect(splitIndent("hello")).toEqual({
        indent: "",
        content: "hello",
      });
    });
  });

  describe("readExplainEnabled and writeExplainEnabled", () => {
    it("returns default value when localStorage is empty", () => {
      expect(readExplainEnabled()).toBe(DEFAULT_EXPLAIN_LINES_ENABLED);
    });

    it("reads stored boolean value correctly", () => {
      writeExplainEnabled(false);
      expect(readExplainEnabled()).toBe(false);

      writeExplainEnabled(true);
      expect(readExplainEnabled()).toBe(true);
    });

    it("returns default value when stored value is invalid JSON or non-boolean", () => {
      window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, "invalid-json{");
      expect(readExplainEnabled()).toBe(DEFAULT_EXPLAIN_LINES_ENABLED);

      window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, JSON.stringify("not-a-boolean"));
      expect(readExplainEnabled()).toBe(DEFAULT_EXPLAIN_LINES_ENABLED);

      window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, JSON.stringify(123));
      expect(readExplainEnabled()).toBe(DEFAULT_EXPLAIN_LINES_ENABLED);
    });

    it("handles localStorage throwing on read gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
        throw new Error("Access denied");
      });
      expect(readExplainEnabled()).toBe(DEFAULT_EXPLAIN_LINES_ENABLED);
    });

    it("handles localStorage throwing on write gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("Storage full");
      });
      expect(() => writeExplainEnabled(true)).not.toThrow();
    });
  });
});
