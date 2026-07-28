import type { AlgorithmDefinition, AlgorithmStep, ProblemExample } from "../../types/dsa";

export interface SmoothquantInput {
  alpha: number; // migration strength, e.g. 0.5
  activations: number[][]; // [numTokens][numChannels]
  weights: number[][]; // [numChannels][outFeatures]
}

export const SMOOTHQUANT_SCALING_CODE = `def smoothquant_scaling(
    X: list[list[float]],
    W: list[list[float]],
    alpha: float
) -> tuple[list[float], list[list[float]], list[list[float]]]:
    num_tokens = len(X)
    channels = len(X[0])
    out_features = len(W[0])
    
    max_act = [
        max(abs(X[i][c]) for i in range(num_tokens))
        for c in range(channels)
    ]
    
    max_weight = [
        max(abs(W[c][j]) for j in range(out_features))
        for c in range(channels)
    ]
    
    scales = []
    for c in range(channels):
        ma = max(max_act[c], 1e-5)
        mw = max(max_weight[c], 1e-5)
        s_c = (ma ** alpha) / (mw ** (1.0 - alpha))
        scales.append(s_c)
        
    X_hat = [
        [X[i][c] / scales[c] for c in range(channels)]
        for i in range(num_tokens)
    ]
    
    W_hat = [
        [W[c][j] * scales[c] for j in range(out_features)]
        for c in range(channels)
    ]
    
    return scales, X_hat, W_hat`;

export const DEFAULT_SMOOTHQUANT_INPUT: SmoothquantInput = {
  alpha: 0.5,
  activations: [
    [10.0, 1.2, 0.5],
    [12.0, 0.8, 0.4],
    [9.5, 1.0, 0.6],
  ],
  weights: [
    [0.1, 0.2],
    [1.5, 2.0],
    [0.8, 1.1],
  ],
};

export const SMOOTHQUANT_EXAMPLES: ProblemExample<SmoothquantInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "Standard 3-Channel Outlier Migration (Alpha 0.5)",
    input: {
      alpha: 0.5,
      activations: [
        [10.0, 1.2, 0.5],
        [12.0, 0.8, 0.4],
        [9.5, 1.0, 0.6],
      ],
      weights: [
        [0.1, 0.2],
        [1.5, 2.0],
        [0.8, 1.1],
      ],
    },
    output: "Per-channel scales s = [7.746, 0.775, 0.739]",
    explanation:
      "Migrates activation outlier variance in channel 0 to weights so both X and W fit INT8 quantization ranges smoothly.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Severe Channel Outlier (Alpha 0.75)",
    input: {
      alpha: 0.75,
      activations: [
        [100.0, 0.5, 0.2],
        [120.0, 0.4, 0.3],
      ],
      weights: [
        [0.05, 0.05],
        [2.0, 3.0],
        [1.0, 1.5],
      ],
    },
    output: "Stronger migration scale for channel 0",
    explanation:
      "Higher migration alpha (0.75) places more scaling burden onto weight rows to tame massive activation spikes.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Pure Weight Preservation (Alpha 0.0)",
    input: {
      alpha: 0.0,
      activations: [
        [5.0, 2.0],
        [4.0, 1.0],
      ],
      weights: [
        [1.0, 1.0],
        [2.0, 2.0],
      ],
    },
    output: "Scales depend solely on inverse max weight magnitude",
    explanation: "Setting alpha to 0 ignores activation magnitude entirely.",
  },
];

function createMatrixSnapshot(
  matrix: number[][],
  rowHeaders: string[],
  colHeaders: string[],
  title: string,
  activeRow?: number,
  activeCol?: number,
  highlightState: "active" | "sorted" | "compared" | "pivot" = "active",
) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
      if (activeRow !== undefined && activeCol !== undefined) {
        if (r === activeRow && c === activeCol) state = highlightState;
      } else if (activeRow !== undefined && r === activeRow) {
        state = highlightState;
      } else if (activeCol !== undefined && c === activeCol) {
        state = highlightState;
      }

      const val = matrix[r][c];
      cells.push({
        row: r,
        col: c,
        value: typeof val === "number" ? Number(val.toFixed(3)) : val,
        state,
      });
    }
  }

  return {
    kind: "matrix" as const,
    rows,
    cols,
    cells,
    rowHeaders,
    colHeaders,
    title,
  };
}

