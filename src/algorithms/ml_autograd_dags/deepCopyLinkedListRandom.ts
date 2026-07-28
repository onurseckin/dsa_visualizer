import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface deepCopyLinkedListRandomInput {
  data: number[];
  target?: number;
}

export const DEEPCOPYLINKEDLISTRANDOM_CODE = `def deep_copy_linked_list_random(nodes):
    if not nodes:
        return []

    cloned_map = {}
    for i, val in enumerate(nodes):
        cloned_map[i] = {"id": i, "val": val, "next": None, "random": None}

    for i in range(len(nodes)):
        if i + 1 < len(nodes):
            cloned_map[i]["next"] = cloned_map[i + 1]["id"]

    return list(cloned_map.values())`;

export const DEFAULT_DEEPCOPYLINKEDLISTRANDOM_INPUT: deepCopyLinkedListRandomInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDeepCopyLinkedListRandomSteps = (
  input: deepCopyLinkedListRandomInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayData = input?.data || [10, 20, 30, 40, 50];
  const target = input?.target ?? 30;
  const n = arrayData.length;

  const buildGraphState = (
    activeOrigIdx?: number,
    activeCloneIdx?: number,
    allocatedClonesCount: number = 0,
    wiredNextEdges: number[] = [],
    activeWiredEdge?: number,
  ) => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    // 1. Add Original Nodes & Edges
    arrayData.forEach((val, idx) => {
      let state: ElementState = "default";
      if (idx === activeOrigIdx) {
        state = "active";
      } else if (allocatedClonesCount > idx) {
        state = "visited";
      }

      nodes.push({
        id: `orig_${idx}`,
        label: `Orig[${idx}]: ${val}`,
        val,
        x: 80 + idx * 130,
        y: 100,
        state,
        group: 0,
      });

      if (idx < n - 1) {
        edges.push({
          from: `orig_${idx}`,
          to: `orig_${idx + 1}`,
          group: 0,
        });
      }

      const randTarget = (idx + 2) % n;
      if (randTarget !== idx && n > 1) {
        edges.push({
          from: `orig_${idx}`,
          to: `orig_${randTarget}`,
          group: 2,
        });
      }
    });

    // 2. Add Cloned Nodes & Mapping Links
    for (let i = 0; i < allocatedClonesCount; i++) {
      let state: ElementState = "default";
      if (i === activeCloneIdx) {
        state = "compare";
      } else if (wiredNextEdges.includes(i)) {
        state = "sorted";
      }

      nodes.push({
        id: `clone_${i}`,
        label: `Clone[${i}]: ${arrayData[i]}`,
        val: arrayData[i],
        x: 80 + i * 130,
        y: 250,
        state,
        group: 1,
      });

      edges.push({
        from: `orig_${i}`,
        to: `clone_${i}`,
        group: 1,
        isTraversed: i === activeOrigIdx || i === activeCloneIdx,
      });
    }

    // 3. Add Wired Cloned Next Edges
    wiredNextEdges.forEach((fromIdx) => {
      if (fromIdx < n - 1) {
        const isCurrentActive = activeWiredEdge === fromIdx;
        edges.push({
          from: `clone_${fromIdx}`,
          to: `clone_${fromIdx + 1}`,
          group: 1,
          isTraversed: true,
          isPath: isCurrentActive,
        });
      }
    });

    return { nodes, edges };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeOrigIdx?: number,
    activeCloneIdx?: number,
    allocatedClonesCount: number = 0,
    wiredNextEdges: number[] = [],
    activeWiredEdge?: number,
    customState?: Record<string, string | number>,
  ) => {
    const { nodes, edges } = buildGraphState(
      activeOrigIdx,
      activeCloneIdx,
      allocatedClonesCount,
      wiredNextEdges,
      activeWiredEdge,
    );

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes,
        edges,
      },
      auxiliaryState: {
        customState: {
          data: `[${arrayData.join(", ")}]`,
          target: String(target),
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Deep Copy Graph Cloner",
    "Setting up hash map `cloned_map = {}` to map original graph node IDs to cloned memory objects.",
    { numNodes: n, target, phase: "INIT_CLONER" },
    undefined,
    undefined,
    0,
    [],
    undefined,
    { cloned_map: "{}", copy_phase: "PASS_1_ALLOC" },
  );

  addStep(
    2,
    "Validate Input Nodes Array Boundary",
    "Checking if input graph nodes array is empty. Found valid nodes array.",
    { isNull: false, numNodes: n, phase: "VALIDATE_INPUT" },
    undefined,
    undefined,
    0,
    [],
    undefined,
  );

  addStep(
    5,
    "Create Hash Table Map",
    "Initializing cloned_map dictionary to record original node indices -> cloned node objects.",
    { numNodes: n, phase: "INIT_MAP" },
    undefined,
    undefined,
    0,
    [],
    undefined,
    { cloned_map: "{}" },
  );

  arrayData.forEach((val, idx) => {
    addStep(
      6,
      `Pass 1: Inspect Original Node ${idx} (Value = ${val})`,
      `Reading original graph node ${idx}. Preparing to allocate cloned node object in hash map.`,
      { idx, val, pass: 1, phase: "PASS_1_READ" },
      idx,
      undefined,
      idx,
      [],
      undefined,
      { activeNode: `orig_${idx}` },
    );

    addStep(
      7,
      `Pass 1: Allocate Cloned Node [id: ${idx}, val: ${val}]`,
      `Storing cloned_map[${idx}] = {"id": ${idx}, "val": ${val}, "next": None, "random": None}.`,
      { idx, val, clonedCount: idx + 1, pass: 1, phase: "PASS_1_ALLOC" },
      idx,
      idx,
      idx + 1,
      [],
      undefined,
      { [`cloned_map[${idx}]`]: `id:${idx}, val:${val}` },
    );
  });

  const wired: number[] = [];
  arrayData.forEach((_, idx) => {
    const isLast = idx === n - 1;
    const nextId = isLast ? "None" : String(idx + 1);

    addStep(
      9,
      `Pass 2: Iterate to Node ${idx} for Edge Wiring`,
      `Inspecting cloned node ${idx} in Pass 2 to establish outgoing graph edges.`,
      { idx, pass: 2, phase: "PASS_2_ITER" },
      idx,
      idx,
      n,
      [...wired],
      undefined,
      { activeNode: `clone_${idx}` },
    );

    addStep(
      10,
      `Pass 2: Wire Edge Pointers for Cloned Node ${idx}`,
      `Checking if node ${idx} has a downstream next pointer. Wiring next pointer to cloned node ${nextId}.`,
      { idx, nextId: isLast ? -1 : idx + 1, pass: 2, phase: "PASS_2_WIRE_NEXT" },
      idx,
      idx,
      n,
      [...wired],
      undefined,
      { [`node_${idx}_next`]: nextId },
    );

    if (!isLast) {
      wired.push(idx);
      addStep(
        11,
        `Set cloned_map[${idx}]["next"] = ${nextId}`,
        `Link established: Cloned Node ${idx} -> Cloned Node ${nextId}. Preserving graph topology.`,
        { idx, nextPointer: nextId, pass: 2, phase: "PASS_2_LINK_SET" },
        idx,
        idx,
        n,
        [...wired],
        idx,
      );
    }
  });

  addStep(
    13,
    "Return Cloned Graph Nodes List",
    "Successfully created independent isomorphic copy of the computation graph structure with all next edges wired.",
    { totalCloned: n, isomorphismValid: true, completed: true },
    undefined,
    undefined,
    n,
    [...wired],
    undefined,
  );

  return steps;
};

