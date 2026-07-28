import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface referenceCountingCowBeamSearchBrancherInput {
  data: number[];
  target?: number;
}

export const REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_CODE = `def reference_counting_cow_beam_search_brancher(beams: list[int], target_beam: int = 30) -> dict:
    ref_counts = {b_id: 1 for b_id in beams}
    active_blocks = list(beams)

    for idx, beam_id in enumerate(active_blocks):
        if beam_id == target_beam:
            ref_counts[beam_id] += 1
            forked_id = beam_id + 100
            ref_counts[forked_id] = 1

    return {"ref_counts": ref_counts, "active_blocks": active_blocks}`;

export const DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT: referenceCountingCowBeamSearchBrancherInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

function buildGraphSnapshot(
  beams: number[],
  refCounts: Record<number, number>,
  activeIdx: number,
  forkedBlocks: Array<{ parentId: number; childId: number }>,
): GraphVisualSnapshot {
  const nodes: GraphNodeItem[] = [];
  const edges: GraphEdgeItem[] = [];

  const startX = 100;
  const spacingX = 130;

  beams.forEach((bId, idx) => {
    let state: GraphNodeItem["state"] = "default";
    if (activeIdx >= 0 && idx === activeIdx) {
      state = "active";
    } else if (activeIdx >= 0 && idx < activeIdx) {
      state = "visited";
    }

    const ref = refCounts[bId] ?? 1;
    if (ref > 1) {
      state = "pivot";
    }

    nodes.push({
      id: `beam-${bId}`,
      label: `Beam #${bId}\n[ref=${ref}]`,
      val: bId,
      state,
      x: startX + idx * spacingX,
      y: 100,
    });
  });

  forkedBlocks.forEach((fork) => {
    const parentIdx = beams.indexOf(fork.parentId);
    const parentX = parentIdx >= 0 ? startX + parentIdx * spacingX : 300;

    nodes.push({
      id: `beam-${fork.childId}`,
      label: `Fork #${fork.childId}\n[ref=${refCounts[fork.childId] ?? 1}]`,
      val: fork.childId,
      state: "sorted",
      x: parentX,
      y: 240,
    });

    edges.push({
      from: `beam-${fork.parentId}`,
      to: `beam-${fork.childId}`,
      isPath: true,
      weight: 1,
    });
  });

  return {
    kind: "graph",
    nodes,
    edges,
  };
}

export const generateReferenceCountingCowBeamSearchBrancherSteps = (
  input: referenceCountingCowBeamSearchBrancherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const beams = input.data;
  const targetBeam = input.target ?? 30;

  const refCounts: Record<number, number> = {};
  const forkedBlocks: Array<{ parentId: number; childId: number }> = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildGraphSnapshot(beams, refCounts, activeIdx, forkedBlocks),
      auxiliaryState: {
        customState: {
          beams: `[${beams.join(", ")}]`,
          target_beam: String(targetBeam),
          tracked_blocks: String(Object.keys(refCounts).length),
        },
      },
      variables,
    });
  };

  // Line 1: Function Entry
  addStep(
    1,
    "Enter reference_counting_cow_beam_search_brancher function",
    "Initializing Copy-on-Write (CoW) reference-counted KV cache brancher for beam search.",
    { num_beams: beams.length, target_beam: targetBeam },
  );

  // Line 2: Dict comprehension
  beams.forEach((bId) => {
    refCounts[bId] = 1;
  });
  addStep(
    2,
    "Initialize ref_counts dict: {b_id: 1 for b_id in beams}",
    "Setting initial reference count = 1 for all active candidate physical KV blocks.",
    { beams: beams.join(", "), num_beams: beams.length },
  );

  // Line 3: active_blocks list copy
  const activeBlocks = [...beams];
  addStep(
    3,
    `Initialize active_blocks = list(beams) -> [${activeBlocks.join(", ")}]`,
    "Constructed list of active physical blocks in current beam search generation step.",
    { active_blocks: activeBlocks.join(", ") },
  );

  // Line 5: Loop over active_blocks
  addStep(
    5,
    "Begin loop: for idx, beam_id in enumerate(active_blocks)",
    `Evaluating ${activeBlocks.length} active physical blocks for target branch matching.`,
    { num_active: activeBlocks.length },
  );

  activeBlocks.forEach((beamId, idx) => {
    addStep(
      5,
      `Loop iteration idx=${idx}: beam_id=${beamId}`,
      `Checking beam block #${beamId} at index ${idx}.`,
      { idx, beam_id: beamId, target_beam: targetBeam },
      idx,
    );

    const isMatch = beamId === targetBeam;
    addStep(
      6,
      `Check condition: beam_id (${beamId}) == target_beam (${targetBeam}) -> ${isMatch}`,
      isMatch
        ? `MATCH FOUND! Beam #${beamId} matches target beam #${targetBeam}. Triggering Copy-on-Write (CoW) fork.`
        : `No match. Beam #${beamId} does not branch in this step.`,
      { idx, beam_id: beamId, target_beam: targetBeam, isMatch },
      idx,
    );

    if (isMatch) {
      refCounts[beamId] += 1;
      addStep(
        7,
        `Increment parent reference count: ref_counts[${beamId}] += 1 -> ${refCounts[beamId]}`,
        `Shared prefix block #${beamId} reference count increased to ${refCounts[beamId]}. Physical copy deferred (Copy-on-Write).`,
        { beam_id: beamId, new_ref_count: refCounts[beamId] },
        idx,
      );

      const forkedId = beamId + 100;
      addStep(
        8,
        `Compute forked_id = beam_id + 100 -> ${forkedId}`,
        `Allocated new virtual child beam handle #${forkedId} sharing parent physical block #${beamId}.`,
        { beam_id: beamId, forked_id: forkedId },
        idx,
      );

      refCounts[forkedId] = 1;
      forkedBlocks.push({ parentId: beamId, childId: forkedId });

      addStep(
        9,
        `Set forked reference count: ref_counts[${forkedId}] = 1`,
        `Initialized child beam #${forkedId} with ref_count = 1. Zero VRAM copied!`,
        { forked_id: forkedId, ref_count: 1 },
        idx,
      );
    }
  });

  // Line 11: Return dict
  addStep(
    11,
    "Return completed reference counts and active blocks dict",
    `CoW beam search branching complete! ${Object.keys(refCounts).length} blocks tracked with shared reference counts.`,
    {
      ref_counts_count: Object.keys(refCounts).length,
      active_blocks_count: activeBlocks.length,
    },
    -1,
  );

  return steps;
};

const REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_TRIVIA: TriviaMeta = {
  skipLines: [4, 10],
  distractors: [
    "ref_counts[beam_id] = 0",
    "forked_id = beam_id * 2",
    "active_blocks.append(forked_id)",
    "ref_counts[forked_id] += 1",
  ],
  hints: [
    {
      line: 2,
      hint: "Initialize ref_counts dict with initial reference count = 1 for all active beams.",
    },
    { line: 7, hint: "Increment parent beam block reference count upon branching." },
    { line: 9, hint: "Initialize forked child beam block reference count = 1." },
  ],
  lineExplanations: {
    1: "Function signature for reference_counting_cow_beam_search_brancher taking beams list and target_beam ID.",
    2: "Initialize reference counts dictionary mapping each beam block ID to initial count 1.",
    3: "Construct list active_blocks containing current active candidate beam block IDs.",
    4: "Blank line before loop iteration.",
    5: "Iterate over indexed beam block IDs in active_blocks.",
    6: "Check if current beam_id matches target_beam selected for branching.",
    7: "If match: increment parent beam block reference count (ref_counts[beam_id] += 1).",
    8: "Compute forked child beam block identifier (forked_id = beam_id + 100).",
    9: "Set initial reference count for new forked child beam block to 1.",
    10: "Blank line before returning results.",
    11: "Return result dictionary containing ref_counts mapping and active_blocks list.",
  },
};

export const referenceCountingCowBeamSearchBrancher: AlgorithmDefinition<referenceCountingCowBeamSearchBrancherInput> =
  {
    id: "reference-counting-cow-beam-search-brancher",
    title: "Copy-On-Write (CoW) Reference-Counted Beam Search Brancher",
    topicIds: ["ml_llm_serving", "tries_and_strings"],
    difficulty: "Medium",
    description:
      "In LLM serving systems executing beam search decoding, multiple candidate output sequences (beams) share identical prefix tokens. Naively duplicating the Key-Value (KV) cache for every beam leads to quadratic memory growth and severe VRAM exhaustion. Copy-on-Write (CoW) reference-counted block allocation allows multiple candidate beams to share the exact same physical KV cache pages in memory. Parent blocks maintain a reference count (`ref_count`). When a beam diverges or appends new tokens, a physical copy is triggered only if `ref_count > 1`, otherwise the block is modified in-place.\n\n### CoW Reference Counting Formula\nWhen beam $B_i$ forks into child beam $B_j$:\n$$\\text{ref}\\_count(P_k) \\leftarrow \\text{ref}\\_count(P_k) + 1$$\n\nPhysical memory allocation is delayed until a write operation occurs on a shared page (${\\text{ref}\\_count > 1}$):\n$$\\text{If write to } P_k \\text{ and } \\text{ref}\\_count(P_k) > 1 \\implies \\text{Allocate } P_{\\text{new}}, \\text{ copy } P_k \\to P_{\\text{new}}$$\n\n### Input Parameters\n- `data`: Array of active beam block IDs in candidate pool.\n- `target`: Target beam ID selected for branching/forking.\n\n### Output\n- Returns dictionary containing `ref_counts` and `active_blocks`.",
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
      time: "$O(K)$ where $K$ is the number of active beams being evaluated.",
      space: "$O(K)$ memory storing reference counts and active block structures.",
    },
    topicGuide: {
      overview:
        "Copy-On-Write (CoW) with reference counting enables zero-copy sharing of physical KV cache blocks across parallel beam search branches in LLM serving engines.",
      sections: [
        {
          heading: "Overview & Theoretical Foundations",
          body: "Beam search is a heuristic search algorithm that expands the top-$k$ most probable sequence hypotheses at each decoding step. Because all $k$ beams share the same initial prompt (and often share long common prefixes during early generation), storing $k$ independent copies of the KV cache multiplies memory usage by $k$. Copy-on-Write reference counting treats the KV cache as a directed acyclic graph (DAG) of shared physical memory blocks.",
        },
        {
          heading: "Core Concepts & Algorithmic Design",
          body: "When a beam search step forks a new hypothesis from an existing parent beam, the engine does not duplicate the parent's physical KV memory blocks. Instead, it increments the reference count (`ref_count += 1`) of each physical block in the parent sequence's block table. Only when a specific beam writes new tokens into a partially-filled block with `ref_count > 1` does the allocator perform a physical memory copy (Copy-on-Write), isolating modifications to the child beam.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "CoW block sharing reduces memory consumption during beam search by up to $k\\times$. This memory efficiency allows serving systems to increase beam widths or run significantly higher concurrent user batches without triggering out-of-memory (OOM) allocation failures on GPU HBM.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
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

export default referenceCountingCowBeamSearchBrancher;
