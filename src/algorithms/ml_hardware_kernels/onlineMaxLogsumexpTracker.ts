import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ChunkItem {
  name: string;
  scores: number[];
}

export interface onlineMaxLogsumexpTrackerInput {
  chunks?: ChunkItem[];
  mPrev?: number;
  lsePrev?: number;
  data?: number[];
  [key: string]: unknown;
}

export const ONLINEMAXLOGSUMEXPTRACKER_CODE = `def update_online_max_lse(m_prev: float, lse_prev: float, new_chunk_scores: list[float]) -> tuple[float, float, float]:
    """Updates running max m and running log-sum-exp lse for streaming online Softmax."""
    if not new_chunk_scores:
        return m_prev, lse_prev, 1.0

    m_curr = max(new_chunk_scores)
    m_new = max(m_prev, m_curr)

    scale_prev = math.exp(m_prev - m_new) if m_prev != -float('inf') else 0.0

    exp_chunk = [math.exp(s - m_new) for s in new_chunk_scores]
    lse_chunk = sum(exp_chunk)

    lse_new = lse_prev * scale_prev + lse_chunk

    return m_new, lse_new, scale_prev`;

export const DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT: onlineMaxLogsumexpTrackerInput = {
  chunks: [
    { name: "Tile 0 (Key 0..1)", scores: [10.0, 20.0] },
    { name: "Tile 1 (Key 2..3)", scores: [30.0, 15.0] },
    { name: "Tile 2 (Key 4..5)", scores: [25.0, 28.0] },
    { name: "Tile 3 (Key 6..7)", scores: [35.0, 32.0] },
    { name: "Tile 4 (Key 8..9)", scores: [40.0, 38.0] },
  ],
  mPrev: -Infinity,
  lsePrev: 0.0,
};