export function generateSmoothquantSteps(input: SmoothquantInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { alpha, activations: X, weights: W } = input;

  if (!X || !W || X.length === 0 || W.length === 0 || X[0].length === 0 || W[0].length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid SmoothQuant Matrices",
        why: "Activations and weights must be non-empty 2D matrices.",
      },
      primarySnapshot: {
        kind: "matrix",
        rows: 0,
        cols: 0,
        cells: [],
        title: "Invalid Input Matrices",
      },
      auxiliaryState: { customState: { error: "Empty input matrices" } },
      variables: {},
    });
    return steps;
  }

  const numTokens = X.length;
  const channels = X[0].length;
  const outFeatures = W[0].length;

  const tokenHeaders = Array.from({ length: numTokens }, (_, i) => `T${i}`);
  const channelHeaders = Array.from({ length: channels }, (_, c) => `C${c}`);
  const featureHeaders = Array.from({ length: outFeatures }, (_, j) => `F${j}`);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    snapshot: ReturnType<typeof createMatrixSnapshot>,
    customState: Record<string, string>,
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: snapshot,
      auxiliaryState: { customState },
      variables: vars,
    });
  };

  // Line 1: Init
  addStep(
    1,
    "Initialize SmoothQuant Outlier Mitigation",
    `Preparing channel-wise activation/weight outlier analysis across ${channels} channels with migration strength alpha=${alpha}.`,
    createMatrixSnapshot(
      X,
      tokenHeaders,
      channelHeaders,
      "Activation Matrix X [tokens x channels]",
    ),
    {
      alpha: alpha.toFixed(2),
      numTokens: String(numTokens),
      channels: String(channels),
      outFeatures: String(outFeatures),
    },
    { numTokens, channels, outFeatures, alpha },
  );

  // Line 10: Calculate per-channel max_act
  const maxAct: number[] = [];
  for (let c = 0; c < channels; c++) {
    let ma = 0;
    for (let i = 0; i < numTokens; i++) {
      ma = Math.max(ma, Math.abs(X[i][c] ?? 0));
    }
    maxAct.push(ma);

    addStep(
      10,
      `Calculate Max Activation Magnitude for Channel ${c} (max_act[${c}])`,
      `Scanned column channel ${c} across all ${numTokens} tokens to find peak absolute activation ${ma.toFixed(3)}.`,
      createMatrixSnapshot(
        X,
        tokenHeaders,
        channelHeaders,
        `Activation Matrix X (Channel ${c} Column Active)`,
        undefined,
        c,
        "active",
      ),
      {
        channel: `C${c}`,
        maxActVal: ma.toFixed(3),
        maxActSoFar: maxAct.map((v) => v.toFixed(3)).join(", "),
      },
      { c, maxAct: Number(ma.toFixed(3)) },
    );
  }

  // Line 15: Calculate per-channel max_weight
  const maxWeight: number[] = [];
  for (let c = 0; c < channels; c++) {
    let mw = 0;
    for (let j = 0; j < outFeatures; j++) {
      mw = Math.max(mw, Math.abs(W[c][j] ?? 0));
    }
    maxWeight.push(mw);

    addStep(
      15,
      `Calculate Max Weight Magnitude for Channel ${c} (max_weight[${c}])`,
      `Scanned row channel ${c} across all ${outFeatures} weight output features to find peak absolute weight ${mw.toFixed(3)}.`,
      createMatrixSnapshot(
        W,
        channelHeaders,
        featureHeaders,
        `Weight Matrix W (Channel ${c} Row Active)`,
        c,
        undefined,
        "active",
      ),
      {
        channel: `C${c}`,
        maxWeightVal: mw.toFixed(3),
        maxWeightSoFar: maxWeight.map((v) => v.toFixed(3)).join(", "),
      },
      { c, maxWeight: Number(mw.toFixed(3)) },
    );
  }

  // Line 20-25: Compute scaling vector s_c
  const scales: number[] = [];
  for (let c = 0; c < channels; c++) {
    const ma = Math.max(maxAct[c], 1e-5);
    const mw = Math.max(maxWeight[c], 1e-5);
    const sC = Math.pow(ma, alpha) / Math.pow(mw, 1.0 - alpha);
    scales.push(sC);

    addStep(
      24,
      `Compute Channel ${c} Scaling Factor s_${c}`,
      `Calculated scale factor s_${c} = (${ma.toFixed(2)}^${alpha}) / (${mw.toFixed(2)}^${(1 - alpha).toFixed(2)}) = ${sC.toFixed(3)}.`,
      createMatrixSnapshot(
        [scales],
        ["Vector s"],
        channelHeaders,
        "Per-Channel Scale Vector s",
        0,
        c,
        "pivot",
      ),
      {
        channel: `C${c}`,
        ma: ma.toFixed(3),
        mw: mw.toFixed(3),
        alpha: alpha.toFixed(2),
        s_c: sC.toFixed(3),
      },
      { c, ma: Number(ma.toFixed(3)), mw: Number(mw.toFixed(3)), scale: Number(sC.toFixed(3)) },
    );
  }

  // Line 27: Scale activations X_hat = X / s
  const XHat = X.map((row) => row.map((val, c) => val / (scales[c] || 1.0)));

  addStep(
    27,
    "Scale Activations Down: X_hat = X / diag(s)",
    `Dividing each activation channel c by s_c reduces peak outlier magnitudes, fitting activation range into INT8 cleanly.`,
    createMatrixSnapshot(
      XHat,
      tokenHeaders,
      channelHeaders,
      "Smoothed Activation Matrix X_hat [tokens x channels]",
      undefined,
      undefined,
      "sorted",
    ),
    {
      maxOriginalAct: Math.max(...X.flat().map(Math.abs)).toFixed(3),
      maxScaledAct: Math.max(...XHat.flat().map(Math.abs)).toFixed(3),
    },
    { numTokens, channels },
  );

  // Line 32: Scale weights W_hat = W * s
  const WHat = W.map((row, c) => row.map((val) => val * (scales[c] || 1.0)));

  addStep(
    32,
    "Scale Weights Up: W_hat = diag(s) * W",
    `Multiplying weight row c by scale s_c absorbs activation outlier difficulty into weight channels while maintaining X_hat * W_hat == X * W.`,
    createMatrixSnapshot(
      WHat,
      channelHeaders,
      featureHeaders,
      "Smoothed Weight Matrix W_hat [channels x outFeatures]",
      undefined,
      undefined,
      "sorted",
    ),
    {
      maxOriginalWeight: Math.max(...W.flat().map(Math.abs)).toFixed(3),
      maxScaledWeight: Math.max(...WHat.flat().map(Math.abs)).toFixed(3),
    },
    { channels, outFeatures },
  );

  // Line 37: Return
  addStep(
    37,
    "Return (scales, X_hat, W_hat)",
    "SmoothQuant equivalent matrix transformation complete. Returning scale vector and smoothed activation/weight matrices ready for W8A8 INT8 quantization.",
    createMatrixSnapshot([scales], ["Scales"], channelHeaders, "Final Channel Scaling Vector s"),
    {
      scales: `[${scales.map((s) => s.toFixed(3)).join(", ")}]`,
      status: "complete",
    },
    { completed: true },
  );

  return steps;
}

