import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KRUSKAL_CODE } from "./pythonCode";
import { generateKruskalSteps, type KruskalInput } from "./stepGenerator";

export const DEFAULT_KRUSKAL_INPUT: KruskalInput = {
  nodes: [
    { id: "A", label: "A", x: 100, y: 100, state: "default" },
    { id: "B", label: "B", x: 250, y: 50, state: "default" },
    { id: "C", label: "C", x: 250, y: 200, state: "default" },
    { id: "D", label: "D", x: 400, y: 50, state: "default" },
    { id: "E", label: "E", x: 400, y: 200, state: "default" },
    { id: "F", label: "F", x: 550, y: 120, state: "default" },
  ],
  edges: [
    { from: "A", to: "B", weight: 1 },
    { from: "B", to: "C", weight: 2 },
    { from: "C", to: "E", weight: 3 },
    { from: "A", to: "C", weight: 4 },
    { from: "B", to: "D", weight: 5 },
    { from: "D", to: "E", weight: 6 },
    { from: "D", to: "F", weight: 7 },
    { from: "E", to: "F", weight: 8 },
    { from: "C", to: "D", weight: 9 },
  ],
};

const KRUSKAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Kruskal's algorithm constructs a <strong>Minimum Spanning Tree (MST)</strong> for a connected, weighted, undirected graph <code>G = (V, E)</code> by greedily processing edges in ascending order of weight. Using a <strong>Disjoint-Set Union (DSU)</strong> structure with path compression and union by rank, Kruskal's algorithm connects components while discarding any edge that would form a cycle. It runs in <code>O(E log E)</code> time.</p>",
  sections: [
    {
      heading: "Why It Exists & What It Solves",
      body: "<p>Network design problems—such as laying fiber-optic cables or power grids at minimal total cost—require connecting all <code>|V|</code> vertices without redundancy. Kruskal's algorithm solves this by selecting the cheapest subset of <code>|V| - 1</code> edges that spans all vertices while minimizing total edge weight.</p>",
    },
    {
      heading: "Greedy Strategy & Cut Property",
      body: "<p>Kruskal's algorithm relies on the <strong>Cut Property</strong> of minimum spanning trees:</p><ul><li>For any cut dividing graph vertices into two disjoint sets, the minimum-weight edge crossing the cut belongs to an MST.</li><li>By sorting edges globally upfront, Kruskal guarantees that every accepted edge is the lightest edge bridging two disconnected forest components.</li></ul>",
    },
    {
      heading: "Union-Find is the Engine",
      body: "<p>To determine if an edge <code>(u, v)</code> creates a cycle, Kruskal queries the DSU structure:</p><ul><li><code>find(u) === find(v)</code>: Both endpoints belong to the same component, so adding the edge forms a cycle and it is skipped.</li><li><code>union(u, v)</code>: Merges the two components in near-constant amortized time <code>O(α(V))</code> when endpoints belong to different sets.</li></ul>",
    },
    {
      heading: "Step-by-Step Intuition",
      body: "<p>The algorithm executes in four clean phases:</p><ol><li><strong>Sort Edges:</strong> Sort all <code>E</code> edges in ascending order of weight.</li><li><strong>Initialize DSU:</strong> Place each vertex in its own singleton set (component root).</li><li><strong>Iterate & Join:</strong> Inspect each sorted edge; if endpoints belong to different sets, accept the edge into the MST and union their sets.</li><li><strong>Terminate:</strong> Stop when <code>|V| - 1</code> edges have been added or all edges have been inspected.</li></ol>",
    },
    {
      heading: "Trade-offs: Kruskal vs. Prim Algorithm",
      body: "<p>Choosing between Kruskal's and Prim's algorithms depends on graph density:</p><ul><li><strong>Sparse Graphs (<code>E ≈ V</code>):</strong> Kruskal excels because its runtime is dominated by edge sorting (<code>O(E log V)</code>) and edge iteration is lightweight.</li><li><strong>Dense Graphs (<code>E ≈ V²</code>):</strong> Prim's algorithm operating with an adjacency matrix or Fibonacci heap can outperform Kruskal's edge-sorting bottleneck.</li></ul>",
    },
    {
      heading: "Complexity Analysis",
      body: "<p><strong>Time Complexity:</strong> <code>O(E log E) = O(E log V)</code><br/>Sorting <code>E</code> edges takes <code>O(E log E)</code> time. DSU operations for <code>E</code> edges take <code>O(E · α(V))</code> amortized linear time.</p><p><strong>Space Complexity:</strong> <code>O(V + E)</code> to store parent/rank arrays in DSU and the sorted edge list.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Minimum Spanning Tree (MST)",
      definition:
        "An acyclic subset of edges T ⊆ E connecting all vertices V with minimal total edge weight.",
    },
    {
      term: "Disjoint-Set Union (DSU)",
      definition:
        "A data structure maintaining non-overlapping partitions of a set supporting near-constant time find and union operations.",
    },
    {
      term: "Cut Property",
      definition:
        "The theorem stating that the minimum-weight edge crossing any cut (S, V \\ S) is guaranteed to be in an MST.",
    },
    {
      term: "Inverse Ackermann Function α(n)",
      definition:
        "An extremely slow-growing function where α(n) ≤ 4 for all practical universe sizes n.",
    },
  ],
};

