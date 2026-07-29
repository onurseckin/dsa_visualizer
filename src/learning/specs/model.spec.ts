import { describe, expect, it } from "vitest";
import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import type { AlgorithmDefinition } from "../../types/dsa";
import {
  ASSESSMENT_RENDERER_BY_KIND,
  hasAssessmentRenderer,
  isAssessmentForLearningItemKind,
  type AssessmentDefinition,
} from "../assessment";
import {
  deriveDifficultyLabel,
  difficultyLevelFromProfile,
  difficultyProfileScore,
  isDifficultyProfile,
  type DifficultyProfile,
} from "../difficulty";
import {
  hasExecutionSpec,
  isAlgorithmLearningItem,
  isCodeLearningItem,
  isRubricLearningItem,
  isTriviaEligibleLearningItem,
  isValidLearningSourceUrl,
  type LearningItem,
} from "../types";
import { adaptAlgorithmDefinition, normalizeAlgorithmSources } from "../algorithmAdapters";

const profile = (
  prerequisite: 0 | 1 | 2 | 3,
  representations: 0 | 1 | 2 | 3,
  horizon: 0 | 1 | 2 | 3,
  tradeoffs: 0 | 1 | 2 | 3,
): DifficultyProfile => ({ prerequisite, representations, horizon, tradeoffs });

describe("learning item model", () => {
  it.each([
    [profile(0, 0, 0, 0), 0, "Introductory", "Easy"],
    [profile(1, 1, 1, 0), 3, "Developing", "Easy"],
    [profile(1, 2, 2, 0), 5, "Proficient", "Medium"],
    [profile(2, 2, 2, 2), 8, "Advanced", "Hard"],
    [profile(3, 3, 3, 3), 12, "Systems Design", "Hard"],
  ] as const)("derives the calibrated label for %o", (value, score, label, coarseLevel) => {
    expect(difficultyProfileScore(value)).toBe(score);
    expect(deriveDifficultyLabel(value)).toBe(label);
    expect(difficultyLevelFromProfile(value)).toBe(coarseLevel);
  });

  it.each([
    null,
    [],
    {},
    profile(0, 0, 0, 0.5 as 0),
    profile(-1 as 0, 0, 0, 0),
    profile(0, 0, 0, 4 as 0),
    { ...profile(0, 0, 0, 0), primary: 1 },
  ])("rejects an invalid or extended P/R/H/T profile: %o", (value) => {
    expect(isDifficultyProfile(value)).toBe(false);
  });

  it("recognizes all assessment discriminants and rejects renderer drift", () => {
    for (const kind of Object.keys(ASSESSMENT_RENDERER_BY_KIND) as LearningItem["kind"][]) {
      const assessment = {
        kind,
        renderer: ASSESSMENT_RENDERER_BY_KIND[kind],
        triviaEligible: kind === "algorithm",
      } as AssessmentDefinition;
      expect(isAssessmentForLearningItemKind(assessment, kind)).toBe(true);
      expect(hasAssessmentRenderer(assessment)).toBe(true);
      expect(
        hasAssessmentRenderer({
          ...assessment,
          renderer: "scenario-assessment",
        } as AssessmentDefinition),
      ).toBe(kind === "scenario");
    }
  });

  it("narrows algorithm, code, rubric, execution-ready, and trivia-eligible items", () => {
    const execution: PythonExecutionSpec = {
      runtime: "browser",
      entrypoint: "trace",
      invocation: { kind: "function", arguments: [] },
      packages: [],
      cases: [
        {
          id: "basic",
          label: "Basic",
          input: null,
          expected: null,
          comparison: "deep-equal",
        },
      ],
    };
    const trace = {
      kind: "trace",
      code: "def trace():\n    return None",
      execution,
      assessment: {
        kind: "trace",
        renderer: "trace-assessment",
        triviaEligible: false,
      },
    } as unknown as LearningItem;
    const scenario = {
      kind: "scenario",
      assessment: {
        kind: "scenario",
        renderer: "scenario-assessment",
        triviaEligible: false,
      },
    } as unknown as LearningItem;

    expect(isAlgorithmLearningItem(trace)).toBe(false);
    expect(isCodeLearningItem(trace)).toBe(true);
    if (!isCodeLearningItem(trace)) throw new Error("trace must be code-bearing");
    expect(hasExecutionSpec(trace)).toBe(true);
    expect(isTriviaEligibleLearningItem(trace)).toBe(false);

    expect(isRubricLearningItem(scenario)).toBe(true);
    expect(isCodeLearningItem(scenario)).toBe(false);
    expect(isTriviaEligibleLearningItem(scenario)).toBe(false);
  });

  it.each([
    ["https://example.com/reference", true],
    ["http://localhost/reference", true],
    ["ftp://example.com/reference", false],
    ["/relative/reference", false],
    ["not a URL", false],
  ])("validates canonical source URL %s", (url, valid) => {
    expect(isValidLearningSourceUrl(url)).toBe(valid);
  });

  it("normalizes legacy sources while preserving their useful display metadata", () => {
    const definition = {
      id: "source-normalization",
      title: "Source normalization",
      topicIds: ["arrays_and_hashing"],
      difficulty: "Easy",
      description: "A source adapter fixture.",
      code: "def source_normalization():\n    pass",
      timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
      spaceComplexity: "O(1)",
      complexityAnalysis: { time: "Constant.", space: "Constant." },
      topicGuide: { overview: "Fixture.", sections: [] },
      defaultInput: null,
      generateSteps: () => [],
      sources: [
        {
          kind: "book",
          bookTitle: "Competitive Programmer's Handbook",
          chapter: 2,
          url: "relative.pdf",
        },
      ],
    } satisfies AlgorithmDefinition<null>;

    const sources = normalizeAlgorithmSources(definition);
    const item = adaptAlgorithmDefinition(definition);

    expect(sources).toEqual([
      expect.objectContaining({
        kind: "book",
        bookTitle: "Competitive Programmer's Handbook",
        chapter: 2,
        url: "https://cses.fi/book/book.pdf",
      }),
    ]);
    expect(item.sources).toEqual(sources);
    expect(isTriviaEligibleLearningItem(item)).toBe(true);
  });
});
