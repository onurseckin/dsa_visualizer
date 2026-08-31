import { describe, expect, it } from "bun:test";
import {
  MASTERY_CREDENTIAL_DEFINITIONS,
  createInitialProgressState,
  deserializeProgress,
  getCourseProgressMetrics,
  getOverallMasteryOverview,
  markPageCompleted,
  markPageVisited,
  recordCheckpointResult,
  recordSocraticQuestionAnswer,
  serializeProgress,
} from "../courseProgress";
import { getCourseJourney } from "../index";

describe("Interactive Course Mastery & Progress State Machine Tests", () => {
  describe("1. Initialization & State Creation", () => {
    it("should initialize a clean empty state with version 1 and 0 learning time", () => {
      const state = createInitialProgressState();
      expect(state.version).toBe(1);
      expect(Object.keys(state.topics).length).toBe(0);
      expect(state.totalLearningTimeSeconds).toBe(0);
      expect(state.globalLastActiveTimestamp).toBeGreaterThan(0);
    });
  });

  describe("2. Page Progress Transitions & Progress Recalculation", () => {
    it("should record page visits and accumulate learning time", () => {
      let state = createInitialProgressState();
      state = markPageVisited(state, "dsa_graph_traversal", 1, 120);

      const topicProg = state.topics["dsa_graph_traversal"];
      expect(topicProg).toBeDefined();
      expect(topicProg.timeSpentSeconds).toBe(120);
      expect(state.totalLearningTimeSeconds).toBe(120);

      const page1 = topicProg.pages["p_1"] || topicProg.pages["dsa_graph_traversal_c1_p1"];
      expect(page1).toBeDefined();
      expect(page1.completed).toBe(false);
      expect(page1.timeSpentSeconds).toBe(120);
    });

    it("should advance completion percentage as pages are completed", () => {
      let state = createInitialProgressState();
      const journey = getCourseJourney("ml_flashattention_sram_tiling");
      expect(journey).toBeDefined();

      const allPages = journey!.chapters.flatMap((c) => c.pages || []);
      expect(allPages.length).toBeGreaterThan(0);

      // Complete first page
      state = markPageCompleted(state, "ml_flashattention_sram_tiling", allPages[0].id, 300);
      let metrics = getCourseProgressMetrics(state, "ml_flashattention_sram_tiling");
      expect(metrics).toBeDefined();
      expect(metrics!.completedPagesCount).toBe(1);
      expect(metrics!.completionPercentage).toBe(Math.round((1 / allPages.length) * 100));
      expect(metrics!.isFullyMastered).toBe(false);

      // Complete all remaining pages
      for (let i = 1; i < allPages.length; i++) {
        state = markPageCompleted(state, "ml_flashattention_sram_tiling", allPages[i].id, 300);
      }

      metrics = getCourseProgressMetrics(state, "ml_flashattention_sram_tiling");
      expect(metrics!.completedPagesCount).toBe(allPages.length);
      expect(metrics!.completionPercentage).toBe(100);
      expect(metrics!.chapters.every((c) => c.isCompleted)).toBe(true);

      const topicProg = state.topics["ml_flashattention_sram_tiling"];
      expect(topicProg.completed).toBe(true);
      expect(topicProg.completedAt).toBeDefined();
    });

    it("should handle shorthand topic IDs transparently", () => {
      let state = createInitialProgressState();
      state = markPageCompleted(state, "graph_traversal", 1, 60);

      expect(state.topics["dsa_graph_traversal"]).toBeDefined();
      const metrics = getCourseProgressMetrics(state, "graph_traversal");
      expect(metrics?.topicId).toBe("dsa_graph_traversal");
    });
  });

  describe("3. Coding Checkpoints & Socratic Question Banks", () => {
    it("should record coding checkpoint attempts and pass status", () => {
      let state = createInitialProgressState();

      // First attempt: failing score
      state = recordCheckpointResult(state, "ml_mlp_backpropagation", "ml_mlp_backpropagation", 60);
      let topic = state.topics["ml_mlp_backpropagation"];
      let cp = topic.checkpoints["ml_mlp_backpropagation"];
      expect(cp.attempts).toBe(1);
      expect(cp.bestScore).toBe(60);
      expect(cp.passed).toBe(false);

      // Second attempt: passing score >= 80
      state = recordCheckpointResult(state, "ml_mlp_backpropagation", "ml_mlp_backpropagation", 95);
      cp = topic.checkpoints["ml_mlp_backpropagation"];
      expect(cp.attempts).toBe(2);
      expect(cp.bestScore).toBe(95);
      expect(cp.passed).toBe(true);
    });

    it("should record Socratic question bank diagnostic scores across parts", () => {
      let state = createInitialProgressState();
      state = recordSocraticQuestionAnswer(state, "ml_ann_hnsw_ivfpq", "partA_dsaCoding", 0, 90);
      state = recordSocraticQuestionAnswer(state, "ml_ann_hnsw_ivfpq", "partB_mathProofs", 0, 95);

      const qb = state.topics["ml_ann_hnsw_ivfpq"].questionBank;
      expect(qb).toBeDefined();
      expect(qb!.partScores["partA_dsaCoding"]).toBe(90);
      expect(qb!.partScores["partB_mathProofs"]).toBe(95);
      expect(qb!.totalScore).toBe(185);
      expect(qb!.completedQuestions.length).toBe(2);
    });
  });

  describe("4. Global Track Analytics & Mastery Credentials", () => {
    it("should aggregate overall curriculum statistics across DSA and ML tracks", () => {
      let state = createInitialProgressState();
      const overview = getOverallMasteryOverview(state);

      expect(overview.totalCourses).toBe(64);
      expect(overview.dsaCoursesTotal).toBe(23);
      expect(overview.mlCoursesTotal).toBe(41);
      expect(overview.completedCoursesCount).toBe(0);
      expect(overview.overallCompletionPercentage).toBe(0);
      expect(overview.credentials.length).toBe(MASTERY_CREDENTIAL_DEFINITIONS.length);
      expect(overview.credentials.every((c) => !c.unlocked)).toBe(true);
    });

    it("should unlock specialization credentials when all required courses are completed", () => {
      let state = createInitialProgressState();

      // Complete all 4 Graph Theory courses
      const graphTopics = [
        "dsa_graph_traversal",
        "dsa_graph_shortest_paths",
        "dsa_graph_spanning_trees",
        "dsa_graph_flows_and_cuts",
      ];

      for (const topicId of graphTopics) {
        const journey = getCourseJourney(topicId);
        const pages = journey!.chapters.flatMap((c) => c.pages || []);
        for (const page of pages) {
          state = markPageCompleted(state, topicId, page.id, 100);
        }
      }

      const overview = getOverallMasteryOverview(state);
      expect(overview.dsaCoursesCompleted).toBe(4);

      const graphCred = overview.credentials.find((c) => c.id === "cred_dsa_graph_flows");
      expect(graphCred).toBeDefined();
      expect(graphCred!.unlocked).toBe(true);
      expect(graphCred!.progressFraction).toBe(1.0);
      expect(graphCred!.completedTopicCount).toBe(4);

      // Other credentials requiring incomplete topics remain locked
      const dpCred = overview.credentials.find((c) => c.id === "cred_dsa_dp_grandmaster");
      expect(dpCred?.unlocked).toBe(false);
    });

    it("should unlock LLM Architecture & Attention Systems credential upon cluster completion", () => {
      let state = createInitialProgressState();

      const llmTopics = [
        "ml_attention_causal_sdpa",
        "ml_rope_gqa_attention",
        "ml_flashattention_sram_tiling",
        "ml_activations_online_softmax",
        "ml_normalization_rmsnorm",
        "ml_subword_bpe_tiktoken",
      ];

      for (const topicId of llmTopics) {
        const journey = getCourseJourney(topicId);
        const pages = journey!.chapters.flatMap((c) => c.pages || []);
        for (const page of pages) {
          state = markPageCompleted(state, topicId, page.id, 120);
        }
      }

      const overview = getOverallMasteryOverview(state);
      const llmCred = overview.credentials.find((c) => c.id === "cred_ml_llm_attention");
      expect(llmCred).toBeDefined();
      expect(llmCred!.unlocked).toBe(true);
      expect(llmCred!.progressFraction).toBe(1.0);
    });
  });

  describe("5. Serialization & Deserialization Resilience", () => {
    it("should serialize and deserialize progress state with 100% roundtrip fidelity", () => {
      let state = createInitialProgressState();
      state = markPageCompleted(state, "ml_dense_gemm_tiling", 1, 500);
      state = recordCheckpointResult(
        state,
        "ml_dense_gemm_tiling",
        "ml_dense_gemm_tiling",
        100,
        true,
      );

      const jsonStr = serializeProgress(state);
      expect(typeof jsonStr).toBe("string");

      const restored = deserializeProgress(jsonStr);
      expect(restored.version).toBe(1);
      expect(restored.totalLearningTimeSeconds).toBe(500);
      expect(restored.topics["ml_dense_gemm_tiling"]).toBeDefined();
      expect(
        restored.topics["ml_dense_gemm_tiling"].checkpoints["ml_dense_gemm_tiling"].bestScore,
      ).toBe(100);
    });

    it("should handle corrupted or empty JSON strings gracefully without throwing", () => {
      expect(deserializeProgress("")).toBeDefined();
      expect(deserializeProgress("null")).toBeDefined();
      expect(deserializeProgress("{ corrupted: true }")).toBeDefined();
      expect(deserializeProgress("42")).toBeDefined();
      expect(deserializeProgress("{ topics: null }")).toBeDefined();
    });
  });
});
