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

export const HIERHOLZER_TRIVIA: TriviaMeta = {
  skipLines: [5, 10, 16, 19, 27],
  distractors: [
    "stack.pop(0)",
    "circuit.append(curr)",
    "if in_deg[u] == out_deg[u]: start_node = u",
    "circuit.sort()",
  ],
  hints: [
    {
      line: 13,
      hint: "Select a start node with out_degree - in_degree == 1 for Eulerian path, or any node with out_degree > 0 for Eulerian circuit.",
    },
    {
      line: 22,
      hint: "Peek at the top of the stack and follow an unvisited outgoing edge if one exists.",
    },
    {
      line: 26,
      hint: "When a vertex has no remaining outgoing edges, pop it from stack into the circuit.",
    },
    {
      line: 28,
      hint: "The post-order traversal yields the circuit in reverse order.",
    },
  ],
  lineExplanations: {
    1: "Defines the hierholzer function to find an Eulerian path or circuit in a directed graph.",
    2: "Initializes adjacency list mapping each node to its outgoing edges.",
    3: "Initializes in-degree table tracking incoming edge counts per node.",
    4: "Initializes out-degree table tracking outgoing edge counts per node.",
    5: "Blank line separating variable initialization from edge processing.",
    6: "Iterates over input directed edges to populate graph structures.",
    7: "Appends neighbor v to adjacency list of source node u.",
    8: "Increments out-degree count of source node u.",
    9: "Increments in-degree count of destination node v.",
    10: "Blank line separating edge population from start node selection.",
    11: "Sets default start node to the first node in the graph.",
    12: "Iterates over nodes to locate an Eulerian path start vertex.",
    13: "Checks if node u has out_degree - in_degree == 1 (start node of an Eulerian path).",
    14: "Assigns u as the start_node for the traversal.",
    15: "Breaks search loop once valid start node is found.",
    16: "Blank line separating start node selection from stack initialization.",
    17: "Initializes traversal stack with start_node.",
    18: "Initializes empty circuit list to store post-order vertex sequence.",
    19: "Blank line separating state init from main loop.",
    20: "Drives main loop while traversal stack contains active vertices.",
    21: "Peeks top vertex u from the traversal stack.",
    22: "Checks if vertex u has any remaining unvisited outgoing edges.",
    23: "Pops next outgoing neighbor v from u's adjacency list.",
    24: "Pushes neighbor v onto traversal stack to extend path.",
    25: "Else branch when vertex u has no remaining outgoing edges.",
    26: "Pops dead-end vertex u from stack and appends to post-order circuit.",
    27: "Blank line separating loop completion from reversal.",
    28: "Reverses post-order circuit list to produce valid Eulerian path sequence.",
    29: "Returns final Eulerian path/circuit sequence.",
  },
};