export const smoothquantScaling: AlgorithmDefinition<SmoothquantInput> = {
  id: "smoothquant-scaling",
  title: "SmoothQuant Activation Scaling Matrix",
  topicIds: ["ml_precision_quantization"],
  difficulty: "Hard",
  description:
    "Mathematically shifts quantization difficulty from activation outliers to weight matrices via a per-channel diagonal scale factor s, enabling 8-bit integer (INT8) quantization for large language models.",
  constraints: [
    "Migration hyperparameter alpha in [0.0, 1.0]",
    "Activations non-empty [numTokens x channels]",
    "Weights non-empty [channels x outFeatures]",
    "Channel count matching between X and W",
  ],
  examples: SMOOTHQUANT_EXAMPLES,
  code: SMOOTHQUANT_SCALING_CODE,
  timeComplexity: {
    best: "O(numTokens * channels + channels * outFeatures)",
    average: "O(numTokens * channels + channels * outFeatures)",
    worst: "O(numTokens * channels + channels * outFeatures)",
  },
  spaceComplexity: "O(channels)",
  complexityAnalysis: {
    time: "Linear pass over activation and weight matrices to calculate per-channel absolute maximums and elementwise scaling.",
    space: "Requires O(channels) memory to store the diagonal scaling vector s.",
  },
  topicGuide: {
    overview:
      "SmoothQuant (Xiao et al.) is an accurate post-training quantization framework for LLMs. Activation outliers in LLMs are up to 100x larger than typical values, making W8A8 INT8 quantization difficult. SmoothQuant uses a mathematically equivalent per-channel scale transformation to smooth out activation spikes.",
    sections: [
      {
        heading: "Mathematical Equivalence",
        body: "Because Y = X * W = (X * diag(s)^-1) * (diag(s) * W) = X_hat * W_hat, the output of the Linear layer is identical mathematically while making activation dynamic ranges uniform for INT8 quantization.",
      },
      {
        heading: "Migration Strength Hyperparameter Alpha",
        body: "Alpha balances the quantization difficulty between activations and weights. Setting alpha=0.5 splits the dynamic range burden equally, whereas alpha=0.75 migrates more variance to weights.",
      },
    ],
    keyTerms: [
      {
        term: "SmoothQuant",
        definition:
          "Post-training W8A8 quantization technique using channel-wise outlier smoothing.",
      },
      {
        term: "Activation Outliers",
        definition:
          "Extreme magnitude values concentrated in specific channels of LLM hidden representations.",
      },
      {
        term: "W8A8 Quantization",
        definition:
          "Quantizing both weights (W) and activations (A) to 8-bit integers for hardware GEMM acceleration.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_SMOOTHQUANT_INPUT,
  generateSteps: generateSmoothquantSteps,
};
