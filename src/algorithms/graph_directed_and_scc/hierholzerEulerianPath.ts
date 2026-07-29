import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface HierholzerEulerianPathInput {
  startNodeId?: string;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const HIERHOLZER_CODE = `def hierholzer(nodes, edges):
    adj = {node: [] for node in nodes}
    in_deg = {node: 0 for node in nodes}
    out_deg = {node: 0 for node in nodes}
    
    for u, v in edges:
        adj[u].append(v)
        out_deg[u] += 1
        in_deg[v] += 1
        
    start_node = nodes[0]
    for u in nodes:
        if out_deg[u] - in_deg[u] == 1:
            start_node = u
            break
            
    stack = [start_node]
    circuit = []
    
    while stack:
        u = stack[-1]
        if adj[u]:
            v = adj[u].pop()
            stack.append(v)
        else:
            circuit.append(stack.pop())
            
    circuit.reverse()
    return circuit`;

export const DEFAULT_HIERHOLZER_INPUT: HierholzerEulerianPathInput = {
  nodes: [
    { id: "0", label: "0", x: 150, y: 100, state: "default" },
    { id: "1", label: "1", x: 350, y: 100, state: "default" },
    { id: "2", label: "2", x: 450, y: 250, state: "default" },
    { id: "3", label: "3", x: 250, y: 300, state: "default" },
    { id: "4", label: "4", x: 100, y: 250, state: "default" },
  ],
  edges: [
    { from: "0", to: "1" },
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "4" },
    { from: "4", to: "0" },
    { from: "1", to: "3" },
    { from: "3", to: "1" },
    { from: "0", to: "2" },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "An Eulerian Path in a directed graph is a continuous trail that visits every directed edge in the graph exactly once.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0", state: "active" },
        { id: "1", label: "1", state: "default" },
        { id: "2", label: "2", state: "default" },
        { id: "3", label: "3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "3", to: "0" },
      ],
    },
  },
  {
    narrative:
      "An Eulerian Circuit is a closed Eulerian path that begins and ends at the exact same vertex.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Start/End 0", state: "visited" },
        { id: "1", label: "1", state: "visited" },
        { id: "2", label: "2", state: "visited" },
        { id: "3", label: "3", state: "visited" },
      ],
      edges: [
        { from: "0", to: "1", isPath: true },
        { from: "1", to: "2", isPath: true },
        { from: "2", to: "3", isPath: true },
        { from: "3", to: "0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Degree conditions state that an Eulerian path requires at most one vertex with out_degree - in_degree = 1 (start) and one with in_degree - out_degree = 1 (end).",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Start 0 (out-in=1)", state: "active" },
        { id: "1", label: "Node 1", state: "default" },
        { id: "2", label: "Node 2", state: "default" },
        { id: "3", label: "End 3 (in-out=1)", state: "compare" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
        { from: "0", to: "2" },
        { from: "2", to: "1" },
      ],
    },
  },
  {
    narrative:
      "Hierholzer's algorithm begins by identifying the valid start node with out_degree - in_degree == 1 (or any vertex with out_degree > 0 for circuits).",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Start Node 0", state: "active" },
        { id: "1", label: "Node 1", state: "default" },
        { id: "2", label: "Node 2", state: "default" },
        { id: "3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1" },
        { from: "1", to: "2" },
        { from: "2", to: "3" },
      ],
    },
  },
  {
    narrative:
      "A LIFO traversal stack tracks the active path, pushing the start node first to guide deep exploration along directed edges.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Stack 0", state: "visited" },
        { id: "1", label: "Stack 1", state: "visited" },
        { id: "2", label: "Top 2", state: "active" },
        { id: "3", label: "Node 3", state: "default" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3" },
      ],
    },
  },
  {
    narrative:
      "As edges are traversed, they are removed from the remaining edge set and the target vertex is pushed onto the stack.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Stack 0", state: "visited" },
        { id: "1", label: "Stack 1", state: "visited" },
        { id: "2", label: "Stack 2", state: "visited" },
        { id: "3", label: "Top 3", state: "active" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "When the top vertex on the stack has zero remaining outgoing edges, it represents a dead end in the current sub-circuit.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Stack 0", state: "visited" },
        { id: "1", label: "Stack 1", state: "visited" },
        { id: "2", label: "Stack 2", state: "visited" },
        { id: "3", label: "Dead End 3", state: "swap" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Dead-end vertices are popped from the stack and appended to a post-order circuit list, guaranteeing sub-cycles are properly closed.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "Stack 0", state: "visited" },
        { id: "1", label: "Stack 1", state: "visited" },
        { id: "2", label: "Top 2", state: "active" },
        { id: "3", label: "Circuit 3", state: "sorted" },
      ],
      edges: [
        { from: "0", to: "1", isTraversed: true },
        { from: "1", to: "2", isTraversed: true },
        { from: "2", to: "3", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Reversing the post-order circuit list splices all sub-circuits together, yielding the valid forward Eulerian Path in O(V + E) time.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "0", label: "0 (Step 1)", state: "sorted" },
        { id: "1", label: "1 (Step 2)", state: "sorted" },
        { id: "2", label: "2 (Step 3)", state: "sorted" },
        { id: "3", label: "3 (Step 4)", state: "sorted" },
      ],
      edges: [
        { from: "0", to: "1", isPath: true },
        { from: "1", to: "2", isPath: true },
        { from: "2", to: "3", isPath: true },
      ],
    },
  },
];

