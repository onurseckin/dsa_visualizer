import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  MatrixCellItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ScaledDotAttentionInput {
  Q: number[][]; // Tq x dk matrix
  K: number[][]; // Tk x dk matrix
  V: number[][]; // Tk x dv matrix
  maskType: "none" | "causal";
}

export const SCALED_DOT_ATTENTION_MASK_CODE = `import math

def scaled_dot_product_attention(Q: list[list[float]], K: list[list[float]], V: list[list[float]], mask_type: str) -> tuple[list[list[float]], list[list[float]]]:
    Tq, dk = len(Q), len(Q[0])
    Tk = len(K)
    scale = 1.0 / math.sqrt(dk)
    
    scores = []
    for i in range(Tq):
        row = []
        for j in range(Tk):
            dot = sum(Q[i][d] * K[j][d] for d in range(dk))
            row.append(dot * scale)
        scores.append(row)
        
    if mask_type == "causal":
        for i in range(Tq):
            for j in range(Tk):
                if j > i:
                    scores[i][j] = -1e9
                    
    attention_weights = []
    for row in scores:
        max_val = max(row)
        exp_row = [math.exp(val - max_val) for val in row]
        sum_exp = sum(exp_row)
        attention_weights.append([e / sum_exp for e in exp_row])
        
    dv = len(V[0])
    output = []
    for i in range(Tq):
        out_row = []
        for d in range(dv):
            val = sum(attention_weights[i][j] * V[j][d] for j in range(Tk))
            out_row.append(val)
        output.append(out_row)
        
    return attention_weights, output`;

