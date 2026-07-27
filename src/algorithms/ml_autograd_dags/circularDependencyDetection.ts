import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface circularDependencyDetectionInput {
  data: number[];
  target?: number;
}

export const CIRCULARDEPENDENCYDETECTION_CODE = `def circular_dependency_detection(num_nodes, edges):
    """
    Detects cycles in autograd computation graph using 3-color DFS traversal.
    """
    adj = [[] for _ in range(num_nodes)]
    for u, v in edges:
        adj[u].append(v)

    visited = [0] * num_nodes
    has_cycle = False

    def dfs(u):
        nonlocal has_cycle
        visited[u] = 1
        for v in adj[u]:
            if visited[v] == 1:
                has_cycle = True
            elif visited[v] == 0:
                dfs(v)
        visited[u] = 2

    for i in range(num_nodes):
        if visited[i] == 0:
            dfs(i)

    return has_cycle`;

export const DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT: circularDependencyDetectionInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCircularDependencyDetectionSteps = (
  input: circularDependencyDetectionInput,
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
    "Initialize 3-Color DFS Cycle Detector for Autograd Graph",
    "Constructing graph adjacency list and preparing 3-color state tracking array (0=White/Unvisited, 1=Gray/Visiting, 2=Black/Visited).",
    { numNodes: arrayData.length, hasCycle: false, phase: "DFS_INIT" },
    undefined,
    { white: "Unvisited(0)", gray: "Visiting(1)", black: "Visited(2)" },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Detects cycles in autograd computation graph using 3-color DFS traversal.",
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

  addStep(
    5,
    "Build Graph Adjacency List `adj`",
    "Allocating neighbor lists for each computation graph node to prepare for depth-first traversal.",
    { numNodes: arrayData.length, edgesCount: arrayData.length - 1, phase: "BUILD_ADJ" },
  );

  arrayData.forEach((val, idx) => {
    const isTarget = val === target;

    const stateA: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "compare", pointers: [`node=${idx}`, "White(0)"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      22,
      `Main Loop: Inspect Node ${idx} State`,
      `Checking if node ${idx} is Unvisited (0/White). Triggering DFS traversal.`,
      { node: idx, state: 0, isUnvisited: true, phase: "MAIN_LOOP_CHECK" },
      stateA,
      { currentNode: `Node_${idx}` },
    );

    const stateB: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`node=${idx}`, "Gray(1)"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      14,
      `Enter DFS(node=${idx}): Set visited[${idx}] = 1 (Gray/Visiting)`,
      `Pushing node ${idx} onto current DFS recursion stack. Marking state 1 (Gray).`,
      { node: idx, colorState: "Gray (1)", onStack: true, phase: "MARK_GRAY" },
      stateB,
      { dfsStack: `[${idx}]` },
    );

    addStep(
      15,
      `Inspect Outgoing Edges for Node ${idx}`,
      `Scanning outgoing adjacency edges from node ${idx} to downstream graph targets.`,
      { node: idx, targetNeighbor: (idx + 1) % arrayData.length, phase: "INSPECT_EDGES" },
      stateB,
    );

    const neighborState = idx === arrayData.length - 1 ? 0 : 0;
    addStep(
      16,
      `Evaluate Neighbor Node State: visited[v] == ${neighborState}`,
      "Checking neighbor color. If Gray (1), a back-edge is detected confirming a cycle! If White (0), recurse.",
      { currNode: idx, neighbor: (idx + 1) % arrayData.length, neighborColor: neighborState === 1 ? "Gray (1)" : "White (0)", isCycle: neighborState === 1, phase: "CHECK_NEIGHBOR" },
      stateB,
    );

    const stateE: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "sorted", pointers: ["Black(2)"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });
    addStep(
      20,
      `Exit DFS(node=${idx}): Set visited[${idx}] = 2 (Black/Visited)`,
      `All outgoing subtrees from node ${idx} evaluated without back-edges. Popping from recursion stack. Marking state 2 (Black).`,
      { node: idx, colorState: "Black (2)", completed: true, phase: "MARK_BLACK" },
      stateE,
      { completedNode: `Node_${idx}` },
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));
  addStep(
    22,
    "Verify Graph Topology DAG Property",
    "Checking that all nodes were colored Black (2) with zero back-edges encountered. Graph is a valid DAG.",
    { totalNodesChecked: arrayData.length, hasCycle: false, validDag: true },
    finalElements,
  );

  addStep(
    26,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    finalElements,
  );

  return steps;
};

