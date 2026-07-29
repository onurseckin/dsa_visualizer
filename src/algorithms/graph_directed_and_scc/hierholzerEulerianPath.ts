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

  let stepIdx = 0;

  // Step 0: Line 1 - Function Entry & Graph Data Structures Init
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: `Initialize Hierholzer's Algorithm on graph with ${nodes.length} nodes and ${edges.length} edges.`,
      why: "Create adjacency lists and degree tracking tables to process incoming and outgoing edges.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "default" })),
      edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
    },
    auxiliaryState: {
      visited: [],
      stack: [],
      customState: { Circuit: "[]" },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  // Step 1: Line 6 - Degree Calculation
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 6,
    explanation: {
      what: `Populated adjacency lists and computed vertex degrees across ${edges.length} directed edges.`,
      why: "In a directed Eulerian path, intermediate vertices must have equal in/out degrees, while the start vertex has out_deg - in_deg == 1.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "default" })),
      edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
    },
    auxiliaryState: {
      visited: [],
      stack: [],
      customState: {
        Circuit: "[]",
        "Degree Summary": nodes
          .map((n) => `${n.id}: in=${inDeg[n.id] || 0}, out=${outDeg[n.id] || 0}`)
          .join(" | "),
      },
    },
    variables: { totalNodes: nodes.length, totalEdges: edges.length },
  });

  let startNode = input?.startNodeId || (nodes.length > 0 ? nodes[0].id : "0");
  for (const n of nodes) {
    if ((outDeg[n.id] || 0) - (inDeg[n.id] || 0) === 1) {
      startNode = n.id;
      break;
    }
  }

  // Step 2: Line 13 - Start Node Selection
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 13,
    explanation: {
      what: `Selected starting vertex '${startNode}' based on Eulerian path degree condition (out_deg - in_deg == 1).`,
      why: "The start vertex of an Eulerian path must have one more outgoing edge than incoming edge (or any vertex with out_degree > 0 for a circuit).",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: n.id === startNode ? "active" : "default",
      })),
      edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
    },
    auxiliaryState: {
      visited: [],
      stack: [],
      customState: { Circuit: "[]", "Start Node": startNode },
    },
    variables: { startNode, outDeg: outDeg[startNode] || 0, inDeg: inDeg[startNode] || 0 },
  });

  const stack: string[] = [startNode];
  const circuit: string[] = [];
  const edgeUsed: Record<string, boolean> = {};

  // Step 3: Line 17 - Stack Init
  steps.push({
    stepIndex: stepIdx++,
    codeLine: 17,
    explanation: {
      what: `Pushed start vertex '${startNode}' onto traversal stack. Initialized empty post-order circuit list.`,
      why: "The LIFO stack will track the active path during traversal, pushing unvisited neighbors and popping when reaching dead ends.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({
        ...n,
        state: n.id === startNode ? "active" : "default",
      })),
      edges: edges.map((e) => ({ ...e, isTraversed: false, isPath: false })),
    },
    auxiliaryState: {
      visited: [],
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
          state:
            n.id === curr
              ? "active"
              : stack.includes(n.id)
                ? "in-stack"
                : circuit.includes(n.id)
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
        customState: { Current: curr, Circuit: `[${circuit.join(", ")}]` },
      },
      variables: { curr, remainingEdges: adj[curr]?.length ?? 0 },
    });

    if (adj[curr] && adj[curr].length > 0) {
      const nxt = adj[curr].pop()!;

      // Mark exact matching edge instance as used
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

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 23,
        explanation: {
          what: `Traversed edge '${curr}' -> '${nxt}' and pushed '${nxt}' onto stack.`,
          why: "Unvisited outgoing edge found. Extending active traversal path to neighbor vertex.",
        },
        primarySnapshot: {
          kind: "graph",
          nodes: nodes.map((n) => ({
            ...n,
            state:
              n.id === nxt
                ? "active"
                : stack.includes(n.id)
                  ? "in-stack"
                  : circuit.includes(n.id)
                    ? "visited"
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
          customState: { Current: nxt, Circuit: `[${circuit.join(", ")}]` },
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
          what: `Vertex '${popped}' has no remaining outgoing edges. Popped to post-order circuit list: [${circuit.join(", ")}].`,
          why: "When a vertex has no unvisited outgoing edges, it forms a dead end in the current sub-circuit and is appended to the post-order circuit.",
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
            isPath: false,
          })),
        },
        auxiliaryState: {
          stack: [...stack],
          visited: [...circuit],
          customState: { Popped: popped, Circuit: `[${circuit.join(", ")}]` },
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
      what: `Reversed post-order circuit list -> Final Eulerian Path: [${resultPath.join(" -> ")}].`,
      why: "Hierholzer's post-order traversal constructs sub-circuits in reverse. Reversing the post-order array restores the correct forward path sequence.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
      edges: edges.map((e) => ({ ...e, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      visited: [...resultPath],
      stack: [],
      customState: {
        "Post-Order": `[${circuit.join(", ")}]`,
        "Eulerian Path": resultPath.join(" -> "),
      },
    },
    variables: { complete: true, pathLength: resultPath.length },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 29,
    explanation: {
      what: `Returned completed Eulerian Path sequence: [${resultPath.join(" -> ")}].`,
      why: "Successfully traversed every edge in the directed graph exactly once in O(V + E) time.",
    },
    primarySnapshot: {
      kind: "graph",
      nodes: nodes.map((n) => ({ ...n, state: "sorted" })),
      edges: edges.map((e) => ({ ...e, isPath: true, isTraversed: true })),
    },
    auxiliaryState: {
      visited: [...resultPath],
      stack: [],
      customState: {
        "Eulerian Path": resultPath.join(" -> "),
        "Total Edges Traversed": edges.length,
      },
    },
    variables: { complete: true, result: resultPath },
  });

  return steps;
}

export const hierholzerEulerianPath: AlgorithmDefinition<HierholzerEulerianPathInput> = {
  id: "hierholzer-eulerian-path",
  title: "Hierholzer's Eulerian Path Algorithm",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>Finds an Eulerian path or Eulerian circuit in a directed graph—a trail that visits every directed edge exactly once. An Eulerian path exists if and only if at most one vertex has <code>out_degree - in_degree == 1</code> (start) and at most one has <code>in_degree - out_degree == 1</code> (end), with all other vertices having equal in-degree and out-degree. The algorithm uses a post-order DFS stack to traverse sub-circuits and splice them together in <code>O(V + E)</code> time.</p>",
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
        body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code></p><ul><li><strong>Time:</strong> Every directed edge is pushed and popped from adjacency lists once, taking linear <code>O(V + E)</code> time.</li><li><strong>Space:</strong> Memory for adjacency lists, LIFO stack, and output circuit array takes <code>O(V + E)</code> space.</li></ul>",
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