export const DEFAULT_SCALED_DOT_ATTENTION_INPUT: ScaledDotAttentionInput = {
  Q: [
    [1.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
  ],
  K: [
    [1.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
  ],
  V: [
    [10.0, 0.0],
    [0.0, 20.0],
    [30.0, 30.0],
  ],
  maskType: "causal",
};

export const generateScaledDotAttentionMaskSteps = (
  input: ScaledDotAttentionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Tq = input.Q.length;
  const dk = input.Q[0].length;
  const Tk = input.K.length;
  const scale = 1.0 / Math.sqrt(dk);

  const buildDistanceTable = (
    rawScores?: number[][],
    maskedScores?: number[][],
    attentionWeights?: number[][],
    output?: number[][],
  ): Record<string, number> => {
    const table: Record<string, number> = {};
    if (rawScores) {
      rawScores.forEach((row, i) =>
        row.forEach((score, j) => {
          table[`Raw_S_q${i}_k${j}`] = Number(score.toFixed(2));
        }),
      );
    }
    if (maskedScores) {
      maskedScores.forEach((row, i) =>
        row.forEach((score, j) => {
          table[`Masked_S_q${i}_k${j}`] = score === -1e9 ? -999 : Number(score.toFixed(2));
        }),
      );
    }
    if (attentionWeights) {
      attentionWeights.forEach((row, i) =>
        row.forEach((w, j) => {
          table[`A_q${i}_k${j}`] = Number(w.toFixed(3));
        }),
      );
    }
    if (output) {
      output.forEach((row, i) =>
        row.forEach((val, d) => {
          table[`O_q${i}_d${d}`] = Number(val.toFixed(2));
        }),
      );
    }
    return table;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize Attention Parameters (Tq=${Tq}, Tk=${Tk}, dk=${dk})`,
      why: `Computing scaling factor scale = 1 / sqrt(${dk}) = ${scale.toFixed(4)}. Query and Key projections will be multiplied and scaled to prevent Softmax saturation.`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: Tq,
      cols: Tk,
      title: `Raw Attention Logits S = (Q @ K^T) / sqrt(d_k) (${Tq}x${Tk})`,
      rowHeaders: Array.from({ length: Tq }, (_, i) => `Query ${i}`),
      colHeaders: Array.from({ length: Tk }, (_, j) => `Key ${j}`),
      cells: Array.from({ length: Tq }, (_, r) =>
        Array.from({ length: Tk }, (_, c) => ({
          row: r,
          col: c,
          value: "-",
          label: `Q${r}_K${c}`,
          state: "default" as ElementState,
        })),
      ).flat(),
    },
    auxiliaryState: {
      distanceTable: {},
    },
    variables: {
      Tq,
      Tk,
      dk,
      scale: Number(scale.toFixed(4)),
    },
  });

  const rawScores: number[][] = [];
  for (let i = 0; i < Tq; i++) {
    const row: number[] = [];
    for (let j = 0; j < Tk; j++) {
      const dot = input.Q[i].reduce((sum, qVal, d) => sum + qVal * input.K[j][d], 0);
      row.push(dot * scale);
    }
    rawScores.push(row);

    const snapshotCells: MatrixCellItem[] = [];
    for (let r = 0; r < Tq; r++) {
      for (let c = 0; c < Tk; c++) {
        if (r < i || (r === i && c <= Tk - 1)) {
          snapshotCells.push({
            row: r,
            col: c,
            value: Number(rawScores[r][c].toFixed(3)),
            label: `S[q${r},k${c}]`,
            state: r === i ? ("active" as ElementState) : ("compared" as ElementState),
          });
        } else {
          snapshotCells.push({
            row: r,
            col: c,
            value: "-",
            label: `Q${r}_K${c}`,
            state: "default" as ElementState,
          });
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Compute Scaled Inner Product Logits for Query Token Q${i}`,
        why: `Calculated inner products Q${i} @ K^T scaled by 1/sqrt(${dk}) (${scale.toFixed(3)}): [${row.map((s) => s.toFixed(3)).join(", ")}].`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: Tq,
        cols: Tk,
        title: `Raw Attention Logits S = (Q @ K^T) / sqrt(d_k)`,
        rowHeaders: Array.from({ length: Tq }, (_, r) => `Query ${r}`),
        colHeaders: Array.from({ length: Tk }, (_, c) => `Key ${c}`),
        cells: snapshotCells,
      },
      auxiliaryState: {
        distanceTable: buildDistanceTable(rawScores),
      },
      variables: {
        queryRow: i,
        scale: Number(scale.toFixed(3)),
      },
    });
  }

  const maskedScores = rawScores.map((row) => [...row]);
  if (input.maskType === "causal") {
    for (let i = 0; i < Tq; i++) {
      for (let j = 0; j < Tk; j++) {
        if (j > i) {
          maskedScores[i][j] = -1e9;
        }
      }
    }
  }

  const maskedCells: MatrixCellItem[] = maskedScores.flatMap((row, r) =>
    row.map((score, c) => ({
      row: r,
      col: c,
      value: score === -1e9 ? "-inf" : Number(score.toFixed(3)),
      label: `S_masked[${r},${c}]`,
      state:
        c > r && input.maskType === "causal"
          ? ("visited" as ElementState)
          : ("active" as ElementState),
    })),
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: input.maskType === "causal" ? 20 : 16,
    explanation: {
      what: `Apply ${input.maskType === "causal" ? "Causal Lower-Triangular Masking" : "No Masking"}`,
      why: `${input.maskType === "causal" ? "Causal mask set upper-triangular entries (j > i) to -inf (-1e9) so future tokens cannot be attended to." : "No masking applied; all tokens attend bidirectionally."}`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: Tq,
      cols: Tk,
      title: `Masked Attention Logits S_masked (${input.maskType})`,
      rowHeaders: Array.from({ length: Tq }, (_, r) => `Query ${r}`),
      colHeaders: Array.from({ length: Tk }, (_, c) => `Key ${c}`),
      cells: maskedCells,
    },
    auxiliaryState: {
      distanceTable: buildDistanceTable(rawScores, maskedScores),
    },
    variables: {
      maskType: input.maskType,
    },
  });

  const attentionWeights: number[][] = [];
  for (let i = 0; i < Tq; i++) {
    const row = maskedScores[i];
    const maxVal = Math.max(...row);
    const expRow = row.map((v) => Math.exp(v - maxVal));
    const sumExp = expRow.reduce((a, b) => a + b, 0);
    const weightsRow = expRow.map((e) => e / sumExp);
    attentionWeights.push(weightsRow);

    const softmaxCells: MatrixCellItem[] = [];
    for (let r = 0; r < Tq; r++) {
      for (let c = 0; c < Tk; c++) {
        if (r <= i) {
          const w = attentionWeights[r][c];
          softmaxCells.push({
            row: r,
            col: c,
            value: Number(w.toFixed(3)),
            label: `A[q${r},k${c}]`,
            state: w > 0.001 ? ("sorted" as ElementState) : ("default" as ElementState),
          });
        } else {
          softmaxCells.push({
            row: r,
            col: c,
            value: "-",
            label: `A[q${r},k${c}]`,
            state: "default" as ElementState,
          });
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: `Compute Softmax Attention Probabilities for Query Row Q${i}`,
        why: `Row ${i} max logit = ${maxVal === -1e9 ? "-inf" : maxVal.toFixed(3)}. Exponentials normalized by sum_exp yield probability weights: [${weightsRow.map((w) => w.toFixed(3)).join(", ")}]. Masked entries become 0.000.`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: Tq,
        cols: Tk,
        title: `Softmax Attention Weights Matrix A = Softmax(S_masked)`,
        rowHeaders: Array.from({ length: Tq }, (_, r) => `Query ${r}`),
        colHeaders: Array.from({ length: Tk }, (_, c) => `Key ${c}`),
        cells: softmaxCells,
      },
      auxiliaryState: {
        distanceTable: buildDistanceTable(rawScores, maskedScores, attentionWeights),
      },
      variables: {
        queryRow: i,
        maxVal: maxVal === -1e9 ? "-1e9" : Number(maxVal.toFixed(3)),
      },
    });
  }

  const dv = input.V[0].length;
  const output: number[][] = [];
  for (let i = 0; i < Tq; i++) {
    const outRow: number[] = [];
    for (let d = 0; d < dv; d++) {
      const val = attentionWeights[i].reduce((sum, w, j) => sum + w * input.V[j][d], 0);
      outRow.push(val);
    }
    output.push(outRow);

    const outputCells: MatrixCellItem[] = [];
    for (let r = 0; r < Tq; r++) {
      for (let d = 0; d < dv; d++) {
        if (r <= i) {
          outputCells.push({
            row: r,
            col: d,
            value: Number(output[r][d].toFixed(2)),
            label: `O[q${r},v${d}]`,
            state: "sorted" as ElementState,
          });
        } else {
          outputCells.push({
            row: r,
            col: d,
            value: "-",
            label: `O[q${r},v${d}]`,
            state: "default" as ElementState,
          });
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 34,
      explanation: {
        what: `Compute Contextualized Output Representation for Query Q${i}: O[${i}] = A[${i}] @ V`,
        why: `Weighted linear combination of Value vectors V using query Q${i} attention weights: [${outRow.map((v) => v.toFixed(2)).join(", ")}].`,
      },
      primarySnapshot: {
        kind: "matrix",
        rows: Tq,
        cols: dv,
        title: `Attention Output Matrix O = A @ V (${Tq}x${dv})`,
        rowHeaders: Array.from({ length: Tq }, (_, r) => `Query ${r}`),
        colHeaders: Array.from({ length: dv }, (_, d) => `Val ${d}`),
        cells: outputCells,
      },
      auxiliaryState: {
        distanceTable: buildDistanceTable(rawScores, maskedScores, attentionWeights, output),
      },
      variables: {
        queryRow: i,
        outputRows: Tq,
        outputCols: dv,
      },
    });
  }

  const finalCells: MatrixCellItem[] = output.flatMap((row, r) =>
    row.map((val, d) => ({
      row: r,
      col: d,
      value: Number(val.toFixed(2)),
      label: `O[q${r},v${d}]`,
      state: "sorted" as ElementState,
    })),
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 38,
    explanation: {
      what: "Scaled Dot-Product Attention Execution Complete",
      why: `Successfully computed causal scaled dot-product attention weights A (${Tq}x${Tk}) and output representation matrix O (${Tq}x${dv}).`,
    },
    primarySnapshot: {
      kind: "matrix",
      rows: Tq,
      cols: dv,
      title: `Final Scaled Dot-Product Attention Output O (${Tq}x${dv})`,
      rowHeaders: Array.from({ length: Tq }, (_, r) => `Query ${r}`),
      colHeaders: Array.from({ length: dv }, (_, d) => `Val ${d}`),
      cells: finalCells,
    },
    auxiliaryState: {
      distanceTable: buildDistanceTable(rawScores, maskedScores, attentionWeights, output),
    },
    variables: {
      completed: true,
      outputRows: Tq,
      outputCols: dv,
    },
  });

  return steps;
};

