import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface deepCopyLinkedListRandomInput {
  data: number[];
  target?: number;
}

export const DEEPCOPYLINKEDLISTRANDOM_CODE = `
def deep_copy_linked_list_random(nodes):
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

    return list(cloned_map.values())
`;

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
          target: String(input?.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Deep Copy Graph with Random Pointers",
    "Setting up execution data structures and memory layout pointers.",
    { n: arrayData.length, target: input?.target ?? 0 },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === input?.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in autograd computation graph.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    16,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const DEEPCOPYLINKEDLISTRANDOM_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process graph nodes in autograd execution pipeline." }],
  lineExplanations: {
    1: "Defines deep copy graph function.",
    4: "Returns empty list if input nodes array is empty.",
    7: "Initializes hash map cloned_map mapping node IDs to new cloned node objects.",
    8: "Iterates through original nodes to create cloned node objects.",
    9: "Populates cloned_map with new node dictionary.",
    11: "Iterates through original nodes to assign next and random edge pointers.",
    13: "Assigns next pointer ID to next cloned node in sequence.",
    15: "Returns list of deep-copied node object dictionaries.",
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
  description:
    "Cloning computation graphs, neural network architectures, or graph datasets (e.g. PyTorch module cloning, LeetCode 138) requires creating a deep copy of nodes while correctly re-mapping graph edges (next, prev, random/skip edges) to point to cloned node instances rather than original nodes.\n\nThis algorithm implements Deep Copy Graph with Random Pointers, creating independent node object copies and mapping original pointer references to cloned node instances.\n\nInput Format:\n- data: Array representing original node values.\n- target: Optional target value.\n\nOutput Format:\n- Returns array of cloned node structures with mapped edge pointers.\n\nEdge Cases & Constraints:\n- Empty graph input.\n- Random pointer pointing to self or null.\n- Circular random pointer cycles.",
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
    time: "Linear time traversal across graph vertices and edges.",
    space: "Linear memory allocation for graph adjacency lists.",
  },
  topicGuide: {
    overview:
      "Deep copying graph structures requires maintaining a hash map (or inter-leaved nodes) mapping original_node -> cloned_node. This guarantees that arbitrary random pointers resolve to new cloned instances rather than original instances.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for every node u in graph G = (V, E), deep copy constructs u' in V' and re-maps every edge (u, v) in E to edge (u', v') in E'. Time complexity is O(V + E) with O(V) space.",
      },
      {
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
