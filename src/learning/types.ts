import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import type { TopicId } from "../curriculum/topics";
import type { AlgorithmDefinition, AlgorithmStep, DifficultyLevel, SourceKind } from "../types/dsa";
import type { TriviaMeta } from "../types/trivia";
import type {
  AlgorithmAssessmentDefinition,
  AssessmentDefinition,
  CalculatorAssessmentDefinition,
  CapstoneAssessmentDefinition,
  DebuggingAssessmentDefinition,
  ScenarioAssessmentDefinition,
  TraceAssessmentDefinition,
} from "./assessment";
import type { DifficultyProfile, LearningDifficultyLabel } from "./difficulty";

export type LearningItemKind =
  | "algorithm"
  | "trace"
  | "calculator"
  | "debugging"
  | "scenario"
  | "capstone";

export interface LearningSource {
  readonly kind: SourceKind;
  readonly label: string;
  readonly url: string;
  readonly id?: number;
  readonly leetcodeId?: number;
  readonly title?: string;
  readonly bookTitle?: string;
  readonly chapter?: string | number;
  readonly chapterTitle?: string;
  readonly section?: string | number;
  readonly shortTitle?: string;
  readonly page?: number;
}

export interface LearningItemBase {
  readonly id: string;
  readonly kind: LearningItemKind;
  readonly title: string;
  readonly topicIds: readonly [TopicId, ...TopicId[]];
  readonly difficultyProfile: DifficultyProfile;
  readonly difficultyLabel: LearningDifficultyLabel;
  readonly difficulty: DifficultyLevel;
  readonly description: string;
  readonly sources: readonly [LearningSource, ...LearningSource[]];
  readonly assessment: AssessmentDefinition;
}

interface CodeLearningItemBase extends LearningItemBase {
  readonly code: string;
  readonly starterCode?: string;
  readonly execution?: PythonExecutionSpec;
  readonly generateSteps: (input: unknown) => AlgorithmStep[];
  readonly trivia?: TriviaMeta;
}

export interface AlgorithmLearningItem extends CodeLearningItemBase {
  readonly kind: "algorithm";
  readonly assessment: AlgorithmAssessmentDefinition;
  readonly algorithm: AlgorithmDefinition;
  readonly defaultInput: unknown;
}

export interface TraceLearningItem extends CodeLearningItemBase {
  readonly kind: "trace";
  readonly assessment: TraceAssessmentDefinition;
}

export interface CalculatorLearningItem extends CodeLearningItemBase {
  readonly kind: "calculator";
  readonly assessment: CalculatorAssessmentDefinition;
}

export interface DebuggingLearningItem extends CodeLearningItemBase {
  readonly kind: "debugging";
  readonly assessment: DebuggingAssessmentDefinition;
}

export interface ScenarioPrompt {
  readonly context: string;
  readonly question: string;
  readonly constraints?: readonly string[];
}

export interface RubricCriterion {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly points: number;
}

export interface RubricDefinition {
  readonly criteria: readonly [RubricCriterion, ...RubricCriterion[]];
}

interface RubricLearningItemBase extends LearningItemBase {
  readonly prompt: ScenarioPrompt;
  readonly rubric: RubricDefinition;
  readonly code?: never;
  readonly starterCode?: never;
  readonly execution?: never;
  readonly generateSteps?: never;
}

export interface ScenarioLearningItem extends RubricLearningItemBase {
  readonly kind: "scenario";
  readonly assessment: ScenarioAssessmentDefinition;
}

export interface CapstoneLearningItem extends RubricLearningItemBase {
  readonly kind: "capstone";
  readonly assessment: CapstoneAssessmentDefinition;
}

export type CodeLearningItem =
  | AlgorithmLearningItem
  | TraceLearningItem
  | CalculatorLearningItem
  | DebuggingLearningItem;

export type RubricLearningItem = ScenarioLearningItem | CapstoneLearningItem;

export type LearningItem = CodeLearningItem | RubricLearningItem;

export type ExecutionReadyLearningItem = CodeLearningItem & {
  readonly execution: PythonExecutionSpec;
};

export function isAlgorithmLearningItem(
  item: LearningItem | undefined,
): item is AlgorithmLearningItem {
  return item?.kind === "algorithm";
}

export function isCodeLearningItem(item: LearningItem): item is CodeLearningItem {
  return (
    item.kind === "algorithm" ||
    item.kind === "trace" ||
    item.kind === "calculator" ||
    item.kind === "debugging"
  );
}

export function isRubricLearningItem(item: LearningItem): item is RubricLearningItem {
  return item.kind === "scenario" || item.kind === "capstone";
}

export function hasExecutionSpec(item: CodeLearningItem): item is ExecutionReadyLearningItem {
  return item.execution !== undefined;
}

export function isTriviaEligibleLearningItem(item: LearningItem): item is CodeLearningItem {
  return isCodeLearningItem(item) && item.assessment.triviaEligible && item.code.trim().length > 0;
}

export function isValidLearningSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}