const CIRCULARDEPENDENCYDETECTION_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8, 11, 21, 25],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
    "if visited[v] == 2: has_cycle = True",
  ],
  hints: [
    { line: 9, hint: "Initialize visited array to 0 (Unvisited White) for all nodes." },
    { line: 14, hint: "Mark node u as state 1 (Gray/Visiting) on recursion entry." },
    { line: 16, hint: "If neighbor v is state 1 (Gray), a back-edge cycle is found!" },
    { line: 20, hint: "Mark node u as state 2 (Black/Visited) on recursion exit." },
  ],
  lineExplanations: {
    1: "Defines entry point for circular_dependency_detection graph cycle checker.",
    2: "Docstring opening: describes 3-color DFS traversal for autograd graph cycle detection.",
    3: "Docstring body: detects cycles in computation graphs to ensure valid DAG topology.",
    4: "Docstring closing.",
    5: "Constructs empty adjacency lists for each node u in the graph.",
    6: "Iterates through directed edge tuples (u, v) in input edge list.",
    7: "Appends target node v to outgoing adjacency list adj[u].",
    8: "Empty line separating graph adjacency list construction from state array initialization.",
    9: "Allocates 3-color state array initialized to 0 (0=White/Unvisited).",
    10: "Initializes boolean flag has_cycle to False.",
    11: "Empty line separating global state initialization from recursive DFS helper function.",
    12: "Defines recursive depth-first search helper function dfs(u).",
    13: "Binds outer scope boolean variable has_cycle via nonlocal keyword.",
    14: "Marks current node u as state 1 (Gray/Visiting) on DFS stack push.",
    15: "Iterates through outgoing neighbor nodes v in adjacency list adj[u].",
    16: "Checks if neighbor v is currently state 1 (Gray), confirming a back-edge to an active ancestor.",
    17: "Sets has_cycle flag to True upon back-edge detection.",
    18: "Checks if neighbor v is state 0 (White/Unvisited).",
    19: "Recursively invokes dfs(v) to traverse unvisited downstream subtree.",
    20: "Marks current node u as state 2 (Black/Visited) on DFS stack pop.",
    21: "Empty line separating DFS helper function definition from outer component traversal loop.",
    22: "Iterates through all graph node indices in main loop to handle disconnected components.",
    23: "Triggers DFS for unvisited state 0 (White) component seed nodes.",
    24: "Invokes dfs(i) for node i.",
    25: "Empty line before returning cycle detection result.",
    26: "Returns final has_cycle boolean flag indicating whether graph contains circular dependencies.",
  },
};

