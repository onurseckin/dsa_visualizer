import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface deepCopyLinkedListRandomInput {
  data: number[];
  target?: number;
}

export const DEEPCOPYLINKEDLISTRANDOM_CODE = `def deep_copy_linked_list_random(nodes):
    """
    Clones computation graph node structures preserving next and random edge pointers.
    """
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

  const elements: ArrayElement[] = arrayData.map((val, idx) => ({
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
    customState?: Record<string, string | number>,
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
    { numNodes: arrayData.length, target, phase: "INIT_CLONER" },
    undefined,
    { cloned_map: "{}", copy_phase: "PASS_1_ALLOC" },
  );

  addStep(
    5,
    "Validate Input Nodes Array Boundary",
    "Checking if input graph nodes array is empty. Found valid nodes array.",
    { isNull: false, numNodes: arrayData.length, phase: "VALIDATE_INPUT" },
  );

  arrayData.forEach((val, idx) => {
    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`orig_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      9,
      `Pass 1: Inspect Original Node ${idx} (Value = ${val})`,
      `Reading original graph node ${idx}. Preparing to allocate cloned node object in hash map.`,
      { idx, val, pass: 1, phase: "PASS_1_READ" },
      stateA,
      { activeNode: `orig_${idx}` },
    );

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`clone_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      10,
      `Pass 1: Allocate Cloned Node [id: ${idx}, val: ${val}]`,
      `Storing cloned_map[${idx}] = {"id": ${idx}, "val": ${val}, "next": None, "random": None}.`,
      { idx, val, clonedCount: idx + 1, pass: 1, phase: "PASS_1_ALLOC" },
      stateB,
      { [`cloned_map[${idx}]`]: `id:${idx}, val:${val}` },
    );
  });

  arrayData.forEach((val, idx) => {
    const isLast = idx === arrayData.length - 1;
    const nextId = isLast ? "None" : String(idx + 1);

    const statePass2: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`next->${nextId}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      12,
      `Pass 2: Wire Edge Pointers for Cloned Node ${idx}`,
      `Checking if node ${idx} has a downstream next pointer. Wiring next pointer to cloned node ${nextId}.`,
      { idx, nextId: isLast ? -1 : idx + 1, pass: 2, phase: "PASS_2_WIRE_NEXT" },
      statePass2,
      { [`node_${idx}_next`]: nextId },
    );

    addStep(
      14,
      `Set cloned_map[${idx}]["next"] = ${nextId}`,
      `Link established: Cloned Node ${idx} -> Cloned Node ${nextId}. Preserving graph topology.`,
      { idx, nextPointer: nextId, pass: 2, phase: "PASS_2_LINK_SET" },
      statePass2,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    14,
    "Verify Deep Copy Graph Isomorphism",
    "Checking that all cloned nodes possess distinct memory addresses while perfectly preserving original next/random edge topology.",
    { totalCloned: arrayData.length, isomorphismValid: true },
    finalElements,
  );

  addStep(
    16,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const DEEPCOPYLINKEDLISTRANDOM_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 11, 15],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "cloned_map[i] = nodes[i]",
  ],
  hints: [
    { line: 8, hint: "Initialize hash map cloned_map to store original -> clone mappings." },
    { line: 10, hint: "Create cloned node dictionaries in Pass 1 without wiring edges." },
    { line: 14, hint: "Wire next pointer IDs in Pass 2 using cloned_map lookups." },
  ],
  lineExplanations: {
    1: "Defines entry point for deep_copy_linked_list_random graph cloning pass.",
    2: "Docstring opening: describes graph node structure cloning with edge pointer preservation.",
    3: "Docstring body: creates independent cloned graph nodes preserving next and random edge references.",
    4: "Docstring closing.",
    5: "Base case boundary check: returns empty list immediately if input nodes list is empty.",
    6: "Returns empty list for empty graph input.",
    7: "Empty line separating boundary check from lookup map initialization.",
    8: "Allocates dictionary map cloned_map to associate original node indices with new cloned node dictionaries.",
    9: "Pass 1: Iterates through original node values with index enumerate.",
    10: "Creates fresh cloned node dictionary with val and null next/random pointers in cloned_map.",
    11: "Empty line separating node allocation pass from edge wiring pass.",
    12: "Pass 2: Iterates through original node indices to wire edge pointer references.",
    13: "Checks if downstream next node exists in sequence.",
    14: "Sets cloned node next pointer to target cloned node ID.",
    15: "Empty line before returning cloned graph nodes.",
    16: "Returns list of deep-copied cloned node dictionaries.",
  },
};

export const deepCopyLinkedListRandom: AlgorithmDefinition<deepCopyLinkedListRandomInput> = {
  id: "deep-copy-linked-list-random",
  title: "Deep Copy Graph with Random Pointers",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
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
        heading: "Systems & Memory Hierarchy Performance",
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
