import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv1dSlidingWindowDirectInput {
  signal?: number[];
  kernel?: number[];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const CONV1DSLIDINGWINDOWDIRECT_CODE = `def conv1d_sliding_window_direct(signal, kernel, stride=1, padding=0):
    """
    Computes 1D direct sliding window cross-correlation/convolution on sequence data.
    
    signal: 1D input sequence array of length L.
    kernel: 1D filter weights array of length K.
    stride: step length between window positions.
    padding: zero-padding applied to signal endpoints.
    """
    l_in = len(signal)
    k_len = len(kernel)

    # Apply boundary zero-padding
    padded = [0.0] * padding + [float(x) for x in signal] + [0.0] * padding
    l_pad = len(padded)

    l_out = (l_pad - k_len) // stride + 1
    output = [0.0] * l_out

    for i in range(l_out):
        acc_sum = 0.0
        start_idx = i * stride
        for k in range(k_len):
            acc_sum += padded[start_idx + k] * kernel[k]
        output[i] = acc_sum

    return output`;

export const DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT: conv1dSlidingWindowDirectInput = {
  signal: [10, 20, 30, 40, 50],
  kernel: [1, 0, -1],
  stride: 1,
  padding: 1,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv1dSlidingWindowDirectSteps = (
  input: conv1dSlidingWindowDirectInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const signal = input.signal || input.data || [10, 20, 30, 40, 50];
  const kernel = input.kernel || [1, 0, -1];
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 1;

  const l_in = signal.length;
  const k_len = kernel.length;

  const padded: number[] = [
    ...Array(padding).fill(0),
    ...signal,
    ...Array(padding).fill(0),
  ];
  const l_pad = padded.length;
  const l_out = Math.floor((l_pad - k_len) / stride) + 1;
  const output: number[] = Array(l_out).fill(0);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customPointers?: Record<number, string[]>,
    activeIndices?: number[],
  ) => {
    const elements: ArrayElement[] = padded.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices?.includes(idx)) {
        state = "active";
      } else if (idx < padding || idx >= l_in + padding) {
        state = "visited";
      }
      return {
        id: `padded-${idx}`,
        value: val,
        label: idx < padding || idx >= l_in + padding ? `P:${val}` : `X[${idx - padding}]`,
        state,
        pointers: customPointers?.[idx],
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        customState: {
          "Signal Input": `[${signal.join(", ")}]`,
          "Kernel Filter": `[${kernel.join(", ")}]`,
          "Padded Sequence": `[${padded.join(", ")}]`,
          "Feature Output": `[${output.map((v) => v.toFixed(1)).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "1D Cross-Correlation Basics Function Entry",
    `Starting 1D direct sliding window cross-correlation with signal length L=${l_in}, kernel length K=${k_len}, stride S=${stride}, padding P=${padding}.`,
    { l_in, k_len, stride, padding },
  );

  // Step 2: Signal length
  addStep(
    10,
    "Measure Input Signal Length",
    `Input sequence signal has l_in = ${l_in} elements.`,
    { l_in },
  );

  // Step 3: Kernel length
  addStep(
    11,
    "Measure Filter Kernel Length",
    `Filter kernel weights array has k_len = ${k_len} elements.`,
    { l_in, k_len },
  );

  // Step 4: Apply padding
  addStep(
    14,
    "Apply Boundary Zero-Padding",
    `Appended ${padding} zero(s) to both boundaries, constructing padded sequence of length ${l_pad}.`,
    { padding, l_pad },
  );

  // Step 5: Padded length
  addStep(
    15,
    "Store Padded Sequence Length",
    `Padded array length l_pad = ${l_pad}.`,
    { l_pad },
  );

  // Step 6: Compute l_out
  addStep(
    17,
    "Calculate Output Sequence Dimension",
    `Computed output length l_out = (${l_pad} - ${k_len}) // ${stride} + 1 = ${l_out}.`,
    { l_out, l_pad, k_len, stride },
  );

  // Step 7: Initialize output
  addStep(
    18,
    "Initialize Output Feature Map Buffer",
    `Created output array of size l_out = ${l_out} initialized to 0.0.`,
    { l_out },
  );

  // Outer loop over output elements
  for (let i = 0; i < l_out; i++) {
    const start_idx = i * stride;

    addStep(
      20,
      `Outer Loop: Output Index i = ${i}`,
      `Evaluating sliding window position i = ${i} of ${l_out - 1}.`,
      { i, l_out },
    );

    let acc_sum = 0.0;
    addStep(
      21,
      `Reset Accumulator for i = ${i}`,
      `Initialized acc_sum = 0.0 for window starting at padded index ${start_idx}.`,
      { i, acc_sum, start_idx },
    );

    addStep(
      22,
      `Set Window Start Index`,
      `Computed start_idx = i * stride = ${i} * ${stride} = ${start_idx}.`,
      { i, start_idx, stride },
    );

    for (let k = 0; k < k_len; k++) {
      const padded_idx = start_idx + k;
      const sig_val = padded[padded_idx];
      const ker_val = kernel[k];
      const prod = sig_val * ker_val;

      addStep(
        23,
        `Inner Loop: Kernel Tap k = ${k}`,
        `Inspecting kernel position k = ${k} (weight = ${ker_val}) against padded signal index ${padded_idx} (value = ${sig_val}).`,
        { i, k, padded_idx, sig_val, ker_val },
        { [padded_idx]: [`k=${k}`, `w=${ker_val}`] },
        [padded_idx],
      );

      acc_sum += prod;
      addStep(
        24,
        `Accumulate Product: ${sig_val} * ${ker_val} = ${prod}`,
        `Updated acc_sum = ${acc_sum.toFixed(1)} after adding term at kernel index ${k}.`,
        { i, k, padded_idx, prod, acc_sum },
        { [padded_idx]: [`acc=${acc_sum.toFixed(1)}`] },
        [padded_idx],
      );
    }

    output[i] = acc_sum;
    addStep(
      25,
      `Write Output Token output[${i}] = ${acc_sum.toFixed(1)}`,
      `Stored dot product result ${acc_sum.toFixed(1)} into feature map at position ${i}.`,
      { i, "output[i]": acc_sum },
    );
  }

  // Step final: Return output
  addStep(
    27,
    "Execution Complete",
    `Successfully computed 1D sliding window cross-correlation across sequence. Final output: [${output.map((v) => v.toFixed(1)).join(", ")}].`,
    { completed: true, l_out },
  );

  return steps;
};

const CONV1DSLIDINGWINDOWDIRECT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 16, 19, 26],
  distractors: [
    "output[i] = sum(signal[i:i+k_len] * kernel)",
    "padded = signal + [0.0] * padding",
    "l_out = (l_in - k_len) // stride",
    "acc_sum *= padded[start_idx + k]",
  ],
  hints: [
    { line: 17, hint: "Spatial output dimension formula: (l_pad - k_len) // stride + 1." },
    { line: 22, hint: "Window start index in padded signal is i * stride." },
    { line: 24, hint: "Multiply padded sample at start_idx + k with kernel weight at index k." },
  ],
  lineExplanations: {
    1: "Defines entry point for 1D sliding window cross-correlation algorithm function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes 1D direct sliding window cross-correlation/convolution sequence processing.",
    4: "Docstring section break.",
    5: "Docstring parameter definition for input sequence signal.",
    6: "Docstring parameter definition for filter weight array kernel.",
    7: "Docstring parameter definition for spatial step stride.",
    8: "Docstring parameter definition for boundary zero-padding.",
    9: "Docstring closing delimiter tag.",
    10: "Measures length l_in of unpadded input sequence signal.",
    11: "Measures length k_len of filter weight kernel.",
    12: "Blank line separating length measurements from padding section.",
    13: "Comment explaining zero-padding application to signal boundaries.",
    14: "Constructs padded array by prepending and appending zero-padding elements to signal.",
    15: "Measures total length l_pad of zero-padded sequence array.",
    16: "Blank line before output dimension calculation.",
    17: "Calculates spatial output sequence length l_out using strided dimension formula.",
    18: "Initializes output feature map buffer of size l_out filled with zero floats.",
    19: "Blank line separating output initialization from sliding window loop.",
    20: "Iterates over each output feature map position i from 0 to l_out - 1.",
    21: "Resets accumulation sum acc_sum to 0.0 for current output window position i.",
    22: "Calculates start index start_idx in padded signal array corresponding to window i.",
    23: "Iterates over each filter kernel tap index k from 0 to k_len - 1.",
    24: "Multiplies padded signal sample with kernel weight and accumulates into acc_sum.",
    25: "Stores completed dot product accumulation acc_sum into output feature map at index i.",
    26: "Blank line separating sliding window loop from return statement.",
    27: "Returns computed 1D feature map output sequence array.",
  },
};

