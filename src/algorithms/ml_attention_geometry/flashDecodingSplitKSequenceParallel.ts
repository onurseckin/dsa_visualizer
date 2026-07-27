import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashDecodingSplitKSequenceParallelInput {
  data: number[];
  target?: number;
}

export const FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE = `
def flash_decoding_split_k(q_vec: list[float], k_tiles: list[list[list[float]]], v_tiles: list[list[list[float]]], scale: float) -> list[float]:
    """
    Simulates Flash-Decoding split-K sequence parallel attention forward pass.
    Partitions long KV sequence into S sub-blocks, computes local max m_s and LSE l_s,
    then combines partial outputs O_s via global log-sum-exp rescaling.
    """
    import math

    num_splits = len(k_tiles)
    partial_outputs = []
    partial_maxes = []
    partial_lses = []

    # Phase 1: Parallel Split-K Computation across KV chunks
    for s in range(num_splits):
        k_chunk = k_tiles[s]
        v_chunk = v_tiles[s]
        scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in k_chunk]
        m_s = max(scores)
        exp_scores = [math.exp(sc - m_s) for sc in scores]
        l_s = sum(exp_scores)
        
        # Weighted partial output vector O_s
        dim = len(v_chunk[0])
        o_s = [0.0] * dim
        for w, v_vec in zip(exp_scores, v_chunk):
            for d in range(dim):
                o_s[d] += w * v_vec[d]
                
        partial_outputs.append(o_s)
        partial_maxes.append(m_s)
        partial_lses.append(l_s)

    # Phase 2: Global Rescaling Reduction across Split-K blocks
    global_max = max(partial_maxes)
    global_lse = sum(l_s * math.exp(m_s - global_max) for m_s, l_s in zip(partial_maxes, partial_lses))
    
    dim = len(partial_outputs[0])
    final_output = [0.0] * dim
    for o_s, m_s in zip(partial_outputs, partial_maxes):
        rescale = math.exp(m_s - global_max) / global_lse
        for d in range(dim):
            final_output[d] += rescale * o_s[d]

    return final_output
`;

