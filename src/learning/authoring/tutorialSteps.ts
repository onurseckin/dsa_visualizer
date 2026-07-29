import type {
  AlgorithmStep,
  AuxiliaryState,
  DisplayValue,
  PrimaryVisualSnapshot,
  StepExplanation,
  TutorialScenarioKind,
  TutorialStepMeta,
} from "../../types/dsa";

interface TutorialStepBaseOptions {
  readonly stepIndex: number;
  readonly narrative: string;
  readonly primarySnapshot: PrimaryVisualSnapshot;
  readonly auxiliaryState?: AuxiliaryState;
  readonly variables?: Record<string, DisplayValue>;
}

export type TutorialStepOptions =
  | (TutorialStepBaseOptions & { readonly phase: "intro"; readonly scenario?: never })
  | (TutorialStepBaseOptions & { readonly phase: "walkthrough"; readonly scenario?: never })
  | (TutorialStepBaseOptions & {
      readonly phase: "scenario";
      readonly scenario: TutorialScenarioKind;
    });

type TutorialNarrativeSource =
  | Pick<AlgorithmStep, "narrative" | "explanation">
  | StepExplanation
  | null
  | undefined;

export function normalizeTutorialNarrative(narrative: unknown): string {
  if (typeof narrative !== "string") {
    throw new Error("Tutorial narratives must be a nonempty paragraph.");
  }

  const normalized = narrative.trim();

  if (!normalized) {
    throw new Error("Tutorial narratives must be a nonempty paragraph.");
  }
  if (/[\r\n]/.test(normalized)) {
    throw new Error("Tutorial narratives must contain one paragraph without line breaks.");
  }
  if (/•/.test(normalized) || /(?:^|[.!?;:]\s+)(?:[-+*]|\d+[.)])\s+/.test(normalized)) {
    throw new Error("Tutorial narratives cannot use bullets or list items.");
  }
  if (/\blines?\s*(?:#\s*)?\d+(?:\s*(?:[-–—]|to)\s*\d+)?\b/i.test(normalized)) {
    throw new Error("Tutorial narratives cannot refer to source-code line numbers.");
  }

  return normalized;
}

export function createTutorialStep(options: TutorialStepOptions): AlgorithmStep {
  const normalizedNarrative = normalizeTutorialNarrative(options.narrative);
  const tutorial: TutorialStepMeta =
    options.phase === "scenario"
      ? { phase: "scenario", scenario: options.scenario }
      : options.phase === "intro"
        ? { phase: "intro" }
        : { phase: "walkthrough" };

  return {
    stepIndex: options.stepIndex,
    codeLine: undefined,
    narrative: normalizedNarrative,
    tutorial,
    primarySnapshot: options.primarySnapshot,
    auxiliaryState: options.auxiliaryState ?? {},
    variables: options.variables ?? {},
    // Compatibility transport for legacy consumers until every tutorial migrates.
    explanation: { what: normalizedNarrative, why: "" },
  };
}

export function getStepNarrative(source: TutorialNarrativeSource): string {
  if (!source) return "";

  const narrative = "narrative" in source ? source.narrative?.trim() : undefined;
  if (narrative) return narrative;

  const explanation = "explanation" in source ? source.explanation : source;
  const what = explanation.what.trim();
  const why = explanation.why.trim();
  if (!what) return why;
  if (!why) return what;

  return `${what}${/[.!?:]$/.test(what) ? "" : "."} ${why}`;
}