const KRUSKAL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines UnionFind class for tracking component roots and ranks.",
    2: "Constructor initializes root and rank arrays for given vertex count.",
    3: "Root array initializes each node pointing to itself (singleton components).",
    4: "Rank array initializes each node's tree rank to 1.",
    5: "Blank line separating constructor from find method.",
    6: "find(x) finds representative root of node x with path compression.",
    7: "Base case check: returns x if x is its own root leader.",
    8: "Returns root leader x when self-referential.",
    9: "Path compression: reparents node x directly to the root leader.",
    10: "Returns compressed representative root leader for node x.",
    11: "Blank line separating find method from union method.",
    12: "union(x, y) merges components containing nodes x and y.",
    13: "Finds representative root leader of node x.",
    14: "Finds representative root leader of node y.",
    15: "Checks if roots are distinct before performing component merge.",
    16: "Checks if rank of rootX is greater than rank of rootY.",
    17: "Attaches lower-rank rootY under higher-rank rootX.",
    18: "Checks if rank of rootX is less than rank of rootY.",
    19: "Attaches lower-rank rootX under higher-rank rootY.",
    20: "Equal rank fallback case.",
    21: "Attaches rootY under rootX when ranks are equal.",
    22: "Increments rank of rootX because equal-rank merge increases tree depth.",
    23: "Blank line separating union method from connected method.",
    24: "connected(x, y) checks if nodes x and y belong to the same component.",
    25: "Returns True if nodes x and y share the exact same root leader.",
    26: "Blank line separating UnionFind class from kruskal_mst function.",
    27: "Entry point: kruskal_mst(nodes, edges) computes the Minimum Spanning Tree.",
    28: "Maps string node IDs to 0-based integer indices for UnionFind.",
    29: "Instantiates UnionFind sized to total number of graph vertices.",
    30: "Sorts edges in ascending order by weight so lightest edges are examined first.",
    31: "Initializes empty list to collect accepted MST edges.",
    32: "Blank line separating edge sort from loop.",
    33: "Iterates over sorted edges from lightest to heaviest.",
    34: "Translates edge endpoint node IDs to integer indices.",
    35: "Checks if endpoints u and v are already connected in the MST.",
    36: "Merges the components of u and v to accept the edge.",
    37: "Appends accepted edge to the MST edge list.",
    38: "Blank line separating loop from return statement.",
    39: "Returns completed list of Minimum Spanning Tree edges.",
  },
};

