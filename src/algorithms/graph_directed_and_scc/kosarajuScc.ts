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
      kind: "basic",
      inputDisplay: "vertices = [0, 1, 2, 3, 4], edges = [(1,0), (0,2), (2,1), (0,3), (3,4)]",
      outputDisplay: "[[0, 1, 2], [3], [4]]",
      title: "Basic Example",
      input: {
        nodes: [
          { id: "0", label: "0", x: 120, y: 120, state: "default" },
          { id: "1", label: "1", x: 260, y: 120, state: "default" },
          { id: "2", label: "2", x: 120, y: 260, state: "default" },
          { id: "3", label: "3", x: 400, y: 120, state: "default" },
          { id: "4", label: "4", x: 400, y: 260, state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "2" },
          { from: "2", to: "0" },
          { from: "1", to: "3" },
          { from: "3", to: "4" },
          { from: "4", to: "3" },
        ],
      },
      output: "2 SCCs: {0, 1, 2}, {3, 4}",
      explanation:
        "Nodes {0, 1, 2} form a directed cycle (SCC 1), and nodes {3, 4} form another cycle (SCC 2). Edge 1->3 connects them in one direction.",
    },
    {
      kind: "complex",
      inputDisplay: "vertices = [A, B, C, D, E, F, G, H], edges = [(A,B), (B,C), (C,A), (B,D), (D,E), (E,F), (F,D), (G,F), (G,H)]",
      outputDisplay: "[[A, B, C], [D, E, F], [G], [H]]",
      title: "Complex Edge Case",
      input: {
        nodes: [
          { id: "0", label: "0", x: 100, y: 100, state: "default" },
          { id: "1", label: "1", x: 200, y: 100, state: "default" },
          { id: "2", label: "2", x: 300, y: 100, state: "default" },
          { id: "3", label: "3", x: 400, y: 100, state: "default" },
          { id: "4", label: "4", x: 500, y: 100, state: "default" },
          { id: "5", label: "5", x: 600, y: 100, state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "1", to: "0" },
          { from: "1", to: "2" },
          { from: "2", to: "3" },
          { from: "3", to: "2" },
          { from: "3", to: "4" },
          { from: "4", to: "5" },
          { from: "5", to: "4" },
        ],
      },
      output: "3 SCCs: {0, 1}, {2, 3}, {4, 5}",
      explanation:
        "Three distinct 2-node cycles are linked in a chain. Kosaraju's two-pass DFS correctly identifies all 3 SCCs.",
    },
    {
      kind: "negative",
      inputDisplay: "vertices = [A, B, C, D], edges = [(A,B), (B,C), (C,D)]",
      outputDisplay: "[[A], [B], [C], [D]]",
      title: "Failing / Boundary Case",
      input: {
        nodes: [
          { id: "0", label: "0", state: "default" },
          { id: "1", label: "1", state: "default" },
          { id: "2", label: "2", state: "default" },
          { id: "3", label: "3", state: "default" },
        ],
        edges: [
          { from: "0", to: "1" },
          { from: "2", to: "3" },
        ],
      },
      output: "4 SCCs: {0}, {1}, {2}, {3}",
      explanation:
        "In an acyclic directed graph with disconnected components, no cycles exist. Each vertex forms its own singleton SCC.",
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
