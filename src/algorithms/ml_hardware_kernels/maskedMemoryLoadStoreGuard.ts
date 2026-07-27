import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface maskedMemoryLoadStoreGuardInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const MASKEDMEMORYLOADSTOREGUARD_CODE = `
def triton_masked_load_store(
    global_ptr: list[float],
    block_start: int,
    block_size: int,
    valid_boundary: int,
    other_val: float = 0.0
) -> tuple[list[float], list[bool], list[float]]:
    """
    Simulates Triton tl.load(ptr, mask=mask, other=other_val) and tl.store(ptr, val, mask=mask).
    Guards out-of-bounds DRAM reads/writes for tail tiles when valid_boundary is unaligned.
    """
    offsets = [block_start + i for i in range(block_size)]
    
    # 1. Compute SIMD boolean mask predicate vector
    mask = [offset < valid_boundary for offset in offsets]
    
    # 2. Masked Load: out-of-bounds reads return other_val (e.g. 0.0 or -inf)
    loaded_vals = []
    for offset, is_valid in zip(offsets, mask):
        if is_valid:
            loaded_vals.append(global_ptr[offset])
        else:
            loaded_vals.append(other_val)
            
    # 3. Masked Store: out-of-bounds writes are safely suppressed (no-op)
    stored_output = list(global_ptr)
    for offset, val, is_valid in zip(offsets, loaded_vals, mask):
        if is_valid:
            stored_output[offset] = val

    return loaded_vals, mask, stored_output
`;

export const DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT: maskedMemoryLoadStoreGuardInput = {
  data: [10, 20, 30, 40, 50],
};

