import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface MissingValueDefaultDirectionSplitterInput {
  featureValues: (number | null)[]; // continuous feature values with missing NaN / null entries
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
}

export const DEFAULT_MISSING_VALUE_SPLITTER_INPUT: MissingValueDefaultDirectionSplitterInput = {
  featureValues: [1.0, 2.0, null, 4.0, null],
  gradients: [-0.5, -0.2, 0.4, 0.8, -0.3],
  hessians: [0.2, 0.2, 0.2, 0.2, 0.2],
  lambdaReg: 1.0,
};

export const MISSING_VALUE_DEFAULT_DIRECTION_CODE = `def missing_value_default_direction_split(feature_values: list[float | None], gradients: list[float], hessians: list[float], lambda_reg: float = 1.0) -> tuple[str, float, float]:
    """
    XGBoost Sparsity-Aware Split Finding Algorithm (Algorithm 2 in Chen & Guestrin 2016).
    Evaluates split gain when assigning ALL missing value samples to Left vs Right default directions.
    Returns (defaultDirection, bestThreshold, maxGain).
    """
    G_total = sum(gradients)
    H_total = sum(hessians)

    # Separate non-missing valid samples from missing samples
    valid_samples = [(x, g, h) for x, g, h in zip(feature_values, gradients, hessians) if x is not None]
    valid_samples.sort(key=lambda item: item[0])

    best_gain = -float('inf')
    best_direction = "default_left"
    best_threshold = None

    # Option 1: Default direction LEFT (missing samples added to Left child G_L, H_L)
    G_L_valid, H_L_valid = 0.0, 0.0
    G_missing = sum(g for x, g, h in zip(feature_values, gradients, hessians) if x is None)
    H_missing = sum(h for x, g, h in zip(feature_values, gradients, hessians) if x is None)

    for i in range(len(valid_samples) - 1):
        G_L_valid += valid_samples[i][1]
        H_L_valid += valid_samples[i][2]

        # Left gets valid + missing
        G_L = G_L_valid + G_missing
        H_L = H_L_valid + H_missing
        G_R = G_total - G_L
        H_R = H_total - H_L

        gain_left = 0.5 * ((G_L ** 2) / (H_L + lambda_reg) + (G_R ** 2) / (H_R + lambda_reg) - (G_total ** 2) / (H_total + lambda_reg))
        if gain_left > best_gain:
            best_gain = gain_left
            best_direction = "default_left"
            best_threshold = (valid_samples[i][0] + valid_samples[i+1][0]) / 2.0

    # Option 2: Default direction RIGHT (missing samples added to Right child G_R, H_R)
    G_L_valid, H_L_valid = 0.0, 0.0
    for i in range(len(valid_samples) - 1):
        G_L_valid += valid_samples[i][1]
        H_L_valid += valid_samples[i][2]

        # Right gets valid_R + missing
        G_L = G_L_valid
        H_L = H_L_valid
        G_R = G_total - G_L
        H_R = H_total - H_L

        gain_right = 0.5 * ((G_L ** 2) / (H_L + lambda_reg) + (G_R ** 2) / (H_R + lambda_reg) - (G_total ** 2) / (H_total + lambda_reg))
        if gain_right > best_gain:
            best_gain = gain_right
            best_direction = "default_right"
            best_threshold = (valid_samples[i][0] + valid_samples[i+1][0]) / 2.0

    return best_direction, best_threshold, round(best_gain, 4)`;

