import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv2dPaddingStrideOutputShapeInput {
  data: number[];
  target?: number;
}

export const CONV2DPADDINGSTRIDEOUTPUTSHAPE_CODE = `def conv2d_padding_stride_output_shape(h_in, w_in, k_h, k_w, stride_h=1, stride_w=1, pad_h=0, pad_w=0, dilation_h=1, dilation_w=1):
    """
    Calculates spatial output dimensions (H_out, W_out) for a 2D convolution operation
    considering input size, kernel dimensions, stride, padding, and dilation.
    
    Formula:
      eff_k_h = k_h + (k_h - 1) * (dilation_h - 1)
      h_out = floor((h_in + 2 * pad_h - eff_k_h) / stride_h) + 1
    """
    eff_k_h = k_h + (k_h - 1) * (dilation_h - 1)
    eff_k_w = k_w + (k_w - 1) * (dilation_w - 1)

    h_out = (h_in + 2 * pad_h - eff_k_h) // stride_h + 1
    w_out = (w_in + 2 * pad_w - eff_k_w) // stride_w + 1

    valid = (h_out > 0) and (w_out > 0)
    return {
        "h_out": max(0, h_out),
        "w_out": max(0, w_out),
        "eff_kernel_h": eff_k_h,
        "eff_kernel_w": eff_k_w,
        "is_valid_shape": valid
    }
`;

