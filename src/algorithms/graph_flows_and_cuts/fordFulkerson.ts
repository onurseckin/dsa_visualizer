import type { AlgorithmDefinition } from "../../types/dsa";
import type { FordFulkersonInput } from "./ford_fulkerson/types";
import { FORD_FULKERSON_CODE, DEFAULT_FORD_FULKERSON_INPUT } from "./ford_fulkerson/types";
import { generateFordFulkersonSteps } from "./ford_fulkerson/stepGenerator";
import { FORD_FULKERSON_TOPIC_GUIDE, FORD_FULKERSON_TRIVIA } from "./ford_fulkerson/metadata";

export type { FordFulkersonInput };
export { FORD_FULKERSON_CODE, DEFAULT_FORD_FULKERSON_INPUT, generateFordFulkersonSteps };

export const fordFulkerson: AlgorithmDefinition<FordFulkersonInput> = {
  id: "ford-fulkerson",
  title: "Ford-Fulkerson Maximum Flow",
  topicIds: ["graph_flows_and_cuts"],
  difficulty: "Hard",
  description:
    "<p>Given a directed flow network <code>G = (V, E)</code> with non-negative edge capacities, a source vertex <code>S</code>, and a sink vertex <code>T</code>, compute the maximum total throughput flow that can be routed from <code>S</code> to <code>T</code>.</p><h3>Problem Statement</h3><p>Find a valid network flow assignment that satisfies capacity constraints <code>0 <= f(u, v) <= c(u, v)</code> and conservation constraints at all intermediate vertices while maximizing total flow into <code>T</code>.</p><h3>Input Parameters</h3><ul><li><code>source</code>: Identifier for the source vertex S.</li><li><code>sink</code>: Identifier for the sink vertex T.</li><li><code>nodes</code>: Array of vertex identifiers.</li><li><code>edges</code>: Array of directed edges with numeric capacities <code>(from, to, capacity)</code>.</li></ul><h3>Output</h3><p>Returns the integer value of the maximum total throughput flow reaching sink T.</p>",
  constraints: [
    "2 <= V <= 50",
    "1 <= capacity <= 10^4",
    "Graph is a directed network with non-negative capacities",
    "Source S and Sink T must exist in the network",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "source = S, sink = T, 4 nodes, 5 edges",
      outputDisplay: "Max Flow = 20",
      title: "Standard Flow Network",
      input: {
        source: "S",
        sink: "T",
        nodes: ["S", "A", "B", "T"],
        edges: [
          { from: "S", to: "A", capacity: 10 },
          { from: "S", to: "B", capacity: 10 },
          { from: "A", to: "B", capacity: 2 },
          { from: "A", to: "T", capacity: 10 },
          { from: "B", to: "T", capacity: 10 },
        ],
      },
      output: "Max Flow = 20",
      explanation:
        "Pushes 10 units along S->A->T and 10 units along S->B->T. Total bottleneck throughput reaching sink T is 20.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "source = S, sink = T, bottleneck node C",
      outputDisplay: "Max Flow = 7",
      title: "Adversarial Bottleneck Network",
      input: {
        source: "S",
        sink: "T",
        nodes: ["S", "A", "B", "C", "T"],
        edges: [
          { from: "S", to: "A", capacity: 10 },
          { from: "S", to: "B", capacity: 8 },
          { from: "A", to: "C", capacity: 5 },
          { from: "B", to: "C", capacity: 4 },
          { from: "C", to: "T", capacity: 7 },
        ],
      },
      output: "Max Flow = 7",
      explanation:
        "Augmenting paths push flow through bottleneck node C. The incoming edge C->T with capacity 7 limits the maximum total flow to 7.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "source = S, sink = T, edges = [(S,A,10), (T,A,10)]",
      outputDisplay: "Max Flow = 0",
      title: "Boundary Disconnected Sink",
      input: {
        source: "S",
        sink: "T",
        nodes: ["S", "A", "T"],
        edges: [
          { from: "S", to: "A", capacity: 10 },
          { from: "T", to: "A", capacity: 10 },
        ],
      },
      output: "Max Flow = 0",
      explanation:
        "Sink T has no incoming residual edges from source S. No augmenting path can be found, returning max flow = 0.",
    },
  ],
  code: FORD_FULKERSON_CODE,
  timeComplexity: {
    best: "O(E)",
    average: "O(E * MaxFlow)",
    worst: "O(E * MaxFlow)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each search for an augmenting path is a DFS over the residual graph, costing O(E). With integer capacities every path found pushes at least 1 unit of flow, so there are at most MaxFlow rounds — O(E × MaxFlow) overall. That is why the bound depends on the answer itself: unlucky 1-unit paths can force many rounds, while the best case is a single O(E) search that finds no path at all.",
    space:
      "We store a capacity and flow entry per edge plus a visited set per search — O(V + E). The DFS recursion stack can also reach V frames on a long path.",
  },
  topicGuide: FORD_FULKERSON_TOPIC_GUIDE,
  trivia: FORD_FULKERSON_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 20",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 20,
      section: "20.1 Ford–Fulkerson algorithm",
    },
  ],
  defaultInput: DEFAULT_FORD_FULKERSON_INPUT,
  generateSteps: generateFordFulkersonSteps,
};

export default fordFulkerson;
