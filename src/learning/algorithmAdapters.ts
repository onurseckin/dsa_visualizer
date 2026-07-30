import { getPythonExecutionSpec, getPythonStarterCode } from "../playground/executionSpecs";
import {
  getAlgorithmSources,
  getSourceKind,
  type AlgorithmDefinition,
  type ProblemSource,
  type SourceKind,
} from "../types/dsa";
import { algorithmAssessment } from "./assessment";
import { deriveDifficultyLabel, legacyDifficultyProfile } from "./difficulty";
import { ACTIVE_TRIVIA_SEMANTIC_METADATA } from "./triviaSemantics";
import type { AlgorithmLearningItem, LearningSource } from "./types";
import { isValidLearningSourceUrl } from "./types";

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

function verifiedSourceUrl(
  definition: AlgorithmDefinition,
  source: ProblemSource,
  kind: SourceKind,
): string | undefined {
  if (source.url && isValidLearningSourceUrl(source.url)) return source.url;
  if (
    kind === "leetcode" &&
    definition.leetcode?.url &&
    isValidLearningSourceUrl(definition.leetcode.url)
  ) {
    return definition.leetcode.url;
  }
  return undefined;
}

export function normalizeAlgorithmSources(
  definition: AlgorithmDefinition,
): readonly [LearningSource, ...LearningSource[]] {
  const normalized = getAlgorithmSources(definition).map((source) => {
    const kind = getSourceKind(source);
    const url = verifiedSourceUrl(definition, source, kind);
    const { url: legacyUrl, ...metadata } = source;
    void legacyUrl;

    return url
      ? Object.freeze({
          ...metadata,
          kind,
          label: sourceLabel(source, kind),
          provenance: "verified" as const,
          url,
        })
      : Object.freeze({
          ...metadata,
          kind,
          label: sourceLabel(source, kind),
          provenance: "unverified" as const,
        });
  });

  const deduplicated = normalized.filter(
    (source, index) =>
      normalized.findIndex(
        (candidate) =>
          candidate.kind === source.kind &&
          candidate.label === source.label &&
          candidate.provenance === source.provenance &&
          ("url" in candidate ? candidate.url : undefined) ===
            ("url" in source ? source.url : undefined),
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
    get objective() {
      return `Explain and execute ${algorithm.title}.`;
    },
    get completionEvidence() {
      return `A correct ${algorithm.id} trace, explanation, and executable result.`;
    },
    sources,
    assessment,
    get code() {
      return algorithm.code;
    },
    get codeVariants() {
      return algorithm.codeVariants;
    },
    get execution() {
      return getPythonExecutionSpec(algorithm.id);
    },
    get starterCode() {
      return getPythonStarterCode(algorithm.id);
    },
    get generateSteps() {
      return algorithm.generateSteps;
    },
    get defaultInput() {
      return algorithm.defaultInput;
    },
    get trivia() {
      const semanticLines = ACTIVE_TRIVIA_SEMANTIC_METADATA[algorithm.id];
      if (!semanticLines || semanticLines.length === 0) return algorithm.trivia;
      return {
        ...(algorithm.trivia ?? {}),
        semanticLines,
      };
    },
  });
}
