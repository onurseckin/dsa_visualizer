import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface detectTerminalNodesInput {
  numNodes?: number;
  edges?: [number, number][];
  data?: number[];
  target?: number;
}

export const DETECTTERMINALNODES_CODE = `def detect_terminal_nodes(num_nodes, edges):
    out_degree = [0] * num_nodes
    for u, v in edges:
        out_degree[u] += 1

    terminal_nodes = [i for i in range(num_nodes) if out_degree[i] == 0]
    return terminal_nodes`;

export const DEFAULT_DETECTTERMINALNODES_INPUT: detectTerminalNodesInput = {
  numNodes: 6,
  edges: [
    [0, 2],
    [1, 2],
    [2, 4],
    [3, 4],
    [4, 5],
  ],
};

export const generateDetectTerminalNodesSteps = (
  input: detectTerminalNodesInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numNodes = input?.numNodes ?? (input?.data ? input.data.length : 6);
  const edges: [number, number][] = input?.edges ?? [
    [0, 2],
    [1, 2],
    [2, 4],
    [3, 4],
    [4, 5],
  ];

  const getNodes = (
    nodeStates: Record<number, "default" | "active" | "visited" | "sorted" | "pivot"> = {},
  ): GraphNodeItem[] => {
    const nodes: GraphNodeItem[] = [];
    const cols = Math.min(3, numNodes);
    for (let i = 0; i < numNodes; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      nodes.push({
        id: `${i}`,
        label: `Node ${i}`,
        state: nodeStates[i] || "default",
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

  const outDegree: number[] = new Array(numNodes).fill(0);
  const terminalNodes: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    nodeStates: Record<number, "default" | "active" | "visited" | "sorted" | "pivot"> = {},
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
          out_degree: `[${outDegree.join(", ")}]`,
          terminal_nodes: `[${terminalNodes.join(", ")}]`,
          ...customState,
        },
      },
      variables,
    });
  };

  // Step 1: Function Entry
  addStep(
    1,
    "Initialize Terminal Sink Node Detector for DAG",
    `Setting up out-degree analysis on autograd computation graph with ${numNodes} nodes and ${edges.length} directed edges.`,
    { numNodes, totalEdges: edges.length },
    {},
    undefined,
    new Set(),
    { status: "INITIALIZING" },
  );

  // Step 2: Allocate out_degree array
  addStep(
    2,
    "Allocate Out-Degree Tracking Array",
    `Initializing out_degree array of size ${numNodes} with zeros: [${outDegree.join(", ")}].`,
    { numNodes, phase: "ALLOC_OUT_DEGREE" },
  );

  // Step 3: Scan Edge List
  addStep(
    3,
    "Iterate Directed Edge List",
    `Looping through ${edges.length} directed edge(s) in the computation graph DAG to count node out-degrees.`,
    { totalEdges: edges.length, phase: "PREPARE_EDGE_LOOP" },
  );

  const traversedEdges = new Set<number>();
  edges.forEach(([u, v], idx) => {
    // Select Edge
    const nodeStates: Record<number, "default" | "active" | "visited" | "sorted" | "pivot"> = {
      [u]: "active",
      [v]: "visited",
    };
    addStep(
      3,
      `Inspect Directed Edge (${u} -> ${v})`,
      `Examining directed connection from source node ${u} to target node ${v}.`,
      { edgeIndex: idx, u, v, currentOutDegree: outDegree[u] },
      nodeStates,
      idx,
      traversedEdges,
    );

    // Increment out-degree
    outDegree[u] += 1;
    traversedEdges.add(idx);
    addStep(
      4,
      `Increment out_degree[${u}] -> ${outDegree[u]}`,
      `Node ${u} has an outgoing edge to Node ${v}, so increment out_degree[${u}] to ${outDegree[u]}.`,
      { u, v, newOutDegree: outDegree[u] },
      nodeStates,
      idx,
      traversedEdges,
    );
  });

  // Step 6: Filter Terminal Nodes
  addStep(
    6,
    "Filter Terminal Sink Nodes (Out-Degree == 0)",
    "Scanning the out_degree array to extract sink leaf nodes with no outgoing edges.",
    { outDegreeArray: `[${outDegree.join(", ")}]`, phase: "CHECK_TERMINALS" },
  );

  for (let i = 0; i < numNodes; i++) {
    const isTerminal = outDegree[i] === 0;
    if (isTerminal) {
      terminalNodes.push(i);
    }

    const nodeStates: Record<number, "default" | "active" | "visited" | "sorted" | "pivot"> = {};
    for (let k = 0; k < numNodes; k++) {
      if (k < i) {
        nodeStates[k] = terminalNodes.includes(k) ? "sorted" : "visited";
      } else if (k === i) {
        nodeStates[k] = isTerminal ? "pivot" : "active";
      }
    }

    addStep(
      6,
      `Check Node ${i}: out_degree[${i}] == ${outDegree[i]}`,
      `Node ${i} has out-degree ${outDegree[i]}. It is ${
        isTerminal
          ? "a TERMINAL SINK NODE (Loss Output head with zero outgoing edges)"
          : "an internal intermediate computation node"
      }.`,
      {
        node: i,
        outDegree: outDegree[i],
        isTerminal,
        terminalNodesSoFar: `[${terminalNodes.join(", ")}]`,
      },
      nodeStates,
      undefined,
      traversedEdges,
    );
  }

  // Final Step: Return terminal nodes
  const finalNodeStates: Record<number, "default" | "active" | "visited" | "sorted" | "pivot"> = {};
  for (let i = 0; i < numNodes; i++) {
    finalNodeStates[i] = terminalNodes.includes(i) ? "sorted" : "visited";
  }

  addStep(
    7,
    "Return Detected Terminal Sink Nodes",
    `Identified ${terminalNodes.length} terminal sink node(s): [${terminalNodes.join(
      ", ",
    )}]. Gradient seeding dL/dL = 1.0 can be initialized at these nodes for reverse-mode autograd.`,
    { terminalCount: terminalNodes.length, terminalNodes: `[${terminalNodes.join(", ")}]` },
    finalNodeStates,
    undefined,
    traversedEdges,
  );

  addStep(
    7,
    "Execution Complete",
    `Successfully processed all nodes in the computation graph structure. Identified terminal sink nodes: [${terminalNodes.join(
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

const DETECTTERMINALNODES_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "terminal_nodes = [i for i in range(num_nodes) if in_degree[i] == 0]",
  ],
  hints: [
    { line: 2, hint: "Initialize out_degree array with zeros for all nodes." },
    { line: 4, hint: "Increment out_degree[u] for each directed edge u -> v." },
    { line: 6, hint: "Extract node indices i where out_degree[i] == 0 (sink leaf nodes)." },
  ],
  lineExplanations: {
    1: "Defines entry point for detect_terminal_nodes graph sink detector.",
    2: "Allocates out_degree array initialized to 0 for num_nodes graph nodes.",
    3: "Iterates through directed edge tuples (u, v) in graph.",
    4: "Increments out-degree count out_degree[u] for source node u.",
    5: "Blank line separating edge iteration from terminal node extraction.",
    6: "List comprehension extracting node indices i whose out-degree is 0 (terminal leaf sink nodes).",
    7: "Returns list of detected terminal sink node IDs.",
  },
};

export const detectTerminalNodes: AlgorithmDefinition<detectTerminalNodesInput> = {
  id: "detect-terminal-nodes",
  title: "Detect Terminal Leaf Nodes in DAG",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  description: `### Detect Terminal Leaf Nodes in DAG

In deep learning autograd engines (**PyTorch**, **JAX**, **TensorFlow**, and **Graph Compilers**), **terminal leaf nodes** (sink nodes with **out-degree = 0**) represent final model output tensors, loss nodes, or target metrics.

#### Why It Exists & What It Solves
Reverse-mode automatic differentiation computes backward gradients starting from loss nodes $L$ down to model weights $W$.

Without terminal node detection:
1. The autograd engine cannot automatically identify which graph nodes require loss gradient seeding ($dL/dL = 1.0$).
2. Multi-task loss topologies (where multiple loss heads exist) fail to discover all backward starting entry points.

With out-degree terminal detection:
- The graph engine scans directed edges and tracks the out-degree count $\\text{out\\_degree}[u]$ of every node $u$.
- Vertices with $\\text{out\\_degree}[u] == 0$ are classified as **terminal sink nodes**.
- Initializes backward gradient propagation cleanly for single-loss or multi-loss computation DAGs.

#### Step-by-Step Mechanism
1. **Initialize Out-Degree Array**: Allocate \`out_degree = [0] * num_nodes\`.
2. **Edge Scanning Pass**: For each directed edge $(u, v) \\in E$, increment \`out_degree[u] += 1\`.
3. **Sink Extraction**: Collect all node indices $i$ where \`out_degree[i] == 0\`.
4. **Return Terminal List**: Return \`terminal_nodes\`.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ linear time across graph vertices $V$ and directed edges $E$.
- **Space Complexity**: $\\mathcal{O}(V)$ auxiliary space for out-degree tracking array.
- **Trade-Off**: Extremely cheap $\\mathcal{O}(V+E)$ scan that automates backward pass initialization across arbitrary graph topologies.`,
  constraints: ["1 <= num_nodes <= 1000", "0 <= edges.length <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Standard Autograd Single-Loss DAG",
      inputDisplay: "numNodes = 6, edges = [[0, 2], [1, 2], [2, 4], [3, 4], [4, 5]]",
      outputDisplay: "[5]",
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
      output: "[5]",
      explanation: "Node 5 has out-degree 0 (terminal loss node).",
    },
    {
      kind: "complex",
      title: "Multi-Task Dual Loss DAG",
      inputDisplay: "numNodes = 7, edges = [[0, 2], [1, 2], [2, 4], [3, 4], [4, 5], [4, 6]]",
      outputDisplay: "[5, 6]",
      input: {
        numNodes: 7,
        edges: [
          [0, 2],
          [1, 2],
          [2, 4],
          [3, 4],
          [4, 5],
          [4, 6],
        ],
      },
      output: "[5, 6]",
      explanation: "Nodes 5 and 6 have out-degree 0 (multi-task loss outputs).",
    },
  ],
  code: DETECTTERMINALNODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Linear time scan over graph vertices and directed edges.",
    space: "Linear memory allocation for node out-degree tracking array.",
  },
  topicGuide: {
    overview:
      "Terminal leaf node detection computes out-degree counts across directed computation graph edges to isolate sink nodes (out-degree 0) for autograd loss gradient seed initialization.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given directed graph G = (V, E), out-degree deg^+(u) = |{v in V : (u, v) in E}|. A vertex u is a terminal sink node iff deg^+(u) = 0.",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "Used in PyTorch backward() trigger validation, FX GraphModule loss extraction, JAX PRNG/loss node identification, and multi-objective optimization frameworks.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Allocate out_degree array of size V.\n2. Iterate through edges (u, v) and increment out_degree[u].\n3. Filter node indices where out_degree[i] == 0.\n4. Return list of terminal sink nodes.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Executes in O(V + E) time and O(V) memory space. Out-degree counting is cache-friendly and parallelizable across CPU thread pools.",
      },
    ],
    keyTerms: [
      {
        term: "Terminal Node",
        definition:
          "A leaf node in a directed graph with no outgoing edges (out-degree 0), typically representing a loss output.",
      },
      {
        term: "Out-Degree",
        definition: "The number of directed edges originating from a specific graph vertex.",
      },
      {
        term: "Sink Node",
        definition: "A vertex in a directed graph with zero outgoing edges.",
      },
      {
        term: "Loss Seed",
        definition:
          "The initial gradient scalar (dL/dL = 1.0) inserted at a terminal sink node to begin reverse-mode autograd.",
      },
    ],
  },
  trivia: DETECTTERMINALNODES_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_DETECTTERMINALNODES_INPUT,
  generateSteps: generateDetectTerminalNodesSteps,
};
