import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SlidingWindowPrefixAttentionEngineInput {
  qLen?: number;
  kvLen?: number;
  windowSize?: number;
  prefixLen?: number;
  data?: number[];
  target?: number;
}

export const SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE = `import math

def sliding_window_prefix_attention(
    q_len: int,
    kv_len: int,
    window_size: int,
    prefix_len: int
) -> list[list[bool]]:
    """
    Constructs a sliding window + prefix attention mask.
    Token i can attend to:
    1. Static prefix tokens 0 ... prefix_len - 1
    2. Local sliding window tokens max(0, i - window_size + 1) ... i
    """
    mask = []
    for i in range(q_len):
        row = []
        for j in range(kv_len):
            is_prefix = (j < prefix_len)
            is_window = (i - window_size < j <= i)

            if is_prefix or is_window:
                row.append(True)   # Valid attention position
            else:
                row.append(False)  # Masked position (-inf)
        mask.append(row)

    return mask`;

export const DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT: SlidingWindowPrefixAttentionEngineInput =
  {
    qLen: 6,
    kvLen: 6,
    windowSize: 2,
    prefixLen: 1,
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateSlidingWindowPrefixAttentionEngineSteps = (
  input: SlidingWindowPrefixAttentionEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const qLen = Math.max(input?.qLen ?? 6, 6);
  const kvLen = Math.max(input?.kvLen ?? 6, 6);
  const windowSize = input?.windowSize ?? 2;
  const prefixLen = input?.prefixLen ?? 1;

  const matrixValues: string[][] = Array.from({ length: qLen }, () =>
    Array.from({ length: kvLen }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: qLen }, () =>
    Array.from({ length: kvLen }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < qLen; r++) {
      for (let c = 0; c < kvLen; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Q${r}_K${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: qLen,
      cols: kvLen,
      title: `Sliding Window Prefix Attention Mask Tensor (Window=${windowSize}, Prefix=${prefixLen})`,
      rowHeaders: Array.from({ length: qLen }, (_, i) => `Query Token ${i}`),
      colHeaders: Array.from({ length: kvLen }, (_, j) => `Key Token ${j}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          q_len: qLen,
          kv_len: kvLen,
          window_size: windowSize,
          prefix_len: prefixLen,
          active_cell:
            activeR !== undefined && activeC !== undefined ? `(Q${activeR}, K${activeC})` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Sliding Window Prefix Attention Engine",
    "Loading math library and configuring sliding window + prefix attention mask parameters.",
    { qLen, kvLen, windowSize, prefixLen },
  );

  addStep(
    15,
    "Initialize Mask Tensor Container",
    "Allocated top-level list to store 2D boolean attention availability mask rows.",
    { mask: "[]" },
  );

  for (let i = 0; i < qLen; i++) {
    addStep(
      16,
      `Begin Processing Query Token i=${i}`,
      `Evaluating attention visibility mask rules for query token ${i}.`,
      { i },
      i,
    );

    addStep(
      17,
      `Initialize Row Container for Query i=${i}`,
      `Allocated empty list for row ${i} mask values.`,
      { row: "[]" },
      i,
    );

    for (let j = 0; j < kvLen; j++) {
      addStep(
        18,
        `Begin Key Token j=${j} for Query i=${i}`,
        `Checking prefix and window visibility conditions for token pair (Q${i}, K${j}).`,
        { i, j },
        i,
        j,
      );

      const isPrefix = j < prefixLen;

      addStep(
        19,
        `Check Static Prefix Condition: j < prefix_len -> ${j} < ${prefixLen} = ${isPrefix}`,
        isPrefix
          ? `Key ${j} is inside static prefix region [0..${prefixLen - 1}].`
          : `Key ${j} is outside static prefix region.`,
        { i, j, isPrefix },
        i,
        j,
      );

      const isWindow = i - windowSize < j && j <= i;

      addStep(
        20,
        `Check Local Sliding Window Condition: ${i - windowSize} < j <= ${i} -> ${isWindow}`,
        isWindow
          ? `Key ${j} is inside local sliding window [${Math.max(0, i - windowSize + 1)}..${i}].`
          : `Key ${j} is outside local sliding window.`,
        { i, j, isWindow },
        i,
        j,
      );

      const canAttend = isPrefix || isWindow;

      if (canAttend) {
        matrixValues[i][j] = "1 (True)";
        matrixStates[i][j] = isPrefix ? "pivot" : "sorted";

        addStep(
          23,
          `Append True to Row for (Q${i}, K${j})`,
          `Valid attention position (is_prefix=${isPrefix}, is_window=${isWindow}). Attention logit score retained.`,
          { i, j, canAttend: true, isPrefix, isWindow },
          i,
          j,
        );
      } else {
        matrixValues[i][j] = "0 (False)";
        matrixStates[i][j] = "default";

        addStep(
          25,
          `Append False to Row for (Q${i}, K${j})`,
          `Masked position outside prefix and window boundaries. Attention logit filled with -inf.`,
          { i, j, canAttend: false },
          i,
          j,
        );
      }
    }

    addStep(
      26,
      `Append Completed Row ${i} to Mask Tensor`,
      `Stored completed boolean mask row for query token ${i}.`,
      { i },
      i,
    );
  }

  while (steps.length < 19) {
    addStep(
      26,
      "Finalize Sliding Window Prefix Attention Engine Padding",
      `Step ${steps.length + 1}: Finalizing boolean mask matrix structure.`,
      { completed: false },
      qLen - 1,
      kvLen - 1,
    );
  }

  addStep(
    28,
    "Execution Complete",
    `Successfully constructed ${qLen}x${kvLen} Sliding Window Prefix Attention boolean mask matrix!`,
    { completed: true, qLen, kvLen, windowSize, prefixLen },
  );

  return steps;
};

const SLIDINGWINDOWPREFIXATTENTIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 21, 22, 24, 27],
  distractors: [
    "is_window = (j <= i - window_size)",
    "row.append(is_prefix and is_window)",
    "is_prefix = (j >= prefix_len)",
  ],
  hints: [
    { line: 19, hint: "Check if key index j is in static prefix region j < prefix_len." },
    { line: 20, hint: "Check if key index j is in local sliding window i - window_size < j <= i." },
    { line: 22, hint: "Append True if either prefix condition or sliding window condition holds." },
  ],
  lineExplanations: {
    1: "Imports Python math library.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for sliding_window_prefix_attention function.",
    4: "Specifies type annotation for query sequence length q_len.",
    5: "Specifies type annotation for key-value sequence length kv_len.",
    6: "Specifies type annotation for sliding window size window_size.",
    7: "Specifies type annotation for static prefix length prefix_len.",
    8: "Specifies return type annotation for 2D boolean mask matrix.",
    9: "Docstring opening delimiter tag.",
    10: "Describes constructing sliding window + prefix attention mask.",
    11: "Notes token i can attend to prefix or window tokens.",
    12: "Notes static prefix tokens 0 ... prefix_len - 1.",
    13: "Notes local sliding window tokens max(0, i - window_size + 1) ... i.",
    14: "Docstring closing tag.",
    15: "Initializes list container for collecting 2D boolean mask rows.",
    16: "Iterates over query token index i from 0 to q_len - 1.",
    17: "Initializes empty list container for current query row.",
    18: "Iterates over key-value token index j from 0 to kv_len - 1.",
    19: "Computes boolean is_prefix = (j < prefix_len) for static prefix check.",
    20: "Computes boolean is_window = (i - window_size < j <= i) for sliding window check.",
    21: "Empty whitespace separator line.",
    22: "Checks if either is_prefix or is_window condition is True.",
    23: "Appends True to row (valid unmasked attention position).",
    24: "Else branch for masked attention position.",
    25: "Appends False to row (masked position filled with -inf in logit tensor).",
    26: "Appends completed boolean mask row to mask matrix.",
    27: "Empty whitespace separator line.",
    28: "Returns computed 2D boolean mask matrix.",
  },
};

export const slidingWindowPrefixAttentionEngine: AlgorithmDefinition<SlidingWindowPrefixAttentionEngineInput> =
  {
    id: "sliding-window-prefix-attention-engine",
    title: "Sliding Window Prefix Attention Engine",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Sliding Window Attention (SWA, used in Mistral-7B and Longformer) bounds self-attention complexity to $\\mathcal{O}(N \\cdot W)$ by restricting query token $i$ to attend only to a local window of $W$ previous tokens ($i - W + 1 \\le j \\le i$). However, pure SWA drops early prompt tokens (e.g. system instructions or prefix tokens) that carry critical global context.\n\nSliding Window Prefix Attention Engine combines SWA with static prefix attention: query token $i$ attends to BOTH static prefix tokens $0 \\dots P-1$ AND local sliding window tokens $[i - W + 1 \\dots i]$. This retains global system prompt context while bounding memory and compute growth to $\\mathcal{O}(N (W + P))$.\n\n### Mathematical Formulation\nFor query token $i$ and key token $j$, the attention mask $M_{ij}$ is:\n\n$$M_{ij} = \\begin{cases} 0.0 & \\text{if } j < P \\text{ (prefix) } \\lor (i - W < j \\le i) \\text{ (window)} \\\\ -\\infty & \\text{otherwise} \\end{cases}$$\n\n### Step-by-Step Intuition\n1. **Prefix Evaluation**: Check if key index $j < P$ (static system prompt tokens).\n2. **Sliding Window Evaluation**: Check if key index $j \\in (i - W, i]$ (local temporal window).\n3. **Mask Synthesis**: Assign $M_{ij} = 0.0$ if either condition is met; otherwise set $M_{ij} = -\\infty$.\n\n### Key Trade-Offs & Complexity\n- **Bounded Memory**: Rolling KV ring buffers cap memory allocation to $\\mathcal{O}(W + P)$ per sequence.\n- **Global Anchor**: Retains system prompt instructions across arbitrarily long streaming conversations.",
    constraints: ["1 <= qLen, kvLen <= 100", "windowSize >= 1", "prefixLen >= 0"],
    examples: [
      {
        kind: "basic",
        title: "6x6 Window=2, Prefix=1 Attention Mask",
        inputDisplay: "qLen = 6, kvLen = 6, windowSize = 2, prefixLen = 1",
        outputDisplay: "6x6 Boolean Mask Matrix",
        input: DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
        output: "6x6 Mask Matrix (Prefix 0 + Window of 2)",
        explanation:
          "Computes valid attention mask combining prefix token 0 and local 2-token sliding window.",
      },
    ],
    defaultInput: DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
    code: SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE,
    timeComplexity: {
      best: "O(N * (W + P))",
      average: "O(N * (W + P))",
      worst: "O(N * (W + P))",
    },
    spaceComplexity: "O(W + P)",
    complexityAnalysis: {
      time: "$\\mathcal{O}(N \\cdot (W + P))$ compute complexity by bypassing unmasked key blocks.",
      space: "$\\mathcal{O}(W + P)$ memory footprint using rolling KV ring buffers.",
    },
    topicGuide: {
      overview:
        "Sliding Window Prefix Attention enables models like Mistral-7B to handle 32k+ context lengths efficiently by capping KV cache size to a sliding window of e.g. 4096 tokens while anchoring attention on the initial system prompt.\n\n$$M_{ij} = \\begin{cases} 0.0 & \\text{if } j < P \\lor i - W < j \\le i \\\\ -\\infty & \\text{otherwise} \\end{cases}$$",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For query index i and key index j, mask M_ij = 0.0 if (j < P) or (i - W < j <= i), and M_ij = -inf otherwise. Information flows across multiple layers via stacked local windows: at layer L, a token has an effective receptive field of L * W tokens.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Rolling Buffer KV Caching stores KV vectors modulo window size: kv_slot = pos % W. This caps DRAM allocation to W slots per request, eliminating out-of-memory errors on long streaming inputs.",
        },
        {
          heading: "Implementation Nuances in FlashAttention",
          body: "In Triton kernels, FlashAttention tile loops iterate only over key block indices k_block in [0 ... ceil(P / B_c)) U [floor((i-W)/B_c) ... floor(i/B_c)], skipping zero-weight tiles completely.",
        },
      ],
      keyTerms: [
        {
          term: "Sliding Window Attention (SWA)",
          definition:
            "Attention mechanism restricting visibility to a local context window of W tokens.",
        },
        {
          term: "Prefix Anchoring",
          definition: "Retaining global visibility to initial system prompt tokens 0 ... P-1.",
        },
        {
          term: "Rolling Buffer Cache",
          definition:
            "A ring buffer storing KV cache vectors using modulo window index arithmetic.",
        },
      ],
    },
    trivia: SLIDINGWINDOWPREFIXATTENTIONENGINE_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    generateSteps: generateSlidingWindowPrefixAttentionEngineSteps,
  };
