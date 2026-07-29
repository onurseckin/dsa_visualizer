import type { LearningItemKind } from "./types";

export const ASSESSMENT_RENDERER_BY_KIND = Object.freeze({
  algorithm: "algorithm-workspace",
  trace: "trace-assessment",
  calculator: "calculator-assessment",
  debugging: "debugging-assessment",
  scenario: "scenario-assessment",
  capstone: "capstone-assessment",
} as const satisfies Record<LearningItemKind, string>);

export type AssessmentRenderer =
  (typeof ASSESSMENT_RENDERER_BY_KIND)[keyof typeof ASSESSMENT_RENDERER_BY_KIND];

export interface AssessmentVariantMetadata {
  readonly variant: string;
  readonly changedContext: boolean;
  readonly isomorphicRetest: boolean;
  readonly delayedRetrievalDueAt?: number;
}

/**
 * Code completion is intentionally an assessment mode nested within trace or debugging.
 * It is not a seventh registry-level LearningItemKind.
 */
export interface CodeCompletionPayload extends AssessmentVariantMetadata {
  readonly prompt: string;
  readonly context: string;
  readonly requiredConcepts: readonly [string, ...string[]];
  readonly consequencePrompt: string;
}

export interface TraceAssessmentPayload extends AssessmentVariantMetadata {
  readonly prompt: string;
  readonly currentState: string;
  readonly referenceNextState?: string;
  readonly completion?: CodeCompletionPayload;
}

export interface CalculatorInputDefinition {
  readonly id: string;
  readonly label: string;
  readonly unit?: string;
  readonly defaultValue?: string;
}

export interface CalculatorAssessmentPayload extends AssessmentVariantMetadata {
  readonly prompt: string;
  readonly inputs: readonly CalculatorInputDefinition[];
  readonly result: {
    readonly value: number;
    readonly unit: string;
    readonly tolerance: number;
  };
}

export interface DebuggingEvidence {
  readonly label: string;
  readonly content: string;
}

export interface DebuggingAssessmentPayload extends AssessmentVariantMetadata {
  readonly faultyStarter: string;
  readonly evidence: readonly DebuggingEvidence[];
  readonly failingTests: readonly string[];
  readonly hints: readonly string[];
  readonly completion?: CodeCompletionPayload;
}

export interface ScenarioAssessmentPayload extends AssessmentVariantMetadata {
  readonly choices?: readonly [string, ...string[]];
  readonly consequences?: string;
}

export interface CapstoneChecklistItem {
  readonly id: string;
  readonly label: string;
}

export interface CapstoneTimelinePrompt {
  readonly id: string;
  readonly label: string;
}

export interface CapstoneAssessmentPayload extends AssessmentVariantMetadata {
  readonly checklist: readonly CapstoneChecklistItem[];
  readonly incidentTimeline: readonly CapstoneTimelinePrompt[];
}

interface AssessmentDefinitionBase<Kind extends LearningItemKind> {
  readonly kind: Kind;
  readonly renderer: (typeof ASSESSMENT_RENDERER_BY_KIND)[Kind];
  readonly triviaEligible: boolean;
}

export type AlgorithmAssessmentDefinition = AssessmentDefinitionBase<"algorithm"> & {
  readonly triviaEligible: true;
};

export type TraceAssessmentDefinition = AssessmentDefinitionBase<"trace"> & {
  readonly payload?: TraceAssessmentPayload;
};

export type CalculatorAssessmentDefinition = AssessmentDefinitionBase<"calculator"> & {
  readonly payload?: CalculatorAssessmentPayload;
};

export type DebuggingAssessmentDefinition = AssessmentDefinitionBase<"debugging"> & {
  readonly payload?: DebuggingAssessmentPayload;
};

export type ScenarioAssessmentDefinition = AssessmentDefinitionBase<"scenario"> & {
  readonly triviaEligible: false;
  readonly payload?: ScenarioAssessmentPayload;
};

export type CapstoneAssessmentDefinition = AssessmentDefinitionBase<"capstone"> & {
  readonly triviaEligible: false;
  readonly payload?: CapstoneAssessmentPayload;
};

export type AssessmentDefinition =
  | AlgorithmAssessmentDefinition
  | TraceAssessmentDefinition
  | CalculatorAssessmentDefinition
  | DebuggingAssessmentDefinition
  | ScenarioAssessmentDefinition
  | CapstoneAssessmentDefinition;

export function algorithmAssessment(): AlgorithmAssessmentDefinition {
  return Object.freeze({
    kind: "algorithm",
    renderer: ASSESSMENT_RENDERER_BY_KIND.algorithm,
    triviaEligible: true,
  });
}

export function isAssessmentForLearningItemKind(
  assessment: AssessmentDefinition,
  kind: LearningItemKind,
): boolean {
  return assessment.kind === kind && assessment.renderer === ASSESSMENT_RENDERER_BY_KIND[kind];
}

export function hasAssessmentRenderer(assessment: AssessmentDefinition): boolean {
  return assessment.renderer === ASSESSMENT_RENDERER_BY_KIND[assessment.kind];
}
