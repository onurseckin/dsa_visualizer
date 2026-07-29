import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KRUSKAL_CODE } from "./pythonCode";
import { generateKruskalSteps, type KruskalInput } from "./stepGenerator";

export const DEFAULT_KRUSKAL_INPUT: KruskalInput = {
  nodes: [
    { id: "A", label: "A", x: 90, y: 140, state: "default" },
    { id: "B", label: "B", x: 230, y: 60, state: "default" },
    { id: "C", label: "C", x: 230, y: 240, state: "default" },
    { id: "D", label: "D", x: 420, y: 60, state: "default" },
    { id: "E", label: "E", x: 420, y: 240, state: "default" },
    { id: "F", label: "F", x: 560, y: 150, state: "default" },
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
    28: "Checks whether zero or one vertex already needs no edges to form a spanning tree.",
    29: "Returns immediately for that trivial input.",
    30: "Blank line separating the trivial-input guard from setup.",
    31: "Maps string node IDs to 0-based integer indices for UnionFind.",
    32: "Instantiates UnionFind sized to the total number of graph vertices.",
    33: "Sorts edges in ascending order by weight so lightest edges are examined first.",
    34: "Initializes the list that collects accepted MST edges.",
    35: "Blank line separating setup from the sorted-edge loop.",
    36: "Iterates over sorted edges from lightest to heaviest.",
    37: "Stops once |V| - 1 accepted edges already connect every vertex.",
    38: "Leaves the loop immediately instead of examining unnecessary later edges.",
    39: "Translates edge endpoint node IDs to integer indices.",
    40: "Checks whether endpoints u and v are already connected in the forest.",
    41: "Merges the components of u and v to accept a safe edge.",
    42: "Appends the accepted edge to the completed MST.",
    43: "Blank line separating the loop from the return statement.",
    44: "Returns the accepted MST edges, or a minimum spanning forest for a disconnected graph.",
  },
};

export const kruskalMst: AlgorithmDefinition<KruskalInput> = {
  id: "kruskal-mst",
  title: "Kruskal's Minimum Spanning Tree",
  topicIds: ["graph_spanning_trees"],
  difficulty: "Medium",
  description: `<p>Given a connected, undirected weighted graph <code>G = (V, E)</code>, find a Minimum Spanning Tree (MST)—a subset of edges that connects all vertices together without any cycles and with the minimum possible total edge weight.</p>
<h3>Problem Statement</h3>
<p>Given a weighted undirected graph with <em>|V|</em> vertices and <em>|E|</em> edges, find a spanning tree (or spanning forest if disconnected) that connects all vertices while minimizing the sum of all edge weights in the tree.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nodes</code>: List of graph node objects representing vertices.</li>
  <li><code>edges</code>: List of weighted edge objects connecting pairs of vertices.</li>
</ul>
<h3>Output</h3>
<p>Returns the list of accepted edges forming the Minimum Spanning Tree (or Forest) and the total sum of their weights.</p>
`,
  constraints: [
    "0 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "Omitted edge weights default to 1; supplied weights must be finite numbers with -10^4 <= weight <= 10^4",
    "Vertex IDs must be unique, and every edge endpoint must reference a listed vertex",
    "Graph must be undirected; graph may be disconnected (yielding a Minimum Spanning Forest)",
    "Duplicate edge weights are supported; this visual tutorial requires no self-loops and at most one undirected edge per vertex pair",
  ],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "vertices = [A, B, C, D, E, F], edges = [(A,B,1), (B,C,2), (C,E,3), (A,C,4), (B,D,5), (D,E,6), (D,F,7), (E,F,8), (C,D,9)]",
      outputDisplay: "MST Weight = 18 (Edges: A-B, B-C, C-E, B-D, D-F)",
      title: "Standard 6-Node Network",
      input: DEFAULT_KRUSKAL_INPUT,
      output: "MST Weight: 18 (Edges: A-B, B-C, C-E, B-D, D-F)",
      explanation:
        "Edges are sorted by weight: A-B(1), B-C(2), C-E(3), A-C(4), B-D(5), D-E(6), D-F(7), E-F(8), C-D(9). Kruskal accepts A-B, B-C, C-E, rejects A-C due to cycle A-B-C, accepts B-D, rejects D-E, and accepts D-F. With 5 = |V| - 1 accepted edges, it terminates early.",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay:
        "vertices = [A, B, C, D, E], edges = [(C,D,1), (A,B,2), (B,C,3), (A,C,4), (D,E,5), (C,E,8)]",
      outputDisplay: "MST Weight = 11 (Edges: C-D, A-B, B-C, D-E)",
      title: "Adversarial Cycle & Dense Cluster",
      input: {
        nodes: [
          { id: "A", label: "A", x: 90, y: 140, state: "default" },
          { id: "B", label: "B", x: 230, y: 60, state: "default" },
          { id: "C", label: "C", x: 230, y: 240, state: "default" },
          { id: "D", label: "D", x: 410, y: 100, state: "default" },
          { id: "E", label: "E", x: 520, y: 220, state: "default" },
        ],
        edges: [
          { from: "A", to: "B", weight: 2 },
          { from: "B", to: "C", weight: 3 },
          { from: "A", to: "C", weight: 4 },
          { from: "C", to: "D", weight: 1 },
          { from: "D", to: "E", weight: 5 },
          { from: "C", to: "E", weight: 8 },
        ],
      },
      output: "MST Weight: 11 (Edges: C-D, A-B, B-C, D-E)",
      explanation:
        "Sorted edges: C-D(1), A-B(2), B-C(3), A-C(4), D-E(5), C-E(8). After the first three edges form the path A-B-C-D, A-C is rejected because A and C already have a route through B; D-E then connects the last vertex, so Kruskal stops before C-E.",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "vertices = [A, B, C, D], edges = [(A,B,1), (C,D,2)]",
      outputDisplay: "Spanning Forest Weight = 3 (2 Edges)",
      title: "Boundary / Disconnected Graph",
      input: {
        nodes: [
          { id: "A", label: "A", x: 120, y: 80, state: "default" },
          { id: "B", label: "B", x: 120, y: 220, state: "default" },
          { id: "C", label: "C", x: 450, y: 80, state: "default" },
          { id: "D", label: "D", x: 450, y: 220, state: "default" },
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
