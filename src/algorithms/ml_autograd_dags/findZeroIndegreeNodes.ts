import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface findZeroIndegreeNodesInput {
  numNodes?: number;
  edges?: [number, number][];
  data?: number[];
  target?: number;
}

export const FINDZEROINDEGREENODES_CODE = `def find_zero_indegree_nodes(num_nodes, edges):
    in_degree = [0] * num_nodes
    for u, v in edges:
        in_degree[v] += 1

    root_nodes = [i for i in range(num_nodes) if in_degree[i] == 0]
    return root_nodes`;

export const DEFAULT_FINDZEROINDEGREENODES_INPUT: findZeroIndegreeNodesInput = {
  numNodes: 6,
  edges: [
    [0, 2],
    [1, 2],
    [2, 4],
    [3, 4],
    [4, 5],
  ],
};

export const generateFindZeroIndegreeNodesSteps = (
  input: findZeroIndegreeNodesInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numNodes = input?.numNodes ?? (input?.data ? input.data.length : 6);
  const edges: [number, number][] =
    input?.edges ??
    (input?.data
      ? Array.from({ length: Math.max(0, input.data.length - 1) }, (_, i): [number, number] => [
          i,
          i + 1,
        ])
      : [
          [0, 2],
          [1, 2],
          [2, 4],
          [3, 4],
          [4, 5],
        ]);

  const inDegreeMap: number[] = new Array(numNodes).fill(0);
  const rootNodes: number[] = [];

  const getNodes = (nodeStates: Record<number, ElementState> = {}): GraphNodeItem[] => {
    const nodes: GraphNodeItem[] = [];
    const cols = Math.min(3, numNodes);
    for (let i = 0; i < numNodes; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      nodes.push({
        id: `${i}`,
        label: `Node ${i}`,
        state: nodeStates[i] || "default",
        val: inDegreeMap[i],
        x: 100 + col * 180,
        y: 100 + row * 120,
      });
    }
    return nodes;
  };

  const getEdges = (
    activeEdgeIdx?: number,
    traversedEdgeIndices: Set<number> = new Set(),
  ): GraphEdgeItem[] => {
    return edges.map(([u, v], idx) => ({
      from: `${u}`,
      to: `${v}`,
      isTraversed: traversedEdgeIndices.has(idx) || activeEdgeIdx === idx,
      isPath: activeEdgeIdx === idx,
    }));
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    nodeStates: Record<number, ElementState> = {},
    activeEdgeIdx?: number,
    traversedEdgeIndices: Set<number> = new Set(),
    customState: Record<string, string | number> = {},
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes: getNodes(nodeStates),
        edges: getEdges(activeEdgeIdx, traversedEdgeIndices),
      },
      auxiliaryState: {
        customState: {
          in_degree: `[${inDegreeMap.join(", ")}]`,
          root_nodes: `[${rootNodes.join(", ")}]`,
          ...customState,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Zero In-Degree Root Input Node Detector",
    `Setting up in-degree tracking across ${numNodes} nodes and ${edges.length} directed edges in autograd computation graph.`,
    { numNodes, totalEdges: edges.length },
    {},
    undefined,
    new Set(),
    { status: "INITIALIZING" },
  );

  addStep(
    2,
    "Allocate In-Degree Array `in_degree = [0] * num_nodes`",
    `Initializing in_degree counter array of size ${numNodes} with zeros: [${inDegreeMap.join(", ")}].`,
    { numNodes, phase: "ALLOC_INDEGREE" },
  );

  addStep(
    3,
    "Iterate Graph Directed Edges List",
    `Looping through ${edges.length} directed edge(s) in computation DAG to count incoming dependencies for each vertex.`,
    { totalEdges: edges.length, phase: "PREPARE_EDGE_LOOP" },
  );

  const traversedEdges = new Set<number>();
  edges.forEach(([u, v], idx) => {
    const nodeStates: Record<number, ElementState> = {
      [u]: "active",
      [v]: "compare",
    };

    addStep(
      3,
      `Inspect Directed Edge (${u} -> ${v})`,
      `Examining directed connection from source node ${u} to target node ${v}.`,
      { edgeIndex: idx, u, v, currentInDegree: inDegreeMap[v] },
      nodeStates,
      idx,
      traversedEdges,
    );

    inDegreeMap[v] += 1;
    traversedEdges.add(idx);

    addStep(
      4,
      `Increment in_degree[${v}] -> ${inDegreeMap[v]}`,
      `Target node ${v} receives incoming edge from ${u}, so increment in_degree[${v}] to ${inDegreeMap[v]}.`,
      { u, v, newInDegree: inDegreeMap[v] },
      nodeStates,
      idx,
      traversedEdges,
    );
  });

  addStep(
    6,
    "Filter Root Source Nodes (In-Degree == 0)",
    "Scanning the in_degree array to extract leaf source nodes with zero incoming dependencies.",
    { inDegreeArray: `[${inDegreeMap.join(", ")}]`, phase: "CHECK_ROOTS" },
  );

  for (let i = 0; i < numNodes; i++) {
    const isRoot = inDegreeMap[i] === 0;
    if (isRoot) {
      rootNodes.push(i);
    }

    const nodeStates: Record<number, ElementState> = {};
    for (let k = 0; k < numNodes; k++) {
      if (k < i) {
        nodeStates[k] = rootNodes.includes(k) ? "sorted" : "visited";
      } else if (k === i) {
        nodeStates[k] = isRoot ? "pivot" : "active";
      }
    }

    addStep(
      6,
      `Check Node ${i}: in_degree[${i}] == ${inDegreeMap[i]}`,
      `Node ${i} has in-degree ${inDegreeMap[i]}. It is ${
        isRoot
          ? "a ROOT SOURCE NODE (User input tensor / parameter leaf with in-degree 0)"
          : "an internal intermediate computation node"
      }.`,
      {
        node: i,
        inDegree: inDegreeMap[i],
        isRoot,
        rootNodesSoFar: `[${rootNodes.join(", ")}]`,
      },
      nodeStates,
      undefined,
      traversedEdges,
    );
  }

  const finalNodeStates: Record<number, ElementState> = {};
  for (let i = 0; i < numNodes; i++) {
    finalNodeStates[i] = rootNodes.includes(i) ? "sorted" : "visited";
  }

  addStep(
    7,
    "Return Detected Zero In-Degree Root Nodes",
    `Identified ${rootNodes.length} root source node(s): [${rootNodes.join(
      ", ",
    )}]. Ready for forward pass execution or Kahn's topological sort queue initialization.`,
    { rootCount: rootNodes.length, rootNodes: `[${rootNodes.join(", ")}]` },
    finalNodeStates,
    undefined,
    traversedEdges,
  );

  addStep(
    7,
    "Execution Complete",
    `Successfully processed all nodes in the computation graph structure. Identified root source nodes: [${rootNodes.join(
      ", ",
    )}].`,
    { completed: true, totalSteps: stepIndex },
    finalNodeStates,
    undefined,
    traversedEdges,
    { status: "COMPLETED" },
  );

  return steps;
};

const FINDZEROINDEGREENODES_TRIVIA: TriviaMeta = {
  skipLines: [5],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "root_nodes = [i for i in range(num_nodes) if out_degree[i] == 0]",
  ],
  hints: [
    { line: 2, hint: "Initialize in_degree counter array with zeros for all nodes." },
    { line: 4, hint: "Increment in_degree[v] for each directed edge u -> v." },
    { line: 6, hint: "Extract node indices i where in_degree[i] == 0 (root source input nodes)." },
  ],
  lineExplanations: {
    1: "Defines entry point for find_zero_indegree_nodes root input node detector.",
    2: "Allocates in_degree array initialized to 0 for num_nodes graph nodes.",
    3: "Iterates through directed edge tuples (u, v) in graph.",
    4: "Increments in-degree count in_degree[v] for target destination node v.",
    5: "Empty line separating edge iteration loop from root node list comprehension extraction.",
    6: "List comprehension extracting node indices i whose in-degree is 0 (root source input leaf nodes).",
    7: "Returns list of detected zero in-degree root source node IDs.",
  },
};

