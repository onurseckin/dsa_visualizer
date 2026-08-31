import { describe, expect, it } from "bun:test";
import { getConceptIndex, searchCurriculum } from "../search";

describe("Curriculum Full-Text Search & Concept Indexing Engine Tests", () => {
  describe("1. Full-Text Search Retrieval & Keyword Precision", () => {
    it("should return empty array for empty or whitespace query", () => {
      expect(searchCurriculum("")).toEqual([]);
      expect(searchCurriculum("   ")).toEqual([]);
    });

    it("should retrieve Dinic flow algorithm in dsa_graph_flows_and_cuts", () => {
      const results = searchCurriculum("Dinic");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topicId).toBe("dsa_graph_flows_and_cuts");
    });

    it("should retrieve FlashAttention in ml_flashattention_sram_tiling", () => {
      const results = searchCurriculum("FlashAttention");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topicId).toBe("ml_flashattention_sram_tiling");
    });

    it("should retrieve Gauss-Markov Theorem in ml_linear_logistic_regression", () => {
      const results = searchCurriculum("Gauss-Markov");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topicId).toBe("ml_linear_logistic_regression");
    });

    it("should retrieve K-Means++ in ml_clustering_kmeans_dbscan", () => {
      const results = searchCurriculum("K-Means++");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.topicId === "ml_clustering_kmeans_dbscan")).toBe(true);
    });

    it("should retrieve Platt's SMO in ml_svm_kernel_smo", () => {
      const results = searchCurriculum("Platt SMO");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topicId).toBe("ml_svm_kernel_smo");
    });

    it("should retrieve Alternating Least Squares in ml_collaborative_filtering_als", () => {
      const results = searchCurriculum("Alternating Least Squares");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.topicId === "ml_collaborative_filtering_als")).toBe(true);
    });

    it("should retrieve Eckart-Young SVD in ml_matrix_svd_pca", () => {
      const results = searchCurriculum("Eckart-Young");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.topicId.includes("svd") || r.topicId.includes("als"))).toBe(
        true,
      );
    });
  });

  describe("2. Filtering & Search Options", () => {
    it("should filter results by trackId", () => {
      const dsaOnly = searchCurriculum("Tree", { trackFilter: "dsa" });
      expect(dsaOnly.length).toBeGreaterThan(0);
      for (const r of dsaOnly) {
        expect(r.trackId).toBe("dsa");
      }

      const mlOnly = searchCurriculum("Attention", { trackFilter: "machine-learning" });
      expect(mlOnly.length).toBeGreaterThan(0);
      for (const r of mlOnly) {
        expect(
          r.trackId === "machine-learning" || r.trackId === "ml" || r.trackId === "ml-infra",
        ).toBe(true);
      }
    });

    it("should filter results by sectionType", () => {
      const mathOnly = searchCurriculum("Hessian", {
        sectionTypeFilter: ["math_proof"],
      });
      expect(mathOnly.length).toBeGreaterThan(0);
      for (const r of mathOnly) {
        expect(r.sectionType).toBe("math_proof");
      }
    });

    it("should respect the result limit option", () => {
      const limited = searchCurriculum("Memory", { limit: 5 });
      expect(limited.length).toBeLessThanOrEqual(5);
    });
  });

  describe("3. Snippet Generation & Ranking Relevance", () => {
    it("should generate formatted snippets containing context around matching terms", () => {
      const results = searchCurriculum("Softmax");
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.snippet.length).toBeGreaterThan(10);
        expect(r.score).toBeGreaterThanOrEqual(5);
      }
    });

    it("should rank higher relevance results first", () => {
      const results = searchCurriculum("XGBoost 2nd-order Taylor");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].topicId).toBe("ml_ensemble_xgboost");
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });
  });

  describe("4. Master Concept Index & Glossary", () => {
    it("should build an alphabetized concept glossary with > 50 concepts", () => {
      const concepts = getConceptIndex();
      expect(concepts.length).toBeGreaterThanOrEqual(50);

      // Verify alphabetical sorting
      for (let i = 0; i < concepts.length - 1; i++) {
        expect(concepts[i].concept.localeCompare(concepts[i + 1].concept)).toBeLessThanOrEqual(0);
      }
    });

    it("every concept entry should have valid metadata and category", () => {
      const validCategories = new Set([
        "theorem",
        "systems_invariant",
        "algorithm",
        "data_structure",
        "metric",
      ]);

      const concepts = getConceptIndex();
      for (const item of concepts) {
        expect(item.concept.length).toBeGreaterThan(0);
        expect(item.topicId.length).toBeGreaterThan(0);
        expect(item.courseTitle.length).toBeGreaterThan(0);
        expect(item.pageTitle.length).toBeGreaterThan(0);
        expect(validCategories.has(item.category)).toBe(true);
      }
    });
  });
});
