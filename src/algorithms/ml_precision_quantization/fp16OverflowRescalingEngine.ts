import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp16OverflowRescalingEngineInput {
  values: number[];
  scale: number;
}

export const FP16OVERFLOWRESCALINGENGINE_CODE = `
def fp16_overflow_rescaling_engine(values, max_fp16=65504.0):
    """
    Detects FP16 max value exponent overflow > 65504 and scales activations down safely.
    """
    rescaled = []
    max_val = max(abs(x) for x in values) if values else 1.0
    scale_factor = 1.0

    if max_val > max_fp16:
        scale_factor = max_fp16 / max_val

    for x in values:
        rescaled.append(x * scale_factor)

    return rescaled, scale_factor
`;

export const DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT: fp16OverflowRescalingEngineInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateFp16OverflowRescalingEngineSteps = (
  input: fp16OverflowRescalingEngineInput,
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
    "Initialize Fp16 Overflow Rescaling Engine",
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
    15,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FP16OVERFLOWRESCALINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines FP16 overflow rescaling engine function.",
    4: "Initializes rescaled output array.",
    5: "Finds peak absolute value max_val in input activation vector.",
    6: "Initializes scale_factor to 1.0 (no scaling needed by default).",
    8: "Checks if peak magnitude max_val exceeds FP16 maximum bound (65504.0).",
    9: "Calculates safe downscaling factor scale_factor = 65504.0 / max_val.",
    11: "Applies downscaling factor to each input value: rescaled.append(x * scale_factor).",
    14: "Returns rescaled activation array and applied scale_factor.",
  },
};

export const fp16OverflowRescalingEngine: AlgorithmDefinition<fp16OverflowRescalingEngineInput> = {
  id: "fp16-overflow-rescaling-engine",
  title: "Fp16 Overflow Rescaling Engine",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In IEEE-754 half-precision floating point (FP16), the maximum representable finite positive value is 65504.0 (2^15 * (1 + 1023/1024)). Any intermediate layer activation or gradient exceeding 65504.0 results in FP16 exponent overflow, evaluating to +Infinity and producing NaN values in downstream loss computations. Dynamic Loss Scaling and activation rescaling engines monitor max activation values and scale tensors down safely.\n\nThis algorithm implements Fp16 Overflow Rescaling Engine, scanning activation vectors for values exceeding 65504.0, calculating a safe downscaling factor, and rescaling elements to prevent FP16 overflow.\n\nInput Format:\n- values: Array of FP32 floating-point values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns rescaled activation array and applied scale factor.\n\nEdge Cases & Constraints:\n- Values strictly within FP16 dynamic range (scale_factor = 1.0, no-op).\n- Extreme outlier values exceeding 1e5.\n- Empty input value array.",
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
  code: FP16OVERFLOWRESCALINGENGINE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "FP16 dynamic range is limited to [6e-8, 65504]. During deep neural network training (e.g. Mixed Precision Training via torch.cuda.amp.GradScaler), gradients and activations can spike above 65504.0, triggering overflow. Rescaling activations prevents infinity values from corrupting model weights.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, peak magnitude M = max_{x} |x|. If M > 65504.0, scale factor s = 65504.0 / M. Rescaled values x' = x * s guarantee all elements satisfy |x'| <= 65504.0.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Automatic Mixed Precision (AMP) uses dynamic loss scaling to keep gradients within [6e-8, 65504] range, doubling training throughput on GPU Tensor Cores while preserving FP32 convergence accuracy.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation finds peak absolute value max_val, computes downscaling factor if max_val > 65504.0, and multiplies each element by scale_factor.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling zero vectors where max_val == 0.",
      },
    ],
    keyTerms: [
      {
        term: "FP16 Max Value (65504)",
        definition:
          "The upper numeric bound of 16-bit half-precision floating point representation.",
      },
      {
        term: "Exponent Overflow",
        definition:
          "Occurs when a calculation exceeds the maximum exponent capability of a float format, yielding Infinity.",
      },
      {
        term: "Dynamic Loss Scaling",
        definition:
          "Adjusting scale factors dynamically during mixed precision training to prevent FP16 underflow/overflow.",
      },
    ],
  },
  trivia: FP16OVERFLOWRESCALINGENGINE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
  generateSteps: generateFp16OverflowRescalingEngineSteps,
};
