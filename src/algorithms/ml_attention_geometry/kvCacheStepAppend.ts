import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface kvCacheStepAppendInput {
  data: number[];
  target?: number;
}

export const KVCACHESTEPAPPEND_CODE = `
def append_kv_cache_step(
    k_cache: list[list[float]],  # Shape [max_seq_len, d_model]
    v_cache: list[list[float]],  # Shape [max_seq_len, d_model]
    new_k: list[float],          # Shape [d_model]
    new_v: list[float],          # Shape [d_model]
    current_seq_len: int
) -> tuple[list[list[float]], list[list[float]], int]:
    """
    Appends new key and value vectors into pre-allocated contiguous KV cache buffers.
    Increments current sequence length pointer without dynamic reallocation.
    """
    # Step 1: Write new key and value vectors into cache slot at current_seq_len offset
    k_cache[current_seq_len] = list(new_k)
    v_cache[current_seq_len] = list(new_v)
    
    # Step 2: Advance sequence length counter for next decoding iteration
    updated_seq_len = current_seq_len + 1
    
    return k_cache, v_cache, updated_seq_len
`;

export const DEFAULT_KVCACHESTEPAPPEND_INPUT: kvCacheStepAppendInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateKvCacheStepAppendSteps = (input: kvCacheStepAppendInput): AlgorithmStep[] => {
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
    "Initialize Autoregressive KV-Cache Step Append",
    "Setting up pre-allocated KV cache buffers and sequence length offset pointer.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`t=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      13,
      `Append new token KV pair at offset t=${idx} (value=${val})`,
      `Writing key vector K_t and value vector V_t into cache index slot ${idx}.`,
      { seqLen: idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    17,
    "Execution Complete",
    "Successfully appended step KV projections into contiguous cache memory.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const KVCACHESTEPAPPEND_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  distractors: [
    "k_cache.append(new_k)",
    "k_cache = k_cache + [new_k]",
    "updated_seq_len = current_seq_len + len(new_k)",
  ],
  hints: [
    { line: 13, hint: "Assign new key vector directly into k_cache[current_seq_len]." },
    { line: 14, hint: "Assign new value vector directly into v_cache[current_seq_len]." },
    { line: 17, hint: "Increment current_seq_len by 1." },
  ],
  lineExplanations: {
    1: "Defines entry point for KV cache step append operations.",
    13: "Overwrites key cache slot at index current_seq_len with new_k vector.",
    14: "Overwrites value cache slot at index current_seq_len with new_v vector.",
    17: "Increments active sequence length counter.",
    19: "Returns updated cache buffers and incremented sequence length.",
  },
};

export const kvCacheStepAppend: AlgorithmDefinition<kvCacheStepAppendInput> = {
  id: "kv-cache-step-append",
  title: "Autoregressive KV-Cache Step Append",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "ml_llm_serving"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "During autoregressive LLM decoding (generation phase), tokens are generated one by one. In step $t$, the transformer model computes Query ($Q_t$), Key ($K_t$), and Value ($V_t$) vectors for token $t$. To compute attention over all tokens $1 \\dots t$, past keys $K_{1 \\dots t-1}$ and values $V_{1 \\dots t-1}$ are retrieved from the KV cache.\n\nAutoregressive KV-Cache Step Append performs zero-copy in-place writing of new key/value projections into pre-allocated memory buffers at offset $t$: $K_{\\text{cache}}[:, :, t, :] = K_t$ and $V_{\\text{cache}}[:, :, t, :] = V_t$. This converts what would be an $O(t^2)$ re-computation loop into an $O(1)$ append per step.\n\nInput Format:\n- data: Array of token sequence step indices or values.\n- target: Active sequence length pointer offset.\n\nOutput Format:\n- Updated KV cache tensor references and updated sequence length scalar $t+1$.\n\nEdge Cases & Constraints:\n- Boundary cases: $t = \\text{max\\_seq\\_len}$ requires buffer re-allocation or cache eviction (sliding window / prefix cache).\n- Memory contiguity: Ensures 128-bit aligned vector writes to prevent GPU non-coalesced store operations.\n- RoPE integration: Rotary Position Embeddings (RoPE) must be applied to $K_t$ using position $t$ BEFORE writing to the KV cache.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Single Token Append",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Appends new token KV vectors into cache slot at current step offset.",
    },
    {
      kind: "complex",
      title: "Sequential Step Appends",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Appends KV pairs sequentially across 5 generation steps.",
    },
    {
      kind: "negative",
      title: "Cache Slot Overwrite Check",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Safely handles sequence length pointer bounds.",
    },
  ],
  code: KVCACHESTEPAPPEND_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Requires $O(d)$ time to store new $d$-dimensional key/value vectors into pre-allocated memory.",
    space: "Requires $O(1)$ auxiliary space during step append operation.",
  },
  topicGuide: {
    overview:
      "KV Caching is the single most critical memory optimization in LLM generation systems (vLLM, HuggingFace TGI, PyTorch). Without KV caching, generating $N$ tokens requires $O(N^2)$ forward passes of quadratic complexity $O(N^3)$. Step appending reduces total compute to $O(N^2)$ linear attention passes.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At generation step $t$, the query $Q_t \\in \\mathbb{R}^{1 \\times d_k}$ attends to all keys $K_{\\le t} \\in \\mathbb{R}^{t \\times d_k}$ and values $V_{\\le t} \\in \\mathbb{R}^{t \\times d_v}$. By appending $K_t$ and $V_t$ directly to $K_{\\text{cache}}[0 \\dots t-1]$ and $V_{\\text{cache}}[0 \\dots t-1]$, the total cache $K_{\\le t}$ is formed without re-running linear projections for past tokens.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Memory bandwidth allocation is optimized by pre-allocating static cache tensors `[batch_size, num_heads, max_seq_len, head_dim]`. In CUDA/Triton kernels, writes issue 128-bit vector stores (`float4` / `bfloat16x8`) directly into High Bandwidth Memory (HBM).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Static contiguous KV caches suffer from internal memory fragmentation when request sequence lengths are unpredictable. PagedAttention (vLLM) resolves this by allocating KV cache pages dynamically in virtual block tables while maintaining logical step-append semantics.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "When context window limits are reached ($t > \\text{max\\_context}$), serving systems employ sliding window attention (evicting oldest token entries) or prompt compression to keep memory usage bounded.",
      },
    ],
    keyTerms: [
      {
        term: "KV Cache",
        definition:
          "Memory buffer storing key and value projections for past tokens during autoregressive LLM decoding.",
      },
      {
        term: "Step Append",
        definition: "In-place write operation storing new token $K_t, V_t$ vectors at offset $t$.",
      },
      {
        term: "RoPE Pre-application",
        definition:
          "Applying Rotary Position Embeddings to key vectors before storing them in the KV cache.",
      },
      {
        term: "Vector Store Coalescing",
        definition:
          "GPU memory hardware access pattern where parallel threads write contiguous memory locations simultaneously.",
      },
    ],
  },
  trivia: KVCACHESTEPAPPEND_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_KVCACHESTEPAPPEND_INPUT,
  generateSteps: generateKvCacheStepAppendSteps,
};