export const generateONLINEMAXLOGSUMEXPTRACKERSteps = (
  input: onlineMaxLogsumexpTrackerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const chunks = input.chunks || DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT.chunks!;
  let runningM = input.mPrev ?? -Infinity;
  let runningLse = input.lsePrev ?? 0.0;

  const history: {
    name: string;
    mPrev: number;
    mCurr: number;
    mNew: number;
    scalePrev: number;
    lseChunk: number;
    lseNew: number;
  }[] = [];

  const createMatrixSnapshot = (
    activeChunkIdx?: number,
  ): MatrixCellItem[] => {
    const grid: MatrixCellItem[][] = [];
    chunks.forEach((chunk, idx) => {
      const rec = history[idx];
      const mPrevVal = rec ? (rec.mPrev === -Infinity ? "-inf" : rec.mPrev.toFixed(1)) : "-";
      const mNewVal = rec ? rec.mNew.toFixed(1) : "-";
      const scaleVal = rec ? rec.scalePrev.toFixed(3) : "-";
      const lseNewVal = rec ? rec.lseNew.toFixed(2) : "-";

      let state: MatrixCellItem["state"] = "default";
      if (activeChunkIdx === idx) {
        state = "active";
      } else if (rec) {
        state = "sorted";
      }

      grid.push([
        {
          row: idx,
          col: 0,
          value: idx + 1,
          label: `${chunk.name}`,
          state,
        },
        {
          row: idx,
          col: 1,
          value: rec ? Number(rec.mCurr.toFixed(1)) : 0,
          label: `m_prev=${mPrevVal}`,
          state,
        },
        {
          row: idx,
          col: 2,
          value: rec ? Number(rec.mNew.toFixed(1)) : 0,
          label: `m_new=${mNewVal}`,
          state,
        },
        {
          row: idx,
          col: 3,
          value: rec ? Number(rec.scalePrev.toFixed(3)) : 0,
          label: `α=${scaleVal}`,
          state,
        },
        {
          row: idx,
          col: 4,
          value: rec ? Number(rec.lseNew.toFixed(2)) : 0,
          label: `lse_new=${lseNewVal}`,
          state,
        },
      ]);
    });
    return grid.flat();
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeChunkIdx?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: chunks.length,
        cols: 5,
        cells: createMatrixSnapshot(activeChunkIdx),
      },
      auxiliaryState: {
        customState: customState ?? {
          running_m: runningM === -Infinity ? "-inf" : runningM.toFixed(1),
          running_lse: runningLse.toFixed(2),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Online Max & LogSumExp Tracker",
    `Setting up streaming online Softmax engine: m = -inf, lse = 0.0 across ${chunks.length} tiles.`,
    { num_chunks: chunks.length, running_m: "-inf", running_lse: 0.0 },
  );

  chunks.forEach((chunk, idx) => {
    addStep(
      1,
      `Process Chunk ${idx + 1}/${chunks.length}: "${chunk.name}" (scores = [${chunk.scores.join(", ")}])`,
      `Calling update_online_max_lse(m_prev=${runningM === -Infinity ? "-inf" : runningM.toFixed(1)}, lse_prev=${runningLse.toFixed(2)}, scores).`,
      { chunkIdx: idx, name: chunk.name, m_prev: runningM === -Infinity ? "-inf" : runningM.toFixed(1), lse_prev: Number(runningLse.toFixed(2)) },
      idx,
    );

    addStep(
      3,
      `Check if chunk scores is empty`,
      `Chunk "${chunk.name}" has ${chunk.scores.length} scores.`,
      { chunk_len: chunk.scores.length },
      idx,
    );

    const mPrev = runningM;
    const lsePrev = runningLse;

    const mCurr = Math.max(...chunk.scores);
    addStep(
      6,
      `Compute m_curr = max([${chunk.scores.join(", ")}]) = ${mCurr.toFixed(1)}`,
      `Maximum logit score within current tile chunk.`,
      { m_curr: Number(mCurr.toFixed(1)) },
      idx,
    );

    const mNew = Math.max(mPrev, mCurr);
    addStep(
      7,
      `Compute running max m_new = max(m_prev=${mPrev === -Infinity ? "-inf" : mPrev.toFixed(1)}, m_curr=${mCurr.toFixed(1)}) = ${mNew.toFixed(1)}`,
      `Updated running maximum for numerical stability in exponentiation.`,
      { m_prev: mPrev === -Infinity ? "-inf" : Number(mPrev.toFixed(1)), m_curr: Number(mCurr.toFixed(1)), m_new: Number(mNew.toFixed(1)) },
      idx,
    );

    const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
    addStep(
      9,
      `Calculate scale_prev α = exp(m_prev - m_new) = ${scalePrev.toFixed(3)}`,
      `Exponential correction factor for adjusting previously accumulated sum-exp.`,
      { scale_prev: Number(scalePrev.toFixed(3)) },
      idx,
    );

    const expChunk = chunk.scores.map((s) => Math.exp(s - mNew));
    addStep(
      11,
      `Compute exp_chunk = exp(scores - m_new) = [${expChunk.map((e) => e.toFixed(3)).join(", ")}]`,
      `Unnormalized exponent scores for current tile.`,
      { exp_chunk: JSON.stringify(expChunk.map((e) => Number(e.toFixed(3)))) },
      idx,
    );

    const lseChunk = expChunk.reduce((a, b) => a + b, 0);
    addStep(
      12,
      `Compute sum-exp for current chunk lse_chunk = sum(exp_chunk) = ${lseChunk.toFixed(3)}`,
      `Sum of exponents for current tile.`,
      { lse_chunk: Number(lseChunk.toFixed(3)) },
      idx,
    );

    const lseNew = lsePrev * scalePrev + lseChunk;
    addStep(
      14,
      `Update running log-sum-exp lse_new = ${lsePrev.toFixed(2)} * ${scalePrev.toFixed(3)} + ${lseChunk.toFixed(3)} = ${lseNew.toFixed(3)}`,
      `Updated running softmax denominator in fast warp registers.`,
      { lse_prev: Number(lsePrev.toFixed(2)), scale_prev: Number(scalePrev.toFixed(3)), lse_chunk: Number(lseChunk.toFixed(3)), lse_new: Number(lseNew.toFixed(3)) },
      idx,
    );

    history.push({
      name: chunk.name,
      mPrev,
      mCurr,
      mNew,
      scalePrev,
      lseChunk,
      lseNew,
    });

    runningM = mNew;
    runningLse = lseNew;

    addStep(
      16,
      `Return (m_new=${mNew.toFixed(1)}, lse_new=${lseNew.toFixed(3)}, scale_prev=${scalePrev.toFixed(3)})`,
      `Online Softmax state update complete for tile chunk "${chunk.name}".`,
      { m_new: Number(mNew.toFixed(1)), lse_new: Number(lseNew.toFixed(3)), scale_prev: Number(scalePrev.toFixed(3)) },
      idx,
    );
  });

  addStep(
    16,
    "Final Online Softmax State Complete",
    `Online Max & LogSumExp tracking complete. Final running max m = ${runningM.toFixed(1)}, final running lse = ${runningLse.toFixed(3)}.`,
    { completed: true, final_m: Number(runningM.toFixed(1)), final_lse: Number(runningLse.toFixed(3)) },
  );

  return steps;
};

export const ONLINEMAXLOGSUMEXPTRACKER_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 10, 13, 15],
  distractors: [
    "scale_prev = math.exp(m_new - m_prev)",
    "lse_new = lse_prev + lse_chunk",
    "m_new = m_prev + m_curr",
    "scale_prev = m_prev / m_new",
  ],
  hints: [
    { line: 7, hint: "Compute updated running max m_new = max(m_prev, max(new_chunk_scores))." },
    { line: 9, hint: "Calculate rescaling factor scale_prev = exp(m_prev - m_new)." },
    { line: 14, hint: "Update running sum-exp lse_new = lse_prev * scale_prev + lse_chunk." },
  ],
  lineExplanations: {
    1: "Defines update_online_max_lse signature with previous max m_prev, previous sum-exp lse_prev, and new chunk scores.",
    2: "Docstring explaining online Softmax state update equations for streaming attention.",
    3: "Checks if new_chunk_scores is empty.",
    4: "Empty chunk branch: returns unchanged m_prev, lse_prev, and identity scale factor 1.0.",
    5: "Blank line preceding online max calculation.",
    6: "Calculates current chunk maximum score m_curr = max(new_chunk_scores).",
    7: "Updates running row maximum m_new = max(m_prev, m_curr).",
    8: "Blank line preceding scale factor calculation.",
    9: "Calculates previous state exponential scale factor scale_prev = exp(m_prev - m_new).",
    10: "Blank line preceding chunk exponentiation.",
    11: "Exponentiates chunk scores relative to updated max: exp(s - m_new).",
    12: "Sum-exp reduction of new chunk scores: lse_chunk = sum(exp_chunk).",
    13: "Blank line preceding log-sum-exp sum update.",
    14: "Updates running log-sum-exp lse_new = lse_prev * scale_prev + lse_chunk.",
    15: "Blank line preceding return statement.",
    16: "Returns updated tuple (m_new, lse_new, scale_prev) stored in registers.",
  },
};