export function generateHierholzerSteps(input: HierholzerEulerianPathInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const inputNodes = input.nodes && input.nodes.length > 0 ? input.nodes : DEFAULT_HIERHOLZER_INPUT.nodes;
  const inputEdges = input.edges && input.edges.length > 0 ? input.edges : DEFAULT_HIERHOLZER_INPUT.edges;

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
    adj[e.from].push(e.to);
    outDeg[e.from] = (outDeg[e.from] || 0) + 1;
    inDeg[e.to] = (inDeg[e.to] || 0) + 1;
  }

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialize Hierholzer's Algorithm on graph with ${nodes.length} nodes and ${edges.length} edges.`,
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
    codeLine: 11,
    explanation: {
      what: `Selected start vertex '${startNode}'.`,
      why: "Vertex selected based on Eulerian path degree condition (out_deg - in_deg == 1) or default start.",
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

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 21,
      explanation: {
        what: `Inspecting top of stack: vertex '${curr}'.`,
        why: `Check if '${curr}' has remaining unvisited outgoing edges (${adj[curr]?.length ?? 0} remaining).`,
      },
      primarySnapshot: {
        kind: "graph",
        nodes: nodes.map((n) => ({
          ...n,
          state: n.id === curr ? "active" : stack.includes(n.id) ? "in-stack" : "default",
        })),
        edges: edges.map((e, idx) => ({
          ...e,
          isTraversed: !!edgeUsed[`${e.from}->${e.to}-${idx}`],
        })),
      },
      auxiliaryState: {
        stack: [...stack],
        customState: { Current: curr, Circuit: `[${circuit.join(", ")}]` },
      },
      variables: { curr, remainingEdges: adj[curr]?.length ?? 0 },
    });

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
        codeLine: 23,
        explanation: {
          what: `Traversed edge '${curr}' -> '${nxt}' and pushed '${nxt}' onto stack.`,
          why: "Unvisited outgoing edge found. Extending active traversal path.",
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
        codeLine: 26,
        explanation: {
          what: `Vertex '${popped}' has no remaining outgoing edges. Popped to post-order circuit list.`,
          why: "When a vertex is stuck with no unvisited outgoing edges, append to post-order list and backtrack.",
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

  const resultPath = [...circuit].reverse();

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 28,
    explanation: {
      what: `Reversed post-order circuit -> Final Eulerian Path: [${resultPath.join(" -> ")}].`,
      why: "Hierholzer's post-order traversal built the circuit backward; reversing it yields the valid forward path.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
      edges: edges.map((e) => ({ ...e, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      customState: {
        "Eulerian Path": resultPath.join(" -> "),
        "Total Edges Traversed": edges.length,
      },
    },
    variables: { complete: true, pathLength: resultPath.length },
  });

  return steps;
}

export const hierholzerEulerianPath: AlgorithmDefinition<HierholzerEulerianPathInput> = {
  id: "hierholzer-eulerian-path",
  title: "Hierholzer's Eulerian Path Algorithm",
  category: "graph_directed_and_scc",
  categories: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "Finds an Eulerian path or Eulerian circuit in a directed graph—a trail that visits every directed edge exactly once. An Eulerian path exists if and only if at most one vertex has out-degree - in-degree == 1 (start) and at most one has in-degree - out-degree == 1 (end), with all other vertices having equal in-degree and out-degree. The algorithm uses a post-order DFS stack to traverse sub-circuits and splice them together in O(V + E) time.",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 3 * 10^4",
    "Graph must be strongly connected (or connected components with positive degrees must be connected)",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "5 nodes, 8 directed edges",
      outputDisplay: "Eulerian Path found",
      title: "5-Node Eulerian Path Graph",
      input: DEFAULT_HIERHOLZER_INPUT,
      output: "[0, 1, 2, 3, 4, 0, 2, 3, 1]",
      explanation: "Visits all 8 directed edges exactly once.",
    },
  ],
  code: HIERHOLZER_CODE,
  timeComplexity: { best: "O(V + E)", average: "O(V + E)", worst: "O(V + E)" },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each edge is traversed and removed from the adjacency list exactly once, and each vertex is pushed/popped from the stack once. Total time is linear $\\mathcal{O}(V + E)$.",
    space: "$\\mathcal{O}(V + E)$ auxiliary space for adjacency list, stack, and circuit array.",
  },
  topicGuide: {
    overview:
      "Hierholzer's algorithm constructs an **Eulerian Path** or **Eulerian Circuit**—a path visiting every directed edge in a graph $G = (V, E)$ exactly once—in linear $\\mathcal{O}(V + E)$ time. It works by maintaining an explicit LIFO stack, building sub-circuits when reaching dead ends, and splicing them into a single continuous trail.",
    sections: [
      {
        heading: "Why It Exists & What It Solves",
        body: "The Seven Bridges of Königsberg problem laid the foundation for graph theory. Modern applications include **genome assembly** (De Bruijn graph traversal), street-sweeping/snowplow routing (Chinese Postman Problem variant), and circuit board trace printing, where every path edge must be traversed without duplication.",
      },
      {
        heading: "Degree Conditions for Eulerian Paths in Directed Graphs",
        body: "1. **Eulerian Circuit**: Every vertex has `in_degree == out_degree`, and all non-isolated vertices belong to a single strongly connected component.\n2. **Eulerian Path**: Exactly one vertex has `out_degree - in_degree == 1` (start vertex), exactly one has `in_degree - out_degree == 1` (end vertex), and all other vertices have `in_degree == out_degree`.",
      },
      {
        heading: "Step-by-Step Intuition: Sub-Circuit Splicing",
        body: "1. **Identify Start**: Find valid start vertex (where `out_degree - in_degree == 1`, or any node with `out_degree > 0`).\n2. **Initialize Stack**: Push start vertex onto LIFO stack.\n3. **Traverse & Backtrack**: While stack is non-empty:\n   a. Peek top vertex $u$.\n   b. If $u$ has unvisited outgoing edges, remove edge $(u, v)$ and push $v$ onto stack.\n   c. If $u$ has no remaining outgoing edges, pop $u$ and append to circuit.\n4. **Reverse**: Reverse circuit to obtain forward Eulerian path sequence.",
      },
      {
        heading: "Trade-offs & Implementation Notes",
        body: "Fleury's algorithm also finds Eulerian paths but requires checking for bridge edges before each step, resulting in $\\mathcal{O}(E^2)$ time. Hierholzer's post-order stack approach avoids bridge checks entirely, operating in optimal $\\mathcal{O}(V + E)$ linear time.",
      },
      {
        heading: "Complexity Analysis",
        body: "$$\\text{Time Complexity}: \\mathcal{O}(V + E)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Time**: Every directed edge is pushed and popped from adjacency lists once, taking linear $\\mathcal{O}(V + E)$ time.\n- **Space**: Memory for adjacency lists, LIFO stack, and output circuit array takes $\\mathcal{O}(V + E)$ space.",
      },
    ],
    keyTerms: [
      {
        term: "Eulerian Path",
        definition:
          "A trail in a finite graph that visits every edge $e \\in E$ exactly once.",
      },
      {
        term: "Eulerian Circuit",
        definition:
          "An Eulerian path that starts and ends at the exact same vertex.",
      },
      {
        term: "In-Degree / Out-Degree Balance",
        definition:
          "The equality condition `in_degree == out_degree` required for Eulerian circuit existence.",
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
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 17",
      label: "Competitive Programmer's Handbook, Ch 17",
    },
  ],
  defaultInput: DEFAULT_HIERHOLZER_INPUT,
  generateSteps: generateHierholzerSteps,
};

export default hierholzerEulerianPath;
