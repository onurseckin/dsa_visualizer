import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface perChannelSymmetricQuantizerInput {
  values?: number[];
  weightMatrix?: number[][];
  scale?: number;
}

export const PERCHANNELSYMMETRICQUANTIZER_CODE = `def per_channel_symmetric_quantizer(weight_matrix):
    channel_scales = []
    quantized_matrix = []
    for channel in weight_matrix:
        max_abs = max(abs(x) for x in channel) if channel else 1.0
        scale = max_abs / 127.0 if max_abs > 0 else 1.0
        channel_scales.append(scale)
        q_channel = [max(-128, min(127, int(round(x / scale)))) for x in channel]
        quantized_matrix.append(q_channel)
    return channel_scales, quantized_matrix`;

export const DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT: perChannelSymmetricQuantizerInput = {
  weightMatrix: [
    [1.2, -3.4, 5.5],
    [0.5, -1.5, 2.5],
    [10.0, -20.0, 15.0],
  ],
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-128, Math.min(127, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 ? "sign" : "quantized",
  }));
};

export const generatePerChannelSymmetricQuantizerSteps = (
  input: perChannelSymmetricQuantizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix: number[][] = input?.weightMatrix || [
    [1.2, -3.4, 5.5],
    [0.5, -1.5, 2.5],
    [10.0, -20.0, 15.0],
  ];

  const channelScalesBuffer: number[] = [];
  const quantizedMatrixBuffer: number[][] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currQuantized?: number,
    currScale?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? matrix[0][0],
        quantizedValue: currQuantized ?? 0,
        scale: currScale ?? 1.0,
        zeroPoint: 0,
        bits: toBitItems(currQuantized ?? 0),
        title: "Per-Channel Symmetric Quantizer (Weight Matrix)",
      },
      auxiliaryState: {
        customState: {
          channelsCount: String(matrix.length),
          channelScales: `[${channelScalesBuffer.map((s) => s.toFixed(4)).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Per-Channel Symmetric Quantizer Engine",
    `Preparing to compute dedicated per-channel INT8 scale parameters across ${matrix.length} weight channels.`,
    { channels: matrix.length },
    matrix[0][0],
    0,
    1.0,
  );

  // Step 2: Allocate channel_scales
  addStep(
    2,
    "Allocate Empty channel_scales List `channel_scales = []`",
    "Initializing empty list `channel_scales = []` to bank per-channel floating-point scale factors.",
    { bufferSize: 0 },
    matrix[0][0],
    0,
    1.0,
  );

  // Step 3: Allocate quantized_matrix
  addStep(
    3,
    "Allocate Empty quantized_matrix List `quantized_matrix = []`",
    "Initializing empty list `quantized_matrix = []` to bank INT8 quantized channel weight vectors.",
    { bufferSize: 0 },
    matrix[0][0],
    0,
    1.0,
  );

  // Multi-step loop per channel and weight element
  matrix.forEach((channel, cIdx) => {
    addStep(
      4,
      `Inspect Weight Channel c = ${cIdx}: [${channel.join(", ")}]`,
      `Reading weight channel ${cIdx} containing ${channel.length} weight entries.`,
      { cIdx, channelLength: channel.length, phase: "INSPECT_CHANNEL" },
      channel[0],
      0,
      1.0,
    );

    let maxAbs = 0;
    channel.forEach((val) => {
      const absVal = Math.abs(val);
      if (absVal > maxAbs) maxAbs = absVal;
    });
    if (channel.length === 0) maxAbs = 1.0;

    addStep(
      5,
      `Scan Peak Magnitude for Channel ${cIdx}: max_abs = max(|x|) = ${maxAbs}`,
      `Peak weight magnitude in channel ${cIdx} is max_abs = ${maxAbs}.`,
      { cIdx, maxAbs, phase: "CHANNEL_MAX_ABS" },
      channel[0],
      0,
      1.0,
    );

    const scale = maxAbs > 0 ? maxAbs / 127.0 : 1.0;
    const scaleFixed = Number(scale.toFixed(6));

    addStep(
      6,
      `Compute Dedicated Scale for Channel ${cIdx}: S_${cIdx} = ${maxAbs} / 127.0 = ${scaleFixed}`,
      `Calculated dedicated quantization scale factor S_${cIdx} = ${scaleFixed} for channel ${cIdx}.`,
      { cIdx, maxAbs, scale: scaleFixed, phase: "CALC_CHANNEL_SCALE" },
      channel[0],
      0,
      scaleFixed,
    );

    channelScalesBuffer.push(scaleFixed);

    addStep(
      7,
      `Append Scale S_${cIdx} = ${scaleFixed} to channel_scales`,
      `Banked channel ${cIdx} scale factor ${scaleFixed} into channel_scales buffer.`,
      { cIdx, scale: scaleFixed, scalesCount: channelScalesBuffer.length },
      channel[0],
      0,
      scaleFixed,
    );

    const qChannel: number[] = [];

    channel.forEach((x, wIdx) => {
      const scaledUnrounded = x / scale;
      const rounded = Math.round(scaledUnrounded);
      const clamped = Math.max(-128, Math.min(127, rounded));

      addStep(
        8,
        `Quantize Channel ${cIdx} Weight [${wIdx}]: x = ${x} -> q = ${clamped}`,
        `Divided weight ${x} by channel scale S_${cIdx} (${scaleFixed}), rounded to ${rounded}, and clamped to INT8 bound ${clamped}.`,
        { cIdx, wIdx, x, scale: scaleFixed, rounded, clamped, phase: "QUANTIZE_WEIGHT" },
        x,
        clamped,
        scaleFixed,
      );

      qChannel.push(clamped);
    });

    addStep(
      8,
      `Complete Channel ${cIdx} INT8 Vector: q_channel = [${qChannel.join(", ")}]`,
      `Quantized channel ${cIdx} weights by S_${cIdx} (${scaleFixed}): [${channel.join(", ")}] -> INT8 [${qChannel.join(", ")}].`,
      { cIdx, scale: scaleFixed, qChannel: JSON.stringify(qChannel) },
      channel[0],
      qChannel[0],
      scaleFixed,
    );

    quantizedMatrixBuffer.push(qChannel);

    addStep(
      9,
      `Append q_channel to quantized_matrix`,
      `Banked INT8 channel vector [${qChannel.join(", ")}] into quantized_matrix result.`,
      { cIdx, matrixRowsCount: quantizedMatrixBuffer.length },
      channel[0],
      qChannel[0],
      scaleFixed,
    );
  });

  // Step 10: Return result
  addStep(
    10,
    "Return Per-Channel Scales & Quantized Matrix `(channel_scales, quantized_matrix)`",
    `Per-channel symmetric quantization complete across ${matrix.length} channels. Channel scales: [${channelScalesBuffer.map((s) => s.toFixed(4)).join(", ")}].`,
    { channels: matrix.length },
    matrix[0][0],
    quantizedMatrixBuffer[0][0],
    channelScalesBuffer[0],
  );

  addStep(
    10,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    matrix[0][0],
    quantizedMatrixBuffer[0][0],
    channelScalesBuffer[0],
  );

  return steps;
};

const PERCHANNELSYMMETRICQUANTIZER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "scale = max_abs / 255.0",
    "channel_scales.append(max_abs)",
    "q_channel = [int(x) for x in channel]",
    "return quantized_matrix",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting 2D weight matrix (channels x weights)." },
    { line: 4, hint: "Iterate through each output channel row in weight matrix." },
    { line: 5, hint: "Find peak absolute weight magnitude max_abs within current channel." },
    { line: 6, hint: "Compute dedicated per-channel scale factor scale = max_abs / 127.0." },
    { line: 8, hint: "Quantize channel weights into INT8 range [-128, 127] using channel scale." },
  ],
  lineExplanations: {
    1: "Declares function signature per_channel_symmetric_quantizer accepting 2D weight matrix `weight_matrix`.",
    2: "Initializes empty accumulator list `channel_scales` to store per-channel float scale factors.",
    3: "Initializes empty accumulator list `quantized_matrix` to store INT8 quantized weight channels.",
    4: "Iterates through each individual output channel row `channel` in `weight_matrix`.",
    5: "Computes peak absolute magnitude max_abs = max(|x|) across weights in current channel.",
    6: "Calculates dedicated per-channel scale factor scale = max_abs / 127.0.",
    7: "Appends channel scale factor `scale` to `channel_scales` list.",
    8: "Quantizes channel weights into 8-bit signed integers q_channel clamped to [-128, 127].",
    9: "Appends quantized INT8 channel row `q_channel` to output `quantized_matrix`.",
    10: "Returns tuple (channel_scales, quantized_matrix) containing per-channel scale vector and INT8 matrix.",
  },
};

export const perChannelSymmetricQuantizer: AlgorithmDefinition<perChannelSymmetricQuantizerInput> = {
  id: "per-channel-symmetric-quantizer",
  title: "Per Channel Symmetric Quantizer",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Per-Channel Symmetric Quantizer

Per-Channel Symmetric Weight Quantization computes an independent scale factor $S_c$ for each individual output channel $c$ (row in a weight matrix $\\mathbf{W} \\in \\mathbb{R}^{C_{\\text{out}} \\times C_{\\text{in}}}$).

#### Why It Exists & What It Solves
In per-tensor quantization, a single global scale factor $S = \\frac{\\max(|W|)}{127}$ scales the entire weight matrix. If a single channel contains large outlier weights while adjacent channels have tiny weights, per-tensor scaling squashes the precision of the tiny channels into 0 or 1 integer bins. Per-channel quantization computes dedicated scales $S_c$, ensuring each channel utilizes the full $[-128, 127]$ INT8 dynamic range.

#### Step-by-Step Mechanism
1. **Per-Channel Peak Magnitude**: For output channel $c$, find peak magnitude:
   $$\\alpha_c = \\max_{j} |W_{c,j}|$$
2. **Per-Channel Scale Derivation**: Calculate dedicated scale factor $S_c$:
   $$S_c = \\frac{\\alpha_c}{127.0}$$
3. **Channel Weight Quantization**: Quantize weight entries into INT8 integers:
   $$Q_{c,j} = \\text{clamp}\\left(\\text{round}\\left(\\frac{W_{c,j}}{S_c}\\right), -128, 127\\right)$$
4. **Hardware GEMM De-quantization**: During INT8 matrix multiplication, output cells are scaled per-channel:
   $$Y_{i,c} = \\left(\\sum_{k} X_{i,k} \\cdot Q_{c,k}\\right) \\cdot (S_{X} \\cdot S_c)$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(C_{\\text{out}} \\cdot C_{\\text{in}})$ linear time over all matrix elements.
- **Space Complexity**: $\\mathcal{O}(C_{\\text{out}} + C_{\\text{out}} \\cdot C_{\\text{in}})$ for channel scale vector and INT8 matrix.
- **Trade-Off**: Eliminates precision loss for quiet channels in wide weight matrices at the cost of storing a 1D vector of $C_{\\text{out}}$ scale factors.`,
  constraints: ["1 <= weightMatrix.length <= 1000", "-10^9 <= weightMatrix[i][j] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "3-Channel Weight Matrix Quantization",
      inputDisplay: "W = [[1.2, -3.4, 5.5], [0.5, -1.5, 2.5], [10.0, -20.0, 15.0]]",
      outputDisplay: "S_c = [0.0433, 0.0197, 0.1575], Q = [[28, -79, 127], [25, -76, 127], [63, -127, 95]]",
      input: {
        weightMatrix: [
          [1.2, -3.4, 5.5],
          [0.5, -1.5, 2.5],
          [10.0, -20.0, 15.0],
        ],
      },
      output: "scales = [0.0433, 0.0197, 0.1575], Q = [[28, -79, 127], [25, -76, 127], [63, -127, 95]]",
      explanation: "Computes independent scale factor S_c for each channel row, preserving INT8 dynamic range for every channel.",
    },
    {
      kind: "complex",
      title: "Asymmetric Channel Magnitudes",
      inputDisplay: "W = [[0.1, -0.2], [100.0, -50.0]]",
      outputDisplay: "S_c = [0.00157, 0.7874]",
      input: {
        weightMatrix: [
          [0.1, -0.2],
          [100.0, -50.0],
        ],
      },
      output: "scales = [0.00157, 0.7874], Q = [[64, -127], [127, -63]]",
      explanation: "Evaluates per-channel scaling across two channels with 1000x magnitude variance.",
    },
    {
      kind: "negative",
      title: "Zero Weight Channel Edge Case",
      inputDisplay: "W = [[0.0, 0.0], [5.0, -5.0]]",
      outputDisplay: "S_c = [1.0, 0.03937]",
      input: {
        weightMatrix: [
          [0.0, 0.0],
          [5.0, -5.0],
        ],
      },
      output: "scales = [1.0, 0.03937], Q = [[0, 0], [127, -127]]",
      explanation: "Handles zero weight channel with fallback scale factor S_c = 1.0.",
    },
  ],
  code: PERCHANNELSYMMETRICQUANTIZER_CODE,
  timeComplexity: { best: "O(C_out * C_in)", average: "O(C_out * C_in)", worst: "O(C_out * C_in)" },
  spaceComplexity: "O(C_out + C_out * C_in)",
  complexityAnalysis: {
    time: "Linear time O(C_out * C_in) pass across all weight elements.",
    space: "Requires linear space for output scale vector and quantized INT8 matrix.",
  },
  topicGuide: {
    overview:
      "Per-Channel Weight Quantization is standard for Convolutional layers (`Conv2d`) and Linear layers in PyTorch (`torch.ao.quantization`) and ONNX Runtime to prevent accuracy loss when channels have widely varying weight magnitudes.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for channel $c$, $\\alpha_c = \\max_j |W_{c,j}|$. Scale $S_c = \\alpha_c / 127.0$. Quantized weights $Q_{c,j} = \\text{clamp}(\\text{round}(W_{c,j} / S_c), -128, 127)$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "TensorRT and ONNX Runtime apply per-channel quantization to weight tensors to maintain accuracy in large language models (e.g. LLaMA, Mistral).",
      },
      {
        heading: "Implementation Details & Row Scans",
        body: "Implementation loops through matrix rows, finds maximum magnitude per row, computes dedicated scale, and quantizes row elements.",
      },
      {
        heading: "Edge Case Analysis & Zero Weight Rows",
        body: "Edge cases include zero-weight rows where $\\alpha_c = 0$, enforcing scale fallback $S_c = 1.0$.",
      },
    ],
    keyTerms: [
      {
        term: "Per-Channel Quantization",
        definition: "Assigning dedicated scale factors S_c to individual output channel weight vectors.",
      },
      {
        term: "Per-Tensor Quantization",
        definition: "Assigning a single global scale factor to an entire weight matrix.",
      },
      {
        term: "Outlier Isolation",
        definition: "Preventing outlier weights in one channel from squashing the precision of adjacent channels.",
      },
    ],
  },
  trivia: PERCHANNELSYMMETRICQUANTIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
  generateSteps: generatePerChannelSymmetricQuantizerSteps,
};
