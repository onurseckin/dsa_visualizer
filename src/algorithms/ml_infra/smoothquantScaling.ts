import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

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
    
    # 1. Maximum activation magnitude per channel
    max_act = [
        max(abs(X[i][c]) for i in range(num_tokens))
        for c in range(channels)
    ]
    
    # 2. Maximum weight magnitude per channel
    max_weight = [
        max(abs(W[c][j]) for j in range(out_features))
        for c in range(channels)
    ]
    
    # 3. Compute per-channel scale s_c = (max_act_c ^ alpha) / (max_weight_c ^ (1 - alpha))
    scales = []
    for c in range(channels):
        ma = max(max_act[c], 1e-5)
        mw = max(max_weight[c], 1e-5)
        s_c = (ma ** alpha) / (mw ** (1.0 - alpha))
        scales.append(s_c)
        
    # 4. Scale activations: X_hat[:, c] = X[:, c] / s_c
    X_hat = [
        [X[i][c] / scales[c] for c in range(channels)]
        for i in range(num_tokens)
    ]
    
    # 5. Scale weights: W_hat[c, :] = W[c, :] * s_c
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
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Empty input matrices" } },
      variables: {},
    });
    return steps;
  }

  const numTokens = X.length;
  const channels = X[0].length;
  const outFeatures = W[0].length;

  const elements: ArrayElement[] = Array.from({ length: channels }, (_, idx) => ({
    id: `channel-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    maxAct: number[],
    maxWeight: number[],
    scales: number[],
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          alpha: alpha.toFixed(2),
          maxActPerChannel: maxAct.map((v) => v.toFixed(2)).join(", "),
          maxWeightPerChannel: maxWeight.map((v) => v.toFixed(2)).join(", "),
          scalingVector_s: scales.map((v) => v.toFixed(3)).join(", "),
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize SmoothQuant Outlier Mitigation",
    `Preparing channel-wise activation/weight outlier analysis across ${channels} channels with migration alpha ${alpha}.`,
    [],
    [],
    [],
    { numTokens, channels, outFeatures, alpha },
  );

  // 1. Compute per-channel max activations and weights
  const maxAct: number[] = [];
  const maxWeight: number[] = [];

  for (let c = 0; c < channels; c++) {
    let ma = 0;
    for (let i = 0; i < numTokens; i++) {
      ma = Math.max(ma, Math.abs(X[i][c] ?? 0));
    }
    maxAct.push(ma);

    let mw = 0;
    for (let j = 0; j < outFeatures; j++) {
      mw = Math.max(mw, Math.abs(W[c][j] ?? 0));
    }
    maxWeight.push(mw);
  }

  addStep(
    10,
    "Calculated Per-Channel Outlier Magnitudes",
    "Analyzed max absolute activation values X_max and max weight magnitudes W_max for each feature channel.",
    maxAct,
    maxWeight,
    [],
    { channels },
  );

  // 2. Compute scaling vector s
  const scales: number[] = [];
  for (let c = 0; c < channels; c++) {
    const ma = Math.max(maxAct[c], 1e-5);
    const mw = Math.max(maxWeight[c], 1e-5);
    const sC = Math.pow(ma, alpha) / Math.pow(mw, 1.0 - alpha);
    scales.push(sC);

    elements[c].state = "active";
    elements[c].pointers = [`s_${c}=${sC.toFixed(2)}`];
  }

  addStep(
    19,
    "Computed Diagonal Scaling Vector s",
    `Formed scale factors s_c = (X_max^${alpha.toFixed(2)}) / (W_max^${(1 - alpha).toFixed(2)}) to divide activation spikes into weights.`,
    maxAct,
    maxWeight,
    scales,
    { alpha, totalScales: scales.length },
  );

  // 3. Transform X and W
  const XHat = X.map((row) => row.map((val, c) => val / (scales[c] || 1.0)));
  const WHat = W.map((row, c) => row.map((val) => val * (scales[c] || 1.0)));

  elements.forEach((el) => {
    el.state = "sorted";
    el.pointers = undefined;
  });

  addStep(
    29,
    "SmoothQuant Equivalent Transformation Complete",
    "Successfully computed X_hat = X * diag(s)^-1 and W_hat = diag(s) * W. Both matrices can now be quantized cleanly to INT8 with minimal accuracy loss.",
    maxAct,
    maxWeight,
    scales,
    {
      tokens: numTokens,
      channels,
      maxScaledAct: Math.max(...XHat.flat().map(Math.abs)).toFixed(2),
      maxScaledWeight: Math.max(...WHat.flat().map(Math.abs)).toFixed(2),
    },
  );

  return steps;
}

export const smoothquantScaling: AlgorithmDefinition<SmoothquantInput> = {
  id: "smoothquant-scaling",
  title: "SmoothQuant Activation Scaling Matrix",
  category: "ml_precision_quantization",
  difficulty: "Hard",
  description:
    "Mathematically shifts quantization difficulty from activation outliers to weight matrices via a per-channel diagonal scale factor s, enabling 8-bit integer (INT8) quantization for large language models.",
  isMlInfra: true,
  mlInfraLevel: 3,
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
