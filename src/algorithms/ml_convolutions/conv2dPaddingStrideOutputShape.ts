import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface conv2dPaddingStrideOutputShapeInput {
  h_in?: number;
  w_in?: number;
  k_h?: number;
  k_w?: number;
  stride_h?: number;
  stride_w?: number;
  pad_h?: number;
  pad_w?: number;
  dilation_h?: number;
  dilation_w?: number;
  data?: number[];
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
    }`;

export const DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT: conv2dPaddingStrideOutputShapeInput = {
  h_in: 28,
  w_in: 28,
  k_h: 3,
  k_w: 3,
  stride_h: 1,
  stride_w: 1,
  pad_h: 1,
  pad_w: 1,
  dilation_h: 1,
  dilation_w: 1,
  data: [28, 28, 3, 3, 1],
  target: 28,
};

export const generateConv2dPaddingStrideOutputShapeSteps = (
  input: conv2dPaddingStrideOutputShapeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const h_in = input.h_in ?? 28;
  const w_in = input.w_in ?? 28;
  const k_h = input.k_h ?? 3;
  const k_w = input.k_w ?? 3;
  const stride_h = input.stride_h ?? 1;
  const stride_w = input.stride_w ?? 1;
  const pad_h = input.pad_h ?? 1;
  const pad_w = input.pad_w ?? 1;
  const dilation_h = input.dilation_h ?? 1;
  const dilation_w = input.dilation_w ?? 1;

  const getSnapshot = (
    stage: string,
    highlightRow: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = 5;
    const cols = 4;
    const cells: MatrixCellItem[] = [
      { row: 0, col: 0, value: "h_in", label: "Input Height", state: highlightRow === 0 ? "active" : "default" },
      { row: 0, col: 1, value: h_in, label: "Value", state: highlightRow === 0 ? "active" : "default" },
      { row: 0, col: 2, value: "w_in", label: "Input Width", state: highlightRow === 0 ? "active" : "default" },
      { row: 0, col: 3, value: w_in, label: "Value", state: highlightRow === 0 ? "active" : "default" },

      { row: 1, col: 0, value: "k_h", label: "Kernel Height", state: highlightRow === 1 ? "active" : "default" },
      { row: 1, col: 1, value: k_h, label: "Value", state: highlightRow === 1 ? "active" : "default" },
      { row: 1, col: 2, value: "k_w", label: "Kernel Width", state: highlightRow === 1 ? "active" : "default" },
      { row: 1, col: 3, value: k_w, label: "Value", state: highlightRow === 1 ? "active" : "default" },

      { row: 2, col: 0, value: "pad_h", label: "Pad Height", state: highlightRow === 2 ? "active" : "default" },
      { row: 2, col: 1, value: pad_h, label: "Value", state: highlightRow === 2 ? "active" : "default" },
      { row: 2, col: 2, value: "pad_w", label: "Pad Width", state: highlightRow === 2 ? "active" : "default" },
      { row: 2, col: 3, value: pad_w, label: "Value", state: highlightRow === 2 ? "active" : "default" },

      { row: 3, col: 0, value: "stride_h", label: "Stride H", state: highlightRow === 3 ? "active" : "default" },
      { row: 3, col: 1, value: stride_h, label: "Value", state: highlightRow === 3 ? "active" : "default" },
      { row: 3, col: 2, value: "stride_w", label: "Stride W", state: highlightRow === 3 ? "active" : "default" },
      { row: 3, col: 3, value: stride_w, label: "Value", state: highlightRow === 3 ? "active" : "default" },

      { row: 4, col: 0, value: "dilation_h", label: "Dilation H", state: highlightRow === 4 ? "active" : "default" },
      { row: 4, col: 1, value: dilation_h, label: "Value", state: highlightRow === 4 ? "active" : "default" },
      { row: 4, col: 2, value: "dilation_w", label: "Dilation W", state: highlightRow === 4 ? "active" : "default" },
      { row: 4, col: 3, value: dilation_w, label: "Value", state: highlightRow === 4 ? "active" : "default" },
    ];

    return {
      kind: "matrix",
      rows,
      cols,
      title: `2D Conv Shape Parameters Matrix (${stage})`,
      rowHeaders: ["Input", "Kernel", "Padding", "Stride", "Dilation"],
      colHeaders: ["Param 1", "Val 1", "Param 2", "Val 2"],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    highlightRow: number = -1,
    stage: string = "Computing",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(stage, highlightRow),
      auxiliaryState: {
        customState: {
          "Input Resolution": `${h_in} x ${w_in}`,
          "Kernel Size": `${k_h} x ${k_w}`,
          "Padding / Stride / Dilation": `P=(${pad_h},${pad_w}), S=(${stride_h},${stride_w}), D=(${dilation_h},${dilation_w})`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize 2D Conv Output Shape Calculator",
    `Started 2D spatial shape calculation for input ${h_in}x${w_in}, kernel ${k_h}x${k_w}, stride (${stride_h},${stride_w}), pad (${pad_h},${pad_w}), dilation (${dilation_h},${dilation_w}).`,
    { h_in, w_in, k_h, k_w, stride_h, stride_w, pad_h, pad_w, dilation_h, dilation_w },
    0,
    "Initialization",
  );

  // Step 2: Validate non-zero inputs
  addStep(
    1,
    "Inspect Hyperparameter Bounds",
    `Validating positive hyperparameter inputs: h_in=${h_in}, w_in=${w_in}, k_h=${k_h}, k_w=${k_w}, stride_h=${stride_h}, stride_w=${stride_w}.`,
    { h_in, w_in, k_h, k_w, stride_h, stride_w },
    0,
    "Parameter Validation",
  );

  // Steps for vertical effective kernel size
  addStep(
    10,
    "Calculate Vertical Effective Kernel Size (eff_k_h)",
    `Evaluating eff_k_h = ${k_h} + (${k_h} - 1) * (${dilation_h} - 1).`,
    { k_h, dilation_h },
    1,
    "Vertical Effective Kernel",
  );

  const eff_k_h = k_h + (k_h - 1) * (dilation_h - 1);
  addStep(
    10,
    `Vertical Effective Kernel Size computed: eff_k_h = ${eff_k_h}`,
    `Dilated kernel height footprint is ${eff_k_h} pixels.`,
    { eff_k_h },
    1,
    "Vertical Effective Kernel Done",
  );

  // Steps for horizontal effective kernel size
  addStep(
    11,
    "Calculate Horizontal Effective Kernel Size (eff_k_w)",
    `Evaluating eff_k_w = ${k_w} + (${k_w} - 1) * (${dilation_w} - 1).`,
    { k_w, dilation_w },
    1,
    "Horizontal Effective Kernel",
  );

  const eff_k_w = k_w + (k_w - 1) * (dilation_w - 1);
  addStep(
    11,
    `Horizontal Effective Kernel Size computed: eff_k_w = ${eff_k_w}`,
    `Dilated kernel width footprint is ${eff_k_w} pixels.`,
    { eff_k_w },
    1,
    "Horizontal Effective Kernel Done",
  );

  // Steps for h_out
  const padded_h = h_in + 2 * pad_h;
  addStep(
    13,
    `Calculate Total Vertical Padded Height: padded_h = ${padded_h}`,
    `Added ${2 * pad_h} padding pixels to input height ${h_in}.`,
    { padded_h, pad_h, h_in },
    2,
    "Vertical Padding",
  );

  const numerator_h = padded_h - eff_k_h;
  addStep(
    13,
    `Calculate Vertical Window Span: numerator_h = ${numerator_h}`,
    `Subtracted effective kernel height ${eff_k_h} from padded height ${padded_h}.`,
    { numerator_h, padded_h, eff_k_h },
    2,
    "Vertical Span",
  );

  const h_out_raw = Math.floor(numerator_h / stride_h) + 1;
  addStep(
    13,
    `Calculate Spatial Output Height: h_out = ${h_out_raw}`,
    `Applied stride step division floor(${numerator_h} / ${stride_h}) + 1 = ${h_out_raw}.`,
    { h_out: h_out_raw, stride_h },
    3,
    "Output Height",
  );

  // Steps for w_out
  const padded_w = w_in + 2 * pad_w;
  addStep(
    14,
    `Calculate Total Horizontal Padded Width: padded_w = ${padded_w}`,
    `Added ${2 * pad_w} padding pixels to input width ${w_in}.`,
    { padded_w, pad_w, w_in },
    2,
    "Horizontal Padding",
  );

  const numerator_w = padded_w - eff_k_w;
  addStep(
    14,
    `Calculate Horizontal Window Span: numerator_w = ${numerator_w}`,
    `Subtracted effective kernel width ${eff_k_w} from padded width ${padded_w}.`,
    { numerator_w, padded_w, eff_k_w },
    2,
    "Horizontal Span",
  );

  const w_out_raw = Math.floor(numerator_w / stride_w) + 1;
  addStep(
    14,
    `Calculate Spatial Output Width: w_out = ${w_out_raw}`,
    `Applied stride step division floor(${numerator_w} / ${stride_w}) + 1 = ${w_out_raw}.`,
    { w_out: w_out_raw, stride_w },
    3,
    "Output Width",
  );

  // Step for validation check
  const valid = h_out_raw > 0 && w_out_raw > 0;
  addStep(
    16,
    `Validate Output Shape Bounds: valid = ${valid}`,
    `Evaluated (h_out > 0) and (w_out > 0) -> ${valid}.`,
    { valid, h_out: h_out_raw, w_out: w_out_raw },
    4,
    "Validity Check",
  );

  // Steps for dictionary creation
  const h_out = Math.max(0, h_out_raw);
  const w_out = Math.max(0, w_out_raw);

  addStep(
    17,
    "Construct Shape Metadata Dictionary",
    `Building output spatial metadata dictionary with clamped non-negative dimensions.`,
    { h_out, w_out, eff_k_h, eff_k_w, valid },
    4,
    "Dictionary Construction",
  );

  addStep(
    18,
    `Set Dictionary Field "h_out": ${h_out}`,
    `Recorded clamped output feature map height h_out = ${h_out}.`,
    { h_out },
    4,
    "Field h_out",
  );

  addStep(
    19,
    `Set Dictionary Field "w_out": ${w_out}`,
    `Recorded clamped output feature map width w_out = ${w_out}.`,
    { w_out },
    4,
    "Field w_out",
  );

  addStep(
    20,
    `Set Dictionary Field "eff_kernel_h": ${eff_k_h}`,
    `Recorded effective vertical receptive field footprint eff_k_h = ${eff_k_h}.`,
    { eff_k_h },
    4,
    "Field eff_k_h",
  );

  addStep(
    21,
    `Set Dictionary Field "eff_kernel_w": ${eff_k_w}`,
    `Recorded effective horizontal receptive field footprint eff_k_w = ${eff_k_w}.`,
    { eff_k_w },
    4,
    "Field eff_k_w",
  );

  addStep(
    22,
    `Set Dictionary Field "is_valid_shape": ${valid}`,
    `Recorded spatial validity flag is_valid_shape = ${valid}.`,
    { is_valid_shape: valid },
    4,
    "Field valid",
  );

  addStep(
    23,
    "Execution Complete",
    `Successfully computed spatial output shape (${h_out}, ${w_out}) with effective kernel size (${eff_k_h}, ${eff_k_w}) and validity status ${valid}.`,
    { completed: true, h_out, w_out, valid },
    4,
    "Complete",
  );

  return steps;
};

const CONV2DPADDINGSTRIDEOUTPUTSHAPE_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 12, 15],
  distractors: [
    "eff_k_h = k_h * dilation_h",
    "h_out = (h_in - k_h) // stride_h",
    "w_out = (w_in + pad_w - k_w) // stride_w + 1",
    "valid = h_out >= 0 or w_out >= 0",
  ],
  hints: [
    { line: 10, hint: "Dilation expands kernel size: eff_k = k + (k - 1) * (dilation - 1)." },
    { line: 13, hint: "Spatial output height formula: (h_in + 2*pad_h - eff_k_h) // stride_h + 1." },
  ],
  lineExplanations: {
    1: "Defines entry point for 2D Conv Output Shape Calculator function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes spatial output shape computation considering padding, stride, and dilation.",
    4: "Docstring continuation tag.",
    5: "Docstring section header for mathematical formula.",
    6: "Docstring formula line for effective kernel height.",
    7: "Docstring formula line for spatial output height.",
    8: "Docstring closing delimiter tag.",
    9: "Blank line before calculation.",
    10: "Calculates effective vertical kernel size eff_k_h factoring in dilation_h.",
    11: "Calculates effective horizontal kernel size eff_k_w factoring in dilation_w.",
    12: "Blank line before output dimension calculation.",
    13: "Calculates spatial output height h_out using integer division floor.",
    14: "Calculates spatial output width w_out using integer division floor.",
    15: "Blank line before validity check.",
    16: "Evaluates boolean validity check ensuring both h_out and w_out are greater than zero.",
    17: "Opens shape metadata dictionary return block.",
    18: "Stores clamped output height max(0, h_out) in dictionary under key 'h_out'.",
    19: "Stores clamped output width max(0, w_out) in dictionary under key 'w_out'.",
    20: "Stores vertical effective kernel footprint eff_k_h in dictionary under key 'eff_kernel_h'.",
    21: "Stores horizontal effective kernel footprint eff_k_w in dictionary under key 'eff_kernel_w'.",
    22: "Stores boolean spatial validity flag in dictionary under key 'is_valid_shape'.",
    23: "Closes metadata dictionary return block.",
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
      "Determining spatial output dimensions $(H_{out}, W_{out})$ after spatial transformations is an essential prerequisite step in ML graph compilers (XLA, TVM, torch.compile), neural architecture search, and tensor memory allocation (PyTorch `nn.Conv2d`, ONNX shape inference). Given spatial height and width, kernel dimensions, padding, stride, and dilation, this algorithm computes exact output feature map shapes and effective receptive fields.\n\n### Why It Exists\nBefore executing high-performance CUDA matrix multiplication kernels, deep learning runtimes must pre-allocate GPU memory buffers for intermediate activation maps. Accurate shape inference prevents out-of-bounds DRAM access and enables compiler layout optimization.\n\n### Mathematical Formulation\nGiven input spatial dimensions $(H_{in}, W_{in})$, kernel size $(K_h, K_w)$, zero-padding $(P_h, P_w)$, stride $(S_h, S_w)$, and dilation $(D_h, D_w)$, the effective kernel footprint $K_{eff}$ and spatial output shape $(H_{out}, W_{out})$ are defined as:\n\n$$K_{eff, h} = K_h + (K_h - 1)(D_h - 1), \\quad K_{eff, w} = K_w + (K_w - 1)(D_w - 1)$$\n\n$$H_{out} = \\left\\lfloor \\frac{H_{in} + 2P_h - K_{eff, h}}{S_h} \\right\\rfloor + 1$$\n\n$$W_{out} = \\left\\lfloor \\frac{W_{in} + 2P_w - K_{eff, w}}{S_w} \\right\\rfloor + 1$$\n\n### Step-by-Step Intuition\n1. **Dilation Expansion**: Dilation rate $D$ inserts $D - 1$ spaces between filter taps, expanding the kernel footprint from $K$ to $K_{eff} = K + (K - 1)(D - 1)$.\n2. **Zero-Padding Addition**: Adding $P$ pixels of padding to both spatial endpoints increases total spatial length to $H_{in} + 2P$.\n3. **Window Span**: Subtracted effective kernel footprint leaves a span of $H_{in} + 2P - K_{eff}$ available for sliding.\n4. **Strided Division**: Floor division by stride $S$ plus 1 counts total valid window placement steps.\n\n### Key Trade-Offs & Hardware Execution\n- **SAME vs VALID Padding**: 'SAME' padding dynamically computes padding $P = \\lfloor (K - 1) / 2 \\rfloor$ to keep $H_{out} = H_{in}$ when $S=1$. 'VALID' padding uses $P=0$, shrinking spatial resolution.\n- **Transposed Conv Complement**: Transposed 2D convolution (deconvolution) flips this formula to upsample spatial features: $H_{out} = (H_{in} - 1) \\cdot S - 2P + K_{eff}$.",
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
        inputDisplay: "H=28, W=28, K=3x3, P=1, S=1, D=1",
        outputDisplay: "H_out=28, W_out=28, K_eff=3, valid=True",
        input: DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
        output: "{ h_out: 28, w_out: 28, eff_kernel_h: 3, eff_kernel_w: 3, is_valid_shape: true }",
        explanation: "P=1 zero-padding preserves spatial dimensions for 3x3 filter with stride=1.",
      },
      {
        kind: "complex",
        title: "Dilated 2x Downsampling Conv",
        inputDisplay: "H=224, W=224, K=7x7, P=3, S=2, D=2",
        outputDisplay: "H_out=106, W_out=106, K_eff=13, valid=True",
        input: {
          h_in: 224,
          w_in: 224,
          k_h: 7,
          k_w: 7,
          stride_h: 2,
          stride_w: 2,
          pad_h: 3,
          pad_w: 3,
          dilation_h: 2,
          dilation_w: 2,
        },
        output: "{ h_out: 106, w_out: 106, eff_kernel_h: 13, eff_kernel_w: 13, is_valid_shape: true }",
        explanation: "Dilation D=2 expands 7x7 kernel to 13x13 effective receptive field.",
      },
    ],
    code: CONV2DPADDINGSTRIDEOUTPUTSHAPE_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Closed-form arithmetic formula evaluates in $O(1)$ constant time.",
      space: "Requires $O(1)$ auxiliary memory to store output shape metadata.",
    },
    topicGuide: {
      overview:
        "The **2D Conv Output Shape Calculator** computes spatial dimensions $H_{out}$ and $W_{out}$ based on input sizes, filter dimensions, padding, stride, and dilation parameters.",
      sections: [
        {
          heading: "1. Core Concept & Mathematical Derivation",
          body: "The spatial output formula for 2D convolution is:\n$$H_{out} = \\left\\lfloor \\frac{H_{in} + 2P - K_{eff}}{S} \\right\\rfloor + 1$$\nDilation expands spatial receptive field spacing without adding parameters:\n$$K_{eff} = K + (K - 1)(D - 1)$$",
        },
        {
          heading: "2. Systems & Memory Layout Impact",
          body: "Spatial dimensions determine the number of rows $M = H_{out} \\cdot W_{out}$ in the lowered `im2col` matrix. ML compilers like XLA and TensorRT use these calculations during graph optimization to allocate continuous DRAM blocks and determine GEMM tile shapes.",
        },
        {
          heading: "3. Implementation Nuances & Framework Conventions",
          body: "Different frameworks handle edge rounding differently. PyTorch uses floor division (floor), whereas PyTorch `MaxPool2d` and Caffe support `ceil_mode=True`. TensorFlow 'SAME' padding dynamically computes asymmetric top/bottom padding to preserve spatial shape.",
        },
        {
          heading: "4. Edge Case Analysis & Production Safeguards",
          body: "Out-of-bounds parameter verification prevents negative array allocation errors in CUDA kernels. When $H_{out} \\le 0$, ML execution engines trigger shape mismatch exceptions prior to memory allocation.",
        },
      ],
      keyTerms: [
        {
          term: "Effective Kernel Size",
          definition:
            "Expanded filter footprint equation $K_{eff} = K + (K - 1)(D - 1)$ under dilated convolution.",
        },
        {
          term: "Dilation Rate",
          definition:
            "Spacing factor between kernel filter elements allowing enlarged receptive fields without parameter increase.",
        },
        {
          term: "Spatial Downsampling Factor",
          definition:
            "Reduction ratio in spatial resolution caused by stride $S > 1$ or pooling layers.",
        },
        {
          term: "Padding Convention",
          definition:
            "Boundary zero-padding rules ('SAME', 'VALID', explicit padding tuples) governing spatial output size.",
        },
      ],
    },
    trivia: CONV2DPADDINGSTRIDEOUTPUTSHAPE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_CONV2DPADDINGSTRIDEOUTPUTSHAPE_INPUT,
    generateSteps: generateConv2dPaddingStrideOutputShapeSteps,
  };
