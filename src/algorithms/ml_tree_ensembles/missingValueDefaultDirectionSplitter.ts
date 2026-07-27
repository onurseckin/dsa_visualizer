import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MissingValueDefaultDirectionSplitterInput {
  featureValues: (number | null)[];
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_MISSING_VALUE_SPLITTER_INPUT: MissingValueDefaultDirectionSplitterInput = {
  featureValues: [1.2, 2.0, null, 3.1, null, 4.5, 5.0, null, 6.2, 7.5, null, 8.8, 9.4, 10.1],
  gradients: [-0.6, -0.4, 0.3, -0.1, 0.5, 0.2, 0.6, -0.2, 0.4, 0.7, -0.5, 0.9, 0.3, -0.8],
  hessians: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  lambdaReg: 1.0,
  data: [1.2, 2.0, 3.1, 4.5, 5.0, 6.2, 7.5, 8.8, 9.4, 10.1],
  target: 1,
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
  const featureValues = input.featureValues || DEFAULT_MISSING_VALUE_SPLITTER_INPUT.featureValues;
  const gradients = input.gradients || DEFAULT_MISSING_VALUE_SPLITTER_INPUT.gradients;
  const hessians = input.hessians || DEFAULT_MISSING_VALUE_SPLITTER_INPUT.hessians;
  const lambdaReg = input.lambdaReg ?? 1.0;
  let stepIndex = 0;

  const Gtotal = gradients.reduce((a, b) => a + b, 0);
  const Htotal = hessians.reduce((a, b) => a + b, 0);

  const Gmissing = featureValues.reduce<number>(
    (acc, x, i) => (x === null ? acc + gradients[i] : acc),
    0,
  );
  const Hmissing = featureValues.reduce<number>(
    (acc, x, i) => (x === null ? acc + hessians[i] : acc),
    0,
  );

  const validSamples = featureValues
    .map((x, i) => ({ x, g: gradients[i], h: hessians[i], id: i }))
    .filter((s): s is { x: number; g: number; h: number; id: number } => s.x !== null)
    .sort((a, b) => a.x - b.x);

  const getSnapshot = (
    activeValidIdx: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: featureValues.map((x, i) => ({
        id: `s-${i}`,
        value: x === null ? -99 : Math.round(x * 10),
        label: x === null ? `S${i}: NaN` : `S${i}: ${x}`,
        state: x === null ? ("compare" as ElementState) : i === activeValidIdx ? ("active" as ElementState) : ("default" as ElementState),
      })),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeValidIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeValidIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "XGBoost Sparsity-Aware Algorithm 2",
          "Total Samples N": String(featureValues.length),
          "Valid Samples Count": String(validSamples.length),
          "Missing Samples Count": String(featureValues.length - validSamples.length),
          "G_missing": Gmissing.toFixed(4),
          "H_missing": Hmissing.toFixed(4),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "XGBoost Sparsity-Aware Split Finding Entry",
    `Started Sparsity-Aware Algorithm 2 on ${featureValues.length} samples (${validSamples.length} valid, ${featureValues.length - validSamples.length} missing).`,
    { n: featureValues.length, validCount: validSamples.length },
  );

  // Step 2: G_total (7)
  addStep(
    7,
    `Calculate Total Gradient G_total = ${Gtotal.toFixed(4)}`,
    `Evaluated total gradient sum G_total = ${Gtotal.toFixed(4)}.`,
    { Gtotal },
  );

  // Step 3: H_total (8)
  addStep(
    8,
    `Calculate Total Hessian H_total = ${Htotal.toFixed(4)}`,
    `Evaluated total hessian sum H_total = ${Htotal.toFixed(4)}.`,
    { Htotal },
  );

  // Step 4: Extract valid samples (11)
  addStep(
    11,
    `Separate Non-Missing Valid Samples (${validSamples.length} samples)`,
    `Filtered out missing (null) values. Retained ${validSamples.length} valid samples.`,
    { validCount: validSamples.length },
  );

  // Step 5: Sort valid samples (12)
  addStep(
    12,
    `Sort Valid Samples by Feature Value x`,
    `Sorted ${validSamples.length} valid samples: [${validSamples.map((s) => s.x).join(", ")}].`,
    { sorted: true },
  );

  // Step 6: Init best_gain, best_direction, best_threshold (14..16)
  let bestGain = -Infinity;
  let bestDirection = "default_left";
  let bestThreshold: number | null = null;

  addStep(
    14,
    "Initialize best_gain = -inf",
    "Set best_gain accumulator to negative infinity.",
    { best_gain: "-inf" },
  );

  addStep(
    15,
    'Initialize best_direction = "default_left"',
    'Set default direction fallback to "default_left".',
    { best_direction: "default_left" },
  );

  addStep(
    16,
    "Initialize best_threshold = None",
    "Set best_threshold to None.",
    { best_threshold: "None" },
  );

  // Option 1: Default LEFT (18..21)
  let GLValid = 0.0;
  let HLValid = 0.0;

  addStep(
    19,
    "Option 1: Evaluate Default Direction LEFT (Missing -> Left Child)",
    "Scanning valid sample boundaries with all missing value samples assigned to Left child node.",
    { defaultDirection: "default_left" },
  );

  addStep(
    20,
    `Sum Missing Gradients G_missing = ${Gmissing.toFixed(4)}`,
    `Evaluated total gradient of missing samples G_missing = ${Gmissing.toFixed(4)}.`,
    { Gmissing },
  );

  addStep(
    21,
    `Sum Missing Hessians H_missing = ${Hmissing.toFixed(4)}`,
    `Evaluated total hessian of missing samples H_missing = ${Hmissing.toFixed(4)}.`,
    { Hmissing },
  );

  // Loop Option 1
  for (let i = 0; i < validSamples.length - 1; i++) {
    const s = validSamples[i];
    GLValid += s.g;
    HLValid += s.h;

    const GL = GLValid + Gmissing;
    const HL = HLValid + Hmissing;
    const GR = Gtotal - GL;
    const HR = Htotal - HL;

    const scoreL = (GL * GL) / (HL + lambdaReg);
    const scoreR = (GR * GR) / (HR + lambdaReg);
    const scoreP = (Gtotal * Gtotal) / (Htotal + lambdaReg);
    const gainLeft = 0.5 * (scoreL + scoreR - scoreP);

    addStep(
      33,
      `Option 1 (Default Left) Boundary i=${i}: x=${s.x} -> Gain = ${gainLeft.toFixed(4)}`,
      `Evaluated split gain for default_left at boundary x=${s.x}: Gain = ${gainLeft.toFixed(4)}.`,
      { i, x: s.x, gainLeft },
      i,
    );

    if (gainLeft > bestGain) {
      bestGain = gainLeft;
      bestDirection = "default_left";
      bestThreshold = (validSamples[i].x + validSamples[i + 1].x) / 2.0;

      addStep(
        35,
        `New Best Split Found (Default Left)! Threshold t = ${bestThreshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}`,
        `Updated best split: default_left, threshold t = ${bestThreshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}.`,
        { bestGain, bestThreshold, bestDirection },
        i,
      );
    }
  }

  // Option 2: Default RIGHT (40..42)
  GLValid = 0.0;
  HLValid = 0.0;

  addStep(
    40,
    "Option 2: Evaluate Default Direction RIGHT (Missing -> Right Child)",
    "Scanning valid sample boundaries with all missing value samples assigned to Right child node.",
    { defaultDirection: "default_right" },
  );

  for (let i = 0; i < validSamples.length - 1; i++) {
    const s = validSamples[i];
    GLValid += s.g;
    HLValid += s.h;

    const GL = GLValid;
    const HL = HLValid;
    const GR = Gtotal - GL;
    const HR = Htotal - HL;

    const scoreL = (GL * GL) / (HL + lambdaReg);
    const scoreR = (GR * GR) / (HR + lambdaReg);
    const scoreP = (Gtotal * Gtotal) / (Htotal + lambdaReg);
    const gainRight = 0.5 * (scoreL + scoreR - scoreP);

    addStep(
      51,
      `Option 2 (Default Right) Boundary i=${i}: x=${s.x} -> Gain = ${gainRight.toFixed(4)}`,
      `Evaluated split gain for default_right at boundary x=${s.x}: Gain = ${gainRight.toFixed(4)}.`,
      { i, x: s.x, gainRight },
      i,
    );

    if (gainRight > bestGain) {
      bestGain = gainRight;
      bestDirection = "default_right";
      bestThreshold = (validSamples[i].x + validSamples[i + 1].x) / 2.0;

      addStep(
        53,
        `New Best Split Found (Default Right)! Threshold t = ${bestThreshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}`,
        `Updated best split: default_right, threshold t = ${bestThreshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}.`,
        { bestGain, bestThreshold, bestDirection },
        i,
      );
    }
  }

  // Final step (57)
  const roundedGain = Math.round(bestGain * 10000) / 10000;
  addStep(
    57,
    `Execution Complete: Return (${bestDirection}, t=${bestThreshold?.toFixed(2)}, Gain=${roundedGain})`,
    `Optimal sparsity-aware split found: Direction = ${bestDirection}, Threshold t = ${bestThreshold?.toFixed(2)}, Max Gain = ${roundedGain}.`,
    { bestDirection, bestThreshold: bestThreshold ?? 0, maxGain: roundedGain, completed: true },
  );

  return steps;
};

const MISSING_VALUE_DEFAULT_DIRECTION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 9, 10, 13, 17, 18, 22, 23, 24, 25, 26, 27, 28, 29, 30, 36, 37, 38, 39, 44, 45, 46, 47, 48, 49, 55, 56],
  distractors: [
    "best_direction = 'drop_missing'",
    "G_L = G_L_valid - G_missing",
    "missing_values = replace_null_with_zero(feature_values)",
    "gain_right = gain_left * 2.0",
  ],
  hints: [
    { line: 28, hint: "Filter out missing (None/null) values before sorting valid samples." },
    { line: 45, hint: "Option 1 (Default Left): Add G_missing and H_missing to G_L and H_L." },
    { line: 65, hint: "Option 2 (Default Right): Add G_missing and H_missing to G_R and H_R." },
  ],
  lineExplanations: {
    1: "Defines entry point for missing_value_default_direction_split function implementing XGBoost Algorithm 2.",
    2: "Docstring opening delimiter tag.",
    3: "Describes XGBoost Sparsity-Aware Split Finding Algorithm (Algorithm 2 in Chen & Guestrin 2016).",
    4: "Docstring detailing evaluating split gain assigning ALL missing values to Left vs Right default directions.",
    5: "Docstring return signature tuple detail.",
    6: "Docstring closing delimiter tag.",
    7: "Sums total gradient G_total across all samples (including missing).",
    8: "Sums total hessian H_total across all samples (including missing).",
    9: "Blank line before valid sample extraction.",
    10: "Comment for separating non-missing valid samples from missing samples.",
    11: "Extracts valid non-missing samples (x is not None) as (x, g, h) tuples.",
    12: "Sorts valid samples in ascending order by feature value x.",
    13: "Blank line before accumulators initialization.",
    14: "Initializes best_gain to negative infinity.",
    15: "Initializes best_direction to 'default_left'.",
    16: "Initializes best_threshold to None.",
    17: "Blank line before Option 1 section.",
    18: "Comment for Option 1: Default direction LEFT (missing samples added to Left child G_L, H_L).",
    19: "Initializes valid left gradient G_L_valid = 0.0 and valid left hessian H_L_valid = 0.0.",
    20: "Sums gradient G_missing across all missing (None/null) samples.",
    21: "Sums hessian H_missing across all missing (None/null) samples.",
    22: "Blank line before Option 1 boundary search loop.",
    23: "Iterates over valid sample boundary index i from 0 to len(valid_samples) - 2.",
    24: "Accumulates sample gradient valid_samples[i][1] into G_L_valid.",
    25: "Accumulates sample hessian valid_samples[i][2] into H_L_valid.",
    26: "Blank line before Option 1 total sums assignment.",
    27: "Comment for Left getting valid + missing samples.",
    28: "Computes total left gradient G_L = G_L_valid + G_missing.",
    29: "Computes total left hessian H_L = H_L_valid + H_missing.",
    30: "Computes total right gradient G_R = G_total - G_L.",
    31: "Computes total right hessian H_R = H_total - H_L.",
    32: "Blank line before Option 1 gain calculation.",
    33: "Evaluates XGBoost split gain for Option 1 (Default Left).",
    34: "Checks if gain_left exceeds current best_gain.",
    35: "Updates best_gain to gain_left.",
    36: "Updates best_direction to 'default_left'.",
    37: "Calculates midpoint decision threshold best_threshold = (valid_samples[i][0] + valid_samples[i+1][0]) / 2.0.",
    38: "Blank line before Option 2 section.",
    39: "Comment for Option 2: Default direction RIGHT (missing samples added to Right child G_R, H_R).",
    40: "Resets valid left accumulators G_L_valid = 0.0 and H_L_valid = 0.0.",
    41: "Iterates over valid sample boundary index i from 0 to len(valid_samples) - 2.",
    42: "Accumulates sample gradient valid_samples[i][1] into G_L_valid.",
    43: "Accumulates sample hessian valid_samples[i][2] into H_L_valid.",
    44: "Blank line before Option 2 total sums assignment.",
    45: "Comment for Right getting valid_R + missing samples.",
    46: "Sets left gradient G_L = G_L_valid.",
    47: "Sets left hessian H_L = H_L_valid.",
    48: "Computes total right gradient G_R = G_total - G_L (which includes G_missing).",
    49: "Computes total right hessian H_R = H_total - H_L (which includes H_missing).",
    50: "Blank line before Option 2 gain calculation.",
    51: "Evaluates XGBoost split gain for Option 2 (Default Right).",
    52: "Checks if gain_right exceeds current best_gain.",
    53: "Updates best_gain to gain_right.",
    54: "Updates best_direction to 'default_right'.",
    55: "Calculates midpoint decision threshold best_threshold = (valid_samples[i][0] + valid_samples[i+1][0]) / 2.0.",
    56: "Blank line separating Option 2 loop from return statement.",
    57: "Returns tuple of (best_direction, best_threshold, rounded best_gain).",
  },
};

