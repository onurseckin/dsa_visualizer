import type { LearningItemPlayground } from "../../../types";
import {
  arraySteps,
  defineCalculatorItem,
  defineDebuggingItem,
  defineScenarioItem,
  defineTraceItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

type Case = Parameters<typeof functionExecution>[0]["cases"][number];
type RecordInput = Record<string, unknown>;

interface ItemInput {
  readonly id: string;
  readonly title: string;
  readonly topicId:
    | "ml_accelerator_performance"
    | "ml_distributed_training"
    | "ml_compilation_quantization"
    | "ml_transformer_internals";
  readonly entrypoint: string;
  readonly contract: string;
  readonly code: string;
  readonly cases: readonly Case[];
  readonly source: readonly [string, string];
  readonly values: (
    record: RecordInput,
  ) => readonly (readonly [string, string | number | boolean])[];
}

function playground(input: ItemInput): LearningItemPlayground {
  return {
    code: input.code,
    starterCode: semanticStarter({
      entrypoint: input.entrypoint,
      parameters: ["record"],
      contract: input.contract,
    }),
    execution: functionExecution({
      entrypoint: input.entrypoint,
      outputContract: input.contract,
      cases: input.cases,
    }),
    generateSteps: (value) => metricSteps(input.values(value as RecordInput)),
  };
}

/** Renders authored model quantities, never labels without their input-derived values. */
export function metricSteps(entries: readonly (readonly [string, string | number | boolean])[]) {
  return arraySteps(
    entries.map(([label, value], index) => ({
      codeLine: index + 1,
      what: `Model ${label} as ${String(value)} from the supplied record.`,
      why: "This frame exposes an accounting quantity; it is not a measurement of live hardware.",
      values: entries.map(([name, metric]) => `${name}: ${String(metric)}`),
      activeIndices: [index],
      completedIndices: entries.slice(0, index).map((_, completed) => completed),
    })),
  );
}

function common(input: ItemInput) {
  return {
    id: input.id,
    title: input.title,
    topicIds: [input.topicId] as const,
    difficultyProfile: profile(3, 3, 3, 3),
    description: `Use a transparent ${input.title.toLowerCase()} model with supplied values; it does not claim a device, compiler, or service execution.`,
    objective:
      "Interpret the displayed modeled quantities, preserve their invariant, and name the measurement needed before making an operational claim.",
    completionEvidence:
      "The learner handles three distinct cases, explains the modeled invariant, and distinguishes this deterministic scratchpad from a measured system result.",
    sources: [verifiedSource({ label: input.source[0], url: input.source[1] })] as const,
  };
}

export function calculator(input: ItemInput) {
  return defineCalculatorItem({
    ...common(input),
    ...playground(input),
    assessmentPayload: {
      variant: "changed-model-input",
      changedContext: true,
      isomorphicRetest: true,
      prompt: "Calculate the stated model quantities from the supplied record.",
      inputs: [{ id: "record", label: "Accounting record" }],
      result: { value: 0, unit: "modeled quantity", tolerance: 0.000001 },
    },
  });
}

export function trace(input: ItemInput) {
  return defineTraceItem({
    ...common(input),
    ...playground(input),
    assessmentPayload: {
      variant: "changed-model-input",
      changedContext: true,
      isomorphicRetest: true,
      prompt: "Trace the supplied accounting record and preserve its invariant.",
      currentState: "The values are an explicit model, not a system execution.",
    },
  });
}

export function debugging(input: ItemInput) {
  return defineDebuggingItem({
    ...common(input),
    ...playground(input),
    assessmentPayload: {
      variant: "changed-model-input",
      changedContext: true,
      isomorphicRetest: true,
      faultyStarter: "Ignores the supplied model evidence.",
      evidence: [
        { label: "Accounting record", content: "The record provides the quantities to inspect." },
      ],
      failingTests: ["the modeled invariant is preserved"],
      hints: ["Use the supplied values rather than inferring an unmeasured system state."],
    },
  });
}

export function scenario(input: ItemInput) {
  return defineScenarioItem({
    ...common(input),
    prompt: {
      context:
        "The scratchpad exposes only supplied model quantities and requires a separate validation plan.",
      question: "What provisional decision follows, and what measurement could overturn it?",
    },
    rubric: {
      criteria: [
        {
          id: "model",
          label: "Model evidence",
          description: "Uses the displayed accounting quantities.",
          points: 3,
          critical: true,
        },
        {
          id: "validation",
          label: "Validation",
          description: "Names a real measurement before a production claim.",
          points: 2,
          critical: true,
        },
      ],
    },
    playground: playground(input),
    assessmentPayload: {
      variant: "changed-model-input",
      changedContext: true,
      isomorphicRetest: true,
      consequences: "The scratchpad is a transparent decision aid, not an execution result.",
    },
  });
}
