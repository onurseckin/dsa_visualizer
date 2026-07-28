import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SingleHeadAttentionInput {
  q?: number[][]; // [seq_len, d_k]
  k?: number[][]; // [seq_len, d_k]
  v?: number[][]; // [seq_len, d_v]
}

export const SINGLEHEADATTENTIONMAP_CODE = `def single_head_attention(
    q: list[list[float]],
    k: list[list[float]],
    v: list[list[float]],
    scale: float
) -> tuple[list[list[float]], list[list[float]]]:
    import math

    seq_len = len(q)
    d_v = len(v[0])

    scores = []
    for i in range(seq_len):
        row_scores = [sum(qi * ki for qi, ki in zip(q[i], k[j])) * scale for j in range(seq_len)]
        scores.append(row_scores)

    weights = []
    for row in scores:
        max_val = max(row)
        exp_vals = [math.exp(sc - max_val) for sc in row]
        sum_exp = sum(exp_vals)
        weights.append([e / sum_exp for e in exp_vals])

    output = []
    for i in range(seq_len):
        out_row = [sum(weights[i][t] * v[t][j] for t in range(seq_len)) for j in range(d_v)]
        output.append(out_row)

    return weights, output`;

export const DEFAULT_SINGLEHEADATTENTIONMAP_INPUT: SingleHeadAttentionInput = {
  q: [
    [1.0, 0.0, 0.5],
    [0.0, 1.0, 0.5],
    [0.5, 0.5, 1.0],
  ],
  k: [
    [1.0, 0.0, 0.5],
    [0.0, 1.0, 0.5],
    [0.5, 0.5, 1.0],
  ],
  v: [
    [10.0, 5.0],
    [20.0, 15.0],
    [30.0, 25.0],
  ],
};

