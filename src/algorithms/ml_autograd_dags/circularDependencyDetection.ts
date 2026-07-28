import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface circularDependencyDetectionInput {
  numNodes?: number;
  edges?: [number, number][];
  data?: number[];
  target?: number;
}

export const CIRCULARDEPENDENCYDETECTION_CODE = `def circular_dependency_detection(num_nodes, edges):
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
  numNodes: 5,
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCircularDependencyDetectionSteps = (
  input: circularDependencyDetectionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numNodes = input?.numNodes ?? (input?.data?.length || 5);
  const edges: [number, number][] =
    input?.edges ??
    (input?.data && input.data.length > 1
      ? input.data.slice(0, -1).map((_, i) => [i, i + 1] as [number, number])
      : [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ]);

  const adj: number[][] = Array.from({ length: numNodes }, () => []);
  for (const [u, v] of edges) {
    if (u >= 0 && u < numNodes && v >= 0 && v < numNodes) {
      adj[u].push(v);
    }
  }

  const nodesBase: GraphNodeItem[] = Array.from({ length: numNodes }, (_, i) => {
    const angle = (2 * Math.PI * i) / numNodes - Math.PI / 2;
    const radius = 140;
    const cx = 250;
    const cy = 180;
    return {
      id: String(i),
      label: `Node ${i}`,
      val: i,
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
      state: "default",
    };
  });

  const visited: number[] = new Array(numNodes).fill(0);
  let hasCycle = false;
  const activeStack: number[] = [];
  const traversedEdges = new Set<string>();
  const backEdges = new Set<string>();

  const getSnapshot = (overrideNodeState?: Record<number, ElementState>): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = nodesBase.map((n) => {
      const idx = Number(n.id);
      let state: ElementState = "default";
      if (overrideNodeState && overrideNodeState[idx]) {
        state = overrideNodeState[idx];
      } else if (visited[idx] === 1) {
        state = "active";
      } else if (visited[idx] === 2) {
        state = "visited";
      } else {
        state = "default";
      }
      return { ...n, state };
    });

    const graphEdges: GraphEdgeItem[] = edges.map(([u, v]) => {
      const key = `${u}->${v}`;
      return {
        from: String(u),
        to: String(v),
        isTraversed: traversedEdges.has(key),
        isPath:
          backEdges.has(key) ||
          (activeStack.includes(u) &&
            activeStack.includes(v) &&
            activeStack.indexOf(v) === activeStack.indexOf(u) + 1),
      };
    });

    return {
      kind: "graph",
      nodes,
      edges: graphEdges,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    vars: Record<string, string | number | boolean>,
    overrideNodeState?: Record<number, ElementState>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(overrideNodeState),
      auxiliaryState: {
        customState: {
          "Visited States": `[${visited.map((v) => (v === 0 ? "0 (White)" : v === 1 ? "1 (Gray)" : "2 (Black)")).join(", ")}]`,
          "Recursion Stack": `[${activeStack.join(", ")}]`,
          "Has Cycle": String(hasCycle),
        },
      },
      variables: vars,
    });
  };

  // Line 1: Function signature entry
  addStep(
    1,
    "Initialize 3-Color DFS Cycle Detector for Autograd Graph",
    "Setting up graph data structures and color state tracking (0=White/Unvisited, 1=Gray/Visiting, 2=Black/Visited).",
    { numNodes, totalEdges: edges.length, hasCycle: false },
  );

  // Line 2: adj = [[] for _ in range(num_nodes)]
  addStep(
    2,
    "Allocate Adjacency List `adj`",
    `Allocated empty neighbor lists for all ${numNodes} vertices.`,
    { numNodes },
  );

  // Line 3: for u, v in edges:
  addStep(
    3,
    "Populate Adjacency List from Directed Edges",
    `Iterating through ${edges.length} directed edge(s) to populate outgoing neighbor lists.`,
    { edgesCount: edges.length },
  );

  // Line 6: visited = [0] * num_nodes
  addStep(
    6,
    "Initialize 3-Color Visited Array: `visited = [0] * num_nodes`",
    "Color state array initialized to 0 (White/Unvisited) for all vertices.",
    { visited: `[${visited.join(", ")}]` },
  );

  // Line 7: has_cycle = False
  addStep(
    7,
    "Initialize Cycle Detection Flag `has_cycle = False`",
    "Boolean flag `has_cycle` will be toggled to True if a back-edge to a Gray (1) node is encountered.",
    { hasCycle: false },
  );

  // Line 9: def dfs(u):
  addStep(
    9,
    "Define Recursive Helper Function `dfs(u)`",
    "Helper function performs 3-color depth-first search traversal.",
    {},
  );

  const runDfs = (u: number) => {
    // Line 10: nonlocal has_cycle
    addStep(
      10,
      `DFS(${u}): Bind Outer Scope Flag \`has_cycle\``,
      `Binds nonlocal \`has_cycle\` variable inside \`dfs(${u})\`.`,
      { u, hasCycle },
    );

    // Line 11: visited[u] = 1
    visited[u] = 1;
    activeStack.push(u);
    addStep(
      11,
      `Enter DFS(u=${u}): Set visited[${u}] = 1 (Gray / Visiting)`,
      `Pushing node ${u} onto active DFS recursion stack. Color state set to 1 (Gray).`,
      { u, color: "1 (Gray)", stack: `[${activeStack.join(", ")}]` },
    );

    // Line 12: for v in adj[u]:
    addStep(
      12,
      `DFS(u=${u}): Inspect Outgoing Neighbors in adj[${u}]`,
      `Scanning outgoing directed edges from node ${u}: [${adj[u].join(", ")}].`,
      { u, neighbors: `[${adj[u].join(", ")}]` },
    );

    for (const v of adj[u]) {
      const edgeKey = `${u}->${v}`;
      traversedEdges.add(edgeKey);

      // Line 13: if visited[v] == 1:
      addStep(
        13,
        `Inspect Edge ${u} -> ${v}: Check visited[${v}] == 1 (Gray)`,
        `Checking color of target neighbor ${v}. Current state: ${
          visited[v] === 1
            ? "1 (Gray - Active Stack Ancestor)"
            : visited[v] === 0
              ? "0 (White - Unvisited)"
              : "2 (Black - Visited)"
        }.`,
        {
          u,
          v,
          neighborColor:
            visited[v] === 1 ? "1 (Gray)" : visited[v] === 0 ? "0 (White)" : "2 (Black)",
        },
      );

      if (visited[v] === 1) {
        // Line 14: has_cycle = True
        hasCycle = true;
        backEdges.add(edgeKey);
        addStep(
          14,
          `BACK EDGE DETECTED (${u} -> ${v}): Set has_cycle = True!`,
          `Edge ${u} -> ${v} points back to active ancestor node ${v} on current recursion stack. Circular dependency cycle confirmed!`,
          { u, v, hasCycle: true, backEdge: `${u}->${v}` },
          { [u]: "active", [v]: "compare" },
        );
      } else if (visited[v] === 0) {
        // Line 15: elif visited[v] == 0:
        addStep(
          15,
          `Evaluate Neighbor Node ${v}: visited[${v}] == 0 (White)`,
          `Neighbor ${v} is Unvisited (0/White). Recursing into downstream subtree.`,
          { u, v, color: "0 (White)" },
        );

        // Line 16: dfs(v)
        addStep(
          16,
          `Recurse: Invoke dfs(${v}) from parent node ${u}`,
          `Descending into unvisited node ${v}.`,
          { u, v },
        );
        runDfs(v);
      }
    }

    // Line 17: visited[u] = 2
    visited[u] = 2;
    activeStack.pop();
    addStep(
      17,
      `Exit DFS(u=${u}): Set visited[${u}] = 2 (Black / Visited)`,
      `All outgoing subtrees from node ${u} fully explored without cycles. Popping node ${u} from stack. Color set to 2 (Black).`,
      { u, color: "2 (Black)", stack: `[${activeStack.join(", ")}]` },
    );
  };

  // Line 19: for i in range(num_nodes):
  addStep(
    19,
    "Main Loop: Scan All Vertices for Disconnected Components",
    "Iterating through all node indices 0..num_nodes-1 to validate graph topology.",
    { numNodes },
  );

  for (let i = 0; i < numNodes; i++) {
    // Line 20: if visited[i] == 0:
    addStep(
      20,
      `Main Loop: Inspect Node ${i} State: visited[${i}] == 0`,
      `Checking if seed vertex ${i} is Unvisited (0/White). State: ${
        visited[i] === 0 ? "0 (White)" : visited[i] === 1 ? "1 (Gray)" : "2 (Black)"
      }.`,
      { i, state: visited[i] === 0 ? "0 (White)" : "2 (Black)" },
    );

    if (visited[i] === 0) {
      // Line 21: dfs(i)
      addStep(
        21,
        `Trigger DFS Traversal for Seed Node ${i}`,
        `Invoking dfs(${i}) to explore component starting at node ${i}.`,
        { i },
      );
      runDfs(i);
    }
  }

  // Line 23: return has_cycle
  addStep(
    23,
    `Execution Complete: Return has_cycle = ${hasCycle ? "True" : "False"}`,
    hasCycle
      ? "Circular dependency detected! Autograd computation graph is INVALID (contains cycles)."
      : "No circular dependencies found. Autograd graph is a VALID Directed Acyclic Graph (DAG).",
    { completed: true, hasCycle, isDag: !hasCycle },
  );

  return steps;
};

