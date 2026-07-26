import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  readStoredProblemListValue,
  writeStoredProblemListValue,
  isProblemListDifficulty,
  isProblemListSortField,
  isProblemListSortOrder,
  PROBLEM_LIST_STORAGE_PREFIX,
  CATEGORY_LABELS,
  cellPadding,
  PANEL_BORDER,
  CATEGORY_ENTRIES,
} from "../problemListUtils";

describe("problemListUtils Spec", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("readStoredProblemListValue and writeStoredProblemListValue", () => {
    it("returns fallback when key is not in localStorage", () => {
      expect(
        readStoredProblemListValue("search", "default", (v): v is string => typeof v === "string"),
      ).toBe("default");
    });

    it("reads and validates valid stored string", () => {
      writeStoredProblemListValue("search", "binary");
      expect(
        readStoredProblemListValue("search", "default", (v): v is string => typeof v === "string"),
      ).toBe("binary");
    });

    it("returns fallback when stored value fails validation guard", () => {
      window.localStorage.setItem(
        PROBLEM_LIST_STORAGE_PREFIX + "diff",
        JSON.stringify("InvalidDiff"),
      );
      expect(readStoredProblemListValue("diff", "All", isProblemListDifficulty)).toBe("All");
    });

    it("returns fallback when stored value is invalid JSON", () => {
      window.localStorage.setItem(PROBLEM_LIST_STORAGE_PREFIX + "diff", "{invalid json");
      expect(readStoredProblemListValue("diff", "All", isProblemListDifficulty)).toBe("All");
    });

    it("handles localStorage throwing on getItem", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
        throw new Error("Access denied");
      });
      expect(readStoredProblemListValue("diff", "All", isProblemListDifficulty)).toBe("All");
    });

    it("handles localStorage throwing on setItem gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("Storage full");
      });
      expect(() => writeStoredProblemListValue("diff", "Easy")).not.toThrow();
    });
  });

  describe("type guards", () => {
    it("isProblemListDifficulty validates difficulty values", () => {
      expect(isProblemListDifficulty("All")).toBe(true);
      expect(isProblemListDifficulty("Easy")).toBe(true);
      expect(isProblemListDifficulty("Medium")).toBe(true);
      expect(isProblemListDifficulty("Hard")).toBe(true);
      expect(isProblemListDifficulty("Unknown")).toBe(false);
      expect(isProblemListDifficulty(123)).toBe(false);
      expect(isProblemListDifficulty(null)).toBe(false);
    });

    it("isProblemListSortField validates sort field values", () => {
      expect(isProblemListSortField("title")).toBe(true);
      expect(isProblemListSortField("difficulty")).toBe(true);
      expect(isProblemListSortField("category")).toBe(true);
      expect(isProblemListSortField("other")).toBe(false);
      expect(isProblemListSortField(undefined)).toBe(false);
    });

    it("isProblemListSortOrder validates sort order values", () => {
      expect(isProblemListSortOrder("asc")).toBe(true);
      expect(isProblemListSortOrder("desc")).toBe(true);
      expect(isProblemListSortOrder("up")).toBe(false);
      expect(isProblemListSortOrder(null)).toBe(false);
    });
  });

  describe("constants", () => {
    it("exports CATEGORY_LABELS and styling constants", () => {
      expect(CATEGORY_LABELS.arrays_and_hashing).toBe("Arrays & Hashing");
      expect(cellPadding).toBe("var(--space-3) var(--space-4)");
      expect(PANEL_BORDER).toEqual({ borderColor: "var(--border-default)" });
      expect(CATEGORY_ENTRIES.length).toBeGreaterThan(0);
    });
  });
});
