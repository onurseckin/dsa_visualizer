import { getPythonExecutionSpec } from "../playground/executionSpecs";
import {
  getAlgorithmSources,
  getSourceKind,
  type AlgorithmDefinition,
  type ProblemSource,
  type SourceKind,
} from "../types/dsa";
import { algorithmAssessment } from "./assessment";
import { deriveDifficultyLabel, legacyDifficultyProfile } from "./difficulty";
import type { AlgorithmLearningItem, LearningSource } from "./types";
import { isValidLearningSourceUrl } from "./types";

const LEGACY_SOURCE_URL_BY_KIND = Object.freeze({
  leetcode: "https://leetcode.com/problemset/",
  book: "https://cses.fi/book/book.pdf",
  standard: "https://en.wikipedia.org/wiki/Algorithm",
  hackerrank: "https://www.hackerrank.com/domains/algorithms",
  ml_infra: "https://pytorch.org/docs/stable/",
  other: "https://en.wikipedia.org/wiki/Algorithm",
} as const satisfies Record<SourceKind, string>);

const SOURCE_LABEL_BY_KIND = Object.freeze({
  leetcode: "LeetCode",
  book: "Competitive Programmer's Handbook",
  standard: "Standard",
  hackerrank: "HackerRank",
  ml_infra: "ML Infra",
  other: "Reference",
} as const satisfies Record<SourceKind, string>);

function sourceLabel(source: ProblemSource, kind: SourceKind): string {
  if (source.label?.trim()) return source.label.trim();
  if ("title" in source && source.title?.trim()) return source.title.trim();
  if ("bookTitle" in source && source.bookTitle?.trim()) return source.bookTitle.trim();
  return SOURCE_LABEL_BY_KIND[kind];
}

function canonicalSourceUrl(
  definition: AlgorithmDefinition,
  source: ProblemSource,
  kind: SourceKind,
): string {
  if (source.url && isValidLearningSourceUrl(source.url)) return source.url;
  if (
    kind === "leetcode" &&
    definition.leetcode?.url &&
    isValidLearningSourceUrl(definition.leetcode.url)
  ) {
    return definition.leetcode.url;
  }
  return LEGACY_SOURCE_URL_BY_KIND[kind];
}

export function normalizeAlgorithmSources(
  definition: AlgorithmDefinition,
): readonly [LearningSource, ...LearningSource[]] {
  const normalized = getAlgorithmSources(definition).map((source) => {
    const kind = getSourceKind(source);
    return Object.freeze({
      ...source,
      kind,
      label: sourceLabel(source, kind),
      url: canonicalSourceUrl(definition, source, kind),
    });
  });

  const deduplicated = normalized.filter(
    (source, index) =>
      normalized.findIndex(
        (candidate) =>
          candidate.kind === source.kind &&
          candidate.label === source.label &&
          candidate.url === source.url,
      ) === index,
  );

  return Object.freeze(deduplicated) as unknown as readonly [LearningSource, ...LearningSource[]];
}

export function adaptAlgorithmDefinition(algorithm: AlgorithmDefinition): AlgorithmLearningItem {
  const difficultyProfile = legacyDifficultyProfile(algorithm.difficulty);
  const sources = normalizeAlgorithmSources(algorithm);
  const assessment = algorithmAssessment();

  return Object.freeze({
    kind: "algorithm" as const,
    algorithm,
    get id() {
      return algorithm.id;
    },
    get title() {
      return algorithm.title;
    },
    get topicIds() {
      return algorithm.topicIds;
    },
    difficultyProfile,
    get difficultyLabel() {
      return deriveDifficultyLabel(difficultyProfile);
    },
    get difficulty() {
      return algorithm.difficulty ?? "Medium";
    },
    get description() {
      return algorithm.description;
    },
    sources,
    assessment,
    get code() {
      return algorithm.code;
    },
    get execution() {
      return getPythonExecutionSpec(algorithm.id);
    },
    get generateSteps() {
      return algorithm.generateSteps;
    },
    get defaultInput() {
      return algorithm.defaultInput;
    },
    get trivia() {
      return algorithm.trivia;
    },
  });
}