const CIRCULARDEPENDENCYDETECTION_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 18, 22],
  distractors: [
    "if visited[v] == 2: has_cycle = True",
    "visited[u] = 3",
    "return True if len(visited) == 0 else False",
    "visited.pop()",
  ],
  hints: [
    { line: 6, hint: "Initialize visited array to 0 (Unvisited White) for all nodes." },
    { line: 11, hint: "Mark node u as state 1 (Gray/Visiting) on recursion entry." },
    { line: 13, hint: "If neighbor v is state 1 (Gray), a back-edge cycle is found!" },
    { line: 17, hint: "Mark node u as state 2 (Black/Visited) on recursion exit." },
  ],
  lineExplanations: {
    1: "Defines entry point for circular_dependency_detection graph cycle checker.",
    2: "Constructs empty adjacency lists for each node u in the graph.",
    3: "Iterates through directed edge tuples (u, v) in input edge list.",
    4: "Appends target node v to outgoing adjacency list adj[u].",
    5: "Empty line separating graph adjacency list construction from state array initialization.",
    6: "Allocates 3-color state array initialized to 0 (0=White/Unvisited).",
    7: "Initializes boolean flag has_cycle to False.",
    8: "Empty line separating global state initialization from recursive DFS helper function.",
    9: "Defines recursive depth-first search helper function dfs(u).",
    10: "Binds outer scope boolean variable has_cycle via nonlocal keyword.",
    11: "Marks current node u as state 1 (Gray/Visiting) on DFS stack push.",
    12: "Iterates through outgoing neighbor nodes v in adjacency list adj[u].",
    13: "Checks if neighbor v is currently state 1 (Gray), confirming a back-edge to an active ancestor.",
    14: "Sets has_cycle flag to True upon back-edge detection.",
    15: "Checks if neighbor v is state 0 (White/Unvisited).",
    16: "Recursively invokes dfs(v) to traverse unvisited downstream subtree.",
    17: "Marks current node u as state 2 (Black/Visited) on DFS stack pop.",
    18: "Empty line separating DFS helper function definition from outer component traversal loop.",
    19: "Iterates through all graph node indices in main loop to handle disconnected components.",
    20: "Checks if node i is state 0 (White/Unvisited).",
    21: "Invokes dfs(i) for unvisited seed node i.",
    22: "Empty line before returning cycle detection result.",
    23: "Returns final has_cycle boolean flag indicating whether graph contains circular dependencies.",
  },
};

