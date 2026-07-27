import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface detectTerminalNodesInput {
  data: number[];
  target?: number;
}

export const DETECTTERMINALNODES_CODE = `def detect_terminal_nodes(num_nodes, edges):
    """
    Finds leaf sink nodes with out-degree 0 in autograd computation graph.
    """
    out_degree = [0] * num_nodes
    for u, v in edges:
        out_degree[u] += 1

    terminal_nodes = [i for i in range(num_nodes) if out_degree[i] == 0]
    return terminal_nodes`;

export const DEFAULT_DETECTTERMINALNODES_INPUT: detectTerminalNodesInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDetectTerminalNodesSteps = (
  input: detectTerminalNodesInput,
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

  // Step 1: Init Terminal Node Finder
  addStep(
    1,
    "Initialize Terminal Sink Node Detector for DAG",
    "Setting up out-degree counter array `out_degree = [0] * num_nodes` to identify autograd loss output nodes.",
    { numNodes: arrayData.length, target, phase: "INIT_TERMINAL_FINDER" },
    undefined,
    { out_degree_status: "INITIALIZING", terminal_nodes: "[]" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Finds leaf sink nodes with out-degree 0 in autograd computation graph.",
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

  // Step 2: Init Out-Degree Array
  addStep(
    5,
    "Allocate Out-Degree Counter Array [0, 0, ...]",
    "Initializing out-degree counts to zero for all computation graph vertices.",
    { numNodes: arrayData.length, phase: "ALLOC_OUT_DEGREE" },
  );

  // Step 3: Scan Edge List Structure
  addStep(
    6,
    "Inspect Graph Edge Topology List",
    "Preparing directed edge traversal pass to compute out-degrees for each vertex.",
    { totalEdgesCount: arrayData.length - 1, phase: "PREPARE_EDGE_SCAN" },
  );

  // Edge processing pass: Count out-degrees for each node
  const outDegreeMap: number[] = new Array(arrayData.length).fill(0);
  arrayData.forEach((val, idx) => {
    const hasOutgoingEdge = idx < arrayData.length - 2;
    if (hasOutgoingEdge) {
      outDegreeMap[idx] += 1;
    }

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`outdeg=${outDegreeMap[idx]}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      6,
      `Process Outgoing Edges for Node ${idx}`,
      `Scanning graph edges from source vertex Node_${idx}. Outdegree = ${outDegreeMap[idx]}.`,
      { idx, outDegree: outDegreeMap[idx], hasOutgoing: hasOutgoingEdge, phase: "SCAN_EDGES" },
      stateA,
      { [`Node_${idx}_outdeg`]: String(outDegreeMap[idx]) },
    );

    addStep(
      7,
      `Update Out-Degree Count: out_degree[${idx}] -> ${outDegreeMap[idx]}`,
      `Incrementing out_degree[${idx}] for each directed downstream edge in DAG.`,
      { idx, finalOutDegree: outDegreeMap[idx], phase: "UPDATE_OUTDEG" },
      stateA,
    );
  });

  // Terminal node extraction pass: Find nodes with out-degree 0
  const terminalList: number[] = [];
  arrayData.forEach((val, idx) => {
    const isTerminal = outDegreeMap[idx] === 0;
    if (isTerminal) terminalList.push(idx);
    const isTarget = val === target;

    const stateExtract: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTerminal ? "active" : "sorted", pointers: [isTerminal ? "SINK_NODE" : "INTERNAL"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      9,
      `Inspect Node ${idx} Out-Degree: out_degree[${idx}] == ${outDegreeMap[idx]}`,
      `Checking terminal condition (out_degree == 0). Node_${idx} is ${isTerminal ? "a TERMINAL SINK (Loss Output)" : "an internal intermediate node"}.`,
      { idx, outDegree: outDegreeMap[idx], isTerminal, totalTerminalFound: terminalList.length, phase: "CHECK_TERMINAL" },
      stateExtract,
      { terminalList: `[${terminalList.join(", ")}]` },
    );
  });

  // Step final-1: Final Graph Verification
  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    9,
    "Verify All Graph Terminal Sink Nodes Extracted",
    `Identified ${terminalList.length} terminal loss sink nodes: [${terminalList.join(", ")}]. Ready for autograd loss gradient seed initialization.`,
    { totalTerminalNodes: terminalList.length, terminalList: terminalList.join(",") },
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

const DETECTTERMINALNODES_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "terminal_nodes = [i for i in range(num_nodes) if in_degree[i] == 0]",
  ],
  hints: [
    { line: 5, hint: "Initialize out_degree array with zeros for all nodes." },
    { line: 7, hint: "Increment out_degree[u] for each directed edge u -> v." },
    { line: 9, hint: "Extract node indices i where out_degree[i] == 0 (sink leaf nodes)." },
  ],
  lineExplanations: {
    1: "Defines entry point for detect_terminal_nodes graph sink detector.",
    2: "Docstring opening: describes finding terminal leaf sink nodes.",
    3: "Docstring body: identifies out-degree 0 sink nodes in autograd computation graph.",
    4: "Docstring closing.",
    5: "Allocates out_degree array initialized to 0 for num_nodes graph nodes.",
    6: "Iterates through directed edge tuples (u, v) in graph.",
    7: "Increments out-degree count out_degree[u] for source node u.",
    8: "Empty line separating edge iteration from terminal node list comprehension extraction.",
    9: "List comprehension extracting node indices i whose out-degree is 0 (terminal leaf sink nodes).",
    10: "Returns list of detected terminal sink node IDs.",
  },
};

export const detectTerminalNodes: AlgorithmDefinition<detectTerminalNodesInput> = {
  id: "detect-terminal-nodes",
  title: "Detect Terminal Leaf Nodes in DAG",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Detect Terminal Leaf Nodes in DAG

In deep learning autograd engines (**PyTorch**, **JAX**, **TensorFlow**, and **Graph Compilers**), **terminal leaf nodes** (sink nodes with **out-degree = 0**) represent final model output tensors, loss nodes, or target metrics.

#### Why It Exists & What It Solves
Reverse-mode automatic differentiation computes backward gradients starting from loss nodes $L$ down to model weights $W$.

Without terminal node detection:
1. The autograd engine cannot automatically identify which graph nodes require loss gradient seeding ($dL/dL = 1.0$).
2. Multi-task loss topologies (where multiple loss heads exist) fail to discover all backward starting entry points.

With out-degree terminal detection:
- The graph engine scans directed edges and tracks the out-degree count $\\text{out\_degree}[u]$ of every node $u$.
- Vertices with $\\text{out\_degree}[u] == 0$ are classified as **terminal sink nodes**.
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
  code: DETECTTERMINALNODES_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
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
        definition:
          "The number of directed edges originating from a specific graph vertex.",
      },
      {
        term: "Sink Node",
        definition:
          "A vertex in a directed graph with zero outgoing edges.",
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
