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
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Hard",
  description:
    "<p>Given a directed graph <code>G = (V, E)</code>, find all <strong>Strongly Connected Components (SCCs)</strong> — maximal subgraphs where every vertex is mutually reachable from every other vertex.</p><h3>Problem Statement</h3><p>Partition the vertices of <code>G</code> into disjoint sets of strongly connected components using Kosaraju's two-pass Depth-First Search algorithm with graph transposition.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of graph vertices.</li><li><code>edges</code>: List of directed edges connecting pairs of vertices.</li></ul><h3>Output</h3><p>Returns a list of arrays, where each array contains the vertex IDs belonging to one strongly connected component.</p>",
  constraints: [
    "1 <= V <= 500",
    "0 <= E <= 2000",
    "Graph is directed and may contain cycles and self-loops",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "vertices = [0, 1, 2, 3, 4], edges = [(0,1), (1,2), (2,0), (1,3), (3,4), (4,3)]",
      outputDisplay: "2 SCCs: {0, 1, 2}, {3, 4}",
      title: "Standard Graph with 2 SCCs",
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
      scenario: "adversarial",
      inputDisplay: "vertices = [0,1,2,3,4,5], edges forming 3 chained 2-node cycles",
      outputDisplay: "3 SCCs: {0, 1}, {2, 3}, {4, 5}",
      title: "Adversarial Chained Cycle Graph",
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
      scenario: "boundary",
      inputDisplay: "vertices = [0, 1, 2, 3], edges = [(0,1), (2,3)]",
      outputDisplay: "4 Singleton SCCs: {0}, {1}, {2}, {3}",
      title: "Boundary Acyclic Disconnected Graph",
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
