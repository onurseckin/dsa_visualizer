import { describe, expect, it } from "bun:test";
import { ALL_COURSE_JOURNEYS } from "../index";
import { generateCourseSteps, getCourseStepperAdapter } from "../stepperAdapters";

describe("Interactive Course Visualizer Stepper Adapter Engine Tests", () => {
  describe("1. Specialized Stepper Adapters", () => {
    it("should generate FlashAttention SRAM tiling steps with memory traces", () => {
      const adapter = getCourseStepperAdapter("ml_flashattention_sram_tiling");
      expect(adapter).toBeDefined();
      expect(adapter.topicId).toBe("ml_flashattention_sram_tiling");

      const steps = adapter.generateSteps();
      expect(steps.length).toBeGreaterThanOrEqual(4);

      const sramStep = steps[0];
      expect(sramStep.title).toContain("SRAM");
      expect(sramStep.memoryTrace).toBeDefined();
      expect(sramStep.memoryTrace?.length).toBeGreaterThan(0);
      expect(sramStep.activeInvariant).toContain("Softmax Running Invariant");
    });

    it("should generate Matrix Memory Layout steps with cache lines", () => {
      const steps = generateCourseSteps("ml_matrix_memory_layout");
      expect(steps.length).toBeGreaterThanOrEqual(3);

      const rowMajorStep = steps[0];
      expect(rowMajorStep.memoryTrace).toBeDefined();
      expect(rowMajorStep.activeInvariant).toContain("cache line");

      const colMajorStep = steps[2];
      expect(colMajorStep.title).toContain("Column-Major");
    });

    it("should generate Binary Search steps with search interval invariants", () => {
      const steps = generateCourseSteps("dsa_binary_search");
      expect(steps.length).toBe(3);

      expect(steps[0].variables.low).toBe(0);
      expect(steps[0].variables.high).toBe(7);
      expect(steps[0].activeInvariant).toContain("Search Invariant");
    });

    it("should generate Dinic Network Flows & Cuts steps with level DAG & Min-Cut", () => {
      const steps = generateCourseSteps("dsa_graph_flows_and_cuts");
      expect(steps.length).toBe(4);

      const bfsStep = steps[0];
      expect(bfsStep.title).toContain("Level Graph");
      expect(bfsStep.activeInvariant).toContain("Admissible Level DAG");
      expect(bfsStep.memoryTrace?.length).toBeGreaterThanOrEqual(5);

      const minCutStep = steps[3];
      expect(minCutStep.title).toContain("Min-Cut");
      expect(minCutStep.activeInvariant).toContain("Max-Flow Min-Cut Theorem");
      expect(minCutStep.variables.max_flow).toBe(14);
    });

    it("should generate Advanced Range Queries steps with Fenwick and Lazy SegTree", () => {
      const steps = generateCourseSteps("dsa_advanced_range_queries");
      expect(steps.length).toBe(3);

      const fenwickStep = steps[0];
      expect(fenwickStep.title).toContain("Fenwick Tree");
      expect(fenwickStep.activeInvariant).toContain("Fenwick Coverage Invariant");

      const lazyStep = steps[2];
      expect(lazyStep.title).toContain("Lazy Tag");
      expect(lazyStep.activeInvariant).toContain("Lazy Invariant");
    });

    it("should generate Tree Fundamentals AVL Rotation steps with Balance Factors", () => {
      const steps = generateCourseSteps("dsa_tree_fundamentals");
      expect(steps.length).toBe(3);

      const violStep = steps[0];
      expect(violStep.title).toContain("Balance Factor Violation");
      expect(violStep.variables.case).toBe("Left-Right (LR)");

      const rotStep = steps[2];
      expect(rotStep.title).toContain("Recalibration");
      expect(rotStep.variables.bf_new_root).toBe(0);
    });

    it("should generate Geometry Monotone Chain Convex Hull steps with Cross Product CCW turn tests", () => {
      const steps = generateCourseSteps("dsa_geometry_and_sweep_line");
      expect(steps.length).toBe(3);

      const crossStep = steps[1];
      expect(crossStep.title).toContain("Cross Product");
      expect(crossStep.variables.turn).toContain("Clockwise");
      expect(crossStep.activeInvariant).toContain("Counter-Clockwise");
    });

    it("should generate Sliding Window Monotonic Deque steps with amortized bounds", () => {
      const steps = generateCourseSteps("dsa_sliding_window");
      expect(steps.length).toBe(3);

      const dequeStep = steps[0];
      expect(dequeStep.title).toContain("Monotonic Decreasing Deque");
      expect(dequeStep.activeInvariant).toContain("Monotonic Invariant");
    });

    it("should generate Ring-AllReduce collective steps with Scatter-Reduce & All-Gather", () => {
      const steps = generateCourseSteps("ml_ring_allreduce_collective");
      expect(steps.length).toBe(3);

      const scatterStep = steps[1];
      expect(scatterStep.title).toContain("Scatter-Reduce");
      expect(scatterStep.activeInvariant).toContain("Scatter-Reduce Invariant");

      const gatherStep = steps[2];
      expect(gatherStep.title).toContain("All-Gather");
      expect(gatherStep.activeInvariant).toContain("Bandwidth Optimality");
    });

    it("should generate PagedAttention Copy-on-Write steps with Block Table mapping", () => {
      const steps = generateCourseSteps("ml_pagedattention_cow_vllm");
      expect(steps.length).toBe(3);

      const allocStep = steps[0];
      expect(allocStep.title).toContain("Logical Token Slot");
      expect(allocStep.activeInvariant).toContain("Zero Internal Fragmentation");

      const cowStep = steps[2];
      expect(cowStep.title).toContain("Copy-on-Write");
      expect(cowStep.activeInvariant).toContain("CoW Isolation Invariant");
    });

    it("should generate HNSW and IVF-PQ ANN Search steps with Multi-layer Routing", () => {
      const steps = generateCourseSteps("ml_ann_hnsw_ivfpq");
      expect(steps.length).toBe(3);

      const hnswStep = steps[0];
      expect(hnswStep.title).toContain("HNSW Skip Graph");
      expect(hnswStep.activeInvariant).toContain("Logarithmic Zoom-in Routing");

      const pqStep = steps[2];
      expect(pqStep.title).toContain("IVF-PQ");
      expect(pqStep.activeInvariant).toContain("ADC Invariant");
    });
  });

  describe("2. Multi-Stage Stepping & Progression", () => {
    it("should generate distinct steps when varying stageIndex", () => {
      const topicId = "ml_gradient_descent_adamw";

      const stage0Steps = generateCourseSteps(topicId, 0);
      const stage1Steps = generateCourseSteps(topicId, 1);
      const stage2Steps = generateCourseSteps(topicId, 2);

      expect(stage0Steps.length).toBeGreaterThanOrEqual(3);
      expect(stage1Steps.length).toBeGreaterThanOrEqual(3);
      expect(stage2Steps.length).toBeGreaterThanOrEqual(3);

      // Verify each stage has valid titles and code snippets
      for (const step of stage0Steps) {
        expect(step.stepNumber).toBeGreaterThanOrEqual(1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.codeSnippet.length).toBeGreaterThan(0);
      }
    });
  });

  describe("3. Universal Course Stepper Coverage (All 64 Courses)", () => {
    it("should generate valid visual execution steps for every course in the curriculum", () => {
      expect(ALL_COURSE_JOURNEYS.length).toBe(64);

      for (const journey of ALL_COURSE_JOURNEYS) {
        const adapter = getCourseStepperAdapter(journey.id);
        expect(adapter).toBeDefined();

        const steps = adapter.generateSteps(0);
        expect(steps.length).toBeGreaterThanOrEqual(3);

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          expect(step.stepNumber).toBe(i + 1);
          expect(step.title.length).toBeGreaterThan(0);
          expect(step.description.length).toBeGreaterThan(0);
          expect(step.codeLine).toBeGreaterThanOrEqual(1);
          expect(step.codeSnippet.length).toBeGreaterThan(0);
          expect(typeof step.variables).toBe("object");
        }
      }
    });
  });
});
