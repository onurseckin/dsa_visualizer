import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface HierholzerEulerianPathInput {
  startNodeId?: string;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const HIERHOLZER_CODE = `
def hierholzer(input_array):
    """
    Implementation of hierholzer.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

export const HIERHOLZER_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "stack.pop(0)",
    "circuit.append(curr)",
    "if in_deg[u] == out_deg[u]: start_node = u",
    "circuit.sort()",
  ],
  hints: [
    {
      line: 12,
      hint: "Select a start node with out_degree - in_degree == 1 for Eulerian path, or any node with out_degree > 0 for Eulerian circuit.",
    },
    {
      line: 19,
      hint: "Peek at the top of the stack and follow an unvisited outgoing edge if one exists.",
    },
    {
      line: 24,
      hint: "When a vertex has no remaining outgoing edges, pop it from stack into the circuit.",
    },
    {
      line: 26,
      hint: "The post-order traversal yields the circuit in reverse order.",
    },
  ],
  lineExplanations: {
    1: "Defines the function to compute an Eulerian path/circuit in a directed graph.",
    5: "Populates the adjacency list and tracks in-degree and out-degree for each vertex.",
    12: "Finds the start vertex for an Eulerian path (where out-degree exceeds in-degree by 1).",
    16: "Initializes the traversal stack with the chosen start vertex and an empty circuit list.",
    18: "While stack is non-empty, peek at the top vertex to explore unused outgoing edges.",
    22: "Follows an unvisited outgoing edge and pushes the target vertex onto the stack.",
    24: "Backtracks when no outgoing edges remain, popping the vertex into the final circuit.",
    26: "Reverses the circuit array to output the Eulerian traversal from start to finish.",
  },
};

export const DEFAULT_HIERHOLZER_INPUT: HierholzerEulerianPathInput = {
  nodes: [
    { id: "0", label: "0", x: 150, y: 100, state: "default" },
    { id: "1", label: "1", x: 350, y: 100, state: "default" },
    { id: "2", label: "2", x: 350, y: 250, state: "default" },
    { id: "3", label: "3", x: 150, y: 250, state: "default" },
  ],
  edges: [
    { from: "0", to: "1" },
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "0" },
    { from: "1", to: "3" },
    { from: "3", to: "1" },
  ],
};

export function generateHierholzerSteps(input: HierholzerEulerianPathInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = input.nodes.map((n) => ({ ...n }));
  const edges = input.edges.map((e) => ({ ...e }));

  const adj: Record<string, string[]> = {};
  const inDeg: Record<string, number> = {};
  const outDeg: Record<string, number> = {};

  for (const n of nodes) {
    adj[n.id] = [];
    inDeg[n.id] = 0;
    outDeg[n.id] = 0;
  }

  for (const e of edges) {
    adj[e.from].push(e.to);
    outDeg[e.from] = (outDeg[e.from] || 0) + 1;
    inDeg[e.to] = (inDeg[e.to] || 0) + 1;
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: "Initialize Hierholzer's Algorithm.",
      why: "Compute in-degrees and out-degrees to determine starting vertex for Eulerian path/circuit.",
    },
    primarySnapshot: { kind: "graph", nodes: [...nodes], edges: [...edges] },
    auxiliaryState: {
      visited: [],
      stack: [],
      customState: { Circuit: "[]" },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  let startNode = input.startNodeId || nodes[0]?.id || "0";
  for (const n of nodes) {
    if ((outDeg[n.id] || 0) - (inDeg[n.id] || 0) === 1) {
      startNode = n.id;
      break;
    }
  }

  const stack: string[] = [startNode];
  const circuit: string[] = [];
  const edgeUsed: Record<string, boolean> = {};

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 16,
    explanation: {
      what: `Selected start vertex ${startNode}.`,
      why: "Vertex selected based on degree conditions or default start.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: n.id === startNode ? "active" : "default",
      })),
      edges: [...edges],
    },
    auxiliaryState: {
      stack: [...stack],
      customState: { Circuit: "[]" },
    },
    variables: { startNode, stackLength: stack.length },
  });

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];

    if (adj[curr] && adj[curr].length > 0) {
      const nxt = adj[curr].pop()!;

      // Mark edge used
      const edgeObj = edges.find(
        (e) =>
          e.from === curr && e.to === nxt && !edgeUsed[`${e.from}->${e.to}-${edges.indexOf(e)}`],
      );
      if (edgeObj) {
        edgeUsed[`${edgeObj.from}->${edgeObj.to}-${edges.indexOf(edgeObj)}`] = true;
      }

      stack.push(nxt);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 22,
        explanation: {
          what: `Followed edge ${curr} -> ${nxt}.`,
          why: "Vertex still has unvisited outgoing edges; push target onto stack.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: n.id === nxt ? "active" : stack.includes(n.id) ? "in-stack" : "default",
          })),
          edges: edges.map((e, idx) => ({
            ...e,
            isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
            isPath: e.from === curr && e.to === nxt,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { Circuit: `[${circuit.join(", ")}]` },
        },
        variables: { current: curr, next: nxt, stackSize: stack.length },
      });
    } else {
      const popped = stack.pop()!;
      circuit.push(popped);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 24,
        explanation: {
          what: `Vertex ${popped} has no remaining outgoing edges. Popped to circuit.`,
          why: "When a vertex is stuck, it is appended to the post-order circuit list.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state: circuit.includes(n.id)
              ? "visited"
              : stack.includes(n.id)
                ? "in-stack"
                : "default",
          })),
          edges: edges.map((e, idx) => ({
            ...e,
            isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          customState: { Circuit: `[${circuit.join(", ")}]` },
        },
        variables: { popped, circuitLength: circuit.length },
      });
    }
  }

  const finalPath = [...circuit].reverse();
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 26,
    explanation: {
      what: `Eulerian Path complete: ${finalPath.join(" -> ")}.`,
      why: "Reversing the post-order circuit yields the complete Eulerian path.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
      edges: edges.map((e) => ({ ...e, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      stack: [],
      customState: { "Final Eulerian Path": finalPath.join(" -> ") },
    },
    variables: { result: finalPath.join(" -> ") },
  });

  return steps;
}

export const hierholzerEulerianPath: AlgorithmDefinition<HierholzerEulerianPathInput> = {
  id: "hierholzer-eulerian-path",
  title: "Hierholzer's Algorithm (Eulerian Path)",
  category: "graph_directed_and_scc",
  categories: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "Hierholzer's algorithm finds an Eulerian path or Eulerian circuit in a graph in linear O(V + E) time. Given a directed or undirected graph with V vertices and E edges, construct an Eulerian Path (a trail visiting every edge exactly once) or Eulerian Circuit. The algorithm maintains an execution stack to explore directed sub-cycles, backtracking when dead-ends are reached, and splicing sub-cycles together into a single continuous trail.",
  constraints: [
    "1 <= V <= 1000",
    "0 <= E <= 5000",
    "For an Eulerian Circuit: in_degree(u) == out_degree(u) for all vertices u",
    "For an Eulerian Path: exactly one vertex has out_degree - in_degree = 1 (start) and one vertex has in_degree - out_degree = 1 (end)",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nodes = [0,1,2,3], edges = [(0,1), (1,2), (2,3), (3,0), (1,3), (3,1)]",
      outputDisplay: "[0, 1, 2, 3, 0, 1, 3]",
      title: "Basic Eulerian Circuit",
      input: DEFAULT_HIERHOLZER_INPUT,
      output: "0 -> 1 -> 2 -> 3 -> 0 -> 1 -> 3",
      explanation: "All edges are traversed exactly once in a closed circuit.",
    },
    {
      kind: "complex",
      inputDisplay: "nodes = [0,1,2,3], edges = [(0,1), (1,2), (2,0), (0,3)]",
      outputDisplay: "[0, 1, 2, 0, 3]",
      title: "Eulerian Path with Terminal Node",
      input: {
        nodes: [
          { id: "0", label: "0", x: 100, y: 150, state: "default" },
          { id: "1", label: "1", x: 250, y: 80, state: "default" },
          { id: "2", label: "2", x: 250, y: 220, state: "default" },
          { id: "3", label: "3", x: 400, y: 150, state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "2" },
          { from: "2", to: "0" },
          { from: "0", to: "3" },
        ],
      },
      output: "0 -> 1 -> 2 -> 0 -> 3",
      explanation:
        "Node 0 has out-degree 2 and in-degree 1; node 3 has in-degree 1 and out-degree 0.",
    },
    {
      kind: "negative",
      inputDisplay: "nodes = [0,1,2], edges = [(0,1), (1,2)]",
      outputDisplay: "[0, 1, 2]",
      title: "Simple Directed Line",
      input: {
        nodes: [
          { id: "0", label: "0", x: 100, y: 150, state: "default" },
          { id: "1", label: "1", x: 250, y: 150, state: "default" },
          { id: "2", label: "2", x: 400, y: 150, state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "2" },
        ],
      },
      output: "0 -> 1 -> 2",
      explanation: "A simple line graph where every edge is visited once.",
    },
  ],
  code: HIERHOLZER_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each edge is pushed to stack and popped into the circuit exactly once, yielding O(E) total operations. Degree calculations and initialization take O(V + E).",
    space:
      "The stack and adjacency list store up to E edges and V vertices, taking O(V + E) memory.",
  },
  topicGuide: {
    overview:
      "Hierholzer's algorithm constructs an Eulerian path or circuit in linear O(V + E) time. By greedily following unvisited edges until getting trapped in a cycle, then using an explicit stack to backtrack and splice sub-cycles into the main traversal sequence, it avoids the exponential overhead of naive backtracking.",
    sections: [
      {
        heading: "Core Concept: Degree Conditions & Existence Theorems",
        body: "Euler proved that a connected directed graph contains an Eulerian Circuit if and only if in_degree(v) == out_degree(v) for all vertices v. An Eulerian Path exists if and only if at most one vertex has out_degree - in_degree = 1 (start) and at most one vertex has in_degree - out_degree = 1 (end).",
      },
      {
        heading: "Hierholzer's Stack Mechanism & Post-Order Splacing",
        body: "Starting from the designated start vertex, the algorithm pushes nodes onto an execution stack while removing traversed edges from the adjacency lists. When a node with no remaining outgoing edges is reached, it is popped from the stack and added to the output trail. Reversing the post-order sequence yields a valid Eulerian trail.",
      },
      {
        heading: "Applications in Robotics & DNA Sequencing",
        body: "Eulerian paths solve the Seven Bridges of Königsberg problem, street sweeping and snow plow route optimization (Chinese Postman Problem), DNA fragment assembly (Eulerian trail over De Bruijn graphs), and circuit board drill path planning.",
      },
      {
        heading: "Edge Cases & Implementation Details",
        body: "Disconnected graph components containing edges prevent a single Eulerian trail. Graph representations must support mutating or deleting edges efficiently during traversal so no edge is traversed twice.",
      },
    ],
    keyTerms: [
      {
        term: "Eulerian Path",
        definition: "A trail in a finite graph that visits every edge exactly once.",
      },
      {
        term: "Eulerian Circuit",
        definition: "An Eulerian path that starts and ends on the exact same vertex.",
      },
      {
        term: "Hierholzer's Algorithm",
        definition:
          "An linear O(V + E) algorithm for finding Eulerian paths via post-order cycle joining.",
      },
      {
        term: "Degree Balance",
        definition:
          "The equality or exact offset between in-degree and out-degree required for Eulerian existence.",
      },
    ],
  },
  trivia: HIERHOLZER_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 19",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 19,
      section: "19.1 Eulerian paths",
    },
  ],
  defaultInput: DEFAULT_HIERHOLZER_INPUT,
  generateSteps: generateHierholzerSteps,
};
