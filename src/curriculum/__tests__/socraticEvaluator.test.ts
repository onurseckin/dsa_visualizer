import { describe, expect, it } from "bun:test";
import {
  evaluateSocraticAnswer,
  getAllQuestionBankSuites,
  getQuestionBankSuite,
} from "../socraticEvaluator";

describe("Socratic Dialogue & Question Bank Diagnostic Engine Tests", () => {
  describe("1. Question Bank Suite Retrieval & Coverage", () => {
    it("should retrieve full 4-part Question Bank Suites across DSA topics", () => {
      const flowsSuite = getQuestionBankSuite("dsa_graph_flows_and_cuts");
      expect(flowsSuite).toBeDefined();
      expect(flowsSuite?.type).toBe("question_bank_suite");
      expect(flowsSuite?.partA_dsaCoding?.length).toBeGreaterThan(0);
      expect(flowsSuite?.partB_mathProofs?.length).toBeGreaterThan(0);
      expect(flowsSuite?.partC_systemsQuestions?.length).toBeGreaterThan(0);
      expect(flowsSuite?.partD_stressTests?.length).toBeGreaterThan(0);

      const rangeSuite = getQuestionBankSuite("dsa_advanced_range_queries");
      expect(rangeSuite).toBeDefined();
      expect(rangeSuite?.type).toBe("question_bank_suite");
    });

    it("should retrieve full 4-part Question Bank Suites across ML topics", () => {
      const flashSuite = getQuestionBankSuite("ml_flashattention_sram_tiling");
      expect(flashSuite).toBeDefined();
      expect(flashSuite?.type).toBe("question_bank_suite");

      const linRegSuite = getQuestionBankSuite("ml_linear_logistic_regression");
      expect(linRegSuite).toBeDefined();

      const clusterSuite = getQuestionBankSuite("ml_clustering_kmeans_dbscan");
      expect(clusterSuite).toBeDefined();

      const svmSuite = getQuestionBankSuite("ml_svm_kernel_smo");
      expect(svmSuite).toBeDefined();

      const alsSuite = getQuestionBankSuite("ml_collaborative_filtering_als");
      expect(alsSuite).toBeDefined();
    });

    it("should return undefined for non-existent topics", () => {
      expect(getQuestionBankSuite("non_existent_topic")).toBeUndefined();
    });

    it("getAllQuestionBankSuites should return suites for all 64 courses", () => {
      const allSuites = getAllQuestionBankSuites();
      expect(Object.keys(allSuites).length).toBe(64);
    });
  });

  describe("2. Socratic Rubric Evaluation", () => {
    it("should handle empty or blank student responses gracefully", () => {
      const result = evaluateSocraticAnswer({
        topicId: "ml_linear_logistic_regression",
        questionPrompt: "Derive the OLS normal equations and condition number squaring.",
        studentAnswer: "",
      });

      expect(result.score).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(10);
      expect(result.socraticHints.length).toBeGreaterThanOrEqual(3);
      expect(result.counterExamples.length).toBeGreaterThanOrEqual(1);
    });

    it("should award high passing score for rigorous mathematical and hardware-aware responses", () => {
      const rigorousAnswer = `
The Hat projection matrix is P = X(X^T X)^{-1} X^T. By algebraic idempotence, P^2 = P and (I - P)X = 0,
proving that the residual vector e = (I - P)y is strictly orthogonal to the column space Col(X).
In normal equations, solving (X^T X)w = X^T y takes O(N D^2 + D^3) time using Cholesky decomposition L L^T.
Systems reality: Computing X^T X squares the condition number kappa(X^T X) = kappa(X)^2, leading to catastrophic
cancellation in floating-point FP32 when features are collinear. We standardise features and use Ridge Tikhonov
regularization (X^T X + lambda I) or QR factorization with TSQR across DRAM bandwidth to preserve precision.
`;

      const result = evaluateSocraticAnswer({
        topicId: "ml_linear_logistic_regression",
        questionPrompt: "Explain the geometric Hat projection and conditioning of OLS.",
        referenceInvariant:
          "Hat matrix P = X(X^T X)^{-1} X^T is idempotent P^2 = P and squares condition number kappa(X^T X) = kappa(X)^2.",
        studentAnswer: rigorousAnswer,
        expectedAsymptotics: "O(N D^2 + D^3)",
        expectedHardwareKey: "DRAM",
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.rubricBreakdown.invariantAccuracy).toBeGreaterThanOrEqual(70);
      expect(result.rubricBreakdown.asymptoticPrecision).toBeGreaterThanOrEqual(80);
      expect(result.rubricBreakdown.hardwareAwareness).toBeGreaterThanOrEqual(80);
      expect(result.feedback).toContain("Excellent technical rigor");
    });

    it("should identify deficiencies and lower scores for vague, unrigorous responses", () => {
      const vagueAnswer = "OLS minimizes error and you solve it with calculus.";

      const result = evaluateSocraticAnswer({
        topicId: "ml_linear_logistic_regression",
        questionPrompt: "Derive the Gauss-Markov theorem for BLUE estimator and normal equations.",
        referenceInvariant:
          "Gauss-Markov Theorem: OLS estimator w_hat = (X^T X)^{-1} X^T y is BLUE with Var(w_tilde) - Var(w_hat) >= 0 PSD.",
        studentAnswer: vagueAnswer,
      });

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(70);
      expect(result.feedback).toContain("Developing response");
      expect(result.socraticHints.length).toBe(3);
    });
  });

  describe("3. Multi-Tier Socratic Guidance & Stress Testing", () => {
    it("should generate progressive 3-tier hints targeting weak rubric areas", () => {
      const partialAnswer = "We use dynamic programming in O(N^2) time.";

      const result = evaluateSocraticAnswer({
        topicId: "dsa_dp_1d",
        questionPrompt: "Analyze Longest Increasing Subsequence with Dilworth theorem.",
        referenceInvariant:
          "Patience sorting partitions poset into antichains, running in O(N log N).",
        studentAnswer: partialAnswer,
      });

      expect(result.socraticHints).toHaveLength(3);
      expect(result.socraticHints[0]).toContain("Tier 1");
      expect(result.socraticHints[1]).toContain("Tier 2");
      expect(result.socraticHints[2]).toContain("Tier 3");
    });

    it("should extract topic-specific counter-examples and failure modes", () => {
      const result = evaluateSocraticAnswer({
        topicId: "ml_flashattention_sram_tiling",
        questionPrompt: "How does FlashAttention avoid O(N^2) memory?",
        studentAnswer: "It computes softmax in blocks.",
      });

      expect(result.counterExamples.length).toBeGreaterThanOrEqual(1);
      for (const ce of result.counterExamples) {
        expect(ce.length).toBeGreaterThan(15);
      }
    });
  });
});