const SCALED_DOT_ATTENTION_MASK_TRIVIA: TriviaMeta = {
  skipLines: [2, 7, 15, 21, 28, 37],
  distractors: [
    "scores[i][j] = 0.0",
    "scale = 1.0 / dk",
    "attention_weights.append([e / max_val for e in exp_row])",
  ],
  hints: [
    {
      line: 6,
      hint: "Scale Q @ K.T matrix multiplication result by 1 / sqrt(d_k).",
    },
    {
      line: 16,
      hint: "Mask future positions (j > i) by setting scores to -inf (-1e9) for causal autoregressive decoding.",
    },
    {
      line: 27,
      hint: "Compute row-wise Softmax probability distribution using max-subtraction for numerical stability.",
    },
    {
      line: 34,
      hint: "Compute weighted sum of Value matrix vectors O = A @ V.",
    },
  ],
  lineExplanations: {
    1: "Imports math library for square root and exponent calculations.",
    3: "Defines entry point for Scaled Dot-Product Attention function.",
    4: "Retrieves Query matrix dimensions Tq and dk.",
    5: "Retrieves Key matrix length Tk.",
    6: "Computes temperature scaling factor 1 / sqrt(dk).",
    8: "Initializes list to store raw attention score logits.",
    9: "Iterates over query token indices i.",
    12: "Computes inner product Q[i] @ K[j] scaled by 1/sqrt(dk).",
    16: "Checks if causal masking is requested.",
    20: "Sets future position logits (j > i) to -infinity (-1e9).",
    22: "Initializes list to store Softmax-normalized attention weights.",
    24: "Finds max logit value in row for numerical stability.",
    25: "Calculates centered exponentials exp(val - max_val).",
    26: "Computes partition sum of row exponentials.",
    27: "Normalizes exponentials by partition sum to produce attention probabilities.",
    29: "Retrieves Value vector feature dimension dv.",
    30: "Initializes list to store final contextualized output vectors.",
    34: "Computes weighted combination of Value matrix vectors.",
    38: "Returns tuple of attention weights matrix and output tensor.",
  },
};