export const onlineMaxLogsumexpTracker: AlgorithmDefinition<onlineMaxLogsumexpTrackerInput> = {
  id: "online-max-logsumexp-tracker",
  title: "Online Max & Log-Sum-Exp Tracker",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_attention_geometry"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master Online Softmax State Tracking: evaluate exact Softmax attention over streaming data blocks loaded sequentially into SRAM without storing the full $N \\times N$ logit matrix in DRAM.

### Why It Exists & What It Solves
Standard Softmax requires evaluating the global maximum $m = \\max_k S_k$ and global sum-exp $\\ell = \\sum_k e^{S_k - m}$ across all sequence elements simultaneously. When sequence lengths $N$ reach 32k or 128k, storing all logits $S$ in GPU memory causes out-of-memory (OOM) failures.

Online Softmax (Milakov & Gimelshein 2018, Rabe & Staats 2021, FlashAttention) enables evaluating exact Softmax attention over **streaming data tiles** loaded sequentially into fast SRAM.

When a new tile of logit scores $S^{(j)}$ is loaded into SRAM, Online Max & LogSumExp Tracker updates running state variables:
1. **Running Maximum**:
   $$m^{(j)} = \\max\\left(m^{(j-1)}, \\max\\left(S^{(j)}\\right)\\right)$$
2. **Rescale Factor $\\alpha$**:
   $$\\alpha = e^{m^{(j-1)} - m^{(j)}}$$
3. **Running Sum-Exp**:
   $$\\ell^{(j)} = \\ell^{(j-1)} \\cdot \\alpha + \\sum_{k} e^{S_k^{(j)} - m^{(j)}}$$
4. **Running Unnormalized Output Vector**:
   $$O^{(j)} = O^{(j-1)} \\cdot \\alpha + P^{(j)} V^{(j)}$$

At the very end, dividing $O^{(\\text{final})}$ by $\\ell^{(\\text{final})}$ yields the exact attention output vector matching standard Softmax.

### Step-by-Step Intuition
1. **Initialize State (Cold Start)**: $m^{(0)} = -\\infty$, $\\ell^{(0)} = 0.0$.
2. **For Each New Tile $S^{(j)}$**:
   - Find tile maximum $m_{\\text{curr}} = \\max(S^{(j)})$.
   - Update running maximum $m_{\\text{new}} = \\max(m_{\\text{prev}}, m_{\\text{curr}})$.
   - Calculate scale factor $\\alpha = e^{m_{\\text{prev}} - m_{\\text{new}}}$ (if $m_{\\text{prev}} = -\\infty$, set $\\alpha = 0.0$).
   - Exponentiate tile scores relative to $m_{\\text{new}}$: $\\text{exp\\_chunk} = e^{S^{(j)} - m_{\\text{new}}}$.
   - Sum tile exponents: $\\text{lse\\_chunk} = \\sum \\text{exp\\_chunk}$.
   - Rescale and update running sum-exp: $\\ell_{\\text{new}} = \\ell_{\\text{prev}} \\cdot \\alpha + \\text{lse\\_chunk}$.

### Input Parameters
- \`chunks\`: Array of tile objects with \`name\` and \`scores\` array.
- \`mPrev\`: Previous running maximum scalar (default \`-\\infty\`).
- \`lsePrev\`: Previous running sum-exp scalar (default \`0.0\`).

### Output
- Returns updated running max scalar $m$, updated running log-sum-exp scalar $\\ell$, and rescaling factor $\\alpha$.

### Trade-offs & Complexity
- **Time Complexity**: $O(K)$ time per chunk of size $K$.
- **Space Complexity**: $O(1)$ auxiliary register space per row during streaming tile evaluation.`,
  constraints: ["1 <= num_chunks <= 1000"],
  examples: [
    {
      kind: "basic",
      title: "2-Chunk Streaming Softmax",
      inputDisplay: "chunk1 = [10, 20], chunk2 = [30, 15]",
      outputDisplay: "m = 30, lse = 1.05",
      input: {
        chunks: [
          { name: "Tile 0 (Key 0..1)", scores: [10.0, 20.0] },
          { name: "Tile 1 (Key 2..3)", scores: [30.0, 15.0] },
        ],
        mPrev: -Infinity,
        lsePrev: 0.0,
      },
      output: "m = 30, lse updated",
      explanation: "Updates running max from 20 to 30 and rescales previous sum-exp by exp(20 - 30).",
    },
    {
      kind: "complex",
      title: "5-Chunk Online Reduction",
      inputDisplay: "5 tiles x 2 scores each",
      outputDisplay: "Online Max m = 40.0",
      input: {
        chunks: [
          { name: "Tile 0 (Key 0..1)", scores: [10.0, 20.0] },
          { name: "Tile 1 (Key 2..3)", scores: [30.0, 15.0] },
          { name: "Tile 2 (Key 4..5)", scores: [25.0, 28.0] },
          { name: "Tile 3 (Key 6..7)", scores: [35.0, 32.0] },
          { name: "Tile 4 (Key 8..9)", scores: [40.0, 38.0] },
        ],
        mPrev: -Infinity,
        lsePrev: 0.0,
      },
      output: "Online Max m = 40.0",
      explanation: "Evaluates online max and log-sum-exp updates across 5 streaming tile chunks.",
    },
    {
      kind: "negative",
      title: "Initial Cold Start Check",
      inputDisplay: "scores = [10.0, 20.0]",
      outputDisplay: "m = 20.0, scale_prev = 0.0",
      input: {
        chunks: [{ name: "Tile 0", scores: [10.0, 20.0] }],
        mPrev: -Infinity,
        lsePrev: 0.0,
      },
      output: "m = 20.0, scale_prev = 0.0",
      explanation: "Cold start initialization (m_prev = -inf) sets scale_prev = 0.0 for initial tile.",
    },
  ],
  code: ONLINEMAXLOGSUMEXPTRACKER_CODE,
  timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Updates online max and sum-exp statistics for a chunk of size K in O(K) time.",
    space: "Requires O(1) auxiliary register space per row during streaming tile evaluation.",
  },
  topicGuide: {
    overview:
      "Online Softmax is the mathematical foundation enabling SRAM tiling in FlashAttention-1/2/3 and vLLM. It allows arbitrary partitioning of sequence attention without losing mathematical exactness.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $S = [S^{(1)}, S^{(2)}, \\dots, S^{(T)}]$. Softmax numerator for element $k \\in S^{(j)}$ is $e^{S_k - m^{(T)}}$. By induction, $e^{S_k - m^{(j)}} = e^{S_k - m^{(j-1)}} \\cdot e^{m^{(j-1)} - m^{(j)}}$. Thus, partial sum $L^{(j)} = \\sum_{k \\in S^{(j)}} e^{S_k - m^{(j)}}$ satisfies $L^{(1..j)} = L^{(1..j-1)} e^{m^{(j-1)} - m^{(j)}} + L^{(j)}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Online max tracking requires zero DRAM reads/writes. Running scalars $(m_i, \\ell_i)$ reside continuously in GPU warp registers, making online softmax compute-bound rather than memory-bound.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Cold start initialization: $m^{(0)} = -\\infty$ and $\\ell^{(0)} = 0$. When $m^{(0)} = -\\infty$, $e^{-\\infty - m^{(1)}} = 0$, driving initial scale factor to 0 without NaN errors.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "If a tile chunk consists entirely of $-\\infty$ logits (e.g. fully masked causal block), $m_{\\text{curr}} = -\\infty$. The state update is a no-op ($m_{\\text{new}} = m_{\\text{prev}}, \\alpha = 1.0$), ensuring safe skipping.",
      },
    ],
    keyTerms: [
      {
        term: "Online Softmax",
        definition:
          "An algorithm for computing exact Softmax over streaming data blocks using running max and sum-exp variables.",
      },
      {
        term: "Rescale Factor Alpha",
        definition:
          "The exponential scale factor $\\alpha = e^{m_{\\text{old}} - m_{\\text{new}}}$ used to adjust intermediate accumulators.",
      },
      {
        term: "Log-Sum-Exp Sum",
        definition: "The unnormalized sum of exponentiated logits relative to the running maximum.",
      },
      {
        term: "Cold Start Initializer",
        definition:
          "Setting $m = -\\infty$ and $\\ell = 0$ to ensure proper base case evaluation on the first tile.",
      },
    ],
  },
  trivia: ONLINEMAXLOGSUMEXPTRACKER_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT,
  generateSteps: generateONLINEMAXLOGSUMEXPTRACKERSteps,
};