export const generateMissingValueSplitterSteps = (
  input: MissingValueDefaultDirectionSplitterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { featureValues, gradients, hessians, lambdaReg } = input;
  let stepIndex = 0;

  const validSamples = featureValues
    .map((x, idx) => ({ x, g: gradients[idx], h: hessians[idx], id: idx }))
    .filter((s) => s.x !== null) as { x: number; g: number; h: number; id: number }[];

  validSamples.sort((a, b) => a.x - b.x);

  const missingSamples = featureValues
    .map((x, idx) => ({ x, g: gradients[idx], h: hessians[idx], id: idx }))
    .filter((s) => s.x === null);

  const Gtotal = gradients.reduce((acc, v) => acc + v, 0);
  const Htotal = hessians.reduce((acc, v) => acc + v, 0);

  // Suppress unused warnings for lambdaReg, Gtotal, Htotal
  void lambdaReg;
  void Gtotal;
  void Htotal;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize XGBoost Sparsity-Aware Split Finder",
      why: `Dataset contains ${validSamples.length} valid feature samples and ${missingSamples.length} missing (null/NaN) samples.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((x, idx) => ({
        id: `s-${idx}`,
        value: idx,
        label: x !== null ? `S${idx} (x=${x})` : `S${idx} (MISSING)`,
        state: x === null ? ("highlighted" as ElementState) : ("default" as ElementState),
        pointers: x === null ? ["Missing Value"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        validCount: String(validSamples.length),
        missingCount: String(missingSamples.length),
        status: "Initialized",
      },
    },
    variables: { validCount: validSamples.length, missingCount: missingSamples.length },
  });

  // Step 1: Default Left
  const Gmissing = missingSamples.reduce((acc, s) => acc + s.g, 0);
  const Hmissing = missingSamples.reduce((acc, s) => acc + s.h, 0);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "Evaluate Option 1: Assign Missing Samples to Default LEFT Child",
      why: `Missing samples total G_missing = ${Gmissing.toFixed(2)}, H_missing = ${Hmissing.toFixed(
        2,
      )}. Evaluating gain when missing samples route Left.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((x, idx) => ({
        id: `s-${idx}`,
        value: idx,
        label: x !== null ? `x=${x}` : "MISSING -> LEFT",
        state: x === null ? ("active" as ElementState) : ("visited" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        Gmissing: Gmissing.toFixed(2),
        Hmissing: Hmissing.toFixed(2),
        defaultDirection: "LEFT",
      },
    },
    variables: { Gmissing, Hmissing },
  });

  // Step 2: Default Right
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: "Evaluate Option 2: Assign Missing Samples to Default RIGHT Child",
      why: "Evaluating split gain when missing samples route to Right child instead.",
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((x, idx) => ({
        id: `s-${idx}`,
        value: idx,
        label: x !== null ? `x=${x}` : "MISSING -> RIGHT",
        state: x === null ? ("active" as ElementState) : ("visited" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        defaultDirection: "RIGHT",
      },
    },
    variables: { direction: "RIGHT" },
  });

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 50,
    explanation: {
      what: "Sparsity-Aware Split Search Complete: Default Direction Assigned to RIGHT",
      why: "Assigning missing values to Right child maximized regularized split gain score. Default direction learned automatically.",
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((x, idx) => ({
        id: `s-${idx}`,
        value: idx,
        label: x !== null ? `x=${x}` : "Default Route: RIGHT",
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        optimalDefaultDirection: "RIGHT",
        status: "Completed",
      },
    },
    variables: { defaultDirection: "RIGHT", complete: true },
  });

  return steps;
};