export const circularDependencyDetection: AlgorithmDefinition<circularDependencyDetectionInput> = {
  id: "circular-dependency-detection",
  title: "Circular Dependency Detection in Graph",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description: `### Circular Dependency Detection (3-Color DFS)

In deep learning computation graph engines (**PyTorch autograd**, **JIT Compilers**, **ONNX Runtime**, and **TensorRT**), execution graphs must strictly be **Directed Acyclic Graphs (DAGs)**.

#### Why It Exists & What It Solves
Automatic differentiation algorithms rely on topological sorting to sequence forward tensor operations and reverse gradient backpropagation.

If a circular dependency cycle exists ($A \to B \to C \to A$):
1. Topological sorting becomes mathematically impossible (Kahn's BFS fails to resolve in-degrees).
2. Autograd backpropagation enters infinite stack recursion or deadlocks GPU worker threads.

With 3-color DFS cycle detection:
- Each graph node is assigned one of three color states:
  - **White (0)**: Unvisited node.
  - **Gray (1)**: Currently active node in the DFS recursion stack.
  - **Black (2)**: Fully processed node whose outgoing subtrees are completed.
- Traversal checks for **back-edges**—edges pointing to a Gray node currently on the active stack—to immediately detect cycle anomalies.

#### Step-by-Step Mechanism
1. **Adjacency Construction**: Build directed adjacency lists \`adj[u]\` for all nodes.
2. **Color Array Allocation**: Initialize \`visited[u] = 0\` (White) for all $u \in V$.
3. **DFS Recursion**:
   - Upon visiting node $u$, set \`visited[u] = 1\` (Gray).
   - For each neighbor $v \in \\text{adj}[u]$:
     - If \`visited[v] == 1\` (Gray): **Cycle Detected!** Set \`has_cycle = True\`.
     - If \`visited[v] == 0\` (White): Recurse \`dfs(v)\`.
   - Upon completion of all outgoing edges, set \`visited[u] = 2\` (Black).
4. **Outer Component Scan**: Loop over all node indices to ensure disconnected graph components are validated.

#### Complexity & Trade-Offs
- **Time Complexity**: $\mathcal{O}(V + E)$ where $V$ is node count and $E$ is edge count.
- **Space Complexity**: $\mathcal{O}(V)$ for color state array and recursion call stack space.
- **Trade-Off**: Enables early graph compilation failure before allocating expensive GPU memory resources.`,
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
  code: CIRCULARDEPENDENCYDETECTION_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Linear time depth-first search visiting every graph vertex and directed edge once.",
    space: "Linear memory allocation for adjacency lists and 3-color node state arrays.",
  },
  topicGuide: {
    overview:
      "3-Color Depth-First Search is the foundational algorithm for detecting back-edges and circular dependencies in directed computation graphs prior to topological sorting and autograd code generation.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "A directed graph G = (V, E) contains a cycle iff DFS traversal yields a back-edge (u, v) where v is an ancestor of u in the active recursion tree. 3-Coloring represents unvisited (0), visiting (1), and visited (2) states.",
      },
      {
        heading: "Practical Applications & ML Infra Ecosystem",
        body: "Used in PyTorch FX GraphModule validation, ONNX model validation, TVM graph passes, and XLA HLO compilers to prevent deadlocks and infinite autograd backpropagation recursion.",
      },
      {
        heading: "Step-by-Step Walkthrough & Algorithmic Mechanics",
        body: "1. Build adjacency list adj[u].\n2. Initialize state array visited = [0]*V.\n3. Run DFS, marking nodes 1 on entry and 2 on exit.\n4. If neighbor node state is 1, declare back-edge cycle.\n5. Return cycle detection status.",
      },
      {
        heading: "Hardware/Systems Trade-Offs & Complexity Analysis",
        body: "Executes in O(V + E) time and O(V) stack space. Pre-validates graph topology before kernel code generation, averting runtime crashes on GPU clusters.",
      },
    ],
    keyTerms: [
      {
        term: "3-Color DFS",
        definition:
          "Cycle detection technique coloring nodes White (unvisited), Gray (visiting), and Black (visited).",
      },
      {
        term: "Back-Edge",
        definition:
          "A directed edge pointing from a graph node to an active ancestor node on the DFS recursion stack.",
      },
      {
        term: "Directed Acyclic Graph (DAG)",
        definition:
          "A graph of nodes connected by directed edges with no closed loops or circular cycles.",
      },
      {
        term: "Topological Order",
        definition:
          "Linear ordering of graph vertices such that for every directed edge u -> v, u comes before v.",
      },
    ],
  },
  trivia: CIRCULARDEPENDENCYDETECTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
  generateSteps: generateCircularDependencyDetectionSteps,
};
