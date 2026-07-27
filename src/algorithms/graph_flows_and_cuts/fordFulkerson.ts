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
  category: "graph_flows_and_cuts",
  difficulty: "Hard",
  description:
    "Computes the maximum flow from a source vertex S to a sink vertex T in a flow network by repeatedly finding augmenting paths in the residual graph. The algorithm terminates when no path with positive residual capacity exists, guaranteeing maximum throughput according to the Max-Flow Min-Cut Theorem.",
  constraints: [
    "2 <= V <= 50",
    "1 <= capacity <= 10^4",
    "Graph is a directed network with non-negative capacities",
    "Source S and Sink T must exist in the network",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "source = S, sink = T, edges = [(S,A,10), (S,C,10), (A,B,4), (A,C,2), (A,D,8), (C,D,9), (B,T,10), (D,T,10)]",
      outputDisplay: "Max Flow = 19",
      title: "Basic Example",
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
      inputDisplay:
        "source = S, sink = T, edges = [(S,1,16), (S,2,13), (1,2,10), (2,1,4), (1,3,12), (3,2,9), (2,4,14), (4,3,7), (3,T,20), (4,T,4)]",
      outputDisplay: "Max Flow = 23",
      title: "Complex Edge Case",
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
      inputDisplay: "source = S, sink = T, edges = [(S,A,10), (T,A,10)]",
      outputDisplay: "Max Flow = 0",
      title: "Failing / Boundary Case",
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
