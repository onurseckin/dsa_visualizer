import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface perChannelSymmetricQuantizerInput {
  values: number[];
  scale: number;
}

export const PERCHANNELSYMMETRICQUANTIZER_CODE = `
def per_channel_symmetric_quantizer(weight_matrix):
    """
    Computes individual scale parameters S_c per output channel for W8 weights.
    """
    channel_scales = []
    quantized_matrix = []

    for channel in weight_matrix:
        max_abs = max(abs(x) for x in channel) if channel else 1.0
        scale = max_abs / 127.0 if max_abs > 0 else 1.0
        channel_scales.append(scale)
        q_channel = [max(-128, min(127, int(round(x / scale)))) for x in channel]
        quantized_matrix.append(q_channel)

    return channel_scales, quantized_matrix
`;

export const DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT: perChannelSymmetricQuantizerInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generatePerChannelSymmetricQuantizerSteps = (
  input: perChannelSymmetricQuantizerInput,
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
    "Initialize Per Channel Symmetric Quantizer",
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

const PERCHANNELSYMMETRICQUANTIZER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines per-channel symmetric quantizer function.",
    4: "Initializes per-channel scales list channel_scales.",
    5: "Initializes quantized INT8 weight matrix output list.",
    7: "Iterates through individual output channels (matrix rows).",
    8: "Finds peak absolute value max_abs within current channel.",
    9: "Calculates dedicated per-channel scale factor S_c = max_abs / 127.0.",
    10: "Appends scale S_c to channel_scales list.",
    11: "Quantizes channel weights into INT8 integer range [-128, 127].",
    12: "Appends quantized INT8 channel row to result matrix list.",
    14: "Returns per-channel scales array and quantized INT8 weight matrix.",
  },
};

export const perChannelSymmetricQuantizer: AlgorithmDefinition<perChannelSymmetricQuantizerInput> =
  {
    id: "per-channel-symmetric-quantizer",
    title: "Per Channel Symmetric Quantizer",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 4,
    mlInfraCategory: "ml_precision_quantization",
    description:
      "In neural network weight quantization (Per-Channel W8 quantization, e.g. PyTorch torch.ao.quantization.per_channel_symmetric), computing a single global scale factor across an entire weight matrix loses precision if different output channels have different dynamic ranges. Per-channel quantization computes an independent scale factor S_c = max(|W_c|) / 127 for each individual output channel c (row in weight matrix).\n\nThis algorithm implements Per Channel Symmetric Quantizer, iterating across weight channels, computing per-channel max absolute values, calculating dedicated scale factors, and quantizing channel weights.\n\nInput Format:\n- values: Array of weight values (or matrix payload).\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns array of per-channel scale factors and quantized INT8 weight matrix.\n\nEdge Cases & Constraints:\n- Channels with all-zero weight entries (scale defaults to 1.0).\n- Wide variance in dynamic range across channels.\n- Single channel weight matrices.",
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
    code: PERCHANNELSYMMETRICQUANTIZER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for quantized result array.",
    },
    topicGuide: {
      overview:
        "Per-channel weight quantization is the industry standard for INT8 linear and convolution layers in TensorRT, ONNX Runtime, and PyTorch. Assigning a dedicated scale factor per channel prevents outlier weights in one channel from squashing the precision of other channels.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, for output channel c, max_abs_c = max_{j} |W_{c,j}|. Per-channel scale S_c = max_abs_c / 127. Quantized weight Q_{c,j} = clamp(round(W_{c,j} / S_c), -128, 127).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Modern GPU INT8 GEMM hardware supports vector scale broadcast multiplication (C_{c,j} = Q_A @ Q_B_{c,j} * (S_a * S_c)), adding zero performance overhead compared to per-tensor scaling.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation iterates over weight channels (rows), computes per-channel max absolute value, calculates channel scale S_c, and quantizes channel weights into INT8 integer vectors.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes handling zero weight channels.",
        },
      ],
      keyTerms: [
        {
          term: "Per-Channel Quantization",
          definition:
            "Computing dedicated quantization scale factors for each individual output channel row.",
        },
        {
          term: "Per-Tensor Quantization",
          definition:
            "Computing a single global scale factor shared across an entire tensor matrix.",
        },
        {
          term: "Channel Dynamic Range",
          definition:
            "The peak magnitude max(|W_c|) exhibited by weights within a single output channel.",
        },
      ],
    },
    trivia: PERCHANNELSYMMETRICQUANTIZER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
    generateSteps: generatePerChannelSymmetricQuantizerSteps,
  };