export const kruskalMst: AlgorithmDefinition<KruskalInput> = {
  id: "kruskal-mst",
  title: "Kruskal's Minimum Spanning Tree",
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description:
    "<p><strong>Kruskal's algorithm</strong> constructs the Minimum Spanning Tree (MST) of a connected, undirected weighted graph <code>G = (V, E)</code>—the cheapest subset of <code>|V| - 1</code> edges connecting all vertices without any cycles.</p><p>It operates greedily: sort all <code>E</code> edges by weight from lightest to heaviest, then iterate through the list using a <strong>Disjoint-Set Union (DSU)</strong> structure to check whether adding each edge connects two distinct components. If distinct, the edge is added to the MST; if already connected, the edge is skipped to prevent cycles. Overall time complexity is <code>O(E log E)</code>.</p>",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "-10^4 <= Edge Weight <= 10^4",
    "Graph must be undirected; graph may be disconnected (yielding a Minimum Spanning Forest)",
    "Duplicate edge weights and parallel edges are supported",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "vertices = [A, B, C, D], edges = [(A,B,1), (B,C,2), (C,D,3), (A,C,4), (B,D,5)]",
      outputDisplay: "MST Weight = 6 (Edges: A-B, B-C, C-D)",
      title: "Basic 4-Node Graph",
      input: {
        nodes: [
          { id: "A", label: "A", x: 100, y: 100, state: "default" },
          { id: "B", label: "B", x: 250, y: 50, state: "default" },
          { id: "C", label: "C", x: 250, y: 200, state: "default" },
          { id: "D", label: "D", x: 400, y: 100, state: "default" },
        ],
        edges: [
          { from: "A", to: "B", weight: 1 },
          { from: "A", to: "C", weight: 4 },
          { from: "B", to: "C", weight: 2 },
          { from: "B", to: "D", weight: 5 },
          { from: "C", to: "D", weight: 3 },
        ],
      },
      output: "MST Weight: 6 (Edges: A-B, B-C, C-D)",
      explanation:
        "Edges are sorted by weight: A-B(1), B-C(2), C-D(3), A-C(4), B-D(5). Kruskal accepts A-B, B-C, C-D to connect all 4 nodes, then skips A-C and B-D as cycle-forming edges.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay:
        "vertices = [A, B, C, D, E], edges = [(C,D,1), (A,B,2), (B,C,3), (D,E,4), (C,E,8), (A,C,10)]",
      outputDisplay: "MST Weight = 10 (Edges: C-D, A-B, B-C, D-E)",
      title: "Adversarial Cycle & Dense Cluster",
      input: {
        nodes: [
          { id: "A", label: "A", state: "default" },
          { id: "B", label: "B", state: "default" },
          { id: "C", label: "C", state: "default" },
          { id: "D", label: "D", state: "default" },
          { id: "E", label: "E", state: "default" },
        ],
        edges: [
          { from: "A", to: "B", weight: 2 },
          { from: "B", to: "C", weight: 3 },
          { from: "A", to: "C", weight: 10 },
          { from: "C", to: "D", weight: 1 },
          { from: "D", to: "E", weight: 4 },
          { from: "C", to: "E", weight: 8 },
        ],
      },
      output: "MST Weight: 10 (Edges: C-D, A-B, B-C, D-E)",
      explanation:
        "Sorted edges: C-D(1), A-B(2), B-C(3), D-E(4), C-E(8), A-C(10). Light edges form the MST path A-B-C-D-E, while heavy edges C-E and A-C are skipped as redundant cycles.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "vertices = [A, B, C, D], edges = [(A,B,1), (C,D,2)]",
      outputDisplay: "Spanning Forest Weight = 3 (2 Edges)",
      title: "Boundary / Disconnected Graph",
      input: {
        nodes: [
          { id: "A", label: "A", state: "default" },
          { id: "B", label: "B", state: "default" },
          { id: "C", label: "C", state: "default" },
          { id: "D", label: "D", state: "default" },
        ],
        edges: [
          { from: "A", to: "B", weight: 1 },
          { from: "C", to: "D", weight: 2 },
        ],
      },
      output: "Spanning Forest Weight: 3 (2 Edges)",
      explanation:
        "The graph has 2 disconnected components {A, B} and {C, D}. Kruskal processes all available edges and forms a Minimum Spanning Forest of 2 edges, unable to construct a single connected V-1 spanning tree.",
    },
  ],
  code: KRUSKAL_CODE,
  timeComplexity: {
    best: "O(E log E)",
    average: "O(E log E)",
    worst: "O(E log E)",
  },
  spaceComplexity: "O(V + E)",
  complexityAnalysis: {
    time: "Sorting the edge list up front dominates everything: O(E log E). After that we walk the sorted edges once, and each union-find query runs in near-constant amortized time thanks to path compression, so the scan adds only about O(E) more. Best and worst case match because the sort always happens in full.",
    space:
      "Union-find stores one parent pointer per vertex, and we keep a sorted copy of the edge list alongside the growing MST, so extra memory is O(V + E).",
  },
  topicGuide: KRUSKAL_TOPIC_GUIDE,
  trivia: KRUSKAL_TRIVIA,
  leetcode: {
    id: 1584,
    url: "https://leetcode.com/problems/min-cost-to-connect-all-points/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #1584",
      leetcodeId: 1584,
      url: "https://leetcode.com/problems/min-cost-to-connect-all-points/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 15",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 15,
      section: "15.1 Kruskal's algorithm",
    },
  ],
  defaultInput: DEFAULT_KRUSKAL_INPUT,
  generateSteps: generateKruskalSteps,
};

export default kruskalMst;
