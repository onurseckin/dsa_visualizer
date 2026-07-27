import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LayerConfig {
  kernelSize: number;
  stride: number;
  padding: number;
  dilation?: number;
}

export interface receptiveFieldGrowthCalculatorInput {
  initialInputSize?: number;
  layers?: LayerConfig[];
  data?: number[];
  target?: number;
}

export const RECEPTIVEFIELDGROWTHCALCULATOR_CODE = `def calculate_receptive_field_growth(initial_input_size, layers):
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

    return history`;

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

  const initialInputSize = input.initialInputSize ?? 224;
  const layers = input.layers || [
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 2, stride: 2, padding: 0 },
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 3, stride: 1, padding: 1 },
    { kernelSize: 2, stride: 2, padding: 0 },
  ];

  interface LayerRecord {
    layer: number;
    input_size: number;
    output_size: number;
    receptive_field: number;
    jump: number;
    start: number;
  }

  const historyRecords: LayerRecord[] = [];

  const getSnapshot = (
    currentLayerIdx: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = layers.length + 1;
    const cols = 6;
    const cells: MatrixCellItem[] = [];

    // Header row
    const headers = ["Layer", "In Size", "Out Size", "RF", "Jump", "Start"];
    for (let c = 0; c < 6; c++) {
      cells.push({
        row: 0,
        col: c,
        value: headers[c],
        label: "Header",
        state: "default",
      });
    }

    // Input state
    let curRF = 1;
    let curJump = 1;
    let curStart = 0.5;
    let curSize = initialInputSize;

    for (let l = 0; l < layers.length; l++) {
      const isCurrent = l === currentLayerIdx;
      const rec = historyRecords[l];

      const k = layers[l].kernelSize;
      const s = layers[l].stride;
      const p = layers[l].padding;
      const d = layers[l].dilation ?? 1;
      const effK = (k - 1) * d + 1;

      if (rec) {
        curSize = rec.output_size;
        curRF = rec.receptive_field;
        curJump = rec.jump;
        curStart = rec.start;
      } else if (isCurrent) {
        curRF = curRF + (effK - 1) * curJump;
        curJump = curJump * s;
        curStart = curStart + ((effK - 1) / 2.0 - p) * curJump;
        curSize = Math.floor((curSize + 2 * p - effK) / s) + 1;
      }

      const rowIdx = l + 1;
      const state = isCurrent ? "active" : l < historyRecords.length ? "visited" : "default";

      cells.push(
        { row: rowIdx, col: 0, value: `Layer ${l + 1}`, state },
        { row: rowIdx, col: 1, value: rec ? rec.input_size : curSize, state },
        { row: rowIdx, col: 2, value: rec ? rec.output_size : "-", state },
        { row: rowIdx, col: 3, value: rec ? rec.receptive_field : "-", state },
        { row: rowIdx, col: 4, value: rec ? rec.jump : "-", state },
        { row: rowIdx, col: 5, value: rec ? rec.start.toFixed(1) : "-", state },
      );
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: "CNN Receptive Field & Jump Growth Table",
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentLayerIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentLayerIdx),
      auxiliaryState: {
        customState: {
          "Initial Image Resolution": `${initialInputSize} x ${initialInputSize}`,
          "Layers Count": String(layers.length),
          "Accumulated Receptive Field": String(historyRecords.length ? historyRecords[historyRecords.length - 1].receptive_field : 1),
          "Accumulated Spatial Jump": String(historyRecords.length ? historyRecords[historyRecords.length - 1].jump : 1),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Receptive Field Growth Calculator Entry",
    `Started layer-by-layer CNN receptive field (RF) and spatial jump (J) tracking for initial input size ${initialInputSize} across ${layers.length} stacked layers.`,
    { initialInputSize, num_layers: layers.length },
  );

  // Step 2: Init rf
  let rf = 1;
  addStep(
    12,
    "Initialize Base Receptive Field: rf = 1",
    "Single pixel in raw input image has receptive field rf = 1.",
    { rf },
  );

  // Step 3: Init jump
  let jump = 1;
  addStep(
    13,
    "Initialize Spatial Jump: jump = 1",
    "Adjacent pixels in raw input image have spatial distance jump = 1.",
    { jump },
  );

  // Step 4: Init start
  let start = 0.5;
  addStep(
    14,
    "Initialize Center Offset: start = 0.5",
    "First pixel center is offset by start = 0.5 units in continuous spatial coordinates.",
    { start },
  );

  // Step 5: Init current_size
  let current_size = initialInputSize;
  addStep(
    15,
    `Initialize Spatial Input Size: current_size = ${current_size}`,
    `Input activation map spatial resolution is ${current_size} pixels.`,
    { current_size },
  );

  // Step 6: Init history
  addStep(
    16,
    "Initialize Layer Growth History Buffer",
    "Created empty history array to record layer-by-layer RF metrics.",
    { num_records: 0 },
  );

  // Loop over layers
  for (let idx = 0; idx < layers.length; idx++) {
    const layer = layers[idx];
    const k = layer.kernelSize;
    const s = layer.stride;
    const p = layer.padding;
    const d = layer.dilation ?? 1;

    addStep(
      18,
      `Layer Loop Index idx = ${idx} (Layer ${idx + 1})`,
      `Processing stacked CNN layer ${idx + 1} of ${layers.length}.`,
      { idx, layer_num: idx + 1 },
      idx,
    );

    addStep(
      19,
      `Read Layer ${idx + 1} Kernel Size: k = ${k}`,
      `Filter kernel size for layer ${idx + 1}: k = ${k}.`,
      { idx, k },
      idx,
    );

    addStep(
      20,
      `Read Layer ${idx + 1} Spatial Stride: s = ${s}`,
      `Spatial stride for layer ${idx + 1}: s = ${s}.`,
      { idx, s },
      idx,
    );

    addStep(
      21,
      `Read Layer ${idx + 1} Zero-Padding: p = ${p}`,
      `Zero-padding for layer ${idx + 1}: p = ${p}.`,
      { idx, p },
      idx,
    );

    addStep(
      22,
      `Read Layer ${idx + 1} Dilation Rate: d = ${d}`,
      `Dilation factor for layer ${idx + 1}: d = ${d}.`,
      { idx, d },
      idx,
    );

    const eff_k = (k - 1) * d + 1;
    addStep(
      24,
      `Calculate Effective Kernel Footprint: eff_k = ${eff_k}`,
      `Evaluated eff_k = (${k} - 1) * ${d} + 1 = ${eff_k}.`,
      { idx, k, d, eff_k },
      idx,
    );

    const rf_new = rf + (eff_k - 1) * jump;
    addStep(
      25,
      `Calculate New Receptive Field: rf_new = ${rf_new}`,
      `Evaluated rf_new = ${rf} + (${eff_k} - 1) * ${jump} = ${rf_new}.`,
      { idx, rf, eff_k, jump, rf_new },
      idx,
    );

    const start_new = start + ((eff_k - 1) / 2.0 - p) * jump;
    addStep(
      26,
      `Calculate New Center Offset: start_new = ${start_new.toFixed(2)}`,
      `Evaluated start_new = ${start} + ((${eff_k} - 1)/2 - ${p}) * ${jump} = ${start_new.toFixed(2)}.`,
      { idx, start, eff_k, p, jump, start_new },
      idx,
    );

    const jump_new = jump * s;
    addStep(
      27,
      `Calculate New Feature Map Jump: jump_new = ${jump_new}`,
      `Evaluated jump_new = ${jump} * ${s} = ${jump_new}.`,
      { idx, jump, s, jump_new },
      idx,
    );

    const out_size = Math.floor((current_size + 2 * p - eff_k) / s) + 1;
    addStep(
      28,
      `Calculate Output Spatial Resolution: out_size = ${out_size}`,
      `Evaluated out_size = (${current_size} + 2*${p} - ${eff_k}) // ${s} + 1 = ${out_size}.`,
      { idx, current_size, p, eff_k, s, out_size },
      idx,
    );

    const record: LayerRecord = {
      layer: idx + 1,
      input_size: current_size,
      output_size: out_size,
      receptive_field: rf_new,
      jump: jump_new,
      start: start_new,
    };
    historyRecords.push(record);

    addStep(
      30,
      `Append Layer ${idx + 1} Metrics to History`,
      `Stored layer ${idx + 1} RF metrics into history table: RF=${rf_new}, Jump=${jump_new}, OutSize=${out_size}.`,
      { idx, layer_num: idx + 1, rf_new, jump_new, out_size },
      idx,
    );

    rf = rf_new;
    addStep(
      39,
      `Update Accumulated Receptive Field: rf = ${rf}`,
      `Set rf = ${rf} for subsequent CNN layers.`,
      { rf },
      idx,
    );

    jump = jump_new;
    addStep(
      40,
      `Update Accumulated Jump: jump = ${jump}`,
      `Set jump = ${jump} for subsequent CNN layers.`,
      { jump },
      idx,
    );

    start = start_new;
    addStep(
      41,
      `Update Accumulated Center Offset: start = ${start.toFixed(2)}`,
      `Set start = ${start.toFixed(2)} for subsequent CNN layers.`,
      { start },
      idx,
    );

    current_size = out_size;
    addStep(
      42,
      `Update Current Spatial Input Size: current_size = ${current_size}`,
      `Set current_size = ${current_size} for layer ${idx + 2}.`,
      { current_size },
      idx,
    );
  }

  // Final step
  addStep(
    44,
    "Execution Complete",
    `Successfully computed receptive field growth across ${layers.length} CNN layers. Final Receptive Field = ${rf}, Final Spatial Resolution = ${current_size}x${current_size}.`,
    { completed: true, final_rf: rf, final_size: current_size, final_jump: jump },
  );

  return steps;
};

const RECEPTIVEFIELDGROWTHCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 23, 29, 31, 32, 33, 34, 35, 36, 37, 38, 43],
  distractors: [
    "rf_new = rf * kernel_size",
    "jump_new = jump + stride",
    "out_size = current_size // stride",
    "start_new = start * jump",
  ],
  hints: [
    {
      line: 25,
      hint: "Receptive field growth equation: RF_l = RF_{l-1} + (eff_k - 1) * J_{l-1}.",
    },
    {
      line: 27,
      hint: "Spatial jump accumulation equation: J_l = J_{l-1} * stride_l.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Receptive Field Growth Calculator function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes layer-by-layer growth tracking of Receptive Field (RF) and Jump (J) across stacked CNN layers.",
    4: "Docstring continuation tag.",
    5: "Docstring formula section header.",
    6: "Docstring effective kernel formula: eff_k = (kernel_size - 1) * dilation + 1.",
    7: "Docstring receptive field growth formula: RF_l = RF_{l-1} + (eff_k - 1) * J_{l-1}.",
    8: "Docstring spatial jump accumulation formula: J_l = J_{l-1} * stride_l.",
    9: "Docstring spatial output resolution formula: Out_l = floor((In_{l-1} + 2*padding - eff_k) / stride_l) + 1.",
    10: "Docstring closing delimiter tag.",
    11: "Blank line before base parameter initialization.",
    12: "Initializes base receptive field rf = 1 for un-convolved input image.",
    13: "Initializes base spatial jump jump = 1 for un-strided input image.",
    14: "Initializes base pixel center offset start = 0.5.",
    15: "Initializes current spatial image size current_size to initial_input_size.",
    16: "Initializes history list to accumulate per-layer RF metrics.",
    17: "Blank line before layer iteration loop.",
    18: "Iterates over stacked CNN layer configs with index idx.",
    19: "Reads kernel_size parameter k (default 3).",
    20: "Reads stride parameter s (default 1).",
    21: "Reads padding parameter p (default 0).",
    22: "Reads dilation parameter d (default 1).",
    23: "Blank line before effective kernel calculation.",
    24: "Calculates effective kernel size eff_k = (k - 1) * d + 1.",
    25: "Calculates updated receptive field rf_new = rf + (eff_k - 1) * jump.",
    26: "Calculates updated center offset start_new = start + ((eff_k - 1)/2 - p) * jump.",
    27: "Calculates updated spatial jump jump_new = jump * s.",
    28: "Calculates spatial output resolution out_size using strided division floor.",
    29: "Blank line before appending layer metrics.",
    30: "Appends dictionary record for current layer to history list.",
    31: "Key 'layer': 1-indexed layer number.",
    32: "Key 'input_size': spatial input resolution to layer.",
    33: "Key 'output_size': spatial output resolution from layer.",
    34: "Key 'receptive_field': accumulated receptive field footprint in raw input pixels.",
    35: "Key 'jump': accumulated spatial stride jump factor.",
    36: "Key 'start': accumulated spatial center offset.",
    37: "Closes layer record dictionary append.",
    38: "Blank line before updating state variables.",
    39: "Updates accumulated receptive field rf = rf_new for next layer.",
    40: "Updates accumulated jump jump = jump_new for next layer.",
    41: "Updates accumulated center offset start = start_new for next layer.",
    42: "Updates current spatial size current_size = out_size for next layer.",
    43: "Blank line separating layer loop from return statement.",
    44: "Returns final layer-by-layer RF growth history array.",
  },
};