export const generateMASKEDMEMORYLOADSTOREGUARDSteps = (
  input: maskedMemoryLoadStoreGuardInput,
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
          block_size: "4",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Masked Memory Load/Store Guard",
    "Setting up Triton predicate masking: offsets = block_start + thread_ids; mask = offsets < valid_boundary.",
    { valid_boundary: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`off=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      14,
      `Evaluate SIMD predicate for offset ${idx} (val=${val})`,
      `Offset ${idx} < boundary (${arrayData.length}): valid read issued to global memory.`,
      { offset: idx, isValid: true, val },
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
    "Successfully executed SIMD masked memory loads and stores without illegal memory access.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MASKEDMEMORYLOADSTOREGUARD_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "mask = [offset > valid_boundary for offset in offsets]",
    "loaded_vals.append(global_ptr[offset] if not is_valid else other_val)",
    "stored_output[offset] = other_val",
  ],
  hints: [
    {
      line: 14,
      hint: "Compute SIMD predicate boolean array mask = [offset < valid_boundary for offset in offsets].",
    },
    {
      line: 17,
      hint: "Return other_val for out-of-bounds offsets to prevent illegal memory reads.",
    },
    { line: 26, hint: "Suppress store operations when is_valid is False." },
  ],
  lineExplanations: {
    1: "Defines Triton masked memory load/store guard function.",
    14: "Calculates boolean SIMD mask vector offsets < valid_boundary.",
    17: "Reads valid global memory pointer offset when mask element is True.",
    20: "Returns padding fallback value (e.g. 0.0 or -inf) when mask element is False.",
    26: "Applies store mutation to global memory only for valid unmasked positions.",
  },
};

export const maskedMemoryLoadStoreGuard: AlgorithmDefinition<maskedMemoryLoadStoreGuardInput> = {
  id: "masked-memory-load-store-guard",
  title: "Triton Masked Memory Load & Store Guard",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_tensor_algebra"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description:
    "In GPU parallel kernel programming (OpenAI Triton, CUDA), memory tiles are processed in fixed block sizes (e.g. `BLOCK_M = 128`). However, real-world tensor dimensions $N$ (e.g. sequence length $N = 350$) are rarely exact multiples of block sizes.\n\nWhen a thread block processes the tail tile of a matrix, offsets $i \\in [384 \\dots 512)$ extend beyond the valid matrix boundary $N = 350$. Issuing un-guarded memory reads/writes to these addresses causes illegal memory access (CUDA Segmentation Fault) or memory corruption.\n\n**Masked Memory Load/Store Guard** evaluates a SIMD boolean predicate array:\n$$\\text{mask} = \\text{offsets} < N$$\n- `tl.load(ptr + offsets, mask=mask, other=0.0)`: Out-of-bounds positions return `0.0` (or `-\\infty` for Softmax attention logits) without reading DRAM.\n- `tl.store(ptr + offsets, values, mask=mask)`: Out-of-bounds positions suppress DRAM writes (no-op).\n\nInput Format:\n- data: Array of global memory values or offsets.\n- target: Valid memory boundary $N$.\n\nOutput Format:\n- Loaded vector values with padding, boolean predicate mask vector, and safely stored output array.",
  constraints: ["1 <= block_size <= 1024", "valid_boundary >= 0"],
  examples: [
    {
      kind: "basic",
      title: "Triton Masked Load (N=5, Block=8)",
      inputDisplay: "offsets = [0..7], N = 5",
      outputDisplay: "Mask: [T,T,T,T,T,F,F,F], Padding: 0.0",
      input: { data: [10, 20, 30, 40, 50] },
      output: "Out-of-bounds padded with 0.0",
      explanation: "Offsets >= 5 set mask=False and return other_val=0.0 without DRAM access.",
    },
    {
      kind: "complex",
      title: "Tail Tile Guard Test",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Zero Illegal Memory Access",
      input: { data: [10, 20, 30, 40, 50] },
      output: "Zero Illegal Memory Access",
      explanation: "Evaluates predicate masks across 5 valid elements and 3 tail padding slots.",
    },
    {
      kind: "negative",
      title: "Full Alignment Check",
      inputDisplay: "data = [1, 2, 3, 4]",
      outputDisplay: "All Mask True",
      input: { data: [1, 2, 3, 4] },
      output: "All Mask True",
      explanation:
        "When sequence length equals block size, all predicate mask entries evaluate to True.",
    },
  ],
  code: MASKEDMEMORYLOADSTOREGUARD_CODE,
  timeComplexity: { best: "O(B)", average: "O(B)", worst: "O(B)" },
  spaceComplexity: "O(B)",
  complexityAnalysis: {
    time: "Evaluates SIMD predicate masks over block size $B$ in $O(B)$ parallel thread instructions.",
    space: "Requires $O(B)$ memory to store boolean mask predicates.",
  },
  topicGuide: {
    overview:
      "Masked loads and stores are a core building block of Triton kernels (`tl.load` and `tl.store`). They allow kernels to process arbitrary matrix dimensions without needing specialized fallback loops.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $P$ be a pointer vector $P_i = \\text{ptr} + \\text{offsets}_i$. The predicate $M_i = (\\text{offsets}_i < N)$. The load operator is $V_i = M_i ? *P_i : v_{\\text{other}}$. The store operator is $M_i ? (*P_i = V_i) : \\text{nop}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "PTX Translation: In CUDA PTX assembly, `tl.load` with a mask compiles to predicated vector load instructions `@p1 ld.global.v4.f32`. Threads where predicate `@p1` is false skip memory transactions entirely.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Padding values in Attention: In FlashAttention / Triton softmax kernels, out-of-bounds logit loads MUST set `other=-float('inf')` so that Softmax exponentiation $e^{-\\infty} = 0.0$ naturally zeroes out padded key tokens.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "2D Masking: For 2D tile loads (`BLOCK_M, BLOCK_N`), masks are constructed via broadcasting: `mask = (offs_m[:, None] < M) & (offs_n[None, :] < N)`. Out-of-bounds elements in either dimension are masked out.",
      },
    ],
    keyTerms: [
      {
        term: "SIMD Predicate Mask",
        definition:
          "A boolean vector controlling which SIMD thread lanes execute memory load/store operations.",
      },
      {
        term: "tl.load / tl.store",
        definition: "OpenAI Triton intrinsic functions for masked block memory transfers.",
      },
      {
        term: "Tail Tile",
        definition:
          "The final block tile of a tensor when dimensions are not evenly divisible by block size.",
      },
      {
        term: "Illegal Memory Access",
        definition:
          "GPU hardware fault triggered when a thread reads/writes un-allocated memory addresses.",
      },
    ],
  },
  trivia: MASKEDMEMORYLOADSTOREGUARD_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT,
  generateSteps: generateMASKEDMEMORYLOADSTOREGUARDSteps,
};