export function generateHierholzerSteps(input: HierholzerEulerianPathInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Intro Phase (9 snapshots)
  const intro = createIntroSnapshots();
  for (const item of intro) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: item.narrative,
        primarySnapshot: item.primarySnapshot,
      }),
    );
  }

  // Walkthrough Phase
  const safeInput = input && typeof input === "object" ? input : DEFAULT_HIERHOLZER_INPUT;
  const inputNodes =
    Array.isArray(safeInput.nodes) && safeInput.nodes.length > 0
      ? safeInput.nodes
      : DEFAULT_HIERHOLZER_INPUT.nodes;
  const inputEdges = Array.isArray(safeInput.edges)
    ? safeInput.edges
    : DEFAULT_HIERHOLZER_INPUT.edges;

  const nodes = inputNodes.map((n) => ({ ...n }));
  const edges = inputEdges.map((e) => ({ ...e }));

  const adj: Record<string, string[]> = {};
  const inDeg: Record<string, number> = {};
  const outDeg: Record<string, number> = {};

  for (const n of nodes) {
    adj[n.id] = [];
    inDeg[n.id] = 0;
    outDeg[n.id] = 0;
  }

  for (const e of edges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to]) adj[e.to] = [];
    if (inDeg[e.from] === undefined) inDeg[e.from] = 0;
    if (outDeg[e.from] === undefined) outDeg[e.from] = 0;
    if (inDeg[e.to] === undefined) inDeg[e.to] = 0;
    if (outDeg[e.to] === undefined) outDeg[e.to] = 0;

    adj[e.from].push(e.to);
    outDeg[e.from]++;
    inDeg[e.to]++;
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Hierholzer's Algorithm on graph with ${nodes.length} vertices and ${edges.length} directed edges.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "active" })),
        edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
      },
      auxiliaryState: {
        stack: [],
        visited: [],
      },
      variables: { totalNodes: nodes.length, totalEdges: edges.length },
    }),
  );

  let startNode = input?.startNodeId || (nodes.length > 0 ? nodes[0].id : "0");
  for (const n of nodes) {
    if ((outDeg[n.id] || 0) - (inDeg[n.id] || 0) === 1) {
      startNode = n.id;
      break;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Selected start node '${startNode}' based on out_deg - in_deg == 1 (or default start for circuit).`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === startNode ? "compare" : "default",
        })),
        edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
      },
      auxiliaryState: {
        stack: [startNode],
        visited: [],
      },
      variables: { startNode },
    }),
  );

  const stack: string[] = [startNode];
  const circuit: string[] = [];
  const edgeUsed: Record<string, boolean> = {};

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Pushed start node '${startNode}' onto LIFO traversal stack. Initialized empty post-order circuit array.`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === startNode ? "swap" : "default",
        })),
        edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
      },
      auxiliaryState: {
        stack: [...stack],
        visited: [],
      },
      variables: { startNode, stackLength: stack.length },
    }),
  );

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Inspecting top of stack vertex '${curr}': checking for remaining unvisited outgoing edges (${adj[curr]?.length ?? 0} remaining).`,
        primarySnapshot: {
          kind: "graph",
          directed: true,
          nodes: nodes.map((n) => ({
            ...n,
            state:
              n.id === curr
                ? "active"
                : stack.includes(n.id)
                  ? "visited"
                  : circuit.includes(n.id)
                    ? "sorted"
                    : "default",
          })),
          edges: edges.map((e, idx) => ({
            ...e,
            isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
            isPath: false,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          visited: [...circuit],
        },
        variables: { curr, remainingEdges: adj[curr]?.length ?? 0 },
      }),
    );

    if (adj[curr] && adj[curr].length > 0) {
      const nxt = adj[curr].pop()!;

      let edgeObjIndex = -1;
      for (let idx = 0; idx < edges.length; idx++) {
        const e = edges[idx];
        if (e.from === curr && e.to === nxt && !edgeUsed[`${e.from}->${e.to}-${idx}`]) {
          edgeObjIndex = idx;
          break;
        }
      }
      if (edgeObjIndex !== -1) {
        edgeUsed[`${edges[edgeObjIndex].from}->${edges[edgeObjIndex].to}-${edgeObjIndex}`] = true;
      }

      stack.push(nxt);

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Traversed directed edge '${curr}' -> '${nxt}' and pushed neighbor '${nxt}' onto stack.`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              state:
                n.id === nxt
                  ? "swap"
                  : stack.includes(n.id)
                    ? "visited"
                    : circuit.includes(n.id)
                      ? "sorted"
                      : "default",
            })),
            edges: edges.map((e, idx) => ({
              ...e,
              isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
              isPath: idx === edgeObjIndex,
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: [...circuit],
          },
          variables: { current: curr, next: nxt, stackSize: stack.length },
        }),
      );
    } else {
      const popped = stack.pop()!;
      circuit.push(popped);

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Vertex '${popped}' has no remaining outgoing edges. Popped '${popped}' to post-order circuit: [${circuit.join(", ")}].`,
          primarySnapshot: {
            kind: "graph",
            directed: true,
            nodes: nodes.map((n) => ({
              ...n,
              state: circuit.includes(n.id)
                ? "sorted"
                : stack.includes(n.id)
                  ? "visited"
                  : "default",
            })),
            edges: edges.map((e, idx) => ({
              ...e,
              isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
              isPath: false,
            })),
          },
          auxiliaryState: {
            stack: [...stack],
            visited: [...circuit],
          },
          variables: { popped, circuitLength: circuit.length },
        }),
      );
    }
  }

  const resultPath = [...circuit].reverse();

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Hierholzer's algorithm complete. Reversed post-order circuit to construct final Eulerian Path: [${resultPath.join(" -> ")}].`,
      primarySnapshot: {
        kind: "graph",
        directed: true,
        nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
        edges: edges.map((e) => ({ ...e, isPath: true, isTraversed: true })),
      },
      auxiliaryState: {
        stack: [],
        visited: [...resultPath],
      },
      variables: { completed: true, result: resultPath.join(" -> ") },
    }),
  );

  return steps;
}