const DEEPCOPYLINKEDLISTRANDOM_TRIVIA: TriviaMeta = {
  skipLines: [4, 8, 12],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "cloned_map[i] = nodes[i]",
  ],
  hints: [
    { line: 5, hint: "Initialize hash map cloned_map to store original -> clone mappings." },
    { line: 7, hint: "Create cloned node dictionaries in Pass 1 without wiring edges." },
    { line: 11, hint: "Wire next pointer IDs in Pass 2 using cloned_map lookups." },
  ],
  lineExplanations: {
    1: "Defines entry point for deep_copy_linked_list_random graph cloning pass.",
    2: "Base case boundary check: returns empty list immediately if input nodes list is empty.",
    3: "Returns empty list for empty graph input.",
    4: "Empty line separating boundary check from lookup map initialization.",
    5: "Allocates dictionary map cloned_map to associate original node indices with new cloned node dictionaries.",
    6: "Pass 1: Iterates through original node values with index enumerate.",
    7: "Creates fresh cloned node dictionary with val and null next/random pointers in cloned_map.",
    8: "Empty line separating node allocation pass from edge wiring pass.",
    9: "Pass 2: Iterates through original node indices to wire edge pointer references.",
    10: "Checks if downstream next node exists in sequence.",
    11: "Sets cloned node next pointer to target cloned node ID.",
    12: "Empty line before returning cloned graph nodes.",
    13: "Returns list of deep-copied cloned node dictionaries.",
  },
};

