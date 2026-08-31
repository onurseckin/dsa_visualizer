import { describe, expect, it } from "bun:test";
import {
  createSocraticSession,
  detectMisconceptions,
  processStudentTurn,
  summarizeSession,
} from "../adaptiveTutor";

describe("Automated Socratic Dialogue Engine & Adaptive Tutor Tests", () => {
  describe("1. Socratic Session Initialization", () => {
    it("should initialize a clean Socratic session for DSA topic", () => {
      const session = createSocraticSession("dsa_tree_fundamentals");

      expect(session.topicId).toBe("dsa_tree_fundamentals");
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.totalQuestions).toBe(4);
      expect(session.turnCount).toBe(1); // Initial tutor opening prompt
      expect(session.isComplete).toBe(false);
      expect(session.conversationHistory.length).toBe(1);
      expect(session.conversationHistory[0].role).toBe("tutor");
      expect(session.conversationHistory[0].interventionType).toBe("initial_prompt");
      expect(session.studentProfile.overallMastery).toBe(0.5);
    });

    it("should initialize a clean Socratic session for ML topic", () => {
      const session = createSocraticSession("ml_flashattention_sram_tiling");

      expect(session.topicId).toBe("ml_flashattention_sram_tiling");
      expect(session.courseTitle.toLowerCase()).toContain("flashattention");
      expect(session.conversationHistory[0].content).toContain("Socratic Diagnostic");
    });
  });

  describe("2. Misconception Detection & Counter-Examples", () => {
    it("should detect amortized vs worst case confusion and generate counter-example", () => {
      const text =
        "The hash table operations are always guaranteed O(1) time without any exception.";
      const misconceptions = detectMisconceptions(text, 1);

      expect(misconceptions.length).toBeGreaterThan(0);
      const m = misconceptions.find((item) => item.id === "amortized_vs_worst_case");
      expect(m).toBeDefined();
      expect(m?.concreteCounterExample).toContain("rehashing");
    });

    it("should detect unbounded SRAM capacity assumptions in attention systems", () => {
      const text =
        "We can just load all tokens into SRAM and store full matrix in sram without issue.";
      const misconceptions = detectMisconceptions(text, 1);

      const m = misconceptions.find((item) => item.id === "unbounded_sram_tiling");
      expect(m).toBeDefined();
      expect(m?.concreteCounterExample).toContain("228 KB");
    });

    it("should detect catastrophic cancellation ignorance in floating point math", () => {
      const text = "The simple sum is exact and order of addition doesn't matter in FP32.";
      const misconceptions = detectMisconceptions(text, 1);

      const m = misconceptions.find((item) => item.id === "naive_summation_cancellation");
      expect(m).toBeDefined();
      expect(m?.concreteCounterExample).toContain("Kahan");
    });
  });

  describe("3. Multi-Turn Socratic Dialogue Progression", () => {
    it("should advance question on high-rigor student answer", () => {
      const session = createSocraticSession("dsa_tree_fundamentals");

      const rigorousAnswer = `
        To validate a binary search tree (BST), we test invariant preservation across entire subtrees rather than local child checks.
        We propagate global strict open intervals (minVal, maxVal) down the tree hierarchy.
        For any node u, all keys in left subtree satisfy key < key(u) and right subtree satisfy key > key(u).
        In an AVL tree, the balance factor BF(u) = height(left) - height(right) is strictly in {-1, 0, 1}.
        During insertion, when BF reaches +2 with left-right violation, we perform an LR double rotation in O(1) time and O(log N) tree height.
        In cache memory, node-based pointer trees suffer from pointer chasing with L1 cache line misses on random heap allocations,
        which flat contiguous array-based implicit trees or B-Trees avoid through cache line alignment.
      `;

      const { tutorResponse } = processStudentTurn(session, rigorousAnswer);

      expect(session.turnCount).toBe(3); // 0: tutor init, 1: student, 2: tutor reply
      expect(session.conversationHistory.length).toBe(3);
      expect(session.studentProfile.overallMastery).toBeGreaterThan(0.55);
      expect(session.masteredConcepts.length).toBeGreaterThanOrEqual(1);

      // Should advance or complete
      expect(["affirmation_and_probing", "completion_summary"]).toContain(
        tutorResponse.interventionType!,
      );
    });

    it("should issue counter-example challenge when student exhibits known misconception", () => {
      const session = createSocraticSession("ml_flashattention_sram_tiling");

      const misconceptionAnswer = `
        We just store full matrix in sram with no memory constraint because GPU is fast.
      `;

      const { tutorResponse } = processStudentTurn(session, misconceptionAnswer);

      expect(tutorResponse.interventionType).toBe("counter_example");
      expect(tutorResponse.content).toContain("Counter-Example Challenge");
      expect(session.identifiedMisconceptions.length).toBeGreaterThan(0);
    });

    it("should provide scaffolded invariant hint when student response is vague", () => {
      const session = createSocraticSession("dsa_graph_flows_and_cuts");

      const vagueAnswer = "Flow goes from source to sink and max flow is the maximum.";

      const { tutorResponse } = processStudentTurn(session, vagueAnswer);

      expect(tutorResponse.interventionType).toBe("scaffolded_hint");
      expect(tutorResponse.content).toContain("Socratic Guidance");
    });
  });

  describe("4. Session Analytics & Follow-Up Recommendations", () => {
    it("should produce detailed summary report and relevant follow-ups", () => {
      const session = createSocraticSession("dsa_intervals");

      // Simulate a student turn
      processStudentTurn(session, "Greedy interval scheduling sorts by earliest finish time f_i.");

      const summary = summarizeSession(session);

      expect(summary.sessionId).toBe(session.sessionId);
      expect(summary.topicId).toBe("dsa_intervals");
      expect(summary.turnsTotal).toBe(session.turnCount);
      expect(summary.overallMasteryScore).toBeGreaterThanOrEqual(0);
      expect(["A+", "A", "B", "C", "F"]).toContain(summary.letterGrade);
      expect(summary.recommendedFollowUps.length).toBeGreaterThanOrEqual(1);

      for (const rec of summary.recommendedFollowUps) {
        expect(rec.topicId.length).toBeGreaterThan(0);
        expect(rec.title.length).toBeGreaterThan(0);
        expect(rec.rationale.length).toBeGreaterThan(0);
      }
    });
  });
});
