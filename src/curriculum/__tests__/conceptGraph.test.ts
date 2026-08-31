import { describe, expect, it } from "bun:test";
import {
  CURRICULUM_PREREQUISITES,
  generateLearningPath,
  getDependents,
  getPrerequisites,
  validateDAG,
} from "../conceptGraph";

describe("Interactive Concept Graph & Prerequisite DAG Engine Tests", () => {
  describe("1. Curriculum DAG Structural Invariants & Acyclicity", () => {
    it("should cover all 64 registered courses in CURRICULUM_PREREQUISITES", () => {
      const allCourseIds = Object.keys(CURRICULUM_PREREQUISITES);
      expect(allCourseIds.length).toBe(64);
    });

    it("validateDAG should confirm the prerequisite graph is strictly acyclic (0 cycles)", () => {
      const validation = validateDAG();
      expect(validation.isAcyclic).toBe(true);
      expect(validation.cycles.length).toBe(0);
      expect(validation.topologicalOrder.length).toBe(64);

      // Verify topological ordering: for every (u -> v), u appears before v
      const posMap = new Map<string, number>();
      validation.topologicalOrder.forEach((id, idx) => posMap.set(id, idx));

      for (const [topicId, prereqs] of Object.entries(CURRICULUM_PREREQUISITES)) {
        const topicPos = posMap.get(topicId)!;
        for (const p of prereqs) {
          const prereqPos = posMap.get(p)!;
          expect(prereqPos).toBeLessThan(topicPos);
        }
      }
    });
  });

  describe("2. Prerequisite & Dependent Query Algorithms", () => {
    it("should resolve direct and transitive prerequisites for ML courses", () => {
      const direct = getPrerequisites("ml_flashattention_sram_tiling");
      expect(direct).toContain("ml_attention_causal_sdpa");
      expect(direct).toContain("ml_dense_gemm_tiling");

      const transitive = getPrerequisites("ml_flashattention_sram_tiling", { transitive: true });
      expect(transitive).toContain("ml_matrix_memory_layout");
      expect(transitive).toContain("ml_tensor_strides_views");
      expect(transitive).toContain("ml_mlp_backpropagation");
    });

    it("should resolve direct and transitive dependents for foundational DSA courses", () => {
      const direct = getDependents("dsa_arrays_and_hashing");
      expect(direct).toContain("dsa_two_pointers");
      expect(direct).toContain("dsa_sliding_window");
      expect(direct).toContain("dsa_binary_search");

      const transitive = getDependents("dsa_arrays_and_hashing", { transitive: true });
      expect(transitive.length).toBeGreaterThan(10);
      expect(transitive).toContain("dsa_dp_2d");
      expect(transitive).toContain("dsa_graph_flows_and_cuts");
    });
  });

  describe("3. Career Goal Learning Path Generator", () => {
    it("should generate valid topological learning path for LLM_SYSTEMS_ENGINEER", () => {
      const path = generateLearningPath("LLM_SYSTEMS_ENGINEER");
      expect(path.goal).toBe("LLM_SYSTEMS_ENGINEER");
      expect(path.orderedTopicIds.length).toBeGreaterThanOrEqual(10);
      expect(path.estimatedHours).toBeGreaterThan(10);
      expect(path.milestones.length).toBe(path.orderedTopicIds.length);

      // Verify terminal goals are included
      expect(path.orderedTopicIds).toContain("ml_flashattention_sram_tiling");
      expect(path.orderedTopicIds).toContain("ml_pagedattention_cow_vllm");
      expect(path.orderedTopicIds).toContain("ml_speculative_decoding");

      // Verify root prerequisites precede terminal goals
      const memoryIdx = path.orderedTopicIds.indexOf("ml_matrix_memory_layout");
      const flashIdx = path.orderedTopicIds.indexOf("ml_flashattention_sram_tiling");
      expect(memoryIdx).toBeLessThan(flashIdx);
    });

    it("should generate valid topological learning path for DISTRIBUTED_ML_ARCHITECT", () => {
      const path = generateLearningPath("DISTRIBUTED_ML_ARCHITECT");
      expect(path.orderedTopicIds).toContain("ml_interconnect_alpha_beta");
      expect(path.orderedTopicIds).toContain("ml_ring_allreduce_collective");
      expect(path.orderedTopicIds).toContain("ml_zero3_parameter_sharding");
      expect(path.orderedTopicIds).toContain("ml_parallelism_3d_moe_1f1b");
    });

    it("should generate valid topological learning path for COMPETITIVE_PROGRAMMING_GRANDMASTER", () => {
      const path = generateLearningPath("COMPETITIVE_PROGRAMMING_GRANDMASTER");
      expect(path.orderedTopicIds).toContain("dsa_graph_flows_and_cuts");
      expect(path.orderedTopicIds).toContain("dsa_advanced_range_queries");
      expect(path.orderedTopicIds).toContain("dsa_dp_2d");
      expect(path.orderedTopicIds).toContain("dsa_geometry_and_sweep_line");
    });

    it("should generate valid topological learning path for MATHEMATICAL_OPTIMIZATION_SPECIALIST", () => {
      const path = generateLearningPath("MATHEMATICAL_OPTIMIZATION_SPECIALIST");
      expect(path.orderedTopicIds).toContain("ml_matrix_svd_pca");
      expect(path.orderedTopicIds).toContain("ml_gradients_jacobians_hessians");
      expect(path.orderedTopicIds).toContain("ml_gradient_descent_adamw");
      expect(path.orderedTopicIds).toContain("ml_svm_kernel_smo");
    });

    it("should generate custom target topic learning paths", () => {
      const customPath = generateLearningPath({
        targetTopicIds: ["ml_pagedattention_cow_vllm"],
      });
      expect(customPath.orderedTopicIds).toContain("ml_attention_causal_sdpa");
      expect(customPath.orderedTopicIds).toContain("ml_pagedattention_cow_vllm");
    });
  });
});