export const findZeroIndegreeNodes: AlgorithmDefinition<findZeroIndegreeNodesInput> = {
  id: "find-zero-indegree-nodes",
  title: "Find Zero In-Degree Root Input Nodes",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  description: `### Find Zero In-Degree Root Input Nodes

In deep learning autograd engines (**PyTorch**, **JAX**, **TensorFlow**, and **Graph Compilers**), **root input nodes** (source nodes with **in-degree = 0**) represent user-created leaf tensors, model weight parameters ($W, b$), or input data batches ($X$).

#### Why It Exists & What It Solves
Forward-mode compilation and topological sorting (such as Kahn's BFS algorithm) start graph execution from root source nodes.

Without zero in-degree detection:
1. Graph compilers cannot identify seed nodes for forward execution passes or Kahn's queue initialization.
2. In PyTorch autograd, leaf tensors created by users (\`requires_grad=True\`) must be distinguished from intermediate nodes generated by operator operations.

With in-degree root detection:
- The execution engine iterates over directed edges $(u, v)$ and computes the incoming edge count $\\text{in_degree}[v]$ for every node $v$.
- Vertices with $\\text{in_degree}[v] == 0$ are extracted as **root source nodes**.
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
  constraints: ["1 <= num_nodes <= 1000", "0 <= edges.length <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Single-Loss DAG",
      inputDisplay: "numNodes = 6, edges = [[0, 2], [1, 2], [2, 4], [3, 4], [4, 5]]",
      outputDisplay: "[0, 1, 3]",
      input: {
        numNodes: 6,
        edges: [
          [0, 2],
          [1, 2],
          [2, 4],
          [3, 4],
          [4, 5],
        ],
      },
      output: "[0, 1, 3]",
      explanation: "Nodes 0, 1, and 3 have in-degree 0 (root input source nodes).",
    },
    {
      kind: "complex",
      title: "Linear Chain DAG",
      inputDisplay: "numNodes = 4, edges = [[0, 1], [1, 2], [2, 3]]",
      outputDisplay: "[0]",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
      output: "[0]",
      explanation: "Only Node 0 has in-degree 0 at the start of the linear chain.",
    },
  ],
  code: FINDZEROINDEGREENODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V)",
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
        body: "Implementation computes in-degree counts by iterating through directed edges $(u, v)$, filtering nodes where `in_degree[v] == 0`.",
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
