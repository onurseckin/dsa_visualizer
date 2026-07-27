import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LayerConfig {
  kernelSize: number;
  stride: number;
  padding: number;
  dilation?: number;
}

export interface receptiveFieldGrowthCalculatorInput {
  initialInputSize: number;
  layers: LayerConfig[];
}

export const RECEPTIVEFIELDGROWTHCALCULATOR_CODE = `
def calculate_receptive_field_growth(initial_input_size, layers):
    """
    Calculates layer-by-layer growth of Receptive Field (RF), effective Jump (J),
    start center offset, and feature map spatial resolution across stacked CNN layers.

    Formulae per layer l:
      eff_k = (kernel_size - 1) * dilation + 1
      RF_l  = RF_{l-1} + (eff_k - 1) * J_{l-1}
      J_l   = J_{l-1} * stride_l
      Out_l = floor((In_{l-1} + 2*padding - eff_k) / stride_l) + 1
    """
    rf = 1
    jump = 1
    start = 0.5
    current_size = initial_input_size
    history = []

    for idx, layer in enumerate(layers):
        k = layer.get("kernel_size", 3)
        s = layer.get("stride", 1)
        p = layer.get("padding", 0)
        d = layer.get("dilation", 1)

        eff_k = (k - 1) * d + 1
        rf_new = rf + (eff_k - 1) * jump
        start_new = start + ((eff_k - 1) / 2.0 - p) * jump
        jump_new = jump * s
        out_size = (current_size + 2 * p - eff_k) // s + 1

        history.append({
            "layer": idx + 1,
            "input_size": current_size,
            "output_size": out_size,
            "receptive_field": rf_new,
            "jump": jump_new,
            "start": start_new
        })

        rf = rf_new
        jump = jump_new
        start = start_new
        current_size = out_size

    return history
`;

export const DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT: receptiveFieldGrowthCalculatorInput = {
  initialInputSize: 224,
  layers: [
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 2, stride: 2, padding: 0 },
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 2, stride: 2, padding: 0 },
  ],
};

export const generateReceptiveFieldGrowthCalculatorSteps = (
  input: receptiveFieldGrowthCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const initialSize = input.initialInputSize;
  const layers = input.layers;

  const elements: ArrayElement[] = layers.map((layer, idx) => ({
    id: `layer-${idx}`,
    value: layer.kernelSize,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customState?: Record<string, string>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({ ...el })),
      },
      auxiliaryState: {
        customState: {
          initialInputSize: String(initialSize),
          layerCount: String(layers.length),
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 2D Receptive Field Growth Calculator",
    "Setting initial Receptive Field RF=1, Jump J=1, Start Offset=0.5, and Input Resolution.",
    { initialSize, layerCount: layers.length },
  );

  let rf = 1;
  let jump = 1;
  let start = 0.5;
  let currentSize = initialSize;

  layers.forEach((layer, idx) => {
    const k = layer.kernelSize;
    const s = layer.stride;
    const p = layer.padding;
    const d = layer.dilation ?? 1;

    const effK = (k - 1) * d + 1;
    const rfNew = rf + (effK - 1) * jump;
    const startNew = start + ((effK - 1) / 2.0 - p) * jump;
    const jumpNew = jump * s;
    const outSize = Math.floor((currentSize + 2 * p - effK) / s) + 1;

    elements[idx].state = "active";

    addStep(
      15,
      `Layer ${idx + 1}: k=${k}, s=${s}, p=${p}, d=${d}`,
      `Calculated RF=${rfNew} (growth +${(effK - 1) * jump}), Jump J=${jumpNew}, Resolution ${currentSize}x${currentSize} -> ${outSize}x${outSize}.`,
      { layer: idx + 1, k, s, p, d, effK, rfNew, jumpNew, startNew, outSize },
      {
        layerInfo: `Layer ${idx + 1}: RF=${rfNew}, Jump=${jumpNew}, Res=${outSize}`,
      },
    );

    elements[idx].state = "visited";
    rf = rfNew;
    jump = jumpNew;
    start = startNew;
    currentSize = outSize;
  });

  addStep(
    32,
    "Execution Complete",
    `Final network Receptive Field: ${rf}x${rf} pixels, final spatial resolution: ${currentSize}x${currentSize}.`,
    { completed: true, finalRF: rf, finalSize: currentSize },
  );

  return steps;
};

const RECEPTIVEFIELDGROWTHCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "rf_new = rf * kernel_size",
    "jump_new = jump + stride",
    "out_size = current_size // stride",
  ],
  hints: [
    {
      line: 15,
      hint: "Receptive Field growth depends on the cumulative jump (product of strides) of previous layers.",
    },
    {
      line: 32,
      hint: "Pooling/strided layers double the effective jump, accelerating RF growth in subsequent convolutions.",
    },
  ],
  lineExplanations: {
    1: "Entry point for receptive field growth calculator.",
    15: "Layer iteration loop computing effective kernel size, RF growth, and stride jump.",
    32: "Returns complete layer-by-layer receptive field growth history.",
  },
};