export const circularDependencyDetection: AlgorithmDefinition<circularDependencyDetectionInput> = {
  id: "circular-dependency-detection",
  title: "Circular Dependency Detection in Graph",
  topicIds: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  description: `### Circular Dependency Detection (3-Color DFS)

In deep learning computation graph engines (**PyTorch autograd**, **JIT Compilers**, **ONNX Runtime**, and **TensorRT**), execution graphs must strictly be **Directed Acyclic Graphs (DAGs)**.

#### Why It Exists & What It Solves
Automatic differentiation algorithms rely on topological sorting to sequence forward tensor operations and reverse gradient backpropagation.

If a circular dependency cycle exists ($A \\to B \\to C \\to A$):
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
2. **Color Array Allocation**: Initialize \`visited[u] = 0\` (White) for all $u \\in V$.
3. **DFS Recursion**:
   - Upon visiting node $u$, set \`visited[u] = 1\` (Gray).
   - For each neighbor $v \\in \\text{adj}[u]$:
     - If \`visited[v] == 1\` (Gray): **Cycle Detected!** Set \`has_cycle = True\`.
     - If \`visited[v] == 0\` (White): Recurse \`dfs(v)\`.
   - Upon completion of all outgoing edges, set \`visited[u] = 2\` (Black).
4. **Outer Component Scan**: Loop over all node indices to ensure disconnected graph components are validated.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(V + E)$ where $V$ is node count and $E$ is edge count.
- **Space Complexity**: $\\mathcal{O}(V)$ for color state array and recursion call stack space.
- **Trade-Off**: Enables early graph compilation failure before allocating expensive GPU memory resources.`,
  constraints: ["1 <= num_nodes <= 1000", "0 <= edges.length <= 5000"],
  examples: [
    {
      kind: "basic",
      title: "Valid DAG (No Cycles)",
      inputDisplay: "num_nodes = 5, edges = [[0,1], [1,2], [2,3], [3,4]]",
      outputDisplay: "has_cycle = False",
      input: {
        numNodes: 5,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      },
      output: "false",
      explanation: "Standard computation graph DAG with sequential dependencies and no cycles.",
    },
    {
      kind: "complex",
      title: "Graph with Circular Dependency",
      inputDisplay: "num_nodes = 4, edges = [[0,1], [1,2], [2,3], [3,1]]",
      outputDisplay: "has_cycle = True",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 1],
        ],
      },
      output: "true",
      explanation:
        "Contains a circular dependency loop (1 -> 2 -> 3 -> 1), causing 3-color DFS to detect a back-edge to Gray node 1.",
    },
    {
      kind: "negative",
      title: "Disconnected Graph Component DAG",
      inputDisplay: "num_nodes = 4, edges = [[0,1], [2,3]]",
      outputDisplay: "has_cycle = False",
      input: {
        numNodes: 4,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      output: "false",
      explanation: "Disconnected DAG components evaluated cleanly without circular dependencies.",
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
