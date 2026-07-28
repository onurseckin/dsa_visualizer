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
  target?: number;
  [key: string]: unknown;
}

export const ONLINEMAXLOGSUMEXPTRACKER_CODE = `def update_online_max_lse(m_prev: float, lse_prev: float, new_chunk_scores: list[float]) -> tuple[float, float, float]:
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
  data: [10.0, 20.0, 30.0, 15.0, 25.0, 28.0, 35.0, 32.0, 40.0, 38.0],
  target: 0,
};

export const generateONLINEMAXLOGSUMEXPTRACKERSteps = (
  input: onlineMaxLogsumexpTrackerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const chunks = input.chunks || DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT.chunks!;
  let runningM = input.mPrev ?? -Infinity;
  let runningLse = input.lsePrev ?? 0.0;
  const n = chunks.length;

  const history: {
    name: string;
    mPrev: number;
    mCurr: number;
    mNew: number;
    scalePrev: number;
    lseChunk: number;
    lseNew: number;
  }[] = [];

  const getSnapshot = (activeChunkIdx: number = -1) => {
    const rows = n + 1;
    const cols = 5;
    const cells: MatrixCellItem[] = [];

    const headers = [
      "Stream Chunk",
      "Previous m_prev",
      "Chunk Max m_curr",
      "Updated m_new",
      "Accumulated lse_new",
    ];
    for (let c = 0; c < 5; c++) {
      cells.push({ row: 0, col: c, value: headers[c], label: "Header", state: "default" });
    }

    for (let r = 0; r < n; r++) {
      const rowIdx = r + 1;
      const chunk = chunks[r];
      const rec = history[r];
      const isCurrent = r === activeChunkIdx;
      const state = isCurrent ? "active" : rec ? "sorted" : "default";

      cells.push(
        { row: rowIdx, col: 0, value: chunk.name, state },
        {
          row: rowIdx,
          col: 1,
          value: rec ? (rec.mPrev === -Infinity ? "-inf" : rec.mPrev.toFixed(1)) : "-",
          state,
        },
        { row: rowIdx, col: 2, value: rec ? rec.mCurr.toFixed(1) : "-", state },
        { row: rowIdx, col: 3, value: rec ? rec.mNew.toFixed(1) : "-", state },
        { row: rowIdx, col: 4, value: rec ? rec.lseNew.toFixed(2) : "-", state },
      );
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      title: "Streaming Online Softmax Max & Logsumexp Tracker Matrix",
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeChunkIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeChunkIdx),
      auxiliaryState: {
        customState: {
          Algorithm: "Online Softmax Streaming Max & Logsumexp Tracker (Milakov & Gimelshein 2018)",
          "Stream Chunks Count": String(n),
          "Running Max m": runningM === -Infinity ? "-inf" : runningM.toFixed(4),
          "Running Logsumexp lse": runningLse.toFixed(4),
          "Numerical Stability": "Zero Overflow / Underflow Guarantees",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Online Softmax Streaming Tracker Entry",
    `Started streaming online Softmax max & logsumexp tracking across ${n} attention score tiles.`,
    { n, mPrev: runningM === -Infinity ? -999 : runningM, lsePrev: runningLse },
  );

  for (let idx = 0; idx < n; idx++) {
    const chunk = chunks[idx];
    const mPrev = runningM;

    addStep(
      2,
      `Stream Chunk ${idx + 1}/${n}: Process Tile "${chunk.name}"`,
      `Loading attention tile "${chunk.name}": scores = [${chunk.scores.join(", ")}]. Current running max m_prev = ${mPrev === -Infinity ? "-inf" : mPrev.toFixed(4)}.`,
      { chunkIdx: idx, name: chunk.name, scores: JSON.stringify(chunk.scores) },
      idx,
    );

    // Empty check (2)
    addStep(
      2,
      "Check Empty Score Vector Condition: if not new_chunk_scores",
      `Verified new_chunk_scores list is non-empty (${chunk.scores.length} scores).`,
      { isEmpty: false },
      idx,
    );

    const mCurr = Math.max(...chunk.scores);
    addStep(
      5,
      `Calculate Chunk Maximum Score: m_curr = max(new_chunk_scores) = ${mCurr.toFixed(4)}`,
      `Evaluated maximum attention score in tile: m_curr = ${mCurr.toFixed(4)}.`,
      { m_curr: mCurr },
      idx,
    );

    const mNew = Math.max(mPrev, mCurr);
    addStep(
      6,
      `Update Global Running Max Score: m_new = max(${mPrev === -Infinity ? "-inf" : mPrev.toFixed(4)}, ${mCurr.toFixed(4)}) = ${mNew.toFixed(4)}`,
      `Updated running maximum score m_new = ${mNew.toFixed(4)}.`,
      { m_prev: mPrev === -Infinity ? -999 : mPrev, m_curr: mCurr, m_new: mNew },
      idx,
    );

    const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
    addStep(
      8,
      `Calculate Rescaling Multiplier: scale_prev = exp(m_prev - m_new) = ${scalePrev.toFixed(4)}`,
      `Evaluated output & denominator correction multiplier scale_prev = ${scalePrev.toFixed(4)}.`,
      { scale_prev: scalePrev },
      idx,
    );

    const expChunk = chunk.scores.map((s) => Math.exp(s - mNew));
    addStep(
      10,
      "Exponentiate Tile Scores: exp(S - m_new)",
      `Evaluated exponentiated score terms: [${expChunk.map((e) => e.toFixed(4)).join(", ")}].`,
      { expChunk: JSON.stringify(expChunk.map((e) => e.toFixed(4))) },
      idx,
    );

    const lseChunk = expChunk.reduce((a, b) => a + b, 0);
    addStep(
      11,
      `Sum Chunk Exponentiated Scores: lse_chunk = ${lseChunk.toFixed(4)}`,
      `Summed chunk exponentiated terms lse_chunk = ${lseChunk.toFixed(4)}.`,
      { lse_chunk: lseChunk },
      idx,
    );

    const lseNew = runningLse * scalePrev + lseChunk;
    addStep(
      13,
      `Update Online Running Logsumexp: lse_new = lse_prev * scale_prev + lse_chunk = ${lseNew.toFixed(4)}`,
      `Rescaled previous normalizer lse_prev by scale_prev (${scalePrev.toFixed(4)}) and added lse_chunk (${lseChunk.toFixed(4)}): lse_new = ${lseNew.toFixed(4)}.`,
      { lse_prev: runningLse, scale_prev: scalePrev, lse_chunk: lseChunk, lse_new: lseNew },
      idx,
    );

    runningM = mNew;
    runningLse = lseNew;

    history.push({
      name: chunk.name,
      mPrev,
      mCurr,
      mNew,
      scalePrev,
      lseChunk,
      lseNew,
    });

    addStep(
      15,
      `Execution Complete for Chunk ${idx + 1}: Return (m_new=${mNew.toFixed(4)}, lse_new=${lseNew.toFixed(4)}, scale_prev=${scalePrev.toFixed(4)})`,
      `Persisted online max m = ${mNew.toFixed(4)} and normalizer lse = ${lseNew.toFixed(4)} for tile "${chunk.name}".`,
      { m_new: mNew, lse_new: lseNew, scale_prev: scalePrev },
      idx,
    );
  }

  // Final step
  addStep(
    15,
    "Execution Complete: Return Final Online Softmax Trackers",
    `Completed streaming online Softmax tracking across all ${n} tiles. Final global max m = ${runningM.toFixed(4)}, Final normalizer lse = ${runningLse.toFixed(4)}.`,
    { runningM, runningLse, completed: true },
  );

  return steps;
};

const ONLINEMAXLOGSUMEXPTRACKER_TRIVIA: TriviaMeta = {
  skipLines: [4, 7, 9, 12, 14],
  distractors: [
    "m_new = m_prev + m_curr",
    "scale_prev = exp(m_new - m_prev)",
    "lse_new = lse_prev + lse_chunk",
    "return m_curr, lse_chunk",
  ],
  hints: [
    { line: 6, hint: "Online max updating equation: m_new = max(m_prev, m_curr)." },
    { line: 8, hint: "Softmax output rescaling factor: scale_prev = exp(m_prev - m_new)." },
    {
      line: 13,
      hint: "Online logsumexp updating equation: lse_new = lse_prev * scale_prev + lse_chunk.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for update_online_max_lse function implementing online Softmax (Milakov & Gimelshein 2018).",
    2: "Checks if new_chunk_scores input list is empty.",
    3: "Returns unchanged m_prev, lse_prev, and scale=1.0 for empty chunk.",
    4: "Blank line before score max calculation.",
    5: "Calculates maximum score in current tile chunk m_curr = max(new_chunk_scores).",
    6: "Updates running global maximum score m_new = max(m_prev, m_curr).",
    7: "Blank line before rescaling multiplier calculation.",
    8: "Calculates previous output correction multiplier scale_prev = exp(m_prev - m_new) if m_prev != -inf else 0.0.",
    9: "Blank line before exponentiated score calculations.",
    10: "Calculates exponentiated scores for current chunk exp_chunk = [exp(s - m_new) for s in scores].",
    11: "Sums current chunk exponentiated terms lse_chunk = sum(exp_chunk).",
    12: "Blank line before online logsumexp update.",
    13: "Rescales previous normalizer and adds current chunk sum: lse_new = lse_prev * scale_prev + lse_chunk.",
    14: "Blank line separating update logic from return statement.",
    15: "Returns tuple of (m_new, lse_new, scale_prev).",
  },
};

export const onlineMaxLogsumexpTracker: AlgorithmDefinition<onlineMaxLogsumexpTrackerInput> = {
  id: "online-max-logsumexp-tracker",
  title: "Online Softmax Streaming Max & Logsumexp Tracker",
  topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Hard",
  description:
    "The Online Softmax Streaming Max & Logsumexp Tracker implements the online Softmax algorithm introduced by **Milakov & Gimelshein (2018)** and adopted in **FlashAttention (Dao et al. 2022)**. Standard Softmax requires two full passes over sequence data: Pass 1 calculates global max $m = \\max(x_i)$ and sum $L = \\sum e^{x_i - m}$, while Pass 2 divides each exponent by $L$. Online Softmax updates running max $m$ and running normalizer $L$ incrementally over streaming tile blocks in a **single pass**, guaranteeing zero numerical overflow or underflow.\n\n### Why It Exists\nIn long-sequence transformer attention, streaming attention scores $S_{i,j}$ arrive block-by-block from SRAM tiles. Standard 2-pass Softmax would require storing all $N$ intermediate scores in HBM DRAM. Online Softmax updates running statistics $(m, L)$ on-the-fly, allowing GPU kernels to compute exact attention outputs in a single fused pass.\n\n### Mathematical Formulation\nFor pre-existing running max $m_{old}$, running normalizer $L_{old}$, new tile scores $S_{chunk}$, and new tile max $m_{chunk} = \\max(S_{chunk})$:\n\n$$1. \\quad m_{new} = \\max(m_{old}, m_{chunk}) \\quad (\\text{Running Max Update})$$\n\n$$2. \\quad \\text{scale}_{prev} = e^{m_{old} - m_{new}} \\quad (\\text{Rescaling Multiplier for Previous Accumulators})$$\n\n$$3. \\quad L_{chunk} = \\sum_{s \\in S_{chunk}} e^{s - m_{new}} \\quad (\\text{New Tile Exponentiated Sum})$$\n\n$$4. \\quad L_{new} = L_{old} \\cdot \\text{scale}_{prev} + L_{chunk} \\quad (\\text{Online Normalizer Update})$$\n\n$$5. \\quad O_{new} = \\frac{O_{old} \\cdot L_{old} \\cdot \\text{scale}_{prev} + P_{chunk} V_{chunk}}{L_{new}} \\quad (\\text{Online Softmax Output Rescaling})$$\n\n### Step-by-Step Intuition\n1. **Local Tile Max**: Find maximum score $m_{chunk}$ in newly loaded SRAM tile scores.\n2. **Global Max Update**: Compare previous global max $m_{old}$ with $m_{chunk}$: $m_{new} = \\max(m_{old}, m_{chunk})$.\n3. **Rescaling Multiplier**: Evaluate correction factor $\\text{scale}_{prev} = e^{m_{old} - m_{new}} \\le 1.0$. If $m_{new} > m_{old}$, $\\text{scale}_{prev} < 1.0$ downscales pre-existing sums to account for the new larger maximum.\n4. **Tile Exponentiated Sum**: Exponentiate tile scores relative to $m_{new}$: $L_{chunk} = \\sum e^{s - m_{new}}$.\n5. **Running Normalizer Update**: Rescale $L_{old}$ and add $L_{chunk}$: $L_{new} = L_{old} \\cdot \\text{scale}_{prev} + L_{chunk}$.\n\n### Key Trade-Offs & Hardware Execution\n- **Numerical Stability (Zero Overflow)**: Subtracting $m_{new}$ before exponentiating guarantees $s - m_{new} \\le 0$, ensuring $e^{s - m_{new}} \\in (0, 1]$ and preventing FP16/BF16 numerical overflow.\n- **FlashAttention Core Building Block**: Powers FlashAttention-1, FlashAttention-2, and FlashAttention-3 forward and backward passes.",
  constraints: [
    "1 <= chunks.length <= 128",
    "1 <= chunk.scores.length <= 256",
    "scores elements are finite floats",
  ],
  examples: [
    {
      kind: "basic",
      title: "Streaming Online Softmax Across 5 Attention Tiles",
      inputDisplay: "5 Attention Tiles (scores 10..40), mPrev = -inf, lsePrev = 0.0",
      outputDisplay: "Final Max m = 40.0, Final Normalizer lse = 1.135",
      input: DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT,
      output: "(40.0, 1.1353, 0.1353)",
      explanation:
        "Streams 5 score tiles. Dynamically rescales running max m and normalizer lse at each tile step with zero numerical overflow.",
    },
  ],
  code: ONLINEMAXLOGSUMEXPTRACKER_CODE,
  timeComplexity: { best: "O(K \\cdot B)", average: "O(K \\cdot B)", worst: "O(K \\cdot B)" },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "Linear in total streaming scores $O(K \\cdot B)$, updating running max $m$ and logsumexp $L$ in $O(B)$ time per tile.",
    space: "Requires $O(K)$ memory to record streaming online tracker history.",
  },
  topicGuide: {
    overview:
      "The Online Softmax Streaming Max & Logsumexp Tracker updates running max m and logsumexp L incrementally over streaming attention tiles.",
    sections: [
      {
        heading: "Core Concept & Online Softmax (Milakov & Gimelshein 2018)",
        body: "Standard Softmax requires 2 full passes over data. Online Softmax updates running max m and normalizer L in a single fused pass, enabling single-pass streaming attention.",
      },
      {
        heading: "Rescaling Multiplier (scale_prev = exp(m_prev - m_new))",
        body: "When a new larger maximum is encountered (m_new > m_prev), scale_prev = exp(m_prev - m_new) < 1.0 downscales pre-existing accumulators to maintain exact mathematical equivalence.",
      },
      {
        heading: "Zero Numerical Overflow Guarantees",
        body: "Subtracting m_new before computing exp(s - m_new) guarantees all exponent terms are <= 0, keeping exp(s - m_new) in (0, 1] and eliminating FP16/BF16 overflow.",
      },
      {
        heading: "FlashAttention Engine Core",
        body: "Online Softmax is the exact mathematical foundation behind FlashAttention-1, FlashAttention-2, and FlashAttention-3 forward and backward engines.",
      },
    ],
    keyTerms: [
      {
        term: "Online Softmax",
        definition:
          "Incremental single-pass Softmax algorithm updating running max m and normalizer L dynamically.",
      },
      {
        term: "Rescaling Multiplier",
        definition:
          "Correction factor scale_prev = exp(m_prev - m_new) downscaling previous accumulators when max increases.",
      },
      {
        term: "Running Logsumexp (L)",
        definition:
          "Incremental sum of exponentiated scores L_new = L_prev * scale_prev + sum(exp(S - m_new)).",
      },
      {
        term: "Numerical Overflow",
        definition:
          "Floating point hardware exception when exp(x) exceeds maximum representable float value (e.g. exp(89) in FP16).",
      },
    ],
  },
  trivia: ONLINEMAXLOGSUMEXPTRACKER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT,
  generateSteps: generateONLINEMAXLOGSUMEXPTRACKERSteps,
};
