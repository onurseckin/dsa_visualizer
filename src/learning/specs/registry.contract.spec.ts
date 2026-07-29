import { describe, expect, it } from "vitest";
import { ALGORITHMS, ALGORITHM_REGISTRY } from "../../algorithms/registry";
import { TOPIC_CATALOG } from "../../curriculum/topics";
import { getPythonExecutionSpec } from "../../playground/executionSpecs";
import { validatePythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { hasAssessmentRenderer, isAssessmentForLearningItemKind } from "../assessment";
import { adaptAlgorithmDefinition } from "../algorithmAdapters";
import { deriveDifficultyLabel, isDifficultyProfile } from "../difficulty";
import {
  assertTransitionalLearningItemCount,
  buildLearningItemRegistry,
  CODE_LEARNING_ITEMS,
  getAllLearningItems,
  getLearningItem,
  getTriviaLearningItems,
  LEGACY_LEARNING_ITEMS,
  LEARNING_ITEMS,
  LEARNING_ITEM_REGISTRY,
  TRANSITIONAL_LEARNING_REGISTRY_STATE,
} from "../registry";
import {
  hasExecutionSpec,
  isAlgorithmLearningItem,
  isCodeLearningItem,
  isRubricLearningItem,
  isTriviaEligibleLearningItem,
  isValidLearningSourceUrl,
} from "../types";

const CANONICAL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const topicIds = new Set<string>(TOPIC_CATALOG.map((topic) => topic.id));

describe("learning item registry contract", () => {
  it("uses one unique canonical ID for each enrollment", () => {
    expect(new Set(LEARNING_ITEMS.map((item) => item.id)).size).toBe(LEARNING_ITEMS.length);
    expect(Object.keys(LEARNING_ITEM_REGISTRY)).toEqual(
      expect.arrayContaining(LEARNING_ITEMS.map((item) => item.id)),
    );
    expect(Object.getPrototypeOf(LEARNING_ITEM_REGISTRY)).toBeNull();

    for (const item of LEARNING_ITEMS) {
      expect(item.id).toMatch(CANONICAL_ID);
      expect(LEARNING_ITEM_REGISTRY[item.id]).toBe(item);
      expect(getLearningItem(item.id)).toBe(item);
    }
    expect(getLearningItem("not-enrolled")).toBeUndefined();
    expect(getLearningItem("__proto__")).toBeUndefined();
    expect(getLearningItem("constructor")).toBeUndefined();
    expect(getAllLearningItems()).toEqual(LEARNING_ITEMS);
    expect(getAllLearningItems()).not.toBe(LEARNING_ITEMS);
  });

  it("keeps every declared topic membership nonempty, valid, unique, and equal", () => {
    for (const item of LEARNING_ITEMS) {
      expect(item.topicIds.length).toBeGreaterThan(0);
      expect(new Set(item.topicIds).size).toBe(item.topicIds.length);
      expect(item.topicIds.every((topicId) => topicIds.has(topicId))).toBe(true);
      expect(Object.hasOwn(item, "primaryTopicId")).toBe(false);
      expect(Object.hasOwn(item, "category")).toBe(false);
      expect(Object.hasOwn(item, "categories")).toBe(false);
    }
  });

  it("preserves verified HTTP(S) provenance and marks missing provenance explicitly", () => {
    let verifiedCount = 0;
    let unverifiedCount = 0;

    for (const item of LEARNING_ITEMS) {
      expect(item.sources.length).toBeGreaterThan(0);
      for (const source of item.sources) {
        if (source.provenance === "verified") {
          verifiedCount += 1;
          expect(isValidLearningSourceUrl(source.url)).toBe(true);
          expect(new URL(source.url).protocol).toMatch(/^https?:$/);
        } else {
          unverifiedCount += 1;
          expect(source.provenance).toBe("unverified");
          expect(source).not.toHaveProperty("url");
        }
      }
    }

    expect(verifiedCount).toBeGreaterThan(0);
    expect(unverifiedCount).toBeGreaterThan(0);
  });

  it("does not fabricate provenance for source-only legacy definitions", () => {
    expect(getLearningItem("bubble-sort")?.sources).toEqual([
      {
        kind: "standard",
        label: "Standard Algorithm",
        provenance: "unverified",
      },
      {
        kind: "book",
        label: "Competitive Programmer's Handbook, Ch 3",
        bookTitle: "Competitive Programmer's Handbook",
        chapter: 3,
        section: "3.1 Sorting theory",
        provenance: "unverified",
      },
    ]);
    expect(getLearningItem("transpose-matrix-square")?.sources).toEqual([
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "ML Infra Level 2",
        provenance: "unverified",
      },
    ]);
  });

  it("stores valid P/R/H/T profiles and derives their labels", () => {
    for (const item of LEARNING_ITEMS) {
      expect(isDifficultyProfile(item.difficultyProfile)).toBe(true);
      expect(item.difficultyLabel).toBe(deriveDifficultyLabel(item.difficultyProfile));
    }
  });

  it("has an available renderer for every matching assessment discriminant", () => {
    for (const item of LEARNING_ITEMS) {
      expect(isAssessmentForLearningItemKind(item.assessment, item.kind)).toBe(true);
      expect(hasAssessmentRenderer(item.assessment)).toBe(true);
    }
  });

  it("reports execution readiness honestly while legacy specs are still pending", () => {
    for (const item of CODE_LEARNING_ITEMS) {
      if (isAlgorithmLearningItem(item)) {
        const execution = getPythonExecutionSpec(item.id);
        expect(item.execution).toBe(execution);
        expect(hasExecutionSpec(item)).toBe(execution !== undefined);
      } else {
        expect(hasExecutionSpec(item)).toBe(true);
      }
      if (item.execution !== undefined) {
        expect(validatePythonExecutionSpec(item.execution).ok).toBe(true);
      }
    }
  });

  it("derives trivia eligibility only from eligible code-bearing items", () => {
    const eligibleIds = LEARNING_ITEMS.filter(isTriviaEligibleLearningItem).map((item) => item.id);
    expect(eligibleIds.length).toBeGreaterThan(0);
    expect(eligibleIds.every((id) => CODE_LEARNING_ITEMS.some((item) => item.id === id))).toBe(
      true,
    );
    expect(CODE_LEARNING_ITEMS.every(isCodeLearningItem)).toBe(true);
    expect(LEARNING_ITEMS.filter(isRubricLearningItem)).toHaveLength(5);
    expect(getTriviaLearningItems().map((item) => item.id)).toEqual(eligibleIds);
  });

  it("codifies the additive temporary 320 legacy plus 18 required-foundation state", () => {
    expect(TRANSITIONAL_LEARNING_REGISTRY_STATE).toEqual({
      enabled: true,
      legacyExpectedItemCount: 320,
      requiredFoundationsExpectedItemCount: 18,
      expectedItemCount: 338,
      removalTask: 16,
    });
    expect(ALGORITHMS).toHaveLength(TRANSITIONAL_LEARNING_REGISTRY_STATE.legacyExpectedItemCount);
    expect(LEGACY_LEARNING_ITEMS).toHaveLength(
      TRANSITIONAL_LEARNING_REGISTRY_STATE.legacyExpectedItemCount,
    );
    expect(LEARNING_ITEMS).toHaveLength(TRANSITIONAL_LEARNING_REGISTRY_STATE.expectedItemCount);
    expect(Object.keys(LEARNING_ITEM_REGISTRY)).toHaveLength(
      TRANSITIONAL_LEARNING_REGISTRY_STATE.expectedItemCount,
    );
    expect(() => assertTransitionalLearningItemCount(LEARNING_ITEMS.slice(1))).toThrow(
      /expected 338 items, received 337/,
    );
  });

  it("rejects duplicate canonical learning-item enrollment", () => {
    const item = LEARNING_ITEMS[0];
    expect(() => buildLearningItemRegistry([item, item])).toThrow(
      `Duplicate canonical learning item id: ${item.id}`,
    );
  });

  it("adapts by reference and delegates canonical algorithm behavior without drift", () => {
    for (const definition of ALGORITHMS) {
      const item = LEARNING_ITEM_REGISTRY[definition.id];
      expect(isAlgorithmLearningItem(item)).toBe(true);
      if (!isAlgorithmLearningItem(item)) continue;

      expect(item.algorithm).toBe(ALGORITHM_REGISTRY[definition.id]);
      expect(item.algorithm).toBe(definition);
      expect(item.id).toBe(definition.id);
      expect(item.title).toBe(definition.title);
      expect(item.topicIds).toBe(definition.topicIds);
      expect(item.difficulty).toBe(definition.difficulty ?? "Medium");
      expect(item.description).toBe(definition.description);
      expect(item.code).toBe(definition.code);
      expect(item.generateSteps).toBe(definition.generateSteps);
      expect(item.defaultInput).toBe(definition.defaultInput);
      expect(item.trivia).toBe(definition.trivia);
      expect(adaptAlgorithmDefinition(definition).algorithm).toBe(definition);
    }
  });
});