export const HIERHOLZER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines hierholzer function to find an Eulerian path or circuit in a directed graph.",
    2: "Initializes adjacency list mapping each node to its outgoing edges.",
    3: "Initializes in-degree table tracking incoming edge counts.",
    4: "Initializes out-degree table tracking outgoing edge counts.",
    6: "Iterates over input directed edges.",
    7: "Appends neighbor v to adjacency list of u.",
    8: "Increments out-degree of u.",
    9: "Increments in-degree of v.",
    11: "Sets default start node.",
    12: "Iterates over nodes to find Eulerian start node.",
    13: "Checks if out_degree - in_degree == 1.",
    14: "Assigns start node.",
    17: "Pushes start node onto stack.",
    18: "Initializes circuit array.",
    20: "Drives main loop while stack is non-empty.",
    21: "Peeks top of stack.",
    22: "Checks if top node has remaining outgoing edges.",
    23: "Pops edge and pushes target to stack.",
    26: "Pops dead-end node and appends to circuit.",
    28: "Reverses post-order circuit.",
    29: "Returns Eulerian path.",
  },
};

export const hierholzerEulerianPath: AlgorithmDefinition<HierholzerEulerianPathInput> = {
  id: "hierholzer-eulerian-path",
  title: "Hierholzer's Eulerian Path Algorithm",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>Given a directed graph <code>G = (V, E)</code>, find an Eulerian Path or Eulerian Circuit—a continuous trail that visits every directed edge in the graph exactly once.</p><h3>Problem Statement</h3><p>Compute an Eulerian path sequence using Hierholzer's post-order DFS stack algorithm. If an Eulerian path exists, return the ordered sequence of vertices visited.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of graph vertices.</li><li><code>edges</code>: List of directed edges.</li><li><code>startNodeId</code>: Optional designated starting vertex ID.</li></ul><h3>Output</h3><p>Returns an array of vertex IDs in the exact order traversed by the Eulerian Path.</p>",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 3 * 10^4",
    "Graph must be strongly connected (or connected components with positive degrees must be connected)",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "5 nodes, 8 directed edges with Eulerian path",
      outputDisplay: "[0, 1, 2, 3, 4, 0, 2, 3, 1]",
      title: "Standard 5-Node Eulerian Path Graph",
      input: DEFAULT_HIERHOLZER_INPUT,
      output: "[0, 1, 2, 3, 4, 0, 2, 3, 1]",
      explanation: "Visits all 8 directed edges exactly once.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "4 nodes in closed Eulerian circuit",
      outputDisplay: "[0, 1, 2, 3, 0]",
      title: "Adversarial Closed Eulerian Circuit",
      input: {
        nodes: [
          { id: "0", label: "0", state: "default" },
          { id: "1", label: "1", state: "default" },
          { id: "2", label: "2", state: "default" },
          { id: "3", label: "3", state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "2" },
          { from: "2", to: "3" },
          { from: "3", to: "0" },
        ],
      },
      output: "[0, 1, 2, 3, 0]",
      explanation:
        "Closed 4-node loop forms a complete Eulerian circuit starting and ending at node 0.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "2 nodes, 1 directed edge",
      outputDisplay: "[0, 1]",
      title: "Boundary Single Edge Path",
      input: {
        nodes: [
          { id: "0", label: "0", state: "default" },
          { id: "1", label: "1", state: "default" },
        ],
        edges: [{ from: "0", to: "1" }],
      },
      output: "[0, 1]",
      explanation: "Single edge path traversing from node 0 to node 1.",
    },
  ],
  code: HIERHOLZER_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each edge is traversed and removed from the adjacency list exactly once, and each vertex is pushed/popped from the stack once. Total time is linear O(V + E).",
    space: "O(V + E) auxiliary space for adjacency list, stack, and circuit array.",
  },
  topicGuide: {
    overview:
      "<p>Hierholzer's algorithm constructs an <strong>Eulerian Path</strong> or <strong>Eulerian Circuit</strong>—a path visiting every directed edge in a graph <code>G = (V, E)</code> exactly once—in linear <code>O(V + E)</code> time. It works by maintaining an explicit LIFO stack, building sub-circuits when reaching dead ends, and splicing them into a single continuous trail.</p>",
    sections: [
      {
        heading: "Why It Exists & What It Solves",
        body: "<p>The Seven Bridges of Königsberg problem laid the foundation for graph theory. Modern applications include <strong>genome assembly</strong> (De Bruijn graph traversal), street-sweeping/snowplow routing (Chinese Postman Problem variant), and circuit board trace printing, where every path edge must be traversed without duplication.</p>",
      },
      {
        heading: "Degree Conditions for Eulerian Paths in Directed Graphs",
        body: "<ol><li><strong>Eulerian Circuit:</strong> Every vertex has <code>in_degree == out_degree</code>, and all non-isolated vertices belong to a single strongly connected component.</li><li><strong>Eulerian Path:</strong> Exactly one vertex has <code>out_degree - in_degree == 1</code> (start vertex), exactly one has <code>in_degree - out_degree == 1</code> (end vertex), and all other vertices have <code>in_degree == out_degree</code>.</li></ol>",
      },
      {
        heading: "Step-by-Step Intuition: Sub-Circuit Splicing",
        body: "<ol><li><strong>Identify Start:</strong> Find valid start vertex (where <code>out_degree - in_degree == 1</code>, or any node with <code>out_degree &gt; 0</code>).</li><li><strong>Initialize Stack:</strong> Push start vertex onto LIFO stack.</li><li><strong>Traverse &amp; Backtrack:</strong> While stack is non-empty:<br/>a. Peek top vertex <code>u</code>.<br/>b. If <code>u</code> has unvisited outgoing edges, remove edge <code>(u, v)</code> and push <code>v</code> onto stack.<br/>c. If <code>u</code> has no remaining outgoing edges, pop <code>u</code> and append to circuit.</li><li><strong>Reverse:</strong> Reverse circuit to obtain forward Eulerian path sequence.</li></ol>",
      },
      {
        heading: "Trade-offs & Implementation Notes",
        body: "<p>Fleury's algorithm also finds Eulerian paths but requires checking for bridge edges before each step, resulting in <code>O(E<sup>2</sup>)</code> time. Hierholzer's post-order stack approach avoids bridge checks entirely, operating in optimal <code>O(V + E)</code> linear time.</p>",
      },
      {
        heading: "Complexity Analysis",
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>Every directed edge is pushed and popped from adjacency lists once, taking linear <code>O(V + E)</code> time. Memory for adjacency lists, LIFO stack, and output circuit array takes <code>O(V + E)</code> space.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Eulerian Path",
        definition: "A trail in a finite graph that visits every edge e in E exactly once.",
      },
      {
        term: "Eulerian Circuit",
        definition: "An Eulerian path that starts and ends at the exact same vertex.",
      },
      {
        term: "In-Degree / Out-Degree Balance",
        definition:
          "The equality condition in_degree == out_degree required for Eulerian circuit existence.",
      },
      {
        term: "Post-Order Circuit Splicing",
        definition:
          "Technique of appending dead-end vertices to a list and reversing to merge detached sub-cycles.",
      },
    ],
  },
  trivia: HIERHOLZER_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 17,
      label: "Competitive Programmer's Handbook, Ch 17",
    },
  ],
  defaultInput: DEFAULT_HIERHOLZER_INPUT,
  generateSteps: generateHierholzerSteps,
};

export default hierholzerEulerianPath;