export const generateSingleHeadAttentionMapSteps = (
  input: SingleHeadAttentionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input?.q ?? DEFAULT_SINGLEHEADATTENTIONMAP_INPUT.q!;
  const K = input?.k ?? DEFAULT_SINGLEHEADATTENTIONMAP_INPUT.k!;
  const V = input?.v ?? DEFAULT_SINGLEHEADATTENTIONMAP_INPUT.v!;
  const seqLen = Q.length;
  const dK = Q[0].length;
  const dV = V[0].length;
  const scale = 1.0 / Math.sqrt(dK);

  const matrixValues: string[][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: seqLen }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: seqLen }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < seqLen; r++) {
      for (let c = 0; c < seqLen; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Q${r}_K${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: seqLen,
      cols: seqLen,
      title: `Single-Head Scaled Attention Map (N=${seqLen}, d_k=${dK}, d_v=${dV})`,
      rowHeaders: Array.from({ length: seqLen }, (_, i) => `Query ${i}`),
      colHeaders: Array.from({ length: seqLen }, (_, j) => `Key ${j}`),
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
          seq_len: seqLen,
          d_k: dK,
          d_v: dV,
          scale: scale.toFixed(4),
          active_pair:
            activeR !== undefined && activeC !== undefined ? `(Q${activeR}, K${activeC})` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Single-Head Attention Map Generator",
    "Initiating single-head scaled dot-product attention calculation.",
    { seqLen, dK, dV, scale: +scale.toFixed(4) },
  );

  addStep(
    7,
    "Import Math Module",
    "Loading exponential primitives for Softmax probability calculation.",
    { import: "math" },
  );

  addStep(
    9,
    `Get Sequence Length: seq_len = len(q) -> ${seqLen}`,
    `Input sequence token count N is ${seqLen}.`,
    { seqLen },
  );

  addStep(
    10,
    `Get Value Dimension: d_v = len(v[0]) -> ${dV}`,
    `Value projection dimension d_v is ${dV}.`,
    { dV },
  );

  addStep(
    12,
    "Initialize Scores Matrix Container",
    "Allocated top-level list to store raw attention score logits S = Q @ K.T * scale.",
    { scores: "[]" },
  );

  const scores: number[][] = [];

  for (let i = 0; i < seqLen; i++) {
    addStep(
      13,
      `Begin Score Computation for Query Token i=${i}`,
      `Computing row ${i} scaled inner products against all key tokens j=0..${seqLen - 1}.`,
      { i },
      i,
    );

    const rowScores: number[] = [];
    for (let j = 0; j < seqLen; j++) {
      let rawDot = 0;
      for (let dIdx = 0; dIdx < dK; dIdx++) {
        rawDot += Q[i][dIdx] * K[j][dIdx];
      }
      const sc = +(rawDot * scale).toFixed(3);
      rowScores.push(sc);

      matrixValues[i][j] = String(sc);
      matrixStates[i][j] = "compared";

      addStep(
        14,
        `Compute Score for Q[${i}] @ K[${j}].T * scale = ${sc}`,
        `Dot product ${rawDot.toFixed(2)} scaled by 1/sqrt(${dK}) = ${scale.toFixed(4)} yields logit ${sc}.`,
        { i, j, rawDot: +rawDot.toFixed(2), sc },
        i,
        j,
      );
    }

    scores.push(rowScores);

    addStep(
      15,
      `Append Logit Row ${i} to Scores Matrix`,
      `Stored completed score logits for query token ${i}: [${rowScores.join(", ")}].`,
      { i },
      i,
    );
  }

  addStep(
    17,
    "Initialize Weights Matrix Container",
    "Allocated top-level list to store Softmax-normalized attention weight probability distributions.",
    { weights: "[]" },
  );

  const weights: number[][] = [];

  for (let rIdx = 0; rIdx < scores.length; rIdx++) {
    const row = scores[rIdx];

    addStep(
      18,
      `Begin Softmax Normalization for Query Row ${rIdx}`,
      `Applying numerically stable online Softmax over row logits: [${row.join(", ")}].`,
      { rIdx },
      rIdx,
    );

    const maxVal = Math.max(...row);

    addStep(
      19,
      `Compute Row Max Logit: max_val = max(row) -> ${maxVal}`,
      `Subtracted max logit ${maxVal} for numerical float stability.`,
      { rIdx, maxVal },
      rIdx,
    );

    const expVals = row.map((sc) => Math.exp(sc - maxVal));

    addStep(
      20,
      `Compute Exponentiated Centered Logits: exp_vals = [exp(sc - max_val)]`,
      `Calculated unnormalized exponentials: [${expVals.map((e) => e.toFixed(3)).join(", ")}].`,
      { rIdx },
      rIdx,
    );

    const sumExp = expVals.reduce((a, b) => a + b, 0);

    addStep(
      21,
      `Compute Softmax Partition Sum: sum_exp = sum(exp_vals) -> ${sumExp.toFixed(3)}`,
      `Calculated normalization constant sum_exp = ${sumExp.toFixed(3)}.`,
      { rIdx, sumExp: +sumExp.toFixed(3) },
      rIdx,
    );

    const normalizedRow = expVals.map((e) => +(e / sumExp).toFixed(3));
    weights.push(normalizedRow);

    for (let cIdx = 0; cIdx < seqLen; cIdx++) {
      matrixValues[rIdx][cIdx] = String(normalizedRow[cIdx]);
      matrixStates[rIdx][cIdx] = "active";
    }

    addStep(
      22,
      `Append Softmax Normalized Weights Row ${rIdx}`,
      `Normalized probability distribution for query ${rIdx}: [${normalizedRow.join(", ")}].`,
      { rIdx },
      rIdx,
    );
  }

  addStep(
    24,
    "Initialize Output Matrix Container",
    "Allocated top-level list to store final contextualized Value output vectors O = Softmax(S) @ V.",
    { output: "[]" },
  );

  const output: number[][] = [];

  for (let i = 0; i < seqLen; i++) {
    addStep(
      25,
      `Begin Weighted Value Aggregation for Output Token i=${i}`,
      `Computing weighted sum of Value vectors V using Softmax probabilities of query ${i}.`,
      { i },
      i,
    );

    const outRow: number[] = [];
    for (let j = 0; j < dV; j++) {
      let val = 0;
      for (let t = 0; t < seqLen; t++) {
        val += weights[i][t] * V[t][j];
      }
      const roundedVal = +val.toFixed(3);
      outRow.push(roundedVal);

      addStep(
        26,
        `Compute Value Output Feature O[${i}][${j}] = ${roundedVal}`,
        `Aggregated feature ${j} across sequence context: sum(weights[${i}][t] * V[t][${j}]) = ${roundedVal}.`,
        { i, j, roundedVal },
        i,
      );
    }

    output.push(outRow);

    addStep(
      27,
      `Append Output Vector Row ${i} to Results Matrix`,
      `Stored contextualized representation vector for token ${i}: [${outRow.join(", ")}].`,
      { i },
      i,
    );
  }

  addStep(
    29,
    "Execution Complete",
    `Successfully computed Scaled Dot-Product Single-Head Attention weights and contextualized output tensor across ${seqLen} sequence tokens!`,
    { completed: true, seqLen, dK, dV },
  );

  return steps;
};

const SINGLEHEADATTENTIONMAP_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 8, 11, 16, 23, 28],
  distractors: [
    "row_scores = [sum(qi * ki for qi, ki in zip(q[i], k[j])) for j in range(seq_len)]",
    "exp_vals = [math.exp(sc) for sc in row]",
    "sum_exp = max(exp_vals)",
  ],
  hints: [
    { line: 14, hint: "Compute scaled dot products qi * ki * scale across query and key vectors." },
    { line: 19, hint: "Subtract max_val = max(row) for numerical float exponent stability." },
    { line: 26, hint: "Compute weighted sum sum(weights[i][t] * v[t][j]) across value dimension." },
  ],
  lineExplanations: {
    1: "Defines entry point for single_head_attention function.",
    2: "Specifies type annotation for Query input matrix Q of shape [seq_len, d_k].",
    3: "Specifies type annotation for Key input matrix K of shape [seq_len, d_k].",
    4: "Specifies type annotation for Value input matrix V of shape [seq_len, d_v].",
    5: "Specifies type annotation for dot product scaling factor scale.",
    6: "Specifies return tuple type for attention weights and output matrix.",
    7: "Imports math library for exponent calculations.",
    8: "Empty whitespace separator line.",
    9: "Reads sequence token length seq_len from Query matrix q.",
    10: "Reads Value feature vector dimension d_v from matrix v.",
    11: "Empty whitespace separator line.",
    12: "Initializes list container for collecting raw attention logit rows.",
    13: "Iterates over query token index i from 0 to seq_len - 1.",
    14: "Computes scaled query-key dot product logits across all key tokens j.",
    15: "Appends computed logit row to scores matrix.",
    16: "Empty whitespace separator line.",
    17: "Initializes list container for collecting Softmax attention weight rows.",
    18: "Iterates over each logit row in scores matrix.",
    19: "Finds maximum logit value max_val in current row for numerical stability.",
    20: "Computes exponentiated centered logits exp(sc - max_val) for row elements.",
    21: "Computes partition sum sum_exp of exponentiated logits across row.",
    22: "Divides exponentiated logits by sum_exp to produce normalized attention weights.",
    23: "Empty whitespace separator line.",
    24: "Initializes list container for collecting contextualized output vector rows.",
    25: "Iterates over output token index i from 0 to seq_len - 1.",
    26: "Computes weighted sum of Value vectors sum(weights[i][t] * v[t][j]) across d_v features.",
    27: "Appends completed output vector row to output matrix.",
    28: "Empty whitespace separator line.",
    29: "Returns tuple of attention weights matrix and contextualized output tensor.",
  },
};

