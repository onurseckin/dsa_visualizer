import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SoftmaxRowNormalizeInput {
  logits?: number[];
  data?: number[];
  target?: number;
}

export const SOFTMAXROWNORMALIZE_CODE = `import math

def safe_softmax_row_normalize(logits: list[float]) -> tuple[list[float], float, float]:
    max_logit = max(logits)
    exp_vals = [math.exp(x - max_logit) for x in logits]
    lse_sum = sum(exp_vals)
    probabilities = [val / lse_sum for val in exp_vals]
    return probabilities, max_logit, lse_sum`;

export const DEFAULT_SOFTMAXROWNORMALIZE_INPUT: SoftmaxRowNormalizeInput = {
  logits: [1.2, -0.5, 3.4, 0.8, -2.1, 4.5, 2.0, -1.0],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateSoftmaxRowNormalizeSteps = (
  input: SoftmaxRowNormalizeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const logits = input?.logits ?? DEFAULT_SOFTMAXROWNORMALIZE_INPUT.logits!;
  const N = logits.length;

  const matrixValues: string[][] = Array.from({ length: N }, () =>
    Array.from({ length: 4 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: N }, () =>
    Array.from({ length: 4 }, () => "default"),
  );

  for (let i = 0; i < N; i++) {
    matrixValues[i][0] = String(logits[i]);
    matrixStates[i][0] = "pivot";
  }

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < 4; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Item ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: N,
      cols: 4,
      title: `Safe Softmax Row Normalization Tensor (${N} Logits)`,
      rowHeaders: Array.from({ length: N }, (_, i) => `x[${i}]`),
      colHeaders: ["Logit x_i", "Centered (x_i - m)", "Exp exp(x_i - m)", "Probability p_i"],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          num_logits: N,
          active_element: activeR !== undefined ? `x[${activeR}]` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Softmax Row Normalizer",
    "Loading math library and configuring safe Softmax normalization parameters.",
    { N },
  );

  addStep(
    3,
    "Call safe_softmax_row_normalize Function",
    `Initiating numerically stable Softmax normalization for ${N} logit scores.`,
    { N },
  );

  const maxLogit = Math.max(...logits);
  const maxIdx = logits.indexOf(maxLogit);

  addStep(
    4,
    `Compute Max Logit Reduction: max_logit = max(logits) -> ${maxLogit}`,
    `Found maximum logit scalar ${maxLogit} at index ${maxIdx} to prevent IEEE 754 float overflow.`,
    { maxLogit, maxIdx },
    maxIdx,
    0,
  );

  matrixStates[maxIdx][0] = "active";

  const expVals: number[] = [];
  for (let i = 0; i < N; i++) {
    const centered = logits[i] - maxLogit;
    const expVal = Math.exp(centered);
    expVals.push(expVal);

    matrixValues[i][1] = String(+centered.toFixed(2));
    matrixStates[i][1] = "compared";
    matrixValues[i][2] = String(+expVal.toFixed(4));
    matrixStates[i][2] = "compared";

    addStep(
      5,
      `Subtract Max and Exponentiate x[${i}]: exp(${logits[i]} - ${maxLogit}) = ${expVal.toFixed(4)}`,
      `Computed centered exponent for index ${i}: exp(${centered.toFixed(2)}) = ${expVal.toFixed(4)}.`,
      { i, centered: +centered.toFixed(2), expVal: +expVal.toFixed(4) },
      i,
      2,
    );
  }

  const lseSum = expVals.reduce((a, b) => a + b, 0);

  addStep(
    6,
    `Compute Partition Denominator Sum: lse_sum = sum(exp_vals) -> ${lseSum.toFixed(4)}`,
    `Calculated Log-Sum-Exp normalization denominator sum = ${lseSum.toFixed(4)}.`,
    { lseSum: +lseSum.toFixed(4) },
  );

  const probabilities: number[] = [];
  for (let i = 0; i < N; i++) {
    const p = expVals[i] / lseSum;
    probabilities.push(p);

    matrixValues[i][3] = String(+p.toFixed(4));
    matrixStates[i][3] = "sorted";

    addStep(
      7,
      `Normalize Probability p[${i}] = exp_vals[${i}] / lse_sum = ${p.toFixed(4)}`,
      `Normalized logit ${i} to probability ${p.toFixed(4)} (${(p * 100).toFixed(2)}%).`,
      { i, p: +p.toFixed(4), pct: +(p * 100).toFixed(2) },
      i,
      3,
    );
  }

  addStep(
    8,
    "Execution Complete",
    `Successfully normalized ${N} logit scores into a valid probability distribution summing to 1.0!`,
    { completed: true, maxLogit, lseSum: +lseSum.toFixed(4) },
  );

  return steps;
};

const SOFTMAXROWNORMALIZE_TRIVIA: TriviaMeta = {
  skipLines: [2],
  distractors: [
    "exp_vals = [math.exp(x) for x in logits]",
    "probabilities = [val / max_logit for val in exp_vals]",
    "lse_sum = max(exp_vals)",
  ],
  hints: [
    {
      line: 4,
      hint: "Find maximum logit max_logit = max(logits) to prevent exp() float overflow.",
    },
    { line: 5, hint: "Subtract max_logit before exponentiation: math.exp(x - max_logit)." },
    {
      line: 7,
      hint: "Divide each exponentiated value by lse_sum to normalize probabilities to 1.0.",
    },
  ],
  lineExplanations: {
    1: "Imports Python math library.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for safe_softmax_row_normalize function.",
    4: "Calculates maximum logit scalar max_logit = max(logits) across vector.",
    5: "Subtracts max_logit and exponentiates each score exp_vals = [exp(x - max_logit)].",
    6: "Calculates lse_sum = sum(exp_vals) as partition denominator.",
    7: "Normalizes probabilities = [val / lse_sum for val in exp_vals].",
    8: "Returns tuple containing (probabilities, max_logit, lse_sum).",
  },
};

export const softmaxRowNormalize: AlgorithmDefinition<SoftmaxRowNormalizeInput> = {
  id: "softmax-row-normalize",
  title: "Softmax Row Normalizer",
  topicIds: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  description:
    "Softmax Row Normalization converts a vector of un-normalized logit scores $x \\in \\mathbb{R}^N$ into a probability distribution $p \\in [0, 1]^N$ where $\\sum_{i=1}^N p_i = 1.0$. Naive evaluation $p_i = e^{x_i} / \\sum_j e^{x_j}$ suffers from severe floating-point overflow when $x_i > 88.7$ in IEEE 754 float32 ($e^{88.7} > 3.4 \\times 10^{38}$).\n\nSafe Softmax subtracts the maximum logit $m = \\max_j x_j$ before exponentiation:\n\n$$p_i = \\frac{e^{x_i - m}}{\\sum_{j=1}^N e^{x_j - m}}$$\n\nSince $x_i - m \\le 0$, every exponent $e^{x_i - m} \\in (0, 1]$, guaranteeing complete numerical stability against overflow.\n\n### Step-by-Step Intuition\n1. **Max Logit Reduction**: Find $m = \\max_j x_j$ across logit vector.\n2. **Shifted Exponentiation**: Compute $e^{x_i - m} \\le 1.0$ for each element.\n3. **Partition Normalization**: Sum exponents $\\ell = \\sum_j e^{x_j - m}$ and divide each term to produce $p_i$.\n\n### Complexity & Performance\n- **Time**: $\\mathcal{O}(N)$ requiring two linear passes over $N$ elements.\n- **Space**: $\\mathcal{O}(N)$ auxiliary memory for normalized probabilities.",
  constraints: ["1 <= logits.length <= 1000"],
  examples: [
    {
      kind: "basic",
      title: "Safe Softmax Row Normalization",
      inputDisplay: "logits (8 values)",
      outputDisplay: "Probabilities vector summing to 1.0, max_logit = 4.5",
      input: DEFAULT_SOFTMAXROWNORMALIZE_INPUT,
      output: "Probability distribution summing to 1.0",
      explanation: "Subtracts max logit m=4.5 before exponentiating, ensuring zero overflow.",
    },
  ],
  defaultInput: DEFAULT_SOFTMAXROWNORMALIZE_INPUT,
  code: SOFTMAXROWNORMALIZE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "$\\mathcal{O}(N)$ linear time across two passes (1 pass max reduction, 1 pass sum-exp normalization).",
    space: "$\\mathcal{O}(N)$ auxiliary space to store normalized probabilities.",
  },
  topicGuide: {
    overview:
      "Softmax row normalization is the core non-linear activation function in self-attention matrices. Its numerical stability and GPU hardware acceleration (via warp shuffle reductions) are essential for deep neural network training.\n\n$$p_i = \\frac{e^{x_i - \\max_j x_j}}{\\sum_{k} e^{x_k - \\max_j x_j}}$$",
    sections: [
      {
        heading: "Core Concept & Mathematical Shift Invariance",
        body: "Softmax maps R^N to standard probability simplex. Mathematically, Softmax(x - c) = Softmax(x) for any scalar shift c. Setting c = max_j x_j forces all exponents into (-inf, 0], eliminating overflow completely.",
      },
      {
        heading: "Systems & Hardware Acceleration",
        body: "In CUDA kernels, row-wise Softmax reduction uses warp shuffle instructions (__shfl_xor_sync) to compute m = max_j x_j and l = sum_j e^(x_j - m) across 32 threads in 5 clock cycles without DRAM access.",
      },
      {
        heading: "Online Softmax in FlashAttention",
        body: "Online Softmax (Milakov & Gimelshein 2018, FlashAttention) merges the max reduction and sum-exp computation into a single tile pass by updating running scale factors e^(m_old - m_new).",
      },
    ],
    keyTerms: [
      {
        term: "Safe Softmax",
        definition:
          "Subtracting the maximum logit m = max_j x_j prior to exponentiation to prevent numerical overflow.",
      },
      {
        term: "Log-Sum-Exp (LSE)",
        definition: "The log-sum-exp normalization factor ln(sum_j e^(x_j - m)) + m.",
      },
      {
        term: "Probability Simplex",
        definition: "The geometric space of vectors with non-negative entries summing to 1.0.",
      },
    ],
  },
  trivia: SOFTMAXROWNORMALIZE_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  generateSteps: generateSoftmaxRowNormalizeSteps,
};
