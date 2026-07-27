import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface findFirstOccurrence1dInput {
  data: number[];
  target?: number;
  stride?: number;
}

export const FINDFIRSTOCCURRENCE1D_CODE = `def find_first_occurrence_1d(buffer, target, stride=1):
    """
    Performs strided 1D linear memory scan to locate target element offset.
    """
    n = len(buffer)
    match_index = -1

    for i in range(0, n, stride):
        val = buffer[i]
        if val == target:
            match_index = i
            break

    return match_index`;

export const DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT: findFirstOccurrence1dInput = {
  data: [15, 28, 42, 10, 55, 63, 77, 84, 91, 102, 115, 120],
  target: 102,
  stride: 1,
};

export const generateFindFirstOccurrence1dSteps = (
  input: findFirstOccurrence1dInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const buffer =
    input.data && input.data.length > 0
      ? input.data
      : [15, 28, 42, 10, 55, 63, 77, 84, 91, 102, 115, 120];
  const target = input.target ?? 102;
  const stride = Math.max(1, input.stride ?? 1);
  const n = buffer.length;

  const cols = 4;
  const rows = Math.ceil(n / cols);

  const buildCells = (
    currentI?: number,
    matchI: number = -1,
    checkedIndices: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const globalIdx = r * cols + c;
        const exists = globalIdx < n;
        const val = exists ? buffer[globalIdx] : "N/A";
        let state: MatrixCellItem["state"] = "default";

        if (globalIdx === matchI) {
          state = "pivot";
        } else if (globalIdx === currentI) {
          state = "active";
        } else if (checkedIndices.includes(globalIdx)) {
          state = "compared";
        } else if (!exists) {
          state = "inactive";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: exists ? `buf[${globalIdx}]` : "PAD",
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentI?: number,
    matchI: number = -1,
    checkedIndices: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows,
        cols,
        cells: buildCells(currentI, matchI, checkedIndices),
        rowHeaders: Array.from({ length: rows }, (_, i) => `Line ${i}`),
        colHeaders: Array.from({ length: cols }, (_, i) => `Col ${i}`),
        title: "1D Strided Memory Scan Grid",
      },
      auxiliaryState: {
        customState: {
          n: String(n),
          target: String(target),
          stride: String(stride),
          matchIndex: String(matchI),
        },
      },
      variables,
    });
  };

  // Step 1: Init function
  addStep(
    1,
    "Initialize Strided 1D Memory Scan Engine",
    "Setting up memory search parameters for target scalar lookup.",
    { n, target, stride },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Performs strided 1D linear memory scan to locate target element offset.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Measure n
  addStep(
    5,
    "Extract Buffer Length n",
    `Measured total memory buffer length n = ${n}.`,
    { n },
  );

  // Step 3: Init match_index
  addStep(
    6,
    "Initialize Match Result Index",
    "Set match_index = -1 (target scalar not yet discovered).",
    { match_index: -1 },
  );

  const checkedIndices: number[] = [];
  let foundIndex = -1;

  for (let i = 0; i < n; i += stride) {
    const val = buffer[i];
    const isMatch = val === target;

    addStep(
      8,
      `Advance Search Pointer to Physical Offset i = ${i}`,
      `Iterating loop for index i = ${i} (stride step ${stride}).`,
      { i, stride, n },
      i,
      foundIndex,
      checkedIndices,
    );

    addStep(
      9,
      `Fetch Scalar Value at Offset ${i}`,
      `Read buffer[${i}] = ${val}.`,
      { i, val },
      i,
      foundIndex,
      checkedIndices,
    );

    checkedIndices.push(i);

    addStep(
      10,
      `Compare Value ${val} against Target ${target}`,
      isMatch
        ? `Match FOUND! val (${val}) == target (${target}).`
        : `No match. val (${val}) != target (${target}). Continuing scan...`,
      { i, val, target, is_match: isMatch },
      i,
      foundIndex,
      checkedIndices,
    );

    if (isMatch) {
      foundIndex = i;
      addStep(
        11,
        `Record Match Physical Offset i = ${i}`,
        `Updated match_index = ${i}.`,
        { match_index: i },
        i,
        foundIndex,
        checkedIndices,
      );

      addStep(
        12,
        "Execute Early Exit (Break)",
        `Target discovered at index ${i}. Terminating linear memory search immediately.`,
        { match_index: i, terminated_early: true },
        i,
        foundIndex,
        checkedIndices,
      );
      break;
    }
  }

  // Return step
  addStep(
    14,
    "Return Match Physical Offset Result",
    foundIndex !== -1
      ? `Search complete. Target ${target} found at physical offset ${foundIndex}.`
      : `Search complete. Target ${target} was not found in buffer (returned -1).`,
    { completed: true, result_index: foundIndex },
    undefined,
    foundIndex,
    checkedIndices,
  );

  return steps;
};

