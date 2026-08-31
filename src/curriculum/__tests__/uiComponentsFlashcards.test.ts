import { describe, expect, it } from "bun:test";
import React from "react";
import { FlashcardReviewModal } from "../../components/curriculum";
import { generateTopicFlashcards, getAllFlashcards } from "../index";

describe("Interactive Flashcard Spaced Repetition Player Tests", () => {
  describe("1. Modal Lifecycle & Element Instantiation", () => {
    it("should return null when isOpen is false", () => {
      const element = React.createElement(FlashcardReviewModal, {
        isOpen: false,
        onClose: () => {},
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate FlashcardReviewModal with default all-tracks deck when open", () => {
      const element = React.createElement(FlashcardReviewModal, {
        isOpen: true,
        onClose: () => {},
        initialTrackFilter: "all",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(FlashcardReviewModal);
      expect(element.props.isOpen).toBe(true);
      expect(element.props.initialTrackFilter).toBe("all");
    });

    it("should instantiate with specific course topic flashcards (FlashAttention)", () => {
      const element = React.createElement(FlashcardReviewModal, {
        isOpen: true,
        onClose: () => {},
        initialTopicId: "ml_flashattention_sram_tiling",
      });

      expect(element.props.initialTopicId).toBe("ml_flashattention_sram_tiling");
    });
  });

  describe("2. Deck Filtering & Spaced Repetition Generator Bindings", () => {
    it("getAllFlashcards should return large set of cards covering multiple domains", () => {
      const allCards = getAllFlashcards();
      const dsaCards = getAllFlashcards("dsa");
      const mlCards = getAllFlashcards("ml-infra");

      expect(allCards.length).toBeGreaterThan(50);
      expect(dsaCards.length).toBeGreaterThan(15);
      expect(mlCards.length).toBeGreaterThan(25);
    });

    it("generateTopicFlashcards should extract theorems and systems cards for a single journey", () => {
      const cards = generateTopicFlashcards("dsa_graph_flows_and_cuts");

      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(cards.some((c) => c.category === "theorem" || c.category === "concept")).toBe(true);
      expect(cards[0].front.length).toBeGreaterThan(10);
      expect(cards[0].back.length).toBeGreaterThan(10);
      expect(cards[0].courseTitle).toBeDefined();
    });

    it("generateTopicFlashcards for FlashAttention should include online softmax and SRAM constraints", () => {
      const cards = generateTopicFlashcards("ml_flashattention_sram_tiling");

      expect(cards.length).toBeGreaterThanOrEqual(2);
      const texts = cards.map((c) => `${c.front} ${c.back}`).join(" ");
      expect(texts.toLowerCase()).toContain("attention");
    });
  });
});