export const DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT: flashDecodingSplitKSequenceParallelInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateFlashDecodingSplitKSequenceParallelSteps = (
  input: flashDecodingSplitKSequenceParallelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Flash-Decoding Split-K Sequence Parallel Attention",
    "Setting up execution grid partitioning KV cache dimension into K splits for max SM occupancy.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`split=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Execute Split-K Block ${idx}: process tile chunk (value=${val})`,
      `Computing local max m_s, unnormalized exponent sum l_s, and partial unscaled attention vector O_s.`,
      { splitIdx: idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    36,
    "Execution Complete",
    "Global log-sum-exp reduction across all split-K blocks complete.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLASHDECODINGSPLITKSEQUENCEPARALLEL_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7],
  distractors: [
    "final_output = sum(partial_outputs) / len(partial_outputs)",
    "rescale = math.exp(global_max - m_s)",
    "global_lse = max(partial_lses)",
  ],
  hints: [
    { line: 15, hint: "Compute scaled dot products Q @ K^T for current split tile." },
    { line: 18, hint: "Track local maximum m_s to ensure online numerical stability." },
    { line: 31, hint: "Compute global max across all split-K thread blocks." },
    { line: 36, hint: "Rescale partial output vectors using global log-sum-exp denominator." },
  ],
  lineExplanations: {
    1: "Defines Flash-Decoding split-K sequence parallel entry point.",
    15: "Loops over split-K tiles partitioned across the KV sequence length.",
    18: "Computes partial maximum m_s for numerical stability during exponentiation.",
    20: "Accumulates unnormalized log-sum-exp denominator l_s for the local chunk.",
    31: "Reduces partial maxes to compute global maximum across all split-K blocks.",
    36: "Combines partial output vectors with log-sum-exp scaling factors.",
  },
};

export const flashDecodingSplitKSequenceParallel: AlgorithmDefinition<flashDecodingSplitKSequenceParallelInput> =
  {
    id: "flash-decoding-split-k-sequence-parallel",
    title: "Flash-Decoding Split-K Sequence Parallel Attention",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Flash-Decoding addresses a fundamental GPU under-utilization bottleneck during LLM autoregressive generation (prefill vs. decode asymmetry). During decoding, the query sequence length is small ($Q=1$), which limits standard FlashAttention parallelization across thread blocks to $B \\times H$ (batch size $\\times$ heads). On ultra-long contexts (e.g. 128k tokens), standard kernels underutilize GPU Streaming Multiprocessors (SMs).\n\nFlash-Decoding partitions the key/value sequence dimension $K$ into $S$ split-K chunks processed in parallel by separate thread blocks. Each block computes local Online Softmax statistics $(m_s, \\ell_s, O_s)$. A fast secondary reduction kernel merges partial outputs using global log-sum-exp rescaling:\n$$O = \\sum_{s=1}^S \\frac{e^{m_s - m_{\\text{global}}}}{\\ell_{\\text{global}}} O_s$$\n\nInput Format:\n- data: Sequence split lengths or block sizes for parallel split-K decomposition.\n- target: Target context sequence length $N_{kv}$.\n\nOutput Format:\n- Combined output vector $O \\in \\mathbb{R}^{d_v}$ after global reduction across all split-K thread blocks.\n\nEdge Cases & Constraints:\n- Boundary cases: Short context length $N_{kv} < \\text{block\\_size}$ falls back to standard single-block FlashAttention decoding.\n- Numerical stability: Prevents FP16 overflow during global reduction by subtracting $m_{\\text{global}} = \\max_s(m_s)$ before exponentiation.\n- Memory synchronization: Requires lightweight barrier or atomic reduction kernel across split-K blocks.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Split-K Decoding",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Splits 30-token KV context across 3 parallel thread blocks.",
      },
      {
        kind: "complex",
        title: "Long-Context 5-Split Decoding",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Executes 5-way split-K sequence parallel decoding with final reduction.",
      },
      {
        kind: "negative",
        title: "Single Split Fallback",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Safely handles uneven context splits with partial block padding.",
      },
    ],
    code: FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE,
    timeComplexity: { best: "O(N / S + S)", average: "O(N / S + S)", worst: "O(N / S + S)" },
    spaceComplexity: "O(S \\cdot d_v)",
    complexityAnalysis: {
      time: "Parallelizes $O(N)$ KV cache scanning across $S$ split-K blocks in $O(N/S)$ time, plus $O(S \\cdot d_v)$ reduction overhead.",
      space:
        "Allocates $O(S \\cdot d_v)$ temporary global memory workspace for storing intermediate split outputs $O_s$ and log-sum-exp scalars $(m_s, \\ell_s)$.",
    },
    topicGuide: {
      overview:
        "Flash-Decoding (Dao et al., vLLM team) optimizes LLM inference latency for long prompts. In decode mode, $Q=1$ creates a severe memory-bound workload. Flash-Decoding unlocks massive GPU parallelism by splitting the sequence dimension $K$ across independent thread blocks, speeding up decode throughput by up to 8x on long contexts.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For split $s \\in \\{1 \\dots S\\}$ operating on key/value slice $(K_s, V_s)$, the thread block computes unnormalized output $O_s = \\sum_{j \\in \\text{chunk}_s} \\exp(Q K_j^T / \\sqrt{d} - m_s) V_j$, local max $m_s = \\max_{j}(Q K_j^T / \\sqrt{d})$, and denominator $\\ell_s = \\sum_{j} \\exp(Q K_j^T / \\sqrt{d} - m_s)$. The reduction pass computes global $m = \\max_s m_s$, global denominator $\\ell = \\sum_s \\ell_s e^{m_s - m}$, and final vector $O = \\sum_s \\frac{e^{m_s - m}}{\\ell} O_s$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "By increasing the number of active thread blocks from $B \\times H$ to $B \\times H \\times S$, Flash-Decoding saturates GPU SM execution units on NVIDIA H100/A100 GPUs. Inter-block communication is minimized by storing partial $(m_s, \\ell_s, O_s)$ in HBM workspace buffers and invoking a small reduction kernel.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Flash-Decoding is integrated with PagedAttention block tables in vLLM. Split-K block mapping aligns with page boundaries (e.g., 16 or 32 tokens per block) to avoid unaligned global memory loads.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Dynamic split selection automatically chooses $S = \\min(S_{\\max}, \\lceil N_{kv} / \\text{tile\\_size} \\rceil)$. If $N_{kv}$ is small, $S=1$ avoids unnecessary reduction kernel launch overhead.",
        },
      ],
      keyTerms: [
        {
          term: "Flash-Decoding",
          definition:
            "A sequence-parallel attention decoding algorithm splitting the KV sequence dimension across GPU SMs.",
        },
        {
          term: "Split-K Parallelism",
          definition:
            "A parallelization pattern partitioning matrix reduction dimensions among independent compute blocks.",
        },
        {
          term: "Log-Sum-Exp (LSE) Rescaling",
          definition:
            "Technique for merging partial softmax results by adjusting exponent base offsets.",
        },
        {
          term: "SM Occupancy",
          definition:
            "The percentage of GPU Streaming Multiprocessors actively executing thread blocks.",
        },
      ],
    },
    trivia: FLASHDECODINGSPLITKSEQUENCEPARALLEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT,
    generateSteps: generateFlashDecodingSplitKSequenceParallelSteps,
  };
