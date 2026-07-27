import type { AlgorithmDefinition } from "../../types/dsa";
import type { KosarajuSccInput } from "./kosaraju_scc/types";
import { KOSARAJU_SCC_CODE, DEFAULT_KOSARAJU_INPUT } from "./kosaraju_scc/types";
import { generateKosarajuSccSteps } from "./kosaraju_scc/stepGenerator";
import { KOSARAJU_SCC_TOPIC_GUIDE, KOSARAJU_SCC_TRIVIA } from "./kosaraju_scc/metadata";

export type { KosarajuSccInput };
export { KOSARAJU_SCC_CODE, DEFAULT_KOSARAJU_INPUT, generateKosarajuSccSteps };

export const kosarajuScc: AlgorithmDefinition<KosarajuSccInput> = {
  id: "kosaraju-scc",
  title: "Kosaraju's Strongly Connected Components",
  category: "graph_directed_and_scc",
  difficulty: "Hard",
  description:
    "Finds all Strongly Connected Components (SCCs) in a directed graph using Kosaraju's two-pass Depth-First Search algorithm with graph transposition. A directed graph is strongly connected if every vertex is reachable from any other vertex. Kosaraju's algorithm decomposes the graph into a condensation DAG of maximal strongly connected subgraphs in linear time O(V + E).",
  constraints: [
    "1 <= V <= 500",
    "0 <= E <= 2000",
    "Graph is directed and may contain cycles and self-loops",
  ],
  examples: [
    {
      input: "Nodes 0..4, Edges: 0->1, 1->2, 2->0, 1->3, 3->4, 4->3",
      output: "2 SCCs: SCC 1 = {0, 1, 2}, SCC 2 = {3, 4}",
      explanation:
        "Vertices 0, 1, 2 form a directed cycle and can reach each other. Vertices 3 and 4 form another 2-node cycle. Edge 1->3 connects the two components in one direction.",
    },
  ],
  code: KOSARAJU_SCC_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Each of the two DFS passes visits every vertex once and walks every edge once, which is O(V + E) per pass. Transposing the graph also touches each edge exactly once. Two linear sweeps plus one linear transpose is still linear overall — O(V + E) — regardless of how the components are shaped.",
    space:
      "We hold adjacency lists for the graph and its transpose, the visited sets, and the finish stack, each proportional to the vertices and edges — O(V + E). The DFS recursion stack can also grow up to V frames on a long path.",
  },
  topicGuide: KOSARAJU_SCC_TOPIC_GUIDE,
  trivia: KOSARAJU_SCC_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 17",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 17,
      section: "17.1 Kosaraju's algorithm",
    },
  ],
  defaultInput: DEFAULT_KOSARAJU_INPUT,
  generateSteps: generateKosarajuSccSteps,
};

export default kosarajuScc;