export const missingValueDefaultDirectionSplitter: AlgorithmDefinition<MissingValueDefaultDirectionSplitterInput> =
  {
    id: "missingValueDefaultDirectionSplitter",
    title: "Sparsity-Aware Missing Value Splitter",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "The Sparsity-Aware Missing Value Splitter implements **XGBoost Algorithm 2** (Chen & Guestrin 2016) for handling missing data, zero-entries, and sparse matrices during decision tree split search. Instead of imputing missing values (mean/median imputation), Algorithm 2 automatically learns an optimal **default branch direction** (Default Left or Default Right) for every internal decision node by evaluating split gains under both assignments.\n\n### Why It Exists\nReal-world tabular data frequently contains missing values (NaNs, unrecorded fields, one-hot zero entries). Standard decision trees require complete data. XGBoost's sparsity-aware algorithm handles sparse inputs natively, achieving 10x-50x speedups on sparse matrices while learning optimal default routing for unseen missing data at inference time.\n\n### Mathematical Formulation\nGiven non-missing valid sample set $I_{valid}$ and missing sample set $I_{missing}$ with total sums $G_{total}, H_{total}$ and missing sums $G_{missing} = \\sum_{i \\in I_{missing}} g_i, H_{missing} = \\sum_{i \\in I_{missing}} h_i$:\n\n$$\\mathbf{\\text{Option 1 (Default Left)}}: \\quad G_L = G_{L, valid} + G_{missing}, \\quad H_L = H_{L, valid} + H_{missing}$$\n\n$$\\mathbf{\\text{Option 2 (Default Right)}}: \\quad G_L = G_{L, valid}, \\quad H_L = H_{L, valid}, \\quad G_R = G_{total} - G_L$$\n\n$$\\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{G_{total}^2}{H_{total} + \\lambda} \\right] - \\gamma$$\n\n$$\\text{Optimal Split} = \\arg\\max_{\\text{direction} \\in \\{\\text{left}, \\text{right}\\}, \\, t} \\text{Gain}(\\text{direction}, t)$$\n\n### Step-by-Step Intuition\n1. **Valid/Missing Separation**: Separate non-missing samples $I_{valid}$ from missing samples $I_{missing}$. Sort valid samples by feature value.\n2. **Missing Sum Accumulation**: Pre-calculate total missing gradients $G_{missing}$ and hessians $H_{missing}$.\n3. **Pass 1 (Default Left)**: Scan valid sample boundaries with all missing samples added to $G_L, H_L$. Record max gain $\\text{Gain}_{left}$.\n4. **Pass 2 (Default Right)**: Scan valid sample boundaries with all missing samples added to $G_R, H_R$. Record max gain $\\text{Gain}_{right}$.\n5. **Optimal Direction Selection**: Pick the overall maximum gain split and store its `default_direction` at the node.\n\n### Key Trade-Offs & Hardware Execution\n- **Inference Zero-Overhead**: During tree inference, if a sample contains a missing value $X[j] = \\text{NaN}$, it follows the node's stored `default_direction` in $O(1)$ time without imputation math.\n- **Sparse Matrix Linear Pass**: Scanning only non-missing entries reduces computational complexity from $O(N \\log N)$ to $O(N_{valid} \\log N_{valid})$.",
    constraints: [
      "1 <= N <= 1000000",
      "lambdaReg >= 0.0",
      "featureValues can contain null/NaN",
    ],
    examples: [
      {
        kind: "basic",
        title: "14-Sample Dataset with 4 Missing Null Values",
        inputDisplay: "14 samples (10 valid, 4 null), lambda = 1.0",
        outputDisplay: "Default Direction: default_right, Threshold t = 6.85, Gain = 0.8241",
        input: DEFAULT_MISSING_VALUE_SPLITTER_INPUT,
        output: "('default_right', 6.85, 0.8241)",
        explanation: "Evaluates split gain under both default_left and default_right missing assignments; default_right yields higher Gain.",
      },
    ],
    code: MISSING_VALUE_DEFAULT_DIRECTION_CODE,
    timeComplexity: {
      best: "O(N_{valid} \\log N_{valid})",
      average: "O(N_{valid} \\log N_{valid})",
      worst: "O(N_{valid} \\log N_{valid})",
    },
    spaceComplexity: "O(N_{valid})",
    complexityAnalysis: {
      time: "Sorting $N_{valid}$ non-missing samples takes $O(N_{valid} \\log N_{valid})$ time; two linear passes take $O(N_{valid})$ operations.",
      space: "Requires $O(N_{valid})$ memory to store valid non-missing sample structs.",
    },
    topicGuide: {
      overview:
        "The Sparsity-Aware Missing Value Splitter implements XGBoost Algorithm 2 to learn optimal default branch directions for missing data.",
      sections: [
        {
          heading: "Core Concept & XGBoost Algorithm 2",
          body: "XGBoost Algorithm 2 evaluates split gain under two default directions: assigning missing values to Left child vs Right child, selecting the direction yielding maximum Gain.",
        },
        {
          heading: "Handling Sparse & One-Hot Encoded Matrices",
          body: "Real-world tabular data is often highly sparse (90%+ zeros or missing entries). Algorithm 2 skips missing entries, computing splits purely over valid non-missing samples.",
        },
        {
          heading: "Zero-Overhead Inference Routing",
          body: "During inference, when a feature X[j] is missing or NaN, the tree engine follows the node's stored default_direction in O(1) time without needing imputation.",
        },
        {
          heading: "Edge Case Analysis & All-Missing Features",
          body: "If a feature has 0 valid samples (all values are missing), split gain is undefined, and the feature is skipped during tree building.",
        },
      ],
      keyTerms: [
        {
          term: "Sparsity-Aware Split Finding",
          definition: "XGBoost Algorithm 2 finding optimal splits over non-missing samples while learning default branch directions.",
        },
        {
          term: "Default Branch Direction",
          definition: "Stored node direction (default_left or default_right) followed when a feature value is missing or NaN.",
        },
        {
          term: "Missing Gradient Sum (G_missing)",
          definition: "Sum of 1st-order gradients across all missing value samples at a node.",
        },
        {
          term: "Imputation-Free Inference",
          definition: "Routing missing samples at inference time via default direction without computing mean/median imputation.",
        },
      ],
    },
    trivia: MISSING_VALUE_DEFAULT_DIRECTION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_MISSING_VALUE_SPLITTER_INPUT,
    generateSteps: generateMissingValueSplitterSteps,
  };
