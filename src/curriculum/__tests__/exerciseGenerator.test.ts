import { describe, expect, it } from "bun:test";
import {
  generateNumericalExercises,
  generateTopicFlashcards,
  getAllFlashcards,
} from "../exerciseGenerator";

describe("Interactive Course Flashcard & Exercise Generator Tests", () => {
  describe("1. Flashcard Deck Generation", () => {
    it("should generate active recall flashcards across DSA topics", () => {
      const cards = generateTopicFlashcards("dsa_binary_search");
      expect(cards.length).toBeGreaterThanOrEqual(1);

      for (const card of cards) {
        expect(card.topicId).toBe("dsa_binary_search");
        expect(card.front.length).toBeGreaterThan(10);
        expect(card.back.length).toBeGreaterThan(10);
        expect(card.keyTakeaway.length).toBeGreaterThan(0);
        expect(["concept", "theorem", "systems"]).toContain(card.category);
        expect(["Easy", "Medium", "Hard"]).toContain(card.difficulty);
      }
    });

    it("should generate theorem and systems flashcards across ML topics", () => {
      const cards = generateTopicFlashcards("ml_flashattention_sram_tiling");
      expect(cards.length).toBeGreaterThanOrEqual(2);

      const theoremCards = cards.filter((c) => c.category === "theorem");
      const systemsCards = cards.filter((c) => c.category === "systems");

      expect(theoremCards.length + systemsCards.length).toBeGreaterThan(0);
      for (const c of cards) {
        expect(c.courseTitle.length).toBeGreaterThan(0);
        expect(c.front).toBeDefined();
        expect(c.back).toBeDefined();
      }
    });

    it("getAllFlashcards should aggregate hundreds of flashcards across tracks", () => {
      const allCards = getAllFlashcards();
      expect(allCards.length).toBeGreaterThan(100);

      const dsaCards = getAllFlashcards("dsa");
      const mlCards = getAllFlashcards("machine-learning");

      expect(dsaCards.length).toBeGreaterThan(20);
      expect(mlCards.length).toBeGreaterThan(50);
    });
  });

  describe("2. Parameterized Numerical Exercises & Verifiers", () => {
    it("should generate deterministic numerical exercises with valid solutions", () => {
      const exercises1 = generateNumericalExercises(undefined, 42);
      const exercises2 = generateNumericalExercises(undefined, 42);

      expect(exercises1.length).toBeGreaterThanOrEqual(5);
      expect(exercises1.length).toBe(exercises2.length);

      // Verify deterministic reproduction under same seed
      for (let i = 0; i < exercises1.length; i++) {
        expect(exercises1[i].id).toBe(exercises2[i].id);
        expect(exercises1[i].correctAnswer).toBe(exercises2[i].correctAnswer);
        expect(exercises1[i].unit).toBe(exercises2[i].unit);
        expect(exercises1[i].solutionSteps.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("exercise verifier should accurately validate correct answers within tolerance", () => {
      const exercises = generateNumericalExercises(undefined, 100);

      for (const ex of exercises) {
        const correctResult = ex.verify(ex.correctAnswer);
        expect(correctResult.isCorrect).toBe(true);
        expect(correctResult.errorPct).toBeLessThanOrEqual(0.01);
        expect(correctResult.feedback).toContain("Correct");

        // Test with deliberately wrong answer
        const wrongResult = ex.verify(ex.correctAnswer + 5000 + Math.abs(ex.correctAnswer));
        expect(wrongResult.isCorrect).toBe(false);
        expect(wrongResult.errorPct).toBeGreaterThan(1.0);
        expect(wrongResult.feedback).toContain("Incorrect");
      }
    });

    it("should filter numerical exercises by topicId", () => {
      const attentionExercises = generateNumericalExercises("ml_attention_causal_sdpa", 7);
      expect(attentionExercises.length).toBeGreaterThanOrEqual(1);
      expect(attentionExercises.some((e) => e.title.includes("KV Cache"))).toBe(true);
    });
  });
});
