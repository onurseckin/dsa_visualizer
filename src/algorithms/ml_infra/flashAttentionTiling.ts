import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface FlashAttentionInput {
  seqLen: number;
  headDim: number;
  blockQ: number;
  blockK: number;
  queries: number[][]; // [seqLen][headDim]
  keys: number[][]; // [seqLen][headDim]
  values: number[][]; // [seqLen][headDim]
}

export const FLASH_ATTENTION_TILING_CODE = `import math

def flash_attention_tiling(
    Q: list[list[float]],
    K: list[list[float]],
    V: list[list[float]],
    block_q: int,
    block_k: int
) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    scale = 1.0 / math.sqrt(d)
    
    O = [[0.0] * d for _ in range(N)]
    l = [0.0] * N
    m = [-float('inf')] * N
    
    for i in range(0, N, block_q):
        Q_block = Q[i:i + block_q]
        for j in range(0, N, block_k):
            K_block = K[j:j + block_k]
            V_block = V[j:j + block_k]
            
            for bi in range(len(Q_block)):
                row_idx = i + bi
                S_row = [sum(Q_block[bi][k] * K_block[bj][k] for k in range(d)) * scale for bj in range(len(K_block))]
                
                m_prev = m[row_idx]
                m_curr = max(S_row)
                m_new = max(m_prev, m_curr)
                
                P_row = [math.exp(s - m_new) for s in S_row]
                l_prev = l[row_idx]
                correction = math.exp(m_prev - m_new) if m_prev != -float('inf') else 0.0
                l_new = correction * l_prev + sum(P_row)
                
                for k in range(d):
                    pv_sum = sum(P_row[bj] * V_block[bj][k] for bj in range(len(V_block)))
                    O[row_idx][k] = (correction * O[row_idx][k] * l_prev + pv_sum) / l_new
                
                m[row_idx] = m_new
                l[row_idx] = l_new
                
    return O`;

export const DEFAULT_FLASH_ATTENTION_INPUT: FlashAttentionInput = {
  seqLen: 4,
  headDim: 2,
  blockQ: 2,
  blockK: 2,
  queries: [
    [1.0, 0.5],
    [0.2, 0.8],
    [0.9, 0.1],
    [0.4, 0.6],
  ],
  keys: [
    [0.8, 0.2],
    [0.1, 0.9],
    [0.5, 0.5],
    [0.3, 0.7],
  ],
  values: [
    [1.0, 2.0],
    [3.0, 4.0],
    [0.5, 1.5],
    [2.5, 3.5],
  ],
};

export const FLASH_ATTENTION_EXAMPLES: ProblemExample<FlashAttentionInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "4-Sequence Attention Tiling (Block Size 2)",
    input: {
      seqLen: 4,
      headDim: 2,
      blockQ: 2,
      blockK: 2,
      queries: [
        [1.0, 0.5],
        [0.2, 0.8],
        [0.9, 0.1],
        [0.4, 0.6],
      ],
      keys: [
        [0.8, 0.2],
        [0.1, 0.9],
        [0.5, 0.5],
        [0.3, 0.7],
      ],
      values: [
        [1.0, 2.0],
        [3.0, 4.0],
        [0.5, 1.5],
        [2.5, 3.5],
      ],
    },
    output: "4 Output Vectors computed in IO-aware blocks",
    explanation:
      "Processes 2 Q-blocks x 2 K/V-blocks in fast SRAM without materializing the N x N attention matrix in DRAM.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "6-Sequence High-Dimensional Attention (Block Size 2)",
    input: {
      seqLen: 6,
      headDim: 2,
      blockQ: 2,
      blockK: 2,
      queries: [
        [1.0, 0.0],
        [0.0, 1.0],
        [0.5, 0.5],
        [0.7, 0.3],
        [0.2, 0.8],
        [0.9, 0.1],
      ],
      keys: [
        [1.0, 0.0],
        [0.0, 1.0],
        [0.5, 0.5],
        [0.7, 0.3],
        [0.2, 0.8],
        [0.9, 0.1],
      ],
      values: [
        [2.0, 1.0],
        [1.0, 2.0],
        [1.5, 1.5],
        [2.1, 0.9],
        [0.6, 2.4],
        [2.7, 0.3],
      ],
    },
    output: "6 Output Vectors computed via 3x3 block iterations",
    explanation:
      "Online softmax updates running max m and denominator l per row dynamically across 9 tile iterations.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Minimal 2-Sequence Block Tiling",
    input: {
      seqLen: 2,
      headDim: 2,
      blockQ: 2,
      blockK: 2,
      queries: [
        [1.0, 1.0],
        [0.0, 1.0],
      ],
      keys: [
        [1.0, 0.0],
        [0.0, 1.0],
      ],
      values: [
        [1.0, 0.0],
        [0.0, 1.0],
      ],
    },
    output: "2 Output Vectors computed in 1 block step",
    explanation: "Single Q-block and single K/V-block execution path.",
  },
];

