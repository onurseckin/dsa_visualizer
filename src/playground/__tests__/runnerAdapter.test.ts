import { describe, expect, it } from "bun:test";
import {
  compareOutputs,
  evaluateTestCases,
  getAllExecutionSpecs,
  resolveExecutionSpec,
} from "../runnerAdapter";

describe("Python Runner Execution Sandbox Integration Tests", () => {
  describe("1. Execution Spec Resolution Bridge", () => {
    it("should resolve DSA execution specs via raw, kebab, snake, and prefixed IDs", () => {
      const spec1 = resolveExecutionSpec("binary-search-1d");
      expect(spec1).toBeDefined();
      expect(spec1?.entrypoint).toBe("binary_search_1d");

      const spec2 = resolveExecutionSpec("dsa_binary_search");
      expect(spec2).toBeDefined();

      const spec3 = resolveExecutionSpec("two-sum");
      expect(spec3).toBeDefined();
      expect(spec3?.entrypoint).toBe("two_sum");
    });

    it("should resolve ML execution specs via raw, prefixed, and stripped IDs", () => {
      const spec1 = resolveExecutionSpec("ml_matrix_memory_layout");
      expect(spec1).toBeDefined();
      expect(spec1?.entrypoint).toBe("flat_index_offset");

      const spec2 = resolveExecutionSpec("matrix_memory_layout");
      expect(spec2).toBeDefined();

      const spec3 = resolveExecutionSpec("ml_flashattention_sram_tiling");
      expect(spec3).toBeDefined();

      const spec4 = resolveExecutionSpec("ml_gradient_descent_adamw");
      expect(spec4).toBeDefined();
      expect(spec4?.entrypoint).toBe("adamw_step");
    });

    it("should return undefined for unknown IDs", () => {
      expect(resolveExecutionSpec("non_existent_algorithm_xyz")).toBeUndefined();
    });

    it("getAllExecutionSpecs should return a populated catalog", () => {
      const catalog = getAllExecutionSpecs();
      expect(catalog.size).toBeGreaterThan(30);
    });
  });

  describe("2. Output Comparator Engine (Comparison Modes)", () => {
    it("should evaluate deep-equal comparisons accurately", () => {
      expect(compareOutputs([1, 2, 3], [1, 2, 3], "deep-equal")).toBe(true);
      expect(compareOutputs([1, 2, 3], [1, 2, 4], "deep-equal")).toBe(false);
      expect(compareOutputs({ a: 1, b: [10, 20] }, { a: 1, b: [10, 20] }, "deep-equal")).toBe(true);
      expect(compareOutputs({ a: 1, b: [10, 20] }, { a: 1, b: [10, 30] }, "deep-equal")).toBe(
        false,
      );
    });

    it("should evaluate float comparisons with tolerance", () => {
      expect(compareOutputs(1.000001, 1.000002, "float", 1e-4)).toBe(true);
      expect(compareOutputs(1.01, 1.05, "float", 1e-3)).toBe(false);

      // Element-wise float array comparison
      expect(compareOutputs([1.0001, 2.0001], [1.0002, 2.0002], "float", 1e-3)).toBe(true);
      expect(compareOutputs([1.0, 2.0], [1.0, 3.0], "float", 1e-3)).toBe(false);

      // Nested object float comparison
      expect(
        compareOutputs({ loss: 0.7531, acc: 0.95 }, { loss: 0.7532, acc: 0.9501 }, "float", 1e-3),
      ).toBe(true);
    });

    it("should evaluate unordered and multiset comparisons", () => {
      expect(compareOutputs([1, 2, 3], [3, 1, 2], "unordered")).toBe(true);
      expect(compareOutputs([1, 2, 2], [2, 1, 2], "unordered")).toBe(true);
      expect(compareOutputs([1, 2, 2], [1, 1, 2], "unordered")).toBe(false);
      expect(
        compareOutputs(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [3, 4],
            [1, 2],
          ],
          "unordered-outer",
        ),
      ).toBe(true);
    });

    it("should evaluate stdout string comparisons with normalized whitespace", () => {
      expect(compareOutputs("Hello World\n", "Hello World", "stdout")).toBe(true);
      expect(compareOutputs("Line 1\r\nLine 2", "Line 1\nLine 2", "stdout")).toBe(true);
      expect(compareOutputs("Result: 42", "Result: 43", "stdout")).toBe(false);
    });
  });

  describe("3. Test Case Evaluation Runner & Error Handling", () => {
    it("should evaluate all cases as passed when simulation returns exact expected outputs", async () => {
      const spec = resolveExecutionSpec("ml_matrix_memory_layout");
      expect(spec).toBeDefined();

      const mockExecutor = async (_code: string, input: unknown) => {
        const inp = input as {
          shape: number[];
          strides: number[];
          indices: number[];
          offset: number;
        };
        let offset = inp.offset ?? 0;
        for (let i = 0; i < inp.indices.length; i++) {
          offset += inp.indices[i] * inp.strides[i];
        }
        return offset;
      };

      const report = await evaluateTestCases(spec!, mockExecutor);
      expect(report.totalCases).toBeGreaterThanOrEqual(3);
      expect(report.passedCases).toBe(report.totalCases);
      expect(report.failedCases).toBe(0);
      expect(report.allPassed).toBe(true);
      expect(report.totalExecutionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should capture failed cases when actual output diverges from expected", async () => {
      const spec = resolveExecutionSpec("two-sum");
      expect(spec).toBeDefined();

      // Flawed executor returning dummy answer
      const flawedExecutor = async () => [-1, -1];

      const report = await evaluateTestCases(spec!, flawedExecutor);
      expect(report.allPassed).toBe(false);
      expect(report.failedCases).toBe(report.totalCases);
      expect(report.results[0].passed).toBe(false);
      expect(report.results[0].actual).toEqual([-1, -1]);
    });

    it("should catch runtime exceptions and record error strings without crashing", async () => {
      const spec = resolveExecutionSpec("binary-search");
      expect(spec).toBeDefined();

      const throwingExecutor = async () => {
        throw new Error("ZeroDivisionError: division by zero in mock user code");
      };

      const report = await evaluateTestCases(spec!, throwingExecutor);
      expect(report.allPassed).toBe(false);
      expect(report.failedCases).toBe(report.totalCases);
      expect(report.results[0].error).toContain("ZeroDivisionError");
      expect(report.results[0].passed).toBe(false);
    });
  });
});
