import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface referenceCountingCowBeamSearchBrancherInput {
  data: number[];
  target?: number;
}

export const REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_CODE = `def reference_counting_cow_beam_search_brancher(beams: list[int], target_beam: int = 30) -> dict:
    """
    Manages KV cache block reference counts and performs Copy-on-Write (CoW)
    forking when beam search hypotheses diverge.
    """
    ref_counts = {b_id: 1 for b_id in beams}
    active_blocks = list(beams)

    for idx, beam_id in enumerate(active_blocks):
        if beam_id == target_beam:
            ref_counts[beam_id] += 1
            forked_id = beam_id + 100
            ref_counts[forked_id] = 1

    return {"ref_counts": ref_counts, "active_blocks": active_blocks}
`;

export const DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT: referenceCountingCowBeamSearchBrancherInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateReferenceCountingCowBeamSearchBrancherSteps = (
  input: referenceCountingCowBeamSearchBrancherInput,
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
    6,
    "Initialize Copy-On-Write (CoW) Reference-Counted Beam Search Brancher",
    "Setting up physical block reference count mappings and beam hypothesis tracking.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`beam_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      9,
      `Process element ${idx}: value = ${val}`,
      `Checking beam block ${val} for target CoW branching condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    15,
    "Execution Complete",
    "Completed Copy-On-Write reference counting pass and beam hypothesis fork updates.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 9, hint: "Check reference counts for shared beam blocks." }],
  lineExplanations: {
    6: "Defines entry point for Copy-On-Write (CoW) Reference-Counted Beam Search Brancher.",
    9: "Iterates through candidate beam sequence blocks.",
    15: "Returns reference count and active block structures.",
  },
};

export const referenceCountingCowBeamSearchBrancher: AlgorithmDefinition<referenceCountingCowBeamSearchBrancherInput> =
  {
    id: "reference-counting-cow-beam-search-brancher",
    title: "Copy-On-Write (CoW) Reference-Counted Beam Search Brancher",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "tries_and_strings"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "In LLM serving systems executing beam search decoding, multiple candidate output sequences (beams) share identical prefix tokens. Naively duplicating the Key-Value (KV) cache for every beam leads to quadratic memory growth and severe VRAM exhaustion. Copy-on-Write (CoW) reference-counted block allocation allows multiple candidate beams to share the exact same physical KV cache pages in memory. Parent blocks maintain a reference count (`ref_count`). When a beam diverges or appends new tokens, a physical copy is triggered only if `ref_count > 1`, otherwise the block is modified in-place.\n\nInput Format:\n- `data`: Array of active beam block IDs in the beam search candidate pool.\n- `target`: Target beam ID selected for branching/forking.\n\nOutput Format:\n- Returns reference counts and active block structures post CoW branching.\n\nEdge Cases & Constraints:\n- Beam pruning decrements block reference counts (`ref_count -= 1`); when `ref_count == 0`, physical memory is freed to allocator pool.\n- High beam width ($k=8$ or $k=16$) creates multi-way shared block graphs.\n- Concurrent multi-threaded reference count increments require atomic operations.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "beams = [10, 20, 30], target = 30",
        outputDisplay: "{ref_counts: {10: 1, 20: 1, 30: 2, 130: 1}}",
        input: { data: [10, 20, 30], target: 30 },
        output: "{ref_counts: {10: 1, 20: 1, 30: 2, 130: 1}}",
        explanation:
          "Target beam 30 is forked. Its reference count increases to 2 as parent block is shared by new candidate beam 130.",
      },
      {
        kind: "complex",
        title: "Multi-Beam Array",
        inputDisplay: "beams = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "{ref_counts: {1: 1, 2: 1, 3: 1, 4: 2, 5: 1, 104: 1}}",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "{ref_counts: {1: 1, 2: 1, 3: 1, 4: 2, 5: 1, 104: 1}}",
        explanation: "Beam 4 is shared across 2 candidate branches via CoW reference counting.",
      },
      {
        kind: "negative",
        title: "Target Beam Missing",
        inputDisplay: "beams = [5, 10, 15], target = 99",
        outputDisplay: "{ref_counts: {5: 1, 10: 1, 15: 1}}",
        input: { data: [5, 10, 15], target: 99 },
        output: "{ref_counts: {5: 1, 10: 1, 15: 1}}",
        explanation: "No beam matches target 99; reference counts remain unchanged at 1.",
      },
    ],
    code: REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_CODE,
    timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "O(K) where K is the number of active beams being evaluated.",
      space: "O(K) memory storing reference counts and active block structures.",
    },
    topicGuide: {
      overview:
        "Copy-On-Write (CoW) with reference counting enables zero-copy sharing of physical KV cache blocks across parallel beam search branches in LLM serving engines.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Beam search is a heuristic search algorithm that expands the top-$k$ most probable sequence hypotheses at each decoding step. Because all $k$ beams share the same initial prompt (and often share long common prefixes during early generation), storing $k$ independent copies of the KV cache multiplies memory usage by $k$. Copy-on-Write reference counting treats the KV cache as a directed acyclic graph (DAG) of shared physical memory blocks.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "When a beam search step forks a new hypothesis from an existing parent beam, the engine does not duplicate the parent's physical KV memory blocks. Instead, it increments the reference count (`ref_count += 1`) of each physical block in the parent sequence's block table. Only when a specific beam writes new tokens into a partially-filled block with `ref_count > 1` does the allocator perform a physical memory copy (Copy-on-Write), isolating modifications to the child beam.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "CoW block sharing reduces memory consumption during beam search by up to $k\\times$. This memory efficiency allows serving systems to increase beam widths or run significantly higher concurrent user batches without triggering out-of-memory (OOM) allocation failures on GPU HBM.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Garbage collection is critical: when a candidate beam is pruned during beam selection, the engine decrements reference counts (`ref_count -= 1`) for all blocks in its table. Any block reaching `ref_count == 0` is immediately returned to the free physical page pool. Thread-safety must be ensured via atomic reference counting when multiple execution streams update page tables simultaneously.",
        },
      ],
      keyTerms: [
        {
          term: "Copy-On-Write (CoW)",
          definition:
            "An optimization strategy where memory copying is deferred until a shared resource is modified.",
        },
        {
          term: "Reference Counting",
          definition:
            "Technique storing the count of references/pointers targeting a memory block to track ownership.",
        },
        {
          term: "Shared Prefix KV Cache",
          definition:
            "A KV cache layout where multiple output sequences point to identical physical prefix memory blocks.",
        },
        {
          term: "Beam Pruning Garbage Collection",
          definition:
            "Immediate recycling of physical GPU memory blocks when their reference count drops to zero.",
        },
      ],
    },
    trivia: REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "vLLM: Efficient Memory Management for Large Language Model Serving (Kwon et al., SOSP 2023)",
      },
    ],
    defaultInput: DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
    generateSteps: generateReferenceCountingCowBeamSearchBrancherSteps,
  };