const FINDFIRSTOCCURRENCE1D_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "match_index = buffer.index(target)",
    "for i in range(n): match_index = i",
    "return buffer[target]",
  ],
  hints: [
    {
      line: 10,
      hint: "Compare buffer element val against target scalar query.",
    },
    {
      line: 12,
      hint: "Execute break statement immediately upon match to ensure early exit and avoid redundant DRAM checks.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for strided 1D buffer search function with default unit stride.",
    2: "Starts docstring for 1D search function.",
    3: "Explains purpose of performing strided linear memory scan to find target scalar offset.",
    4: "Closes docstring for 1D search function.",
    5: "Measures total element length N of input memory buffer.",
    6: "Initializes match_index variable to -1 (indicating target not yet found).",
    7: "Blank line before strided loop execution.",
    8: "Iterates memory index i from 0 up to n - 1 advancing by stride.",
    9: "Fetches scalar value val = buffer[i] at current physical offset i.",
    10: "Compares fetched scalar val against target query scalar.",
    11: "Sets match_index = i upon discovering matching target scalar.",
    12: "Terminates loop execution immediately via break statement.",
    13: "Blank line before return statement.",
    14: "Returns match_index containing physical offset or -1 if target is absent.",
  },
};

export const findFirstOccurrence1d: AlgorithmDefinition<findFirstOccurrence1dInput> = {
  id: "find-first-occurrence-1d",
  title: "Find First Occurrence in 1D Buffer",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In strided tensor indexing, token search kernels, and payload metadata parsers, locating matching scalar markers or target tokens across non-contiguous memory layouts requires strided linear scans.\n\nThis algorithm performs a strided search pass across a 1D memory array to find the first physical index matching a target query scalar. Upon discovering the match, it records the physical offset index and terminates execution immediately via early exit.\n\n### Problem Solved & ML Compiler Relevance\nIn LLM tokenization pipelines, KV cache metadata lookups, and sparse tensor indexing, search kernels scan flat 1D memory buffers to locate sentinel tokens (such as End-Of-Sequence `<eos>` or padding tokens). When tensors have non-unit strides, evaluating offsets via strided steps ($i = 0, S, 2S, \\dots$) avoids unnecessary memory reads while locating target elements.\n\n### Step-by-Step Execution\n1. **Buffer Length Measurement**: Extract length $N = len(buffer)$.\n2. **Result Pointer Initialization**: Set $match\\_index = -1$.\n3. **Strided Iteration**: Loop index $i$ from 0 to $N-1$ in step increments of $stride$.\n4. **Scalar Comparison**: If $buffer[i] == target$, set $match\\_index = i$ and break immediately.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Target Found at Index 9",
      inputDisplay: "data = [15, 28, 42, 10, 55, 63, 77, 84, 91, 102, 115, 120], target = 102, stride = 1",
      outputDisplay: "match_index = 9",
      input: {
        data: [15, 28, 42, 10, 55, 63, 77, 84, 91, 102, 115, 120],
        target: 102,
        stride: 1,
      },
      output: "9",
      explanation: "Scans buffer elements sequentially and terminates at index 9 where buffer[9] == 102.",
    },
    {
      kind: "complex",
      title: "Strided Search Pass with Stride 2",
      inputDisplay: "data = [10, 99, 20, 99, 30, 99], target = 30, stride = 2",
      outputDisplay: "match_index = 4",
      input: { data: [10, 99, 20, 99, 30, 99], target: 30, stride: 2 },
      output: "4",
      explanation: "Scans even indices 0, 2, 4 (skipping odd indices) and discovers 30 at index 4.",
    },
    {
      kind: "negative",
      title: "Target Absent from Memory Buffer",
      inputDisplay: "data = [5, 10, 15, 20], target = 99, stride = 1",
      outputDisplay: "match_index = -1",
      input: { data: [5, 10, 15, 20], target: 99, stride: 1 },
      output: "-1",
      explanation: "Scans entire buffer without finding 99; returns -1.",
    },
  ],
  code: FINDFIRSTOCCURRENCE1D_CODE,
  timeComplexity: { best: "O(1)", average: "O(N / S)", worst: "O(N / S)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N / S) linear search time where N is buffer length and S is stride.",
    space: "O(1) constant auxiliary space.",
  },
  topicGuide: {
    overview:
      "Strided 1D buffer search is a building block for tensor slicing, token matching in LLM tokenizers, and finding sentinel values in sparse tensor buffers. Efficient strided traversal ensures linear-time search $\\mathcal{O}(N / S)$ without redundant element checks.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Machine learning memory layout formats (like PyTorch strided Tensors) frequently arrange elements at non-unit strides. Scanning a 1D buffer with stride $S$ allows searching sub-sampled dimensions or specific column channels directly in physical memory without creating intermediate array copies. Physical addresses are sampled at $i = 0, S, 2S, \\dots, kS$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Applications include locating stop-token IDs in vLLM generation loops, searching for non-zero pivot elements in sparse matrix solvers, checking boundary markers in RPC message payloads, and finding specific feature channels in strided tensor views.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Given buffer `data = [10, 20, 30, 40, 50]`, target $T = 30$, stride $S = 1$.\n1. $i=0$: $\\text{val}=10 \\neq 30$.\n2. $i=1$: $\\text{val}=20 \\neq 30$.\n3. $i=2$: $\\text{val}=30 == 30$. Set $\\text{match\\_index} = 2$ and break immediately.\nExecution finishes in 3 steps without scanning indices 3 and 4.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "On GPU SIMT hardware, non-unit strides ($S > 1$) break spatial memory locality because thread warps fetch 128-byte DRAM cache lines containing unused skipped bytes. When $S$ is large, gathering non-contiguous elements into contiguous shared memory (SRAM) before searching yields higher memory throughput.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: Worst-case $\\mathcal{O}(\\lceil N / S \\rceil)$ steps when target is absent or at the final strided index; Best-case $\\mathcal{O}(1)$ when target is at index 0. Space Complexity: $\\mathcal{O}(1)$ constant auxiliary space.",
      },
    ],
    keyTerms: [
      {
        term: "Strided Search",
        definition:
          "Scanning a memory array by advancing pointer positions by non-unit stride increments.",
      },
      {
        term: "Early Exit",
        definition:
          "Terminating search execution immediately once a target matching condition is met.",
      },
      {
        term: "Spatial Locality",
        definition:
          "The property where accessing a memory address makes adjacent memory addresses faster to access via CPU/GPU cache lines.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A specific predefined scalar value used to signal termination or special conditions in data streams.",
      },
    ],
  },
  trivia: FINDFIRSTOCCURRENCE1D_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FINDFIRSTOCCURRENCE1D_INPUT,
  generateSteps: generateFindFirstOccurrence1dSteps,
};
