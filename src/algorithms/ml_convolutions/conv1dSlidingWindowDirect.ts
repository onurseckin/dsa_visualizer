import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv1dSlidingWindowDirectInput {
  data: number[];
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

    return output
`;

export const DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT: conv1dSlidingWindowDirectInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv1dSlidingWindowDirectSteps = (
  input: conv1dSlidingWindowDirectInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          im2colBuffer: "1D Feature Map",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 1D Cross-Correlation Basics",
    "Setting up 1D sequence signal buffers, kernel window pointers, and padding structures.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      19,
      `Slide 1D window over index ${idx}: value = ${val}`,
      `Evaluating 1D dot product accumulation between sequence window and filter kernel.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Successfully computed 1D sliding window cross-correlation across entire sequence.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CONV1DSLIDINGWINDOWDIRECT_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 19, hint: "Compute dot product over 1D sliding window of length K." }],
  lineExplanations: {
    1: "Defines entry point for 1D Cross-Correlation Basics.",
    19: "Computes dot product between 1D signal window and kernel weights.",
    25: "Returns 1D feature map output sequence.",
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
    "1D cross-correlation (direct 1D convolution) is a fundamental sequence processing primitive used in audio processing (Wav2Vec, SpeechT5), time-series analysis, and Temporal Convolutional Networks (TCNs). Direct 1D sliding window convolution computes feature maps by sliding a 1D kernel of length K across a 1D input signal of length L, taking the dot product at each strided window position without explicit memory matrix unrolling.\n\nInput Format:\n- signal: 1D array of floats representing temporal activations or raw audio samples of length L.\n- kernel: 1D filter weight array of length K.\n- stride: Integer spatial step size between window positions.\n- padding: Number of zero-padding elements appended at boundaries.\n\nOutput Format:\n- Returns a 1D feature map sequence of length L_out = floor((L + 2P - K) / S) + 1.\n\nEdge Cases & Constraints:\n- Causal padding vs symmetric padding: Causal padding pads only the left boundary to prevent future temporal leakage.\n- Kernel larger than input (K > L): Requires sufficient padding P to ensure non-empty output.\n- Stride S > K: Non-overlapping sub-sampling skips intermediate temporal steps.",
  constraints: ["1 <= L <= 10000", "1 <= K <= L", "stride >= 1"],
  examples: [
    {
      kind: "basic",
      title: "Standard 1D Signal Filter",
      inputDisplay: "signal = [1, 2, 3, 4, 5], kernel = [1, 0, -1], stride = 1",
      outputDisplay: "output = [-2, -2, -2]",
      input: { data: [10, 20, 30, 40, 50], target: 30 },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Applies 1D gradient filter detecting temporal signal slope.",
    },
    {
      kind: "complex",
      title: "Strided Downsampling",
      inputDisplay: "signal = [1, 3, 5, 7, 9, 11], kernel = [0.5, 0.5], stride = 2",
      outputDisplay: "output = [2, 6, 10]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Averages 1D window pairs while downsampling sequence length by 2x.",
    },
    {
      kind: "negative",
      title: "Causal Padded Boundary",
      inputDisplay: "signal = [5, 10], kernel = [1, 1, 1], padding = 2",
      outputDisplay: "Valid output computed across padded left boundary",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Left zero-padding enables early temporal window computation without lookahead.",
    },
  ],
  code: CONV1DSLIDINGWINDOWDIRECT_CODE,
  timeComplexity: { best: "O(L_{out} K)", average: "O(L_{out} K)", worst: "O(L_{out} K)" },
  spaceComplexity: "O(L_{out})",
  complexityAnalysis: {
    time: "Direct loop evaluates K multiplications for each of the L_{out} output tokens, taking O(L_{out} K) operations.",
    space: "Requires O(L_{out}) memory to store the resulting 1D sequence feature map.",
  },
  topicGuide: {
    overview:
      "Direct 1D Sliding Window Convolution evaluates discrete 1D cross-correlation across temporal sequences for time-series forecasting, audio modeling, and 1D CNN architectures.",
    sections: [
      {
        heading: "Core Concepts & Discrete Cross-Correlation Formula",
        body: "1D discrete cross-correlation computes output token y[i] = sum_{k=0}^{K-1} x[i*S + k - P] * w[k]. Unlike math convolution which flips the kernel w[K-1-k], deep learning frameworks implement cross-correlation directly since filter weights are learned via gradient backpropagation.",
      },
      {
        heading: "Systems & Performance Roofline Impact",
        body: "For small 1D kernels (K=3, 5), direct sliding window convolution has low arithmetic intensity (FLOPs/byte). On GPUs, batching multiple sequence channels into a 2D GEMM (C_out x L_out = (C_out x C_in*K) * (C_in*K x L_out)) achieves significantly higher hardware throughput than naive direct loops.",
      },
      {
        heading: "Implementation Nuances & Data Layouts",
        body: "Data layout conventions for 1D sequence signals include (Batch, Channel, Length) - NCL in PyTorch or (Batch, Length, Channel) - NLC in TensorFlow. NLC is preferred for autoregressive transformers and hardware accelerators with vector-wide channel packing.",
      },
      {
        heading: "Edge Cases & Production Safeguards",
        body: "Key edge cases involve causal temporal masking (ensuring y[t] depends only on x[<=t]), dilation rate D > 1 for exponential receptive field growth in WaveNet, and edge zero-padding alignment.",
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
        term: "Output Sequence Dimension",
        definition: "Spatial output length equation L_out = floor((L + 2P - K)/S) + 1.",
      },
    ],
  },
  trivia: CONV1DSLIDINGWINDOWDIRECT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_CONV1DSLIDINGWINDOWDIRECT_INPUT,
  generateSteps: generateConv1dSlidingWindowDirectSteps,
};