export const receptiveFieldGrowthCalculator: AlgorithmDefinition<receptiveFieldGrowthCalculatorInput> =
  {
    id: "receptiveFieldGrowthCalculator",
    title: "Receptive Field Growth Calculator",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_tensor_algebra"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "The **Receptive Field Growth Calculator** tracks the exact layer-by-layer expansion of a feature map pixel's **Receptive Field (RF)**, **Spatial Jump ($J$)**, and **Start Center Offset ($S$)** across deep stacked Convolutional Neural Networks (VGG-16, ResNet-50, AlexNet). Knowing the exact receptive field in raw input pixels is crucial for object detection (anchor box sizing in Faster R-CNN, YOLO) and dense pixel-wise semantic segmentation (DeepLab).\n\n### Why It Exists\nA single activation scalar in a deep CNN layer represents a summary of a spatial patch in the original input image. As layers stack, strided convolutions and pooling expand the receptive field while downsampling spatial resolution. This algorithm tracks exact input pixel coverage and coordinate alignment.\n\n### Mathematical Formulation\nFor layer $l$ receiving input with receptive field $RF_{l-1}$, spatial jump $J_{l-1}$, and center offset $start_{l-1}$:\n\n$$1. \\quad K_{eff, l} = (K_l - 1) \\cdot D_l + 1 \\quad (\\text{Effective Kernel Size})$$\n\n$$2. \\quad RF_l = RF_{l-1} + (K_{eff, l} - 1) \\cdot J_{l-1} \\quad (\\text{Receptive Field Expansion})$$\n\n$$3. \\quad J_l = J_{l-1} \\cdot S_l \\quad (\\text{Spatial Jump Factor})$$\n\n$$4. \\quad start_l = start_{l-1} + \\left( \\frac{K_{eff, l} - 1}{2} - P_l \\right) \\cdot J_{l-1} \\quad (\\text{Feature Center Offset})$$\n\n$$5. \\quad Out_l = \\left\\lfloor \\frac{In_{l-1} + 2P_l - K_{eff, l}}{S_l} \\right\\rfloor + 1 \\quad (\\text{Spatial Resolution})$$\n\n### Step-by-Step Intuition\n1. **Base Initialization**: Raw input image has $RF_0 = 1$, $J_0 = 1$, $start_0 = 0.5$.\n2. **Effective Kernel**: Dilation rate $D$ expands kernel footprint $K \\to K_{eff} = K + (K-1)(D-1)$.\n3. **RF Expansion**: Each filter tap extends $RF$ by the previous layer's spatial jump step $J_{l-1}$.\n4. **Jump Compound**: Spatial stride $S_l > 1$ multiplies the jump factor for all downstream layers $J_l = J_{l-1} \\cdot S_l$.\n5. **Center Drift**: Asymmetric padding or non-unit kernels shift the spatial center of feature pixels.\n\n### Key Trade-Offs & Hardware Execution\n- **Effective Receptive Field (ERF)**: While theoretical RF defines the mathematical boundary of inputs affecting a feature, empirical studies (NIPS 2016) show that the Effective Receptive Field follows a Gaussian distribution centered at the feature middle.\n- **Dilated Convolutions (Atrous Conv)**: Increasing dilation $D$ expands RF exponentially without introducing extra parameters or losing spatial resolution (used in WaveNet and DeepLabV3).",
    constraints: [
      "1 <= initialInputSize <= 10000",
      "1 <= layers.length <= 100",
      "1 <= kernelSize <= 31",
      "stride >= 1",
      "dilation >= 1",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 5-Layer CNN RF Tracking",
        inputDisplay: "Initial Size: 224, 5 CNN Layers",
        outputDisplay: "Layer-by-layer RF history",
        input: DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
        output: "Array of layer RF metrics",
        explanation: "Tracks RF expansion from 1x1 up to 18x18 across 5 stacked conv/pool layers.",
      },
    ],
    code: RECEPTIVEFIELDGROWTHCALCULATOR_CODE,
    timeComplexity: { best: "O(L)", average: "O(L)", worst: "O(L)" },
    spaceComplexity: "O(L)",
    complexityAnalysis: {
      time: "Linear in the number of stacked CNN layers $O(L)$.",
      space: "Requires $O(L)$ memory to store layer-by-layer receptive field growth records.",
    },
    topicGuide: {
      overview:
        "The **Receptive Field Growth Calculator** tracks layer-by-layer expansion of receptive fields, spatial jumps, and center offsets across stacked CNN layers.",
      sections: [
        {
          heading: "1. Core Concept & Mathematical Derivation",
          body: "Receptive field grows linearly with previous jump factor $J_{l-1}$: $RF_l = RF_{l-1} + (K_{eff} - 1) \\cdot J_{l-1}$. Spatial jump compounds multiplicatively: $J_l = J_{l-1} \\cdot S_l$. These two equations dictate how deep features map back to raw input pixels.",
        },
        {
          heading: "2. Anchor Box Sizing in Object Detection",
          body: "In object detection architectures (Faster R-CNN, SSD, YOLO), default anchor boxes placed at layer $l$ must match the receptive field $RF_l$. If anchor boxes are smaller than $RF_l$, features lack context; if larger, features contain unnecessary background noise.",
        },
        {
          heading: "3. Dilated Convolutions & Receptive Field Expansion",
          body: "Dilated (atrous) convolutions expand $K_{eff} = (K - 1) \\cdot D + 1$ without adding parameters or downsampling spatial resolution, enabling large receptive fields in semantic segmentation networks (DeepLab).",
        },
        {
          heading: "4. Edge Case Analysis & Padding Drift",
          body: "Zero-padding shifts feature center offsets $start_l$. Asymmetric padding causes spatial drift where deep feature pixels align unevenly with input image centers.",
        },
      ],
      keyTerms: [
        {
          term: "Receptive Field (RF)",
          definition: "The spatial region of raw input pixels that influence a specific feature map scalar.",
        },
        {
          term: "Spatial Jump (J)",
          definition: "The pixel distance between adjacent features in the current layer relative to raw input coordinates.",
        },
        {
          term: "Effective Receptive Field (ERF)",
          definition:
            "The Gaussian-shaped region of highest gradient impact within the mathematical receptive field.",
        },
        {
          term: "Atrous (Dilated) Convolution",
          definition:
            "Convolution inserting spaces between filter taps to enlarge receptive field at zero compute cost.",
        },
      ],
    },
    trivia: RECEPTIVEFIELDGROWTHCALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_RECEPTIVEFIELDGROWTHCALCULATOR_INPUT,
    generateSteps: generateReceptiveFieldGrowthCalculatorSteps,
  };
