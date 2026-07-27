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
      input:
        "Source = S, Sink = T, Nodes: [S, A, B, T], Edges with capacities S->A:10, S->B:10, A->B:2, A->T:10, B->T:10",
      output: "Max Flow = 20",
      explanation:
        "Flow of 10 is pushed along S->A->T and 10 along S->B->T. Total capacity of 20 reaches sink T.",
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