export const conv1dSlidingWindowDirect: AlgorithmDefinition<conv1dSlidingWindowDirectInput> = {
  id: "conv1dSlidingWindowDirect",
  title: "1D Cross-Correlation Basics",
  category: "ml_convolutions",
  categories: ["ml_convolutions", "ml_gemm_roofline"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_convolutions",
  description:
    "**1D cross-correlation** (direct 1D convolution) is a fundamental temporal sequence processing primitive used in audio processing (Wav2Vec 2.0, SpeechT5), time-series analysis, and Temporal Convolutional Networks (TCNs). Direct 1D sliding window convolution computes feature maps by sliding a 1D filter kernel of length $K$ across a 1D input sequence signal of length $L$, computing the inner product at each strided window position without explicit memory matrix unrolling.\n\n### Why It Exists\nIn temporal sequence modeling, local feature extraction requires aggregating contextual information within small receptive fields. While transformers utilize global attention $O(N^2)$, 1D convolutions provide focused $O(N \\cdot K)$ linear temporal aggregation with translation invariance.\n\n### Mathematical Formulation\nGiven an input sequence $x \\in \\mathbb{R}^L$, filter weights $w \\in \\mathbb{R}^K$, stride $S$, and padding $P$, the spatial output sequence dimension $L_{out}$ and feature map values $y[i]$ are defined as:\n\n$$L_{out} = \\left\\lfloor \\frac{L + 2P - K}{S} \\right\\rfloor + 1$$\n\n$$y[i] = \\sum_{k=0}^{K-1} \\text{padded}[i \\cdot S + k] \\cdot w[k] \\quad \\text{for } i \\in [0, L_{out}-1]$$\n\n### Step-by-Step Intuition\n1. **Zero-Padding**: Extend the input sequence at both endpoints with $P$ zeros to preserve spatial boundary dimensions.\n2. **Window Alignment**: Position the filter kernel at starting index $\\text{start\\_idx} = i \\cdot S$.\n3. **Dot Product Accumulation**: Multiply corresponding elements of the padded signal and filter kernel over $K$ taps, accumulating into a scalar sum.\n4. **Feature Writing**: Store the scalar sum into $y[i]$ and advance the window position by stride $S$.\n\n### Key Trade-Offs & Hardware Execution\n- **Arithmetic Intensity**: Naive 1D sliding window loops exhibit low operational intensity (2 FLOPs per memory read). High-performance deep learning libraries lower 1D sequence batches into 2D matrix multiplication (`im2col` or `as_strided`) to leverage hardware Tensor Cores.\n- **Padding Strategies**: Causal padding pads only the left boundary to enforce non-lookahead causality in real-time streaming audio models.",
  constraints: ["1 <= L <= 10000", "1 <= K <= L", "stride >= 1", "padding >= 0"],
  examples: [
    {
      kind: "basic",
      title: "Standard 1D Signal Filter",
      inputDisplay: "signal = [10, 20, 30, 40, 50], kernel = [1, 0, -1], stride = 1, padding = 1",
      outputDisplay: "output = [20.0, 20.0, 20.0, 20.0, -40.0]",
      input: { signal: [10, 20, 30, 40, 50], kernel: [1, 0, -1], stride: 1, padding: 1 },
      output: "[20.0, 20.0, 20.0, 20.0, -40.0]",
      explanation: "Applies 1D gradient filter detecting temporal signal slope.",
    },
    {
      kind: "complex",
      title: "Strided Downsampling",
      inputDisplay: "signal = [1, 3, 5, 7, 9, 11], kernel = [0.5, 0.5], stride = 2, padding = 0",
      outputDisplay: "output = [2.0, 6.0, 10.0]",
      input: { signal: [1, 3, 5, 7, 9, 11], kernel: [0.5, 0.5], stride: 2, padding: 0 },
      output: "[2.0, 6.0, 10.0]",
      explanation: "Averages 1D window pairs while downsampling sequence length by 2x.",
    },
  ],
  code: CONV1DSLIDINGWINDOWDIRECT_CODE,
  timeComplexity: { best: "O(L_{out} \\cdot K)", average: "O(L_{out} \\cdot K)", worst: "O(L_{out} \\cdot K)" },
  spaceComplexity: "O(L_{out} + P)",
  complexityAnalysis: {
    time: "Direct nested loops evaluate $K$ multiplications for each of the $L_{out}$ output tokens, taking $O(L_{out} \\cdot K)$ total operations.",
    space: "Requires $O(L_{out})$ memory to store the output feature map and $O(L + 2P)$ for zero-padded sequence buffers.",
  },
  topicGuide: {
    overview:
      "**Direct 1D Sliding Window Convolution** evaluates discrete 1D cross-correlation across temporal sequence data for speech processing, time-series forecasting, and 1D temporal convolutional networks (TCNs).",
    sections: [
      {
        heading: "1. Core Concept & Mathematical Formulation",
        body: "1D discrete cross-correlation computes output token:\n$$y[i] = \\sum_{k=0}^{K-1} \\text{padded}[i \\cdot S + k] \\cdot w[k]$$\nUnlike mathematical convolution which flips the kernel filter $w[K-1-k]$, deep learning engines execute direct cross-correlation directly since filter weights are learned via gradient descent.",
      },
      {
        heading: "2. Systems & Performance Roofline Impact",
        body: "For small 1D kernels ($K=3, 5$), direct sliding window convolution has low arithmetic intensity (FLOPs/byte). On GPUs, batching multiple sequence channels into a 2D GEMM:\n$$(C_{out} \\times L_{out}) = (C_{out} \\times C_{in} \\cdot K) \\cdot (C_{in} \\cdot K \\times L_{out})$$\nachieves significantly higher hardware memory bandwidth efficiency.",
      },
      {
        heading: "3. Implementation Nuances & Data Layouts",
        body: "Data layout conventions for 1D sequence signals include $(N, C, L)$ (PyTorch `NCL`) or $(N, L, C)$ (TensorFlow `NLC`). `NLC` is preferred for autoregressive transformers and hardware accelerators with vector-wide channel packing.",
      },
      {
        heading: "4. Edge Case Analysis & Production Safeguards",
        body: "Key edge cases involve causal temporal masking (ensuring $y[t]$ depends only on $x[\\le t]$), dilation rate $D > 1$ for exponential receptive field growth in WaveNet, and boundary zero-padding alignment.",
      },
    ],
    keyTerms: [
      {
        term: "1D Cross-Correlation",
        definition:
          "Discrete sequence operation computing inner product between 1D filter kernel and sliding temporal windows.",
      },
      {
        term: "Causal Padding",
        definition:
          "Asymmetric padding applied exclusively to sequence start to prevent future temporal information leakage.",
      },
      {
        term: "Temporal Convolutional Network (TCN)",
        definition:
          "Deep architecture utilizing 1D dilated causal convolutions for sequential modeling tasks.",
      },
      {
        term: "Spatial Output Dimension",
        definition: "Spatial output length equation $L_{out} = \\lfloor (L + 2P - K)/S \\rfloor + 1$.",
      },
    ],
  },
  trivia: CONV1DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv1dSlidingWindowDirectSteps,
};
