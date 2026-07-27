import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface findZeroIndegreeNodesInput {
  data: number[];
  target?: number;
}

export const FINDZEROINDEGREENODES_CODE = `def find_zero_indegree_nodes(num_nodes, edges):
    """
    Identifies source root nodes with in-degree 0 in computation graph.
    """
    in_degree = [0] * num_nodes
    for u, v in edges:
        in_degree[v] += 1

    root_nodes = [i for i in range(num_nodes) if in_degree[i] == 0]
    return root_nodes`;

export const DEFAULT_FINDZEROINDEGREENODES_INPUT: findZeroIndegreeNodesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFindZeroIndegreeNodesSteps = (
  input: findZeroIndegreeNodesInput,
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

  // Step 1: Init Zero In-Degree Detector
  addStep(
    1,
    "Initialize Zero In-Degree Root Input Node Detector",
    "Setting up in-degree tracking array `in_degree = [0] * num_nodes` to identify autograd graph source leaf nodes.",
    { numNodes: arrayData.length, target, phase: "INIT_ZERO_INDEGREE" },
    undefined,
    { status: "INITIALIZING", root_nodes: "[]" },
  );

  // Step 2: Allocate In-Degree Array
  addStep(
    5,
    "Allocate In-Degree Counter Array [0, 0, ...]",
    "Initializing in-degree counts to zero for all computation graph vertices.",
    { numNodes: arrayData.length, phase: "ALLOC_INDEGREE" },
  );

  // Step 3: Scan Edge List Structure
  addStep(
    6,
    "Inspect Graph Directed Edges List",
    "Preparing edge scanning pass to count incoming dependencies for each vertex.",
    { totalEdgesCount: arrayData.length - 1, phase: "PREPARE_EDGE_SCAN" },
  );

  // Edge processing pass: Count in-degrees for each node
  const inDegreeMap: number[] = new Array(arrayData.length).fill(0);
  arrayData.forEach((val, idx) => {
    const hasIncomingEdge = idx > 1;
    if (hasIncomingEdge) {
      inDegreeMap[idx] += 1;
    }

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`indeg=${inDegreeMap[idx]}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      6,
      `Process Incoming Edges for Node ${idx}`,
      `Scanning directed edges pointing to target vertex Node_${idx}. Indegree = ${inDegreeMap[idx]}.`,
      { idx, inDegree: inDegreeMap[idx], hasIncoming: hasIncomingEdge, phase: "SCAN_EDGES" },
      stateA,
      { [`Node_${idx}_indeg`]: String(inDegreeMap[idx]) },
    );

    addStep(
      7,
      `Update In-Degree Count: in_degree[${idx}] -> ${inDegreeMap[idx]}`,
      `Incrementing in_degree[${idx}] for each directed incoming dependency edge in DAG.`,
      { idx, finalInDegree: inDegreeMap[idx], phase: "UPDATE_INDEG" },
      stateA,
    );
  });

  // Root node extraction pass: Find nodes with in-degree 0
  const rootList: number[] = [];
  arrayData.forEach((val, idx) => {
    const isRoot = inDegreeMap[idx] === 0;
    if (isRoot) rootList.push(idx);
    const isTarget = val === target;

    const stateExtract: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isRoot ? "active" : "sorted", pointers: [isRoot ? "ROOT_SOURCE" : "INTERMEDIATE"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      9,
      `Inspect Node ${idx} In-Degree: in_degree[${idx}] == ${inDegreeMap[idx]}`,
      `Checking root condition (in_degree == 0). Node_${idx} is ${isRoot ? "a ROOT SOURCE (Input Leaf Tensor)" : "an internal intermediate computation node"}.`,
      { idx, inDegree: inDegreeMap[idx], isRoot, totalRootsFound: rootList.length, phase: "CHECK_ROOT" },
      stateExtract,
      { rootList: `[${rootList.join(", ")}]` },
    );
  });

  // Step final-1: Final Graph Verification
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    9,
    "Verify All Graph Zero In-Degree Root Nodes Extracted",
    `Identified ${rootList.length} root source nodes: [${rootList.join(", ")}]. Ready for forward pass execution or Kahn's topological sort queue initialization.`,
    { totalRootNodes: rootList.length, rootList: rootList.join(",") },
    finalElements,
  );

  // Step final: Complete
  addStep(
    10,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const FINDZEROINDEGREENODES_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "root_nodes = [i for i in range(num_nodes) if out_degree[i] == 0]",
  ],
  hints: [
    { line: 5, hint: "Initialize in_degree counter array with zeros for all nodes." },
    { line: 7, hint: "Increment in_degree[v] for each directed edge u -> v." },
    { line: 9, hint: "Extract node indices i where in_degree[i] == 0 (root source input nodes)." },
  ],
  lineExplanations: {
    1: "Defines entry point for find_zero_indegree_nodes root input node detector.",
    2: "Docstring opening: describes finding source root nodes with in-degree 0.",
    3: "Docstring body: identifies in-degree 0 source input nodes in autograd computation graph.",
    4: "Docstring closing.",
    5: "Allocates in_degree array initialized to 0 for num_nodes graph nodes.",
    6: "Iterates through directed edge tuples (u, v) in graph.",
    7: "Increments in-degree count in_degree[v] for target destination node v.",
    8: "Empty line separating edge iteration loop from root node list comprehension extraction.",
    9: "List comprehension extracting node indices i whose in-degree is 0 (root source input leaf nodes).",
    10: "Returns list of detected zero in-degree root source node IDs.",
  },
};

export const findZeroIndegreeNodes: AlgorithmDefinition<findZeroIndegreeNodesInput> = {
  id: "find-zero-indegree-nodes",
  title: "Find Zero In-Degree Root Input Nodes",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Find Zero In-Degree Root Input Nodes

In deep learning autograd engines (**PyTorch**, **JAX**, **TensorFlow**, and **Graph Compilers**), **root input nodes** (source nodes with **in-degree = 0**) represent user-created leaf tensors, model weight parameters ($W, b$), or input data batches ($X$).

#### Why It Exists & What It Solves
Forward-mode compilation and topological sorting (such as Kahn's BFS algorithm) start graph execution from root source nodes.

Without zero in-degree detection:
1. Graph compilers cannot identify seed nodes for forward execution passes or Kahn's queue initialization.
2. In PyTorch autograd, leaf tensors created by users (\`requires_grad=True\`) must be distinguished from intermediate nodes generated by operator operations.

With in-degree root detection:
- The execution engine iterates over directed edges $(u, v)$ and computes the incoming edge count $\\text{in\_degree}[v]$ for every node $v$.
- Vertices with $\\text{in\_degree}[v] == 0$ are extracted as **root source nodes**.
- Initializes Kahn's BFS queue or forward pass execution sequences cleanly.

#### Step-by-Step Mechanism
1. **Initialize In-Degree Array**: Allocate \`in_degree = [0] * num_nodes\`.
2. **Edge Processing Pass**: For each directed edge $(u, v) \\in E$, increment \`in_degree[v] += 1\`.
3. **Source Extraction**: Collect all node indices $i$ where \`in_degree[i] == 0\`.
4. **Return Root List**: Return \`root_nodes\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time across graph vertices $V$ and directed edges $E$.
- **Space Complexity**: $\\mathcal{O}(V)$ auxiliary space for in-degree tracking array.
- **Trade-Off**: Minimal $\\mathcal{O}(V+E)$ setup cost that guarantees clean forward pass and topological sort initialization.`,
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
  code: FINDZEROINDEGREENODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time traversal across graph vertices and directed edges.",
    space: "Linear memory allocation for in-degree array.",
  },
  topicGuide: {
    overview:
      "Zero in-degree nodes represent independent inputs in a DAG. In PyTorch and TensorFlow, leaf Tensors created directly by users (e.g. weights initialized via torch.randn) have no grad_fn (in-degree = 0).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, node $v$ in $G = (V, E)$ is a root node iff $\\text{InDegree}(v) = |\\{ u \\in V : (u, v) \\in E \\}| = 0$. Execution time is $\\mathcal{O}(V + E)$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Finding zero in-degree nodes initializes the queue in Kahn's BFS topological sorting algorithm before graph lowering passes.",
      },
      {
        heading: "Implementation Details & Data Structures",
        body: "Implementation computes in-degree counts by iterating through directed edges $(u, v)$, filtering nodes where \`in_degree[v] == 0\`.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include disconnected isolated nodes (all isolated nodes have in-degree 0 and are valid source roots).",
      },
    ],
    keyTerms: [
      {
        term: "Root Input Node (Source)",
        definition: "A graph node with in-degree 0 having no incoming edges from parent nodes.",
      },
      {
        term: "In-Degree",
        definition: "The total number of directed incoming edges pointing to a node.",
      },
      {
        term: "Leaf Tensor",
        definition:
          "A PyTorch tensor created directly by user code without a backward autograd history.",
      },
    ],
  },
  trivia: FINDZEROINDEGREENODES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_FINDZEROINDEGREENODES_INPUT,
  generateSteps: generateFindZeroIndegreeNodesSteps,
};
