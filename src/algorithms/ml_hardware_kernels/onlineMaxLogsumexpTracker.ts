import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface onlineMaxLogsumexpTrackerInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const ONLINEMAXLOGSUMEXPTRACKER_CODE = `
import math

def update_online_max_lse(
    m_prev: float,
    lse_prev: float,
    new_chunk_scores: list[float]
) -> tuple[float, float, float]:
    """
    Updates running max m and running log-sum-exp lse for streaming online Softmax.
    - m_new = max(m_prev, max(new_chunk_scores))
    - lse_new = lse_prev * exp(m_prev - m_new) + sum(exp(score - m_new))
    Returns (m_new, lse_new, scale_prev).
    """
    if not new_chunk_scores:
        return m_prev, lse_prev, 1.0

    m_curr = max(new_chunk_scores)
    m_new = max(m_prev, m_curr)
    
    # Scaling factor for previous accumulated state: exp(m_prev - m_new)
    scale_prev = math.exp(m_prev - m_new) if m_prev != -float('inf') else 0.0
    
    # Exponentiate new chunk scores relative to m_new
    exp_chunk = [math.exp(s - m_new) for s in new_chunk_scores]
    lse_chunk = sum(exp_chunk)
    
    # Updated running log-sum-exp sum
    lse_new = lse_prev * scale_prev + lse_chunk

    return m_new, lse_new, scale_prev
`;

export const DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT: onlineMaxLogsumexpTrackerInput = {
  data: [10, 20, 30, 40, 50],
};

export const generateONLINEMAXLOGSUMEXPTRACKERSteps = (
  input: onlineMaxLogsumexpTrackerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [10, 20, 30, 40, 50];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          m_init: "-inf",
          lse_init: "0.0",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Online Max & LogSumExp Tracker",
    "Setting up streaming online softmax state: m = -inf, lse = 0.0.",
    { num_chunks: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`chunk=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      18,
      `Update streaming online max & LSE for chunk ${idx} (score=${val})`,
      `Updating running max m_new and rescaling previous log-sum-exp sum lse_prev by exp(m_prev - m_new).`,
      { chunkIdx: idx, scoreVal: val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    28,
    "Execution Complete",
    "Successfully tracked online max and log-sum-exp statistics across streaming tile chunks.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ONLINEMAXLOGSUMEXPTRACKER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "scale_prev = math.exp(m_new - m_prev)",
    "lse_new = lse_prev + lse_chunk",
    "m_new = m_prev + m_curr",
  ],
  hints: [
    { line: 18, hint: "Compute updated running max m_new = max(m_prev, max(new_chunk_scores))." },
    { line: 21, hint: "Calculate rescaling factor scale_prev = exp(m_prev - m_new)." },
    { line: 28, hint: "Update running sum-exp lse_new = lse_prev * scale_prev + lse_chunk." },
  ],
  lineExplanations: {
    1: "Defines entry point for online max and log-sum-exp tracking.",
    18: "Finds current chunk max score m_curr and updates running max m_new.",
    21: "Calculates exponential correction factor scale_prev = exp(m_prev - m_new).",
    25: "Exponentiates new chunk scores relative to updated max m_new.",
    28: "Accumulates rescaled previous sum-exp and new chunk sum-exp.",
    30: "Returns updated m_new, lse_new, and scale_prev.",
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
  description:
    "Online Softmax (Milakov & Gimelshein 2018, Rabe & Staats 2021, FlashAttention) enables evaluating exact Softmax attention over streaming data blocks loaded sequentially into SRAM without storing the full $N \\times N$ logit matrix in DRAM.\n\nWhen a new tile of logit scores $S^{(j)}$ is loaded into SRAM, Online Max & LogSumExp Tracker updates running state variables:\n1. **Running Max**: $m^{(j)} = \\max(m^{(j-1)}, \\max(S^{(j)}))$\n2. **Rescale Factor**: $\\alpha = e^{m^{(j-1)} - m^{(j)}}$\n3. **Running Sum-Exp**: $\\ell^{(j)} = \\ell^{(j-1)} \\cdot \\alpha + \\sum_{k} e^{S_k^{(j)} - m^{(j)}}$\n4. **Output Vector Rescaling**: $O^{(j)} = O^{(j-1)} \\cdot \\alpha + P^{(j)} V^{(j)}$\n\nInput Format:\n- data: Array of streaming chunk max scores or logit tiles.\n- target: Target sequence tile offset.\n\nOutput Format:\n- Updated running max scalar $m$, updated running log-sum-exp scalar $\\ell$, and rescaling factor $\\alpha$.",
  constraints: ["1 <= num_chunks <= 1000"],
  examples: [
    {
      kind: "basic",
      title: "2-Chunk Streaming Softmax",
      inputDisplay: "chunk1 = [10, 20], chunk2 = [30, 15]",
      outputDisplay: "m = 30, lse = 1.05",
      input: { data: [10, 20, 30, 40, 50] },
      output: "m = 30, lse updated",
      explanation:
        "Updates running max from 20 to 30 and rescales previous sum-exp by exp(20 - 30).",
    },
    {
      kind: "complex",
      title: "5-Chunk Online Reduction",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Online Max m = 50",
      input: { data: [10, 20, 30, 40, 50] },
      output: "Online Max m = 50",
      explanation: "Evaluates online max and log-sum-exp updates across 5 streaming tile chunks.",
    },
    {
      kind: "negative",
      title: "Initial Cold Start Check",
      inputDisplay: "data = [10]",
      outputDisplay: "m = 10, scale_prev = 0.0",
      input: { data: [10] },
      output: "m = 10, scale_prev = 0.0",
      explanation:
        "Cold start initialization (m_prev = -inf) sets scale_prev = 0.0 for initial tile.",
    },
  ],
  code: ONLINEMAXLOGSUMEXPTRACKER_CODE,
  timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Updates online max and sum-exp statistics for a chunk of size $K$ in $O(K)$ time.",
    space: "Requires $O(1)$ auxiliary register space per row during streaming tile evaluation.",
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
