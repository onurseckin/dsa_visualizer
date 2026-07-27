import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
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
    
    # Step 1: Compute scaled dot-product attention scores S = (Q @ K.T) / sqrt(dk)
    scores = []
    for i in range(Tq):
        row = []
        for j in range(Tk):
            dot = sum(Q[i][d] * K[j][d] for d in range(dk))
            row.append(dot * scale)
        scores.append(row)
        
    # Step 2: Apply attention mask (set score to -inf for masked positions j > i)
    if mask_type == "causal":
        for i in range(Tq):
            for j in range(Tk):
                if j > i:
                    scores[i][j] = -1e9
                    
    # Step 3: Compute numerically stable Softmax per row
    attention_weights = []
    for row in scores:
        max_val = max(row)
        exp_row = [math.exp(val - max_val) for val in row]
        sum_exp = sum(exp_row)
        attention_weights.append([e / sum_exp for e in exp_row])
        
    # Step 4: Multiply attention weights by Value matrix O = Attention @ V
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
  input: ScaledDotAttentionInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Tq = input.Q.length;
  const dk = input.Q[0].length;
  const Tk = input.K.length;
  const scale = 1.0 / Math.sqrt(dk);

  // 1. Matmul Q @ K.T and scale
  const rawScores: number[][] = [];
  for (let i = 0; i < Tq; i++) {
    const row: number[] = [];
    for (let j = 0; j < Tk; j++) {
      const dot = input.Q[i].reduce((sum, qVal, d) => sum + qVal * input.K[j][d], 0);
      row.push(dot * scale);
    }
    rawScores.push(row);
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Compute Scaled Dot-Product Scores S = Q K^T / sqrt(d_k)",
      why: `Queries (${Tq}x${dk}) x Keys (${Tk}x${dk}) scaled by 1/sqrt(${dk}) = ${scale.toFixed(3)}. Dot product Q K^T measures alignment between Query and Key vectors.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: rawScores.flatMap((row, i) =>
        row.map((score, j) => ({
          id: `score-${i}-${j}`,
          value: Number((score * 10).toFixed(0)),
          state: "active" as ElementState,
        }))
      ),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        rawScores.flatMap((row, i) =>
          row.map((score, j) => [`Raw_S_q${i}_k${j}`, Number(score.toFixed(2))])
        )
      ),
    },
    variables: {
      Tq,
      Tk,
      scale: Number(scale.toFixed(3)),
    },
  });

  // 2. Apply Mask
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Apply ${input.maskType === "causal" ? "Causal Masking" : "No Mask"}`,
      why: `${input.maskType === "causal" ? "Causal mask set upper-triangle positions (j > i) to -inf (-1e9)." : "No masking applied."} Causal masking prevents decoder tokens from attending to future tokens.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: maskedScores.flatMap((row, i) =>
        row.map((score, j) => ({
          id: `score-${i}-${j}`,
          value: score === -1e9 ? -99 : Number((score * 10).toFixed(0)),
          state: j > i && input.maskType === "causal" ? ("visited" as ElementState) : ("active" as ElementState),
        }))
      ),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        maskedScores.flatMap((row, i) =>
          row.map((score, j) => [`Masked_S_q${i}_k${j}`, score === -1e9 ? -999 : Number(score.toFixed(2))])
        )
      ),
    },
    variables: {
      maskType: input.maskType,
    },
  });

  // 3. Softmax
  const attentionWeights: number[][] = [];
  for (const row of maskedScores) {
    const maxVal = Math.max(...row);
    const expRow = row.map((v) => Math.exp(v - maxVal));
    const sumExp = expRow.reduce((a, b) => a + b, 0);
    attentionWeights.push(expRow.map((e) => e / sumExp));
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: "Apply Row-wise Stable Softmax",
      why: "Attention matrix weights A generated via Softmax(S). Masked -inf entries evaluate to exactly 0.000 probability.",
    },
    primarySnapshot: {
      kind: "array",
      elements: attentionWeights.flatMap((row, i) =>
        row.map((w, j) => ({
          id: `w-${i}-${j}`,
          value: Number((w * 100).toFixed(0)),
          state: w > 0.001 ? ("sorted" as ElementState) : ("default" as ElementState),
        }))
      ),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        attentionWeights.flatMap((row, i) =>
          row.map((w, j) => [`A_q${i}_k${j}`, Number(w.toFixed(3))])
        )
      ),
    },
    variables: {
      maxWeight: Number(Math.max(...attentionWeights.flat()).toFixed(3)),
    },
  });

  // 4. Output O = A @ V
  const dv = input.V[0].length;
  const output: number[][] = [];
  for (let i = 0; i < Tq; i++) {
    const outRow: number[] = [];
    for (let d = 0; d < dv; d++) {
      const val = attentionWeights[i].reduce((sum, w, j) => sum + w * input.V[j][d], 0);
      outRow.push(val);
    }
    output.push(outRow);
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 31,
    explanation: {
      what: "Compute Final Attention Output O = A @ V",
      why: `Attention Output matrix O (${Tq}x${dv}) produced by linear combination of Value vectors V weighted by attention probabilities A.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: output.flatMap((row, i) =>
        row.map((val, d) => ({
          id: `out-${i}-${d}`,
          value: Number((val * 10).toFixed(0)),
          state: "sorted" as ElementState,
        }))
      ),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        output.flatMap((row, i) =>
          row.map((val, d) => [`O_q${i}_d${d}`, Number(val.toFixed(2))])
        )
      ),
    },
    variables: {
      outputRows: Tq,
      outputCols: dv,
    },
  });

  return steps;
};