export const singleHeadAttentionMap: AlgorithmDefinition<SingleHeadAttentionInput> = {
  id: "single-head-attention-map",
  title: "Single-Head Attention Map Generator",
  topicIds: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Scaled Dot-Product Attention (Vaswani et al., 2017) is the core operational building block of Transformer neural networks. Given Query matrix $Q \\in \\mathbb{R}^{N \\times d_k}$, Key matrix $K \\in \\mathbb{R}^{N \\times d_k}$, and Value matrix $V \\in \\mathbb{R}^{N \\times d_v}$, single-head attention maps input sequences into contextual representations:\n\n$$\\text{Attention}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$\n\nThe scaling factor $1/\\sqrt{d_k}$ compensates for dot-product variance growth under large feature dimensions $d_k$, preventing the Softmax gradient from vanishing in regions of extreme values.\n\n### Step-by-Step Intuition\n1. **Query-Key Projection**: Compute $S = Q K^T / \\sqrt{d_k}$ to measure token pair affinity.\n2. **Softmax Normalization**: Subtract max logit for float stability and apply row-wise Softmax to form probability weights $P$.\n3. **Value Aggregation**: Multiply weights $P$ by Value matrix $V$ to compute contextualized output embeddings $O = P V$.\n\n### Complexity & Performance\n- **Time**: $\\mathcal{O}(N^2 \\cdot d_k + N^2 \\cdot d_v)$ to compute raw logits $Q K^T$ and value weighted sum $P V$.\n- **Space**: $\\mathcal{O}(N^2 + N \\cdot d_v)$ to store $N \\times N$ attention weight matrix and output tensor.",
  constraints: ["1 <= seq_len <= 100", "1 <= d_k, d_v <= 64"],
  examples: [
    {
      kind: "basic",
      title: "3x3 Single-Head Attention",
      inputDisplay: "Q (3x3), K (3x3), V (3x2)",
      outputDisplay: "3x3 Attention Weights P, 3x2 Output O",
      input: DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
      output: "Attention weights matrix and output matrix",
      explanation:
        "Computes scaled dot-product attention logits, online softmax weights, and value output tensor.",
    },
  ],
  defaultInput: DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
  code: SINGLEHEADATTENTIONMAP_CODE,
  timeComplexity: {
    best: "O(N^2 * d_k + N^2 * d_v)",
    average: "O(N^2 * d_k + N^2 * d_v)",
    worst: "O(N^2 * d_k + N^2 * d_v)",
  },
  spaceComplexity: "O(N^2 + N * d_v)",
  complexityAnalysis: {
    time: "$\\mathcal{O}(N^2 \\cdot d_k + N^2 \\cdot d_v)$ to compute raw logits $Q K^T$ and value matrix product $P V$.",
    space:
      "$\\mathcal{O}(N^2 + N \\cdot d_v)$ auxiliary space for $N \\times N$ attention weights and output tensor.",
  },
  topicGuide: {
    overview:
      "Scaled Dot-Product Attention is the foundational building block of all modern Transformer architectures. By allowing every token to attend to every other token, attention captures complex long-range dependencies.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given queries Q in R^(N x d_k), keys K in R^(N x d_k), values V in R^(N x d_v), raw logits are S = Q K^T / sqrt(d_k). Attention weights are P = Softmax(S) in R^(N x N). Output is O = P V in R^(N x d_v).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Standard attention materializes S in R^(N x N) in GPU HBM, consuming O(N^2) memory and creating a severe DRAM bandwidth bottleneck. Tiling algorithms like FlashAttention avoid materializing S in DRAM by fusing matrix multiplication, online softmax, and value reduction inside fast GPU SRAM.",
      },
      {
        heading: "Softmax Numerical Stability",
        body: "Subtracting max logit m_i = max_j S_{ij} before exponentiation exp(S_{ij} - m_i) prevents IEEE 754 floating-point overflow.",
      },
    ],
    keyTerms: [
      {
        term: "Scaled Dot-Product Attention",
        definition: "The fundamental attention mechanism computing Softmax(QK^T / sqrt(d_k)) V.",
      },
      {
        term: "Temperature Scaling Factor",
        definition:
          "The factor 1/sqrt(d_k) used to maintain variance = 1 under random vector inputs.",
      },
      {
        term: "Attention Probability Weights",
        definition:
          "Row-normalized probabilities representing contextual relevance between query and key tokens.",
      },
    ],
  },
  trivia: SINGLEHEADATTENTIONMAP_TRIVIA,
  sources: [{ kind: "standard", label: "Attention Is All You Need (Vaswani 2017)" }],
  generateSteps: generateSingleHeadAttentionMapSteps,
};