export function generateFlashAttentionSteps(input: FlashAttentionInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { seqLen: N, headDim: d, blockQ, blockK, queries: Q, keys: K, values: V } = input;

  if (N <= 0 || d <= 0 || blockQ <= 0 || blockK <= 0 || !Q || !K || !V) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid FlashAttention Input",
        why: "Sequence length, head dimension, and block sizes must be positive.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Invalid dimensions" } },
      variables: {},
    });
    return steps;
  }

  const scale = 1.0 / Math.sqrt(d);
  const O: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));
  const l: number[] = new Array(N).fill(0.0);
  const m: number[] = new Array(N).fill(-Infinity);

  const flatOutput = () => O.map((row) => row.map((v) => Number(v.toFixed(3))).join(", "));

  const elements: ArrayElement[] = Array.from({ length: N }, (_, idx) => ({
    id: `row-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    qBlockIdx: number,
    kBlockIdx: number,
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
          runningMax_m: m.map((v) => (v === -Infinity ? "-inf" : v.toFixed(3))).join(", "),
          runningSum_l: l.map((v) => v.toFixed(3)).join(", "),
          outputMatrix_O: flatOutput().join(" | "),
          activeQBlock: `[${qBlockIdx * blockQ}..${Math.min(N, (qBlockIdx + 1) * blockQ) - 1}]`,
          activeKVBlock: `[${kBlockIdx * blockK}..${Math.min(N, (kBlockIdx + 1) * blockK) - 1}]`,
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention Tiled Softmax Engine",
    `Setting up online softmax statistics (m=-inf, l=0) and tiled SRAM iteration for ${N} queries with head dimension ${d}.`,
    0,
    0,
    { N, d, blockQ, blockK, scale: scale.toFixed(4) },
  );

  const numQBlocks = Math.ceil(N / blockQ);
  const numKBlocks = Math.ceil(N / blockK);

  for (let qb = 0; qb < numQBlocks; qb++) {
    const qStart = qb * blockQ;
    const qEnd = Math.min(N, (qb + 1) * blockQ);

    for (let kb = 0; kb < numKBlocks; kb++) {
      const kStart = kb * blockK;
      const kEnd = Math.min(N, (kb + 1) * blockK);

      // Highlight active query rows
      elements.forEach((el, idx) => {
        if (idx >= qStart && idx < qEnd) {
          el.state = "active";
          el.pointers = [`Q-block #${qb}`];
        } else {
          el.state = "default";
          el.pointers = undefined;
        }
      });

      for (let i = qStart; i < qEnd; i++) {
        const qRow = Q[i] ?? new Array(d).fill(0);
        const sRow: number[] = [];

        for (let j = kStart; j < kEnd; j++) {
          const kRow = K[j] ?? new Array(d).fill(0);
          let dot = 0;
          for (let k = 0; k < d; k++) {
            dot += (qRow[k] ?? 0) * (kRow[k] ?? 0);
          }
          sRow.push(dot * scale);
        }

        const mPrev = m[i];
        const mCurr = Math.max(...sRow);
        const mNew = Math.max(mPrev, mCurr);

        const pRow = sRow.map((s) => Math.exp(s - mNew));
        const lPrev = l[i];
        const correction = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
        const pSum = pRow.reduce((a, b) => a + b, 0);
        const lNew = correction * lPrev + pSum;

        const vBlock = V.slice(kStart, kEnd);
        for (let k = 0; k < d; k++) {
          let pvSum = 0;
          for (let bj = 0; bj < pRow.length; bj++) {
            pvSum += pRow[bj] * (vBlock[bj]?.[k] ?? 0);
          }
          const prevO = O[i][k];
          O[i][k] = lNew > 0 ? (correction * prevO * lPrev + pvSum) / lNew : 0;
        }

        m[i] = mNew;
        l[i] = lNew;
      }

      addStep(
        15,
        `Processed Q-block #${qb} with K/V-block #${kb}`,
        `Updated online softmax max (m) and sum (l) statistics dynamically in fast SRAM without writing N x N matrix to HBM.`,
        qb,
        kb,
        { qb, kb, qStart, kStart, activeRows: `${qStart}..${qEnd - 1}` },
      );
    }
  }

  elements.forEach((el) => {
    el.state = "sorted";
    el.pointers = undefined;
  });

  addStep(
    30,
    "FlashAttention Tiling Complete",
    "Successfully evaluated exact attention matrix product in IO-aware tiled fashion, saving memory bandwidth by O(N).",
    numQBlocks - 1,
    numKBlocks - 1,
    { totalOutputRows: N, headDim: d },
  );

  return steps;
}