const SCALED_DOT_ATTENTION_MASK_TRIVIA: TriviaMeta = {
  skipLines: [1, 3],
  distractors: [
    "scores[i][j] = 0.0 # Wrong mask value",
    "scale = 1.0 / dk # Forgot square root",
    "attention_weights.append([e / max_val for e in exp_row])",
  ],
  hints: [
    {
      line: 8,
      hint: "Scale Q @ K.T matrix multiplication result by 1 / sqrt(d_k).",
    },
    {
      line: 16,
      hint: "Mask future positions (j > i) by setting scores to -inf (-1e9) for causal autoregressive decoding.",
    },
    {
      line: 23,
      hint: "Compute row-wise Softmax probability distribution using max-subtraction for numerical stability.",
    },
  ],
  lineExplanations: {
    1: "Defines Scaled Dot-Product Attention function.",
    8: "Computes query-key dot products scaled by 1/sqrt(d_k).",
    16: "Applies causal upper-triangular mask setting future tokens to -inf.",
    23: "Transforms logits to valid attention probability weights via Softmax.",
    31: "Computes weighted sum of Value matrix vectors O = A @ V.",
  },
};

export const scaledDotAttentionMask: AlgorithmDefinition<ScaledDotAttentionInput> = {
  id: "scaled-dot-attention-mask",
  title: "Scaled Dot-Product Attention with Causal Masking & Softmax",
  category: "ml_attention_geometry",
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 7,
  description:
    "Computes Transformer scaled dot-product self-attention Softmax(Q K^T / sqrt(d_k) + M) V with causal lower-triangular masking for autoregressive sequence modeling.",
  constraints: [
    "len(Q) >= 1",
    "len(Q[0]) == len(K[0])",
    "len(K) == len(V)",
  ],
  examples: [
    {
      kind: "basic",
      title: "Causal Self-Attention (3 Tokens, d_k=2)",
      inputDisplay: "Q, K, V (3x2), causal mask enabled",
      outputDisplay: "O[q=0] attends to V[0] 100%, O[q=1] attends to V[0], V[1]",
      input: DEFAULT_SCALED_DOT_ATTENTION_INPUT,
      output: "O[q=0] = [10.0, 0.0], O[q=1] = [3.33, 13.33]",
      explanation: "Token 0 (q=0) cannot attend to tokens 1 or 2 due to causal mask -inf, forcing A[0,0] = 1.0. Token 1 attends to tokens 0 and 1.",
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
      explanation: "Without causal masking (like BERT encoder attention), all tokens attend to all previous and future sequence positions.",
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
      explanation: "Single token sequence trivially yields 100% self-attention probability weight A = [[1.0]].",
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
        definition: "Additive mask matrix setting future token position logits to -infinity to enforce autoregressive causality.",
      },
    ],
  },
  trivia: SCALED_DOT_ATTENTION_MASK_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_SCALED_DOT_ATTENTION_INPUT,
  generateSteps: generateScaledDotAttentionMaskSteps,
};