export const receptiveFieldGrowthCalculator: AlgorithmDefinition<receptiveFieldGrowthCalculatorInput> =
  {
    id: "receptiveFieldGrowthCalculator",
    title: "2D Receptive Field Growth Calculator",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_tensor_algebra"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "The Receptive Field (RF) of a neural network feature map activation defines the spatial region in the raw input image that directly influences that activation's value. Accurate calculation of receptive field growth is critical for designing computer vision models (object detection, semantic segmentation, keypoint estimation) to ensure the network has sufficient spatial context to cover objects of interest. Given a sequence of convolution and pooling layers (with kernel sizes, strides, padding, and dilations), this calculator evaluates the exact layer-by-layer expansion of the receptive field RF_l = RF_{l-1} + ((k_l-1)*d_l + 1 - 1) * J_{l-1}, tracking effective stride jumps J_l = J_{l-1} * s_l and output spatial resolutions.\n\nInput Format:\n- initialInputSize: Integer spatial dimension of the input image (e.g. 224).\n- layers: Array of layer parameter objects containing kernelSize, stride, padding, and optional dilation.\n\nOutput Format:\n- Returns a list of layer history objects containing input_size, output_size, receptive_field, jump, and start center offset.\n\nEdge Cases & Constraints:\n- Dilated convolutions: Dilation d > 1 expands effective kernel size eff_k = (k-1)*d + 1 without extra parameter FLOPs.\n- Pooling layers: Strided pooling increases jump J, causing all subsequent layers to grow RF significantly faster.",
    constraints: [
      "1 <= initialInputSize <= 4096",
      "1 <= layers.length <= 100",
      "1 <= kernelSize <= 31",
      "1 <= stride <= 16",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 5-Layer CNN Pipeline",
        inputDisplay: "initialInputSize: 224, 5 Conv/Pool layers",
        outputDisplay: "Final RF: 16x16, Final Res: 56x56",
        input: DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
        output: "RF Growth History Array",
        explanation: "Tracks RF growth from 1x1 up to 16x16 across 5 stacked layers.",
      },
    ],
    code: RECEPTIVEFIELDGROWTHCALCULATOR_CODE,
    timeComplexity: { best: "O(L)", average: "O(L)", worst: "O(L)" },
    spaceComplexity: "O(L)",
    complexityAnalysis: {
      time: "Linear time pass across the L layer configuration objects.",
      space: "Linear memory proportional to the number of network layers L.",
    },
    topicGuide: {
      overview:
        "Receptive Field analysis is crucial for network architecture design. It governs whether an object detection head can see large bounding boxes or fine-grained keypoints.",
      sections: [
        {
          heading: "Overview",
          body: "A single pixel in an early feature map sees a 3x3 input patch. As deep layers stack convolutions and downsampling pools, a single activation in later layers sees large 200x200 image regions. Tracking RF ensures model capacity matches task requirements.",
        },
        {
          heading: "Core Concepts",
          body: "1. Receptive Field (RF): Spatial region in the input tensor that affects a single output feature.\n2. Jump (J): Distance in input pixels between adjacent features in the current layer (cumulative product of all preceding strides).\n3. Effective Kernel Size: eff_k = (k - 1) * d + 1, accounting for dilated kernels.\n4. RF Recurrence: RF_l = RF_{l-1} + (eff_k - 1) * J_{l-1}.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Dilated convolutions (atrous convolutions) increase RF exponentially without reducing spatial resolution or adding parameters, but increase memory footprint in high-resolution feature maps.",
        },
        {
          heading: "Implementation Nuances",
          body: "Start center offset tracks precise pixel coordinate alignment (start_new = start + ((eff_k-1)/2 - p)*jump), essential for anchor box alignment in object detectors like YOLO and Faster R-CNN.",
        },
        {
          heading: "Edge Cases",
          body: "Asymmetric padding, 1x1 convolutions (which do not expand RF, eff_k=1), and downsampling with stride > kernel size.",
        },
      ],
      keyTerms: [
        {
          term: "Receptive Field",
          definition: "Input spatial area influencing a specific feature map activation.",
        },
        {
          term: "Effective Jump",
          definition: "Distance in input pixels between adjacent features in a feature map.",
        },
        {
          term: "Dilated Convolution",
          definition:
            "Convolution with spaces between kernel elements to expand RF without extra FLOPs.",
        },
        {
          term: "Center Offset",
          definition:
            "Sub-pixel coordinate offset of the receptive field center relative to original input space.",
        },
      ],
    },
    trivia: RECEPTIVEFIELDGROWTHCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
    generateSteps: generateReceptiveFieldGrowthCalculatorSteps,
  };
