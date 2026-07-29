import type {
  CalculatorAssessmentPayload,
  CapstoneAssessmentPayload,
  DebuggingAssessmentPayload,
  ScenarioAssessmentPayload,
  TraceAssessmentPayload,
} from "../assessment";
import { ASSESSMENT_RENDERER_BY_KIND } from "../assessment";
import type { DifficultyProfile } from "../difficulty";
import type {
  CalculatorLearningItem,
  CapstoneLearningItem,
  DebuggingLearningItem,
  LearningItemBase,
  LearningItemPlayground,
  RubricDefinition,
  ScenarioLearningItem,
  ScenarioPrompt,
  TraceLearningItem,
} from "../types";
import { authoredDifficulty } from "./difficulty";
import { deepFreezeCopy } from "./freeze";

interface SharedItemInput {
  readonly id: string;
  readonly title: string;
  readonly topicIds: LearningItemBase["topicIds"];
  readonly difficultyProfile: DifficultyProfile;
  readonly description: string;
  readonly objective: string;
  readonly completionEvidence: string;
  readonly sources: LearningItemBase["sources"];
}

interface SharedCodeItemInput extends SharedItemInput, LearningItemPlayground {}

export interface TraceItemInput extends SharedCodeItemInput {
  readonly assessmentPayload: TraceAssessmentPayload;
}

export interface CalculatorItemInput extends SharedCodeItemInput {
  readonly assessmentPayload: CalculatorAssessmentPayload;
}

export interface DebuggingItemInput extends SharedCodeItemInput {
  readonly assessmentPayload: DebuggingAssessmentPayload;
}

interface SharedRubricItemInput extends SharedItemInput {
  readonly prompt: ScenarioPrompt;
  readonly rubric: RubricDefinition;
  readonly playground: LearningItemPlayground;
}

export interface ScenarioItemInput extends SharedRubricItemInput {
  readonly assessmentPayload: ScenarioAssessmentPayload;
}

export interface CapstoneItemInput extends SharedRubricItemInput {
  readonly assessmentPayload: CapstoneAssessmentPayload;
}

function commonItem(input: SharedItemInput) {
  return {
    id: input.id,
    title: input.title,
    topicIds: input.topicIds,
    ...authoredDifficulty(input.difficultyProfile),
    description: input.description,
    objective: input.objective,
    completionEvidence: input.completionEvidence,
    sources: input.sources,
  };
}

export function defineTraceItem(input: TraceItemInput): TraceLearningItem {
  return deepFreezeCopy({
    ...commonItem(input),
    kind: "trace",
    code: input.code,
    starterCode: input.starterCode,
    execution: input.execution,
    generateSteps: input.generateSteps,
    assessment: Object.freeze({
      kind: "trace",
      renderer: ASSESSMENT_RENDERER_BY_KIND.trace,
      triviaEligible: false,
      payload: input.assessmentPayload,
    }),
  } satisfies TraceLearningItem);
}

export function defineCalculatorItem(input: CalculatorItemInput): CalculatorLearningItem {
  return deepFreezeCopy({
    ...commonItem(input),
    kind: "calculator",
    code: input.code,
    starterCode: input.starterCode,
    execution: input.execution,
    generateSteps: input.generateSteps,
    assessment: Object.freeze({
      kind: "calculator",
      renderer: ASSESSMENT_RENDERER_BY_KIND.calculator,
      triviaEligible: false,
      payload: input.assessmentPayload,
    }),
  } satisfies CalculatorLearningItem);
}

export function defineDebuggingItem(input: DebuggingItemInput): DebuggingLearningItem {
  return deepFreezeCopy({
    ...commonItem(input),
    kind: "debugging",
    code: input.code,
    starterCode: input.starterCode,
    execution: input.execution,
    generateSteps: input.generateSteps,
    assessment: Object.freeze({
      kind: "debugging",
      renderer: ASSESSMENT_RENDERER_BY_KIND.debugging,
      triviaEligible: false,
      payload: input.assessmentPayload,
    }),
  } satisfies DebuggingLearningItem);
}

export function defineScenarioItem(input: ScenarioItemInput): ScenarioLearningItem {
  return deepFreezeCopy({
    ...commonItem(input),
    kind: "scenario",
    prompt: input.prompt,
    rubric: input.rubric,
    playground: input.playground,
    assessment: Object.freeze({
      kind: "scenario",
      renderer: ASSESSMENT_RENDERER_BY_KIND.scenario,
      triviaEligible: false,
      payload: input.assessmentPayload,
    }),
  } satisfies ScenarioLearningItem);
}

export function defineCapstoneItem(input: CapstoneItemInput): CapstoneLearningItem {
  return deepFreezeCopy({
    ...commonItem(input),
    kind: "capstone",
    prompt: input.prompt,
    rubric: input.rubric,
    playground: input.playground,
    assessment: Object.freeze({
      kind: "capstone",
      renderer: ASSESSMENT_RENDERER_BY_KIND.capstone,
      triviaEligible: false,
      payload: input.assessmentPayload,
    }),
  } satisfies CapstoneLearningItem);
}