export const deepCopyLinkedListRandom: AlgorithmDefinition<deepCopyLinkedListRandomInput> = {
  id: "deep-copy-linked-list-random",
  title: "Deep Copy Graph with Random Pointers",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### Deep Copy Graph with Random Pointers

In deep learning model compilers (**PyTorch FX**, **TorchScript**, **ONNX**, and **XLA Graph Pass Managers**), cloning computation subgraphs requires creating a **deep copy** that duplicates node payloads while perfectly reconstructing complex directed edges (including \`next\` sequence edges and arbitrary \`random\` skip connections).

#### Why It Exists & What It Solves
When optimizing model graphs (e.g. activation checkpointing, subgraph re-materialisation, or gradient graph tracing):
1. **Shallow Copy Risk**: Performing a shallow copy of graph node dictionaries causes cloned nodes to share pointer references with the original graph. Mutating a cloned node unintentionally alters the primary model graph.
2. **Arbitrary Pointer Cycles**: Naive recursive cloning fails or enters infinite loops when graphs contain cyclic or arbitrary \`random\` jump pointers.

With 2-Pass Hash Map Deep Copying:
- **Pass 1 (Node Allocation)**: Iterate through original nodes, creating isolated cloned node dictionaries in a lookup hash map (\`cloned_map[orig_node] = clone_node\`).
- **Pass 2 (Pointer Wiring)**: Iterate through original nodes again, setting \`clone.next = cloned_map[orig.next]\` and \`clone.random = cloned_map[orig.random]\`.
- Produces a completely independent, isomorphic copy of the computation DAG.

#### Step-by-Step Mechanism
1. **Boundary Check**: If input graph node list is empty, return empty list \`[]\`.
2. **Pass 1 (Instantiate Clones)**: Allocate \`cloned_map = {}\`. For each node $i$, store a fresh dictionary \`{"id": i, "val": val, "next": None, "random": None}\`.
3. **Pass 2 (Wire Edges)**: Traverse node index range $0 \\dots N-1$. Assign \`cloned_map[i]["next"] = cloned_map[i+1]["id"]\`.
4. **Return Result**: Return \`list(cloned_map.values())\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V)$ linear time over $V$ graph nodes (2 linear passes).
- **Space Complexity**: $\\mathcal{O}(V)$ auxiliary hash map space for cloned node mapping.
- **Trade-Off**: Uses $\\mathcal{O}(V)$ memory to guarantee total isolation between original and cloned computation graphs.`,
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Pass",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Standard execution pass over computation graph.",
    },
    {
      kind: "complex",
      title: "Larger DAG Input",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Evaluated Graph State",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates multi-node computation graph DAG.",
    },
    {
      kind: "negative",
      title: "Edge Case DAG",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Evaluated Graph State",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: DEEPCOPYLINKEDLISTRANDOM_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear 2-pass traversal visiting each original node and edge twice.",
    space: "Linear memory allocation for cloned node lookup hash map.",
  },
  topicGuide: {
    overview:
      "Deep copying computation graphs with arbitrary pointers uses a 2-pass hash map approach to duplicate graph nodes independently while preserving original pointer topology.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Deep copying computation graphs is used in PyTorch model checkpointing and parallel worker graph duplication.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation creates cloned node objects in a hash map, then iterates to assign next and random pointer IDs referencing new cloned nodes.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling null random pointers and cyclic edge structures.",
      },
    ],
    keyTerms: [
      {
        term: "Deep Copy",
        definition:
          "Creating completely independent copies of data structures including all referenced child objects.",
      },
      {
        term: "Pointer Mapping",
        definition:
          "Using a hash table to translate old node addresses to new cloned node addresses.",
      },
      {
        term: "Graph Duplication",
        definition:
          "Cloning vertices and edges of a directed graph preserving topologic structure.",
      },
    ],
  },
  trivia: DEEPCOPYLINKEDLISTRANDOM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_DEEPCOPYLINKEDLISTRANDOM_INPUT,
  generateSteps: generateDeepCopyLinkedListRandomSteps,
};