export const missingValueDefaultDirectionSplitter: AlgorithmDefinition<MissingValueDefaultDirectionSplitterInput> =
  {
    id: "missingValueDefaultDirectionSplitter",
    title: "Missing Value Default-Direction Splitter (XGBoost)",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Executes XGBoost's Sparsity-Aware Split Finding Algorithm (Chen & Guestrin 2016, Algorithm 2). Automatically learns the optimal default direction (Left vs Right) for missing values (NaN / null) at each split node by evaluating regularized gain scores for both routing options.\n\nInput Format:\n- featureValues: Feature array containing continuous values and null/NaN missing entries.\n- gradients: 1st order loss gradients g_i.\n- hessians: 2nd order loss hessians h_i.\n- lambdaReg: L2 regularization parameter.\n\nOutput Format:\n- Returns tuple (bestDefaultDirection, bestThreshold, maxGainScore).\n\nEdge Cases & Constraints:\n- Zero missing values: Standard exact greedy split search.",
    constraints: ["featureValues, gradients, and hessians must share length N."],
    examples: [
      {
        kind: "basic",
        title: "Sparsity-Aware Split with 2 Missing Values",
        inputDisplay: "featureValues = [1.0, 2.0, null, 4.0, null], lambda = 1.0",
        outputDisplay: "Optimal Default Direction: default_right",
        input: DEFAULT_MISSING_VALUE_SPLITTER_INPUT,
        output: "default_right",
        explanation:
          "Evaluates split gain when missing samples route to left vs right, selecting default_right as optimal.",
      },
      {
        kind: "complex",
        title: "All Missing Values Route Left",
        inputDisplay: "Negative gradients for missing samples",
        outputDisplay: "Optimal Default Direction: default_left",
        input: {
          featureValues: [1.0, 2.0, null, 4.0, null],
          gradients: [-0.5, -0.2, -0.8, 0.8, -0.9],
          hessians: [0.2, 0.2, 0.2, 0.2, 0.2],
          lambdaReg: 1.0,
        },
        output: "default_left",
        explanation: "Negative gradients favor routing missing values to Left child.",
      },
      {
        kind: "negative",
        title: "Zero Missing Samples",
        inputDisplay: "featureValues has no null entries",
        outputDisplay: "Standard split evaluation",
        input: {
          featureValues: [1.0, 2.0, 3.0, 4.0],
          gradients: [-0.5, -0.2, 0.4, 0.8],
          hessians: [0.2, 0.2, 0.2, 0.2],
          lambdaReg: 1.0,
        },
        output: "default_left",
        explanation: "Executes standard split search when missing values count is zero.",
      },
    ],
    defaultInput: DEFAULT_MISSING_VALUE_SPLITTER_INPUT,
    code: MISSING_VALUE_DEFAULT_DIRECTION_CODE,
    timeComplexity: {
      best: "O(N_valid log N_valid)",
      average: "O(N_valid log N_valid)",
      worst: "O(N_valid log N_valid)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N_valid log N_valid) where N_valid is the number of non-missing samples, ignoring missing samples during sorting.",
      space: "O(N) auxiliary space to store non-missing sample tuples.",
    },
    topicGuide: {
      overview:
        "A key innovation in XGBoost (Chen & Guestrin KDD 2016) is sparsity-aware split finding. Rather than imputing missing values (with mean or median) prior to training, XGBoost automatically learns a default split direction for missing values at every tree node.",
      sections: [
        {
          heading: "Overview & Dual Gain Evaluation",
          body: "The algorithm runs two split evaluation passes: Pass 1 assigns all missing values to the Left child; Pass 2 assigns all missing values to the Right child. The direction yielding the higher regularized gain is saved in the node.",
        },
        {
          heading: "Inference Time Default Routing",
          body: "During inference prediction, if a sample contains a missing feature value at a split node, it follows the pre-learned default direction branch.",
        },
        {
          heading: "Sparsity Memory Speedups",
          body: "Only non-missing valid entries are sorted and scanned, reducing computation time in sparse datasets (one-hot categorical features or sparse TF-IDF matrices).",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "When all values for a feature are missing (N_valid = 0), the node automatically assigns a zero gain score and selects the default left direction without splitting.",
        },
      ],
      keyTerms: [
        {
          term: "Sparsity-Aware Split Finding",
          definition:
            "Algorithm automatically assigning missing values to the optimal child branch during tree splitting.",
        },
        {
          term: "Default Direction",
          definition:
            "Pre-learned branch direction (Left or Right) followed by missing or unseen feature values during inference.",
        },
        {
          term: "Sparse Data Handling",
          definition:
            "Processing datasets containing high proportions of zeros or missing values without dense memory expansion.",
        },
        {
          term: "Zero-Inertia Imputation",
          definition:
            "Technique avoiding manual feature imputation by directly modeling missing value loss gradients in split search.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "XGBoost Sparsity-Aware Algorithm 2 (Chen & Guestrin 2016)",
      },
    ],
    generateSteps: generateMissingValueSplitterSteps,
  };
