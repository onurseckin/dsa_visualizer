import { describe, expect, it } from "bun:test";
import React from "react";
import {
  InteractiveCodingCheckpointView,
  categorizeTestCase,
  formatDataForDisplay,
} from "../../components/curriculum";
import {
  executeSpecTestCases,
  getCheckpointByProblemId,
  resolveCheckpointSpec,
  resolveExecutionSpec,
} from "../../playground";

describe("Interactive Coding Checkpoint View & Evaluation Engine Tests", () => {
  describe("1. Component Instantiation & Modal / Standalone Modes", () => {
    it("should instantiate in standalone embedded mode when isOpen is undefined", () => {
      const element = React.createElement(InteractiveCodingCheckpointView, {
        problemId: "binary-search-1d",
        className: "custom-checkpoint-class",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(InteractiveCodingCheckpointView);
      expect(element.props.problemId).toBe("binary-search-1d");
      expect(element.props.isOpen).toBeUndefined();
      expect(element.props.className).toBe("custom-checkpoint-class");
    });

    it("should instantiate in modal dialog mode when isOpen is true", () => {
      let closed = false;
      const element = React.createElement(InteractiveCodingCheckpointView, {
        problemId: "two-sum",
        isOpen: true,
        onClose: () => {
          closed = true;
        },
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(true);
      expect(element.props.problemId).toBe("two-sum");
      expect(closed).toBe(false);
    });

    it("should accept custom onComplete callback and custom initialCode", () => {
      let completedReport: unknown = null;
      const customCode = "def solve():\n    return 42\n";

      const element = React.createElement(InteractiveCodingCheckpointView, {
        problemId: "binary-search-1d",
        initialCode: customCode,
        onComplete: (report) => {
          completedReport = report;
        },
      });

      expect(element.props.initialCode).toBe(customCode);
      expect(typeof element.props.onComplete).toBe("function");
      expect(completedReport).toBeNull();
    });
  });

  describe("2. Checkpoint Spec Resolution Across DSA & ML Domains", () => {
    it("should resolve signature DSA problem checkpoints", () => {
      const dsaProblems = [
        "binary-search-1d",
        "binary-search",
        "two-sum",
        "dsa_binary_search",
        "dsa_linked_list",
      ];

      for (const id of dsaProblems) {
        const resolved = resolveCheckpointSpec(id);
        expect(resolved).toBeDefined();
        expect(resolved?.reference).toBeDefined();
        expect(resolved?.reference.title.length).toBeGreaterThan(0);
        expect(resolved?.resolvedStarterCode).toBeDefined();
      }
    });

    it("should resolve signature ML problem checkpoints", () => {
      const mlProblems = [
        "ml_attention_causal_sdpa",
        "ml_loss_functions_info_theory",
        "ml_zero3_parameter_sharding",
        "ml_flashattention_sram_tiling",
        "ml_matrix_memory_layout",
      ];

      for (const id of mlProblems) {
        const resolved = resolveCheckpointSpec(id);
        expect(resolved).toBeDefined();
        expect(resolved?.reference).toBeDefined();
        expect(resolved?.resolvedStarterCode).toBeDefined();
      }
    });

    it("should resolve execution spec cases and entrypoints", () => {
      const bsSpec = resolveExecutionSpec("binary-search-1d");
      expect(bsSpec).toBeDefined();
      expect(bsSpec?.cases.length).toBeGreaterThanOrEqual(3);
      expect(bsSpec?.entrypoint).toBe("binary_search_1d");

      const sdpaSpec = resolveExecutionSpec("ml_attention_causal_sdpa");
      expect(sdpaSpec).toBeDefined();
      expect(sdpaSpec?.cases.length).toBeGreaterThanOrEqual(2);

      const cpDirect = getCheckpointByProblemId("binary-search-1d");
      if (cpDirect) {
        expect(cpDirect.reference.problemId).toBe("binary-search-1d");
      }
    });

    it("should return undefined for completely unknown and invalid problem IDs", () => {
      expect(resolveCheckpointSpec("non_existent_random_id_98765")).toBeUndefined();
    });
  });

  describe("3. Test Case Categorization Engine (Basic vs Boundary vs Complex)", () => {
    it("should categorize boundary test cases correctly", () => {
      const boundaryCases = [
        { id: "case-1", label: "Empty input array", input: { array: [] } },
        { id: "case-2", label: "Single element edge case", input: [42] },
        { id: "case-3", label: "Zero variance boundary", input: { std: 0 } },
        { id: "case-4", label: "Null root node check", input: null },
        { id: "case-5", label: "Minimal negative value", input: -999 },
      ];

      for (const tc of boundaryCases) {
        expect(categorizeTestCase(tc)).toBe("boundary");
      }
    });

    it("should categorize complex / stress test cases correctly", () => {
      const complexCases = [
        { id: "case-1", label: "Large stress tensor multi-head batch", input: { heads: 32 } },
        { id: "case-2", label: "Deep recursion stack tree", input: { depth: 1000 } },
        { id: "case-3", label: "Distributed sharded parameter ring", input: { ranks: 64 } },
        {
          id: "case-4",
          label: "High dimensional matrix",
          input: new Array(50)
            .fill(0)
            .map((_, i) => ({ id: i, value: i * 2, metadata: "payload" })),
        },
      ];

      for (const tc of complexCases) {
        expect(categorizeTestCase(tc)).toBe("complex");
      }
    });

    it("should categorize standard test cases as basic", () => {
      const basicCases = [
        { id: "case-1", label: "Present middle target", input: { array: [1, 2, 3], target: 2 } },
        { id: "case-2", label: "Standard 2-element sum", input: { nums: [2, 7], target: 9 } },
        { id: "case-3", label: "Sample query execution", input: { val: 5 } },
      ];

      for (const tc of basicCases) {
        expect(categorizeTestCase(tc)).toBe("basic");
      }
    });
  });

  describe("4. Data Formatting Utilities for Display", () => {
    it("should format primitives and objects cleanly", () => {
      expect(formatDataForDisplay(undefined)).toBe("undefined");
      expect(formatDataForDisplay(null)).toBe("null");
      expect(formatDataForDisplay("hello")).toBe("hello");
      expect(formatDataForDisplay(42)).toBe("42");
      expect(formatDataForDisplay(true)).toBe("true");
      expect(formatDataForDisplay([1, 2, 3])).toBe("[\n  1,\n  2,\n  3\n]");
      expect(formatDataForDisplay({ a: 1 })).toBe('{\n  "a": 1\n}');
    });
  });

  describe("5. Execution Sandbox & Test Runner Evaluation Flow", () => {
    it("should execute passing test suite with accurate metrics and zero failures", async () => {
      const spec = resolveExecutionSpec("binary-search-1d");
      expect(spec).toBeDefined();

      const mockPassingExecutor = async (_code: string, input: unknown) => {
        const inp = input as { array: number[]; target: number };
        const arr = inp.array;
        const target = inp.target;
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      };

      const report = await executeSpecTestCases(
        spec!,
        mockPassingExecutor,
        "def binary_search_1d(): pass",
      );

      expect(report.totalCases).toBe(spec!.cases.length);
      expect(report.passedCases).toBe(spec!.cases.length);
      expect(report.failedCases).toBe(0);
      expect(report.allPassed).toBe(true);
      expect(report.totalExecutionTimeMs).toBeGreaterThanOrEqual(0);
      expect(report.results.every((r) => r.passed)).toBe(true);
    });

    it("should capture failed cases with divergent actual vs expected values", async () => {
      const spec = resolveExecutionSpec("binary-search-1d");
      expect(spec).toBeDefined();

      // Flawed executor always returning 999
      const mockFailingExecutor = async () => 999;

      const report = await executeSpecTestCases(
        spec!,
        mockFailingExecutor,
        "def binary_search(): return 999",
      );

      expect(report.allPassed).toBe(false);
      expect(report.failedCases).toBe(spec!.cases.length);
      expect(report.passedCases).toBe(0);
      expect(report.results[0].actual).toBe(999);
      expect(report.results[0].passed).toBe(false);
    });

    it("should safely catch and record runtime exceptions in test results", async () => {
      const spec = resolveExecutionSpec("two-sum");
      expect(spec).toBeDefined();

      const mockThrowingExecutor = async () => {
        throw new Error("IndexError: list index out of range");
      };

      const report = await executeSpecTestCases(spec!, mockThrowingExecutor, "invalid code");

      expect(report.allPassed).toBe(false);
      expect(report.failedCases).toBe(spec!.cases.length);
      expect(report.results[0].error).toContain("IndexError: list index out of range");
      expect(report.results[0].passed).toBe(false);
    });
  });
});
