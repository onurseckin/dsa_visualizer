import { describe, expect, it } from "bun:test";
import { getCourseStepperAdapter } from "../stepperAdapters";
import {
  BreakpointFactory,
  computeStepDiff,
  ExecutionRecorder,
  TimeTravelController,
} from "../timeTravelDebugger";

describe("Interactive Step Replay & Time-Travel Debugger Tests", () => {
  const dinicAdapter = getCourseStepperAdapter("dsa_graph_flows_and_cuts");
  const sampleSteps = dinicAdapter ? dinicAdapter.generateSteps() : [];

  describe("1. Deterministic Execution Recording & State Diffing", () => {
    it("should record full checkpoints and compute bidirectional state diffs", () => {
      expect(sampleSteps.length).toBeGreaterThanOrEqual(4);

      const recorder = new ExecutionRecorder(sampleSteps);
      expect(recorder.totalSteps).toBe(sampleSteps.length);

      const cp0 = recorder.getCheckpoint(0)!;
      const cp1 = recorder.getCheckpoint(1)!;

      expect(cp0).toBeDefined();
      expect(cp0.forwardDiff).toBeDefined();
      expect(cp0.backwardDiff).toBeUndefined(); // First step has no previous

      expect(cp1.backwardDiff).toBeDefined();
      expect(cp1.forwardDiff).toBeDefined();

      // State diff structure
      const fwd = cp0.forwardDiff!;
      expect(fwd.fromStepIndex).toBe(0);
      expect(fwd.toStepIndex).toBe(1);
      expect(fwd.lineChanged).toBe(true);
      expect(fwd.variableDiffs.length).toBeGreaterThan(0);
    });

    it("computeStepDiff should track variable creation, mutation, and memory trace updates", () => {
      const stepA = {
        stepNumber: 1,
        title: "Step 1",
        description: "Init",
        codeLine: 10,
        codeSnippet: "low = 0; high = 10",
        variables: { low: 0, high: 10, target: 7 },
        memoryTrace: [{ address: "0x100", label: "L1_Line0", value: 42, isCacheHit: true }],
        activeInvariant: "Search space [0..10]",
      };

      const stepB = {
        stepNumber: 2,
        title: "Step 2",
        description: "Bisect",
        codeLine: 15,
        codeSnippet: "mid = 5",
        variables: { low: 0, high: 10, target: 7, mid: 5 },
        memoryTrace: [
          { address: "0x100", label: "L1_Line0", value: 99, isCacheHit: false, isDirty: true },
        ],
        activeInvariant: "Bisected interval [0..5]",
      };

      const diff = computeStepDiff(stepA, stepB, 0, 1);

      expect(diff.lineChanged).toBe(true);
      expect(diff.previousLine).toBe(10);
      expect(diff.currentLine).toBe(15);
      expect(diff.invariantChanged).toBe(true);

      // Variable diff: 'mid' was created
      const midDiff = diff.variableDiffs.find((v) => v.name === "mid");
      expect(midDiff).toBeDefined();
      expect(midDiff?.kind).toBe("created");
      expect(midDiff?.currentValue).toBe(5);

      // Memory diff: 0x100 value mutated from 42 to 99, cache hit false
      const memDiff = diff.memoryDiffs.find((m) => m.address === "0x100");
      expect(memDiff).toBeDefined();
      expect(memDiff?.previousValue).toBe(42);
      expect(memDiff?.currentValue).toBe(99);
      expect(memDiff?.currentCacheHit).toBe(false);
      expect(memDiff?.isDirty).toBe(true);
    });
  });

  describe("2. Time-Travel Stepping Controller", () => {
    it("should step forward and backward with O(1) state delta updates", () => {
      const controller = new TimeTravelController(sampleSteps);

      expect(controller.currentIndex).toBe(0);
      expect(controller.isAtStart).toBe(true);
      expect(controller.isAtEnd).toBe(false);

      // Step forward to index 1
      const fwd1 = controller.stepForward();
      expect(controller.currentIndex).toBe(1);
      expect(fwd1.step?.stepNumber).toBe(2);
      expect(fwd1.diff).toBeDefined();

      // Step forward to index 2
      const fwd2 = controller.stepForward();
      expect(controller.currentIndex).toBe(2);
      expect(fwd2.step?.stepNumber).toBe(3);

      // Step backward to index 1
      const bwd1 = controller.stepBackward();
      expect(controller.currentIndex).toBe(1);
      expect(bwd1.step?.stepNumber).toBe(2);

      // Instantaneous jump to last step
      const lastStep = controller.jumpToStep(sampleSteps.length - 1);
      expect(controller.currentIndex).toBe(sampleSteps.length - 1);
      expect(controller.isAtEnd).toBe(true);
      expect(lastStep?.stepNumber).toBe(sampleSteps.length);

      // Reset
      controller.reset();
      expect(controller.currentIndex).toBe(0);
      expect(controller.isAtStart).toBe(true);
    });
  });

  describe("3. Conditional Breakpoint Engine & Resume Execution", () => {
    it("should halt execution when variable condition matches", () => {
      const controller = new TimeTravelController(sampleSteps);

      // Add breakpoint when max_flow reaches 14 (final max flow step)
      const flowBp = BreakpointFactory.createVariableBreakpoint(
        "max_flow",
        (val) => val === 14,
        "Max-Flow Converged at 14",
      );
      controller.addBreakpoint(flowBp);

      const result = controller.resumeUntilBreakpoint();

      expect(result.hitBreakpoint).toBeDefined();
      expect(result.hitBreakpoint?.id).toBe(flowBp.id);
      expect(result.finalStep?.variables["max_flow"]).toBe(14);
      expect(controller.playbackState).toBe("paused");
    });

    it("should halt execution when memory cache miss occurs", () => {
      // Create trace with a deliberate cache miss on step 2
      const stepsWithCacheMiss = [
        {
          stepNumber: 1,
          title: "Warmup",
          description: "Prefetch",
          codeLine: 1,
          codeSnippet: "",
          variables: {},
          memoryTrace: [{ address: "0x00", label: "L1", value: 1, isCacheHit: true }],
        },
        {
          stepNumber: 2,
          title: "Cache Stall",
          description: "Eviction",
          codeLine: 5,
          codeSnippet: "",
          variables: {},
          memoryTrace: [{ address: "0x80", label: "DRAM_EVICT", value: 2, isCacheHit: false }],
        },
        {
          stepNumber: 3,
          title: "Complete",
          description: "Done",
          codeLine: 10,
          codeSnippet: "",
          variables: {},
        },
      ];

      const controller = new TimeTravelController(stepsWithCacheMiss);
      const cacheMissBp = BreakpointFactory.createCacheMissBreakpoint("DRAM Stall Detected");
      controller.addBreakpoint(cacheMissBp);

      const result = controller.resumeUntilBreakpoint();

      expect(result.hitBreakpoint).toBeDefined();
      expect(result.hitBreakpoint?.id).toBe(cacheMissBp.id);
      expect(controller.currentIndex).toBe(1);
      expect(result.finalStep?.stepNumber).toBe(2);
    });

    it("should halt execution when invariant violation is detected", () => {
      const geoAdapter = getCourseStepperAdapter("dsa_geometry_and_sweep_line");
      const geoSteps = geoAdapter ? geoAdapter.generateSteps() : [];

      const controller = new TimeTravelController(geoSteps);
      const invBp = BreakpointFactory.createInvariantViolationBreakpoint(
        "Turn Convexity Violation",
      );
      controller.addBreakpoint(invBp);

      const result = controller.resumeUntilBreakpoint();

      expect(result.hitBreakpoint).toBeDefined();
      expect(result.hitBreakpoint?.id).toBe(invBp.id);
      expect(controller.currentIndex).toBe(1); // Step 2 has turn: Clockwise (Invalid)
      expect(result.finalStep?.stepNumber).toBe(2);
    });
  });
});
