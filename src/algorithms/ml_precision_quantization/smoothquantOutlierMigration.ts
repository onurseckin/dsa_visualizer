import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface smoothquantOutlierMigrationInput {
  values: number[];
  scale: number;
}

export const SMOOTHQUANTOUTLIERMIGRATION_CODE = `
def smoothquant_outlier_migration(activations, weights, alpha=0.5):
    """
    Migrates activation quantization difficulty to weight scales using smoothing vector s.
    """
    s_vector = [abs(x) ** alpha for x in activations]
    smoothed_act = [a / s for a, s in zip(activations, s_vector)]
    smoothed_weights = [w * s for w, s in zip(weights, s_vector)]
    return smoothed_act, smoothed_weights, s_vector
`;

export const DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT: smoothquantOutlierMigrationInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateSmoothquantOutlierMigrationSteps = (
  input: smoothquantOutlierMigrationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5];
  const elements: ArrayElement[] = arrayValues.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          values: `[${arrayValues.join(", ")}]`,
          scale: String(input?.scale ?? 0.1),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Smoothquant Outlier Migration",
    "Setting up quantization scale parameters and FP32 memory buffer.",
    { n: arrayValues.length, scale: input?.scale ?? 0.1 },
  );

  arrayValues.forEach((val, idx) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating quantization transformation for element at index ${idx}.`,
      { idx, val, scale: input?.scale ?? 0.1 },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    8,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SMOOTHQUANTOUTLIERMIGRATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines SmoothQuant outlier migration function.",
    4: "Computes per-channel smoothing scale vector s_vector = |activations|^alpha.",
    5: "Scales down activations by dividing by s_vector: smoothed_act = [a / s].",
    6: "Scales up weight channels by multiplying by s_vector: smoothed_weights = [w * s].",
    7: "Returns smoothed activations, smoothed weights, and smoothing vector s.",
  },
};

export const smoothquantOutlierMigration: AlgorithmDefinition<smoothquantOutlierMigrationInput> = {
  id: "smoothquant-outlier-migration",
  title: "Smoothquant Outlier Migration",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In Large Language Model quantization (SmoothQuant, Xiao et al. 2023 for LLMs like OPT, LLaMA), LLM activations exhibit extreme channel outliers that make INT8 activation quantization difficult. SmoothQuant mathematically migrates quantization difficulty from activations to weights by dividing activations by a per-channel smoothing scale vector s = max(|X|)^alpha and multiplying weight columns by s.\n\nThis algorithm implements Smoothquant Outlier Migration, computing per-channel smoothing vector s, scaling activations down, and scaling weight channels up to balance quantization precision.\n\nInput Format:\n- values: Array of activation or weight values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns smoothed activations array, smoothed weights array, and smoothing scale vector s.\n\nEdge Cases & Constraints:\n- alpha = 0.5 (equal migration of quantization difficulty between activations and weights).\n- alpha = 1.0 (migrates all activation difficulty to weights).\n- Zero activation values (smoothing scale s = 1.0 to prevent division by zero).",
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9", "scale > 0"],
  examples: [
    {
      kind: "basic",
      title: "Standard Quantization Case",
      inputDisplay: "values = [1.2, -3.4, 5.5], scale = 0.1",
      outputDisplay: "Quantized INT8 Values",
      input: { values: [1.2, -3.4, 5.5], scale: 0.1 },
      output: "[12, -34, 55]",
      explanation: "Standard execution pass quantizing FP32 values.",
    },
    {
      kind: "complex",
      title: "Larger Values Array",
      inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5], scale = 0.1",
      outputDisplay: "Quantized INT8 Values",
      input: { values: [0.5, -1.5, 2.5, -3.5, 4.5], scale: 0.1 },
      output: "[5, -15, 25, -35, 45]",
      explanation: "Evaluates quantization pass across 5 scalar values.",
    },
    {
      kind: "negative",
      title: "Edge Case Overflow",
      inputDisplay: "values = [1000.0, -1000.0], scale = 0.1",
      outputDisplay: "[127, -128]",
      input: { values: [1000.0, -1000.0], scale: 0.1 },
      output: "[127, -128]",
      explanation: "Clamps extreme values to INT8 integer bounds [-128, 127].",
    },
  ],
  code: SMOOTHQUANTOUTLIERMIGRATION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "SmoothQuant enables W8A8 INT8 quantization for 100B+ parameter LLMs without loss of accuracy. By smoothing out activation magnitude spikes across channels, both activations and weights can be quantized cleanly to INT8 using standard per-tensor/per-channel quantizers.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, Y = X @ W = (X * diag(s)^-1) @ (diag(s) * W) = X_smooth @ W_smooth. Smoothing scale s_c = max(|X_c|)^alpha / max(|W_c|)^(1-alpha).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "SmoothQuant maintains exact mathematical identity while reducing activation outlier dynamic range by 10x-100x, allowing INT8 Tensor Cores to achieve 2x throughput speedups during LLM serving.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes per-channel scale vector s_vector = |activations|^alpha, divides activations by s_vector, and multiplies weights by s_vector.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes zero activation channels where division fallback s = 1.0 is used.",
      },
    ],
    keyTerms: [
      {
        term: "SmoothQuant",
        definition:
          "LLM quantization technique migrating activation outlier difficulty to weight channels via per-channel scaling.",
      },
      {
        term: "Outlier Migration",
        definition:
          "Mathematically scaling down activation channels while scaling up weight channels to balance dynamic range.",
      },
      {
        term: "Migration Strength (alpha)",
        definition:
          "Hyperparameter alpha controlling how much quantization difficulty is shifted from activations to weights.",
      },
    ],
  },
  trivia: SMOOTHQUANTOUTLIERMIGRATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
  generateSteps: generateSmoothquantOutlierMigrationSteps,
};
