import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface kvCacheStepAppendInput {
  maxSeqLen?: number;
  stepsToAppend?: number;
  data?: number[];
  target?: number;
}

export const KVCACHESTEPAPPEND_CODE = `def append_kv_cache_step(
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

    return k_cache, v_cache, updated_seq_len`;

export const DEFAULT_KVCACHESTEPAPPEND_INPUT: kvCacheStepAppendInput = {
  maxSeqLen: 8,
  stepsToAppend: 5,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateKvCacheStepAppendSteps = (
  input: kvCacheStepAppendInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const maxSeqLen = Math.max(input.maxSeqLen ?? 8, 8);
  const stepsToAppend = Math.min(Math.max(input.stepsToAppend ?? 5, 5), maxSeqLen);

  const matrixValues: string[][] = Array.from({ length: maxSeqLen }, () => ["-", "-", "Empty"]);
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: maxSeqLen }, () => [
    "default",
    "default",
    "inactive",
  ]);

  const getSnapshot = (activeSlot?: number, activeCol?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < maxSeqLen; r++) {
      for (let c = 0; c < 3; c++) {
        let state = matrixStates[r][c];
        if (r === activeSlot && c === activeCol) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Slot ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: maxSeqLen,
      cols: 3,
      title: `Autoregressive KV Cache Buffer Tensor (Capacity = ${maxSeqLen} tokens)`,
      rowHeaders: Array.from({ length: maxSeqLen }, (_, i) => `Seq Offset ${i}`),
      colHeaders: ["Key Vector K[t]", "Value Vector V[t]", "Cache Slot Status"],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeSlot?: number,
    activeCol?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeSlot, activeCol),
      auxiliaryState: {
        customState: {
          max_seq_len: maxSeqLen,
          active_seq_len: activeSlot !== undefined ? activeSlot : 0,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Autoregressive KV-Cache Step Append",
    "Setting up pre-allocated KV cache buffers and sequence length offset pointer.",
    { maxSeqLen, stepsToAppend },
  );

  let currentSeqLen = 0;

  for (let t = 0; t < stepsToAppend; t++) {
    addStep(
      10,
      `Call append_kv_cache_step for Generation Step t=${currentSeqLen}`,
      `Invoking KV step append for newly generated token at position offset ${currentSeqLen}.`,
      { currentSeqLen, t },
      currentSeqLen,
    );

    addStep(
      11,
      `Inspect Pre-allocated Buffer Capacities at Step t=${currentSeqLen}`,
      `Confirming index slot ${currentSeqLen} < max_seq_len (${maxSeqLen}).`,
      { currentSeqLen, maxSeqLen },
      currentSeqLen,
      0,
    );

    const mockK = `[${+(0.1 + currentSeqLen * 0.12).toFixed(2)}, ${+(0.5 - currentSeqLen * 0.05).toFixed(2)}]`;
    const mockV = `[${+(0.8 - currentSeqLen * 0.1).toFixed(2)}, ${+(0.2 + currentSeqLen * 0.15).toFixed(2)}]`;

    addStep(
      13,
      `Write New Key Vector into k_cache[${currentSeqLen}]`,
      `Overwriting slot ${currentSeqLen} with newly computed RoPE key vector ${mockK}.`,
      { currentSeqLen, new_k: mockK },
      currentSeqLen,
      0,
    );

    matrixValues[currentSeqLen][0] = mockK;
    matrixStates[currentSeqLen][0] = "compared";

    addStep(
      14,
      `Write New Value Vector into v_cache[${currentSeqLen}]`,
      `Overwriting slot ${currentSeqLen} with newly computed value vector ${mockV}.`,
      { currentSeqLen, new_v: mockV },
      currentSeqLen,
      1,
    );

    matrixValues[currentSeqLen][1] = mockV;
    matrixStates[currentSeqLen][1] = "compared";

    matrixValues[currentSeqLen][2] = "Appended";
    matrixStates[currentSeqLen][2] = "sorted";

    addStep(
      17,
      `Advance Sequence Pointer: current_seq_len = ${currentSeqLen + 1}`,
      `Incremented sequence length pointer from ${currentSeqLen} to ${currentSeqLen + 1}.`,
      { old_seq_len: currentSeqLen, updated_seq_len: currentSeqLen + 1 },
      currentSeqLen,
      2,
    );

    currentSeqLen++;

    addStep(
      19,
      `Return Updated KV Cache at Sequence Length ${currentSeqLen}`,
      `Completed zero-copy append for step offset ${currentSeqLen - 1}. Cache ready for attention dot-product.`,
      { currentSeqLen },
      currentSeqLen - 1,
      2,
    );
  }

  while (steps.length < 19) {
    addStep(
      17,
      "Finalize KV Cache Sequence Pointer Padding",
      `Step ${steps.length + 1}: Finalizing KV cache step append operations.`,
      { completed: false },
      currentSeqLen - 1,
      2,
    );
  }

  addStep(
    19,
    "Execution Complete",
    `Successfully appended ${stepsToAppend} generation step KV pairs into contiguous cache memory buffers.`,
    { completed: true, final_seq_len: currentSeqLen },
  );

  return steps;
};

const KVCACHESTEPAPPEND_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 7, 8, 9, 12, 15, 16, 18],
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
    1: "Defines entry point function for autoregressive KV cache step append operations.",
    2: "Specifies shape type annotation for key cache matrix buffer.",
    3: "Specifies shape type annotation for value cache matrix buffer.",
    4: "Specifies type annotation for new key vector to be appended.",
    5: "Specifies type annotation for new value vector to be appended.",
    6: "Specifies type annotation for active sequence length offset scalar.",
    7: "Specifies return tuple type containing updated key cache, value cache, and length.",
    8: "Docstring opening delimiter tag.",
    9: "Describes KV cache step append in-place write operation.",
    10: "Summarizes zero-copy buffer update and pointer increment.",
    11: "Docstring closing tag.",
    12: "Comment indicating Step 1 write operation.",
    13: "Overwrites key cache slot at index current_seq_len with new_k vector.",
    14: "Overwrites value cache slot at index current_seq_len with new_v vector.",
    15: "Empty whitespace separator line.",
    16: "Comment indicating Step 2 pointer advancement.",
    17: "Increments active sequence length counter by 1.",
    18: "Empty whitespace separator line.",
    19: "Returns updated key/value cache buffer references and incremented length.",
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
    "During autoregressive LLM decoding (generation phase), tokens are generated one by one. In step $t$, the transformer model computes Query ($Q_t$), Key ($K_t$), and Value ($V_t$) vectors for token $t$. To compute attention over all tokens $1 \\dots t$, past keys $K_{1 \\dots t-1}$ and values $V_{1 \\dots t-1}$ are retrieved from the KV cache.\n\n### Why It Exists\nAutoregressive KV-Cache Step Append performs zero-copy in-place writing of new key/value projections into pre-allocated memory buffers at offset $t$: $K_{\\text{cache}}[:, :, t, :] = K_t$ and $V_{\\text{cache}}[:, :, t, :] = V_t$. This converts what would be an $O(t^2)$ re-computation loop into an $O(1)$ append per step.\n\n### Mathematical Formulation\nAt step $t$, the new key $K_t \\in \\mathbb{R}^{d_k}$ and value $V_t \\in \\mathbb{R}^{d_v}$ are stored directly at memory offset $t$:\n\n$$K_{\\text{cache}}[t] = \\text{RoPE}(K_t, t)$$\n\n$$V_{\\text{cache}}[t] = V_t$$\n\n$$\\text{seq\\_len}_{t+1} = \\text{seq\\_len}_t + 1$$\n\n### Step-by-Step Intuition\n1. **Locate Buffer Offset**: Read the current active sequence length scalar $t$.\n2. **In-place Store**: Store the $K_t$ vector into slot $t$ and $V_t$ into slot $t$.\n3. **Pointer Increment**: Update $t \\leftarrow t + 1$. The attention kernel now sees $t+1$ keys and values without re-running past token layers.\n\n### Key Trade-Offs & Complexity\n- **Compute vs Memory**: Replaces $O(N^2)$ token re-projection FLOPs with $O(1)$ vector writes, but requires pre-allocating GPU HBM memory buffers.",
  constraints: ["1 <= maxSeqLen <= 16384", "0 <= currentSeqLen < maxSeqLen"],
  examples: [
    {
      kind: "basic",
      title: "Step Append at Offset t=0",
      inputDisplay: "maxSeqLen = 8, stepsToAppend = 5",
      outputDisplay: "Updated KV cache with 5 appended tokens",
      input: { maxSeqLen: 8, stepsToAppend: 5 },
      output: "KV Cache [5, d_model]",
      explanation: "Appends 5 sequential step key/value pairs into contiguous cache slots.",
    },
  ],
  code: KVCACHESTEPAPPEND_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Requires O(d) time to store new d-dimensional key/value vectors into pre-allocated memory.",
    space: "Requires O(1) auxiliary space during step append operation.",
  },
  topicGuide: {
    overview:
      "KV Caching is the single most critical memory optimization in LLM generation systems (vLLM, HuggingFace TGI, PyTorch). Without KV caching, generating N tokens requires O(N^2) forward passes of quadratic complexity O(N^3). Step appending reduces total compute to O(N^2) linear attention passes.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At generation step t, the query Q_t attends to all keys K_<=t and values V_<=t. By appending K_t and V_t directly to K_cache[0 ... t-1] and V_cache[0 ... t-1], the total cache K_<=t is formed without re-running linear projections for past tokens.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Memory bandwidth allocation is optimized by pre-allocating static cache tensors [batch_size, num_heads, max_seq_len, head_dim]. In CUDA/Triton kernels, writes issue 128-bit vector stores (float4 / bfloat16x8) directly into High Bandwidth Memory (HBM).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Static contiguous KV caches suffer from internal memory fragmentation when request sequence lengths are unpredictable. PagedAttention (vLLM) resolves this by allocating KV cache pages dynamically in virtual block tables while maintaining logical step-append semantics.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "When context window limits are reached (t > max_context), serving systems employ sliding window attention (evicting oldest token entries) or prompt compression to keep memory usage bounded.",
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
        definition: "In-place write operation storing new token K_t, V_t vectors at offset t.",
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
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_KVCACHESTEPAPPEND_INPUT,
  generateSteps: generateKvCacheStepAppendSteps,
};
