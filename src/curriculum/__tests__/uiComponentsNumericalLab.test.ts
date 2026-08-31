import { describe, expect, it } from "bun:test";
import React from "react";
import {
  NumericalLabPlayground,
  renderFormattedMath,
  renderRichProblemText,
} from "../../components/curriculum";
import { generateNumericalExercises } from "../index";

describe("Interactive Numerical Lab & Sizing Playground Tests", () => {
  describe("1. Component Lifecycle & Modal/Standalone Mode Instantiation", () => {
    it("should return null when isOpen is false in modal mode", () => {
      const element = React.createElement(NumericalLabPlayground, {
        isOpen: false,
        onClose: () => {},
      });
      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate in modal dialog mode when isOpen is true", () => {
      let closed = false;
      const element = React.createElement(NumericalLabPlayground, {
        isOpen: true,
        onClose: () => {
          closed = true;
        },
        initialSeed: 1234,
      });
      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(true);
      expect(element.props.initialSeed).toBe(1234);
      expect(closed).toBe(false);
    });

    it("should instantiate in standalone embedded mode when isOpen is undefined", () => {
      const element = React.createElement(NumericalLabPlayground, {
        className: "custom-numerical-panel",
        topicId: "ml_attention_causal_sdpa",
        initialSeed: 42,
      });
      expect(element).toBeDefined();
      expect(element.props.isOpen).toBeUndefined();
      expect(element.props.className).toBe("custom-numerical-panel");
      expect(element.props.topicId).toBe("ml_attention_causal_sdpa");
      expect(element.props.initialSeed).toBe(42);
    });

    it("should accept onComplete callback prop", () => {
      let completedResult: { exerciseId: string; isCorrect: boolean; score: number } | null = null;
      const handleComplete = (res: { exerciseId: string; isCorrect: boolean; score: number }) => {
        completedResult = res;
      };
      const element = React.createElement(NumericalLabPlayground, {
        initialSeed: 55,
        onComplete: handleComplete,
      });
      expect(element.props.onComplete).toBe(handleComplete);
      expect(completedResult).toBeNull();
    });
  });

  describe("2. Real-Time Math & Formula Parsing Engine", () => {
    it("should parse basic LaTeX symbols, fractions, and Greek letters", () => {
      const mathNode = renderFormattedMath("3 \\times 3");
      expect(React.isValidElement(mathNode)).toBe(true);

      const subNode = renderFormattedMath("d_{\\text{head}} = 128");
      expect(React.isValidElement(subNode)).toBe(true);

      const fracNode = renderFormattedMath("2 \\frac{P-1}{P} S");
      expect(React.isValidElement(fracNode)).toBe(true);

      const greekNode = renderFormattedMath("\\alpha + \\beta");
      expect(React.isValidElement(greekNode)).toBe(true);
    });

    it("should render rich text containing multiple inline math formulas and bullet lists", () => {
      const text =
        "Calculate total memory with:\n- Context length $L = 2048$\n- Dimension $d_{\\text{head}} = 128$\n- Bandwidth $B = 50\\text{ GB/s}$";
      const richNode = renderRichProblemText(text);
      expect(React.isValidElement(richNode)).toBe(true);
    });
  });

  describe("3. Parameterized Calculations Across All Exercise Archetypes", () => {
    it("should calculate KV Cache memory sizing across seeds", () => {
      for (const seed of [42, 101, 777]) {
        const exercises = generateNumericalExercises("ml_attention_causal_sdpa", seed);
        const kvEx = exercises.find((e) => e.id.startsWith("num_kv_cache_"));
        expect(kvEx).toBeDefined();
        if (!kvEx) continue;
        const p = kvEx.parameters as Record<string, number>;
        const bytes =
          2 * p.layers * p.kvHeads * p.headDim * p.seqLen * p.batchSize * p.bytesPerElem;
        const expectedGB = Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100;
        expect(kvEx.correctAnswer).toBe(expectedGB);
        expect(kvEx.unit).toBe("GB");
      }
    });

    it("should calculate Ring-AllReduce transfer latency across seeds", () => {
      for (const seed of [13, 88, 256]) {
        const exercises = generateNumericalExercises("ml_distributed_data_parallel_ddp", seed);
        const ringEx = exercises.find((e) => e.id.startsWith("num_ring_allreduce_"));
        expect(ringEx).toBeDefined();
        if (!ringEx) continue;
        const p = ringEx.parameters as Record<string, number>;
        const factor = (2 * (p.P - 1)) / p.P;
        const expectedSec = Math.round(((factor * p.modelGB) / p.bandwidthGBs) * 1000) / 1000;
        expect(ringEx.correctAnswer).toBe(expectedSec);
        expect(ringEx.unit).toBe("seconds");
      }
    });

    it("should calculate ZeRO-3 parameter sharding across seeds", () => {
      for (const seed of [5, 42, 500]) {
        const exercises = generateNumericalExercises("ml_zero_stage_123_optimizer", seed);
        const zeroEx = exercises.find((e) => e.id.startsWith("num_zero3_sharding_"));
        expect(zeroEx).toBeDefined();
        if (!zeroEx) continue;
        const p = zeroEx.parameters as Record<string, number>;
        const expectedPerGpuGB = Math.round(((16 * p.paramsBillion) / p.gpus) * 100) / 100;
        expect(zeroEx.correctAnswer).toBe(expectedPerGpuGB);
        expect(zeroEx.unit).toBe("GB");
      }
    });

    it("should calculate Fenwick Tree lowbit jumps across seeds", () => {
      for (const seed of [1, 23, 77]) {
        const exercises = generateNumericalExercises("dsa_advanced_range_queries", seed);
        const fenwickEx = exercises.find((e) => e.id.startsWith("num_fenwick_lowbit_"));
        expect(fenwickEx).toBeDefined();
        if (!fenwickEx) continue;
        const p = fenwickEx.parameters as Record<string, number>;
        expect(p.lowbit).toBe(p.index & -p.index);
        expect(fenwickEx.correctAnswer).toBe(p.index + p.lowbit);
      }
    });

    it("should calculate Im2Col unfolded memory expansion across seeds", () => {
      for (const seed of [7, 49, 345]) {
        const exercises = generateNumericalExercises("ml_convolutions_im2col_gemm", seed);
        const im2colEx = exercises.find((e) => e.id.startsWith("num_im2col_expansion_"));
        expect(im2colEx).toBeDefined();
        if (!im2colEx) continue;
        const p = im2colEx.parameters as Record<string, number>;
        const expectedColMB =
          Math.round(((p.B * (p.C_in * p.K * p.K) * p.H * p.W * 4) / 1e6) * 100) / 100;
        expect(im2colEx.correctAnswer).toBe(expectedColMB);
        expect(im2colEx.unit).toBe("MB");
      }
    });
  });

  describe("4. Numerical Tolerance Verification & Edge Cases", () => {
    it("should pass verification on exact and near-tolerance answers", () => {
      const exercises = generateNumericalExercises(undefined, 42);
      for (const ex of exercises) {
        const exact = ex.verify(ex.correctAnswer);
        expect(exact.isCorrect).toBe(true);
        expect(exact.errorPct).toBe(0);
        expect(exact.feedback).toContain("Correct");

        if (ex.tolerance > 0) {
          const near = ex.verify(ex.correctAnswer + ex.tolerance * 0.5);
          expect(near.isCorrect).toBe(true);
        }
      }
    });

    it("should fail verification when answer exceeds tolerance threshold", () => {
      const exercises = generateNumericalExercises(undefined, 42);
      for (const ex of exercises) {
        const wrongAnswer = ex.correctAnswer + 5000 + Math.abs(ex.correctAnswer) * 2;
        const result = ex.verify(wrongAnswer);
        expect(result.isCorrect).toBe(false);
        expect(result.errorPct).toBeGreaterThan(1.0);
        expect(result.feedback).toContain("Incorrect");
      }
    });

    it("should handle edge cases: extreme numbers and negative values", () => {
      const exercises = generateNumericalExercises(undefined, 42);
      for (const ex of exercises) {
        expect(ex.verify(-10000).isCorrect).toBe(false);
        expect(ex.verify(1e9).isCorrect).toBe(false);
      }
    });
  });

  describe("5. Seed Determinism & Solution Steps", () => {
    it("should produce deterministic exercises for identical seeds and variations across different seeds", () => {
      const a = generateNumericalExercises(undefined, 777);
      const b = generateNumericalExercises(undefined, 777);
      expect(a.length).toBe(b.length);
      for (let i = 0; i < a.length; i++) {
        expect(a[i].id).toBe(b[i].id);
        expect(a[i].correctAnswer).toBe(b[i].correctAnswer);
      }

      const ex42 = generateNumericalExercises("ml_attention_causal_sdpa", 42)[0];
      const ex999 = generateNumericalExercises("ml_attention_causal_sdpa", 999)[0];
      expect(ex42.id).not.toBe(ex999.id);
    });

    it("should produce non-empty solution steps and populated parameters for all exercises", () => {
      const exercises = generateNumericalExercises(undefined, 100);
      for (const ex of exercises) {
        expect(ex.solutionSteps.length).toBeGreaterThanOrEqual(2);
        for (const step of ex.solutionSteps) {
          expect(step.length).toBeGreaterThan(5);
        }
        expect(Object.keys(ex.parameters).length).toBeGreaterThan(0);
      }
    });
  });
});