export const flashAttentionTiling: AlgorithmDefinition<FlashAttentionInput> = {
  id: "flash-attention-tiling",
  title: "FlashAttention Tiling & Online Softmax",
  category: "ml_hardware_kernels",
  difficulty: "Hard",
  description:
    "IO-aware exact attention algorithm that tiles Query, Key, and Value matrices into fast SRAM blocks, computing online softmax updates without materializing the full N x N attention matrix in GPU memory.",
  isMlInfra: true,
  mlInfraLevel: 7,
  constraints: [
    "Sequence length N > 0",
    "Head dimension d > 0",
    "Block sizes blockQ, blockK > 0",
    "Queries, Keys, and Values match shape N x d",
  ],
  examples: FLASH_ATTENTION_EXAMPLES,
  code: FLASH_ATTENTION_TILING_CODE,
  timeComplexity: {
    best: "O(N^2 * d)",
    average: "O(N^2 * d)",
    worst: "O(N^2 * d)",
  },
  spaceComplexity: "O(N * d)",
  complexityAnalysis: {
    time: "Requires N^2 * d floating-point operations total, matching standard attention compute cost while avoiding high-latency HBM accesses.",
    space:
      "Requires O(N * d) memory to store output matrix O and running online softmax statistics (m, l), reducing memory complexity from O(N^2) to O(N).",
  },
  topicGuide: {
    overview:
      "FlashAttention (Tri Dao et al.) optimizes Transformer attention by fusing matrix operations and utilizing online softmax. It tiles inputs into fast GPU SRAM blocks to eliminate high-latency High Bandwidth Memory (HBM) read/write bottlenecks.",
    sections: [
      {
        heading: "Online Softmax Rescaling",
        body: "Softmax requires global row max and sum. FlashAttention maintains running max (m) and running sum (l) per row, rescaling previously accumulated partial outputs when a larger score is discovered in subsequent tiles.",
      },
      {
        heading: "IO-Aware Tiling",
        body: "Standard attention reads/writes the N x N score matrix to GPU DRAM multiple times. FlashAttention keeps tiles in SRAM (up to 19 TB/s bandwidth) and writes only the final N x d output back to DRAM (1.5-3 TB/s).",
      },
    ],
    keyTerms: [
      {
        term: "FlashAttention",
        definition:
          "IO-aware exact attention kernel using online softmax tiling for fast execution and small memory footprint.",
      },
      {
        term: "Online Softmax",
        definition:
          "Algorithmic technique for incrementally computing exact softmax over streaming data blocks using running max and sum.",
      },
      {
        term: "SRAM vs HBM",
        definition: "GPU fast on-chip static RAM vs slower High Bandwidth Memory (DRAM).",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_FLASH_ATTENTION_INPUT,
  generateSteps: generateFlashAttentionSteps,
};
