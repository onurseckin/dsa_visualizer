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

interface AssessmentDefinitionBase<Kind extends LearningItemKind> {
  readonly kind: Kind;
  readonly renderer: (typeof ASSESSMENT_RENDERER_BY_KIND)[Kind];
  readonly triviaEligible: boolean;
}

export type AlgorithmAssessmentDefinition = AssessmentDefinitionBase<"algorithm"> & {
  readonly triviaEligible: true;
};

export type TraceAssessmentDefinition = AssessmentDefinitionBase<"trace">;
export type CalculatorAssessmentDefinition = AssessmentDefinitionBase<"calculator">;
export type DebuggingAssessmentDefinition = AssessmentDefinitionBase<"debugging">;

export type ScenarioAssessmentDefinition = AssessmentDefinitionBase<"scenario"> & {
  readonly triviaEligible: false;
};

export type CapstoneAssessmentDefinition = AssessmentDefinitionBase<"capstone"> & {
  readonly triviaEligible: false;
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