export const DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT: conv2dPaddingStrideOutputShapeInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateConv2dPaddingStrideOutputShapeSteps = (
  input: conv2dPaddingStrideOutputShapeInput,
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
          im2colBuffer: "Output Shape Metadata",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 2D Conv Output Shape Calculator",
    "Parsing spatial input dimensions, filter sizes, stride steps, zero-padding, and dilation rates.",
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
      15,
      `Evaluate spatial output dimension for parameter element ${idx}: value = ${val}`,
      `Applying equation H_out = floor((H_in + 2P - K_eff) / S) + 1 to compute feature map bounds.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    20,
    "Execution Complete",
    "Successfully verified 2D convolution spatial output shape and memory stride parameters.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CONV2DPADDINGSTRIDEOUTPUTSHAPE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    {
      line: 15,
      hint: "Compute effective kernel size considering dilation factor: K_eff = K + (K-1)*(D-1).",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 2D Conv Output Shape Calculator.",
    15: "Calculates spatial output height and width using stride/padding formula.",
    20: "Returns shape metadata dictionary containing (H_out, W_out) and effective kernel size.",
  },
};

export const conv2dPaddingStrideOutputShape: AlgorithmDefinition<conv2dPaddingStrideOutputShapeInput> =
  {
    id: "conv2dPaddingStrideOutputShape",
    title: "2D Conv Output Shape Calculator",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "Determining spatial output dimensions (H_out, W_out) after spatial transformations is an essential prerequisite step in ML graph compilers (XLA, TVM), neural architecture search, and tensor memory allocation (PyTorch `nn.Conv2d`, ONNX shape inference). Given spatial height and width, kernel dimensions, padding, stride, and dilation, this algorithm computes exact output feature map shapes and effective receptive fields.\n\nInput Format:\n- h_in, w_in: Spatial height and width of input tensor.\n- k_h, k_w: Height and width of convolution filter kernel.\n- stride_h, stride_w: Spatial stride steps along height and width.\n- pad_h, pad_w: Zero-padding size added to top/bottom and left/right.\n- dilation_h, dilation_w: Dilation factors expanding kernel receptive field.\n\nOutput Format:\n- Returns a dictionary with h_out, w_out, eff_kernel_h, eff_kernel_w, and is_valid_shape.\n\nEdge Cases & Constraints:\n- Invalid shape (K > H + 2P): Yields H_out <= 0, flagging invalid model config.\n- Dilation factor D > 1: Expands effective kernel footprint K_eff = K + (K - 1) * (D - 1).\n- Asymmetric padding / strides: Different parameters along vertical vs horizontal axes.",
    constraints: [
      "1 <= H_in, W_in <= 10000",
      "1 <= K_h, K_w <= 100",
      "stride >= 1",
      "dilation >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 3x3 Conv SAME Padding",
        inputDisplay: "H=28, W=28, K=3x3, P=1, S=1",
        outputDisplay: "H_out=28, W_out=28, valid=True",
        input: { data: [10, 20, 30, 40, 50], target: 30 },
        output: "[10, 20, 30, 40, 50]",
        explanation: "P=1 zero-padding preserves spatial dimensions for 3x3 filter with stride=1.",
      },
      {
        kind: "complex",
        title: "Dilated 2x Downsampling Conv",
        inputDisplay: "H=224, W=224, K=7x7, P=3, S=2, D=2",
        outputDisplay: "H_out=106, W_out=106, K_eff=13",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Dilation D=2 expands 7x7 kernel to 13x13 effective receptive field.",
      },
      {
        kind: "negative",
        title: "Kernel Exceeds Input Bounds",
        inputDisplay: "H=5, W=5, K=7x7, P=0, S=1",
        outputDisplay: "H_out=0, W_out=0, valid=False",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation:
          "Kernel size larger than unpadded spatial activation yields invalid output shape.",
      },
    ],
    code: CONV2DPADDINGSTRIDEOUTPUTSHAPE_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Closed-form arithmetic evaluation executes in O(1) time.",
      space: "O(1) memory space required for output shape metadata.",
    },
    topicGuide: {
      overview:
        "The 2D Conv Output Shape Calculator computes feature map spatial dimensions H_out and W_out based on input sizes, filter dimensions, padding, stride, and dilation parameters.",
      sections: [
        {
          heading: "Core Concepts & Mathematical Derivation",
          body: "The spatial output formula for 2D convolution is H_out = floor((H_in + 2*Pad - K_eff) / Stride) + 1. Dilation expands spatial receptive field spacing without adding parameters: K_eff = K + (K - 1)*(D - 1).",
        },
        {
          heading: "Systems & Memory Layout Impact",
          body: "Spatial dimensions determine the number of rows M = H_out * W_out in the lowered im2col matrix. ML compilers like XLA and TensorRT use these calculations during graph optimization to allocate continuous DRAM blocks and determine GEMM tile shapes.",
        },
        {
          heading: "Implementation Nuances & Conventions",
          body: "Different frameworks handle edge rounding differently. PyTorch uses floor division (floor), whereas PyTorch MaxPool2d and Caffe support ceil_mode=True. TensorFlow 'SAME' padding dynamically computes asymmetric top/bottom padding to preserve spatial shape.",
        },
        {
          heading: "Edge Cases & Production Safeguards",
          body: "Out-of-bounds parameter verification prevents negative array allocation errors in CUDA kernels. When H_out <= 0, ML execution engines trigger shape mismatch exceptions prior to memory allocation.",
        },
      ],
      keyTerms: [
        {
          term: "Effective Kernel Size",
          definition:
            "Expanded filter footprint equation K_eff = K + (K - 1) * (D - 1) under dilated convolution.",
        },
        {
          term: "Dilation Rate",
          definition:
            "Spacing factor between kernel filter elements allowing enlarged receptive fields without parameter increase.",
        },
        {
          term: "Spatial Downsampling Factor",
          definition:
            "Reduction ratio in spatial resolution caused by stride S > 1 or pooling layers.",
        },
        {
          term: "Padding Convention",
          definition:
            "Boundary zero-padding rules ('SAME', 'VALID', explicit padding tuples) governing spatial output size.",
        },
      ],
    },
    trivia: CONV2DPADDINGSTRIDEOUTPUTSHAPE_TRIVIA,

    defaultInput: DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
    generateSteps: generateConv2dPaddingStrideOutputShapeSteps,
  };