export const scaledDotAttentionMask: AlgorithmDefinition<ScaledDotAttentionInput> = {
  id: "scaled-dot-attention-mask",
  title: "Scaled Dot-Product Attention with Causal Masking & Softmax",
  topicIds: ["ml_attention_geometry"],
  difficulty: "Hard",
  description:
    "Computes Transformer scaled dot-product self-attention Softmax(Q K^T / sqrt(d_k) + M) V with causal lower-triangular masking for autoregressive sequence modeling.",
  constraints: ["len(Q) >= 1", "len(Q[0]) == len(K[0])", "len(K) == len(V)"],
  examples: [
    {
      kind: "basic",
      title: "Causal Self-Attention (3 Tokens, d_k=2)",
      inputDisplay: "Q, K, V (3x2), causal mask enabled",
      outputDisplay: "O[q=0] attends to V[0] 100%, O[q=1] attends to V[0], V[1]",
      input: DEFAULT_SCALED_DOT_ATTENTION_INPUT,
      output: "O[q=0] = [10.0, 0.0], O[q=1] = [3.33, 13.33]",
      explanation:
        "Token 0 (q=0) cannot attend to tokens 1 or 2 due to causal mask -inf, forcing A[0,0] = 1.0. Token 1 attends to tokens 0 and 1.",
    },
    {
      kind: "complex",
      title: "Unmasked Bidirectional Encoder Attention",
      inputDisplay: "Same Q, K, V with maskType = 'none'",
      outputDisplay: "Full bidirectional attention matrix across all query-key pairs",
      input: {
        ...DEFAULT_SCALED_DOT_ATTENTION_INPUT,
        maskType: "none",
      },
      output: "Bidirectional attention weights A over full sequence",
      explanation:
        "Without causal masking (like BERT encoder attention), all tokens attend to all previous and future sequence positions.",
    },
    {
      kind: "negative",
      title: "Single Token Self-Attention Step (1x1)",
      inputDisplay: "Q=[[1.0]], K=[[1.0]], V=[[5.0]]",
      outputDisplay: "O = [[5.0]], A = [[1.0]]",
      input: {
        Q: [[1.0]],
        K: [[1.0]],
        V: [[5.0]],
        maskType: "causal",
      },
      output: "O = [[5.0]]",
      explanation:
        "Single token sequence trivially yields 100% self-attention probability weight A = [[1.0]].",
    },
  ],
  code: SCALED_DOT_ATTENTION_MASK_CODE,
  timeComplexity: {
    best: "O(Tq * Tk * dk + Tq * Tk * dv)",
    average: "O(Tq * Tk * dk + Tq * Tk * dv)",
    worst: "O(Tq * Tk * dk + Tq * Tk * dv)",
  },
  spaceComplexity: "O(Tq * Tk + Tq * dv)",
  complexityAnalysis: {
    time: "Computing score matrix S takes O(Tq * Tk * dk) ops. Softmax takes O(Tq * Tk) ops. Matrix multiply with V takes O(Tq * Tk * dv) ops.",
    space: "Requires O(Tq * Tk) space for attention score and weight matrices.",
  },
  topicGuide: {
    overview:
      "Scaled Dot-Product Attention (Vaswani et al., 2017) is the core computational kernel of the Transformer architecture, powering LLMs like GPT-4, LLaMA, and Claude.",
    sections: [
      {
        heading: "Scaling Factor 1/sqrt(d_k)",
        body: "For large head dimensions d_k, unscaled dot products grow large, pushing Softmax into regions with extremely small gradients. Dividing by sqrt(d_k) maintains unit variance of score logits.",
      },
      {
        heading: "Causal Decoder Masking",
        body: "By adding an additive mask matrix M with -inf in upper-triangular positions prior to Softmax, autoregressive models prevent current tokens from looking at future token completions.",
      },
    ],
    keyTerms: [
      {
        term: "Scaled Dot-Product Attention",
        definition: "Attention mechanism computing Softmax((Q @ K.T) / sqrt(d_k)) @ V.",
      },
      {
        term: "Causal Mask",
        definition:
          "Additive mask matrix setting future token position logits to -infinity to enforce autoregressive causality.",
      },
    ],
  },
  trivia: SCALED_DOT_ATTENTION_MASK_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_SCALED_DOT_ATTENTION_INPUT,
  generateSteps: generateScaledDotAttentionMaskSteps,
};
