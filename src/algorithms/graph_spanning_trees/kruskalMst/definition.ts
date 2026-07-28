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
    "Kruskal's algorithm constructs a **Minimum Spanning Tree (MST)** for a connected, weighted, undirected graph $G = (V, E)$ by greedily processing edges in ascending order of weight $w(e)$. Using a **Disjoint-Set Union (DSU)** data structure with *path compression* and *union by rank*, Kruskal's algorithm connects components while discarding any edge that would form a cycle. It runs in $\\mathcal{O}(E \\log E)$ time, dominated by the initial edge sorting phase.",
  sections: [
    {
      heading: "Why It Exists & What It Solves",
      body: "Network design problems—such as connecting servers, power grids, or transportation hubs at minimal total infrastructure cost—require connecting all $|V|$ vertices without redundancy. Kruskal's algorithm solves this by selecting the cheapest subset of $|V| - 1$ edges that spans all $|V|$ vertices while keeping total weight $\\sum_{e \\in T} w(e)$ minimal without creating cycles.",
    },
    {
      heading: "Greedy Strategy & Cut Property",
      body: "Kruskal's algorithm relies on the **Cut Property**: for any cut $(S, V \\setminus S)$ dividing graph vertices into two non-empty sets, the minimum-weight edge $e = (u, v)$ crossing the cut belongs to some MST. By sorting edges globally so $w(e_1) \\le w(e_2) \\le \\dots \\le w(e_m)$, Kruskal guarantees that every accepted edge is the lightest edge bridging two currently disconnected forest components.",
    },
    {
      heading: "Union-find is the engine",
      body: "To determine if an edge $(u, v)$ creates a cycle, Kruskal queries the Union-Find structure: `find(u) == find(v)`. If `true`, $u$ and $v$ already share the same root representative, so adding $(u, v)$ would complete a simple cycle and the edge is rejected. If `false`, `union(u, v)` merges the two disjoint sets in amortized $\\mathcal{O}(\\alpha(|V|))$ time, where $\\alpha$ is the inverse Ackermann function.",
    },
    {
      heading: "Step-by-Step Intuition",
      body: "1. **Sort Edges**: Sort all $E$ edges in non-decreasing order of weight: $w(e_1) \\le w(e_2) \\le \\dots \\le w(e_E)$.\n2. **Initialize DSU**: Create $|V|$ singleton sets where `parent[i] = i` and `rank[i] = 1`.\n3. **Iterate & Check**: For each edge $e = (u, v, w)$, check if `find(u) != find(v)`.\n4. **Accept & Merge**: If in distinct components, accept $e$ into the MST set $T$ and execute `union(u, v)`.\n5. **Terminate**: Stop when $|T| = |V| - 1$ edges are collected or all edges have been inspected.",
    },
    {
      heading: "Trade-offs: Kruskal vs. Prim Algorithm",
      body: "Kruskal's algorithm shines on **sparse graphs** ($E \\approx V$) and when edge lists are easily sorted, executing in $\\mathcal{O}(E \\log V)$ time. **Prim's algorithm** operates locally from a starting node and is preferable for **dense graphs** ($E \\approx V^2$) when paired with a Fibonacci heap $\\mathcal{O}(E + V \\log V)$. Kruskal also naturally processes disconnected graphs into a **Minimum Spanning Forest**.",
    },
    {
      heading: "Complexity Analysis",
      body: "$$\\text{Time Complexity}: \\mathcal{O}(E \\log E) = \\mathcal{O}(E \\log V)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Time**: Edge sorting takes $\\mathcal{O}(E \\log E)$. DSU operations for $E$ edges require $\\mathcal{O}(E \\cdot \\alpha(V))$ time, which is effectively linear $\\mathcal{O}(E)$. Thus overall time is dominated by $\\mathcal{O}(E \\log E)$.\n- **Space**: The DSU arrays (`parent`, `rank`) consume $\\mathcal{O}(V)$ space, while storing the edge list and output MST consumes $\\mathcal{O}(E)$ space.",
    },
  ],
  keyTerms: [
    {
      term: "Minimum Spanning Tree (MST)",
      definition:
        "An acyclic subset $T \\subseteq E$ connecting all vertices $V$ with minimal total edge weight sum $\\sum_{e \\in T} w(e)$.",
    },
    {
      term: "Disjoint-Set Union (DSU)",
      definition:
        "Data structure maintaining non-overlapping partitions of a set supporting near-constant time `find` and `union` operations.",
    },
    {
      term: "Cut property",
      definition:
        "Theorem stating that the minimum-weight edge crossing any cut $(S, V \\setminus S)$ is guaranteed to be in an MST.",
    },
    {
      term: "Inverse Ackermann Function $\\alpha(n)$",
      definition:
        "An extremely slow-growing function where $\\alpha(n) \\le 4$ for all practical universe sizes $n < 10^{80}$.",
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
    "Kruskal's algorithm constructs the **Minimum Spanning Tree (MST)** of a connected, undirected weighted graph $G = (V, E)$—the cheapest subset of $|V| - 1$ edges connecting all vertices without any cycles. It operates greedily: sort all $E$ edges by weight from lightest to heaviest, then iterate through the list using a **Disjoint-Set Union (DSU)** structure to check whether adding each edge connects two distinct components. If distinct, the edge is added to the MST; if already connected, the edge is skipped to prevent cycles. Overall time complexity is $\\mathcal{O}(E \\log E)$.",
  constraints: [
    "1 <= Vertices V <= 10^4",
    "0 <= Edges E <= 10^5",
    "-10^4 <= Edge Weight <= 10^4",
    "Graph must be undirected and connected (to form a single spanning tree of V - 1 edges)",
    "Duplicate edge weights are supported",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "vertices = [A, B, C, D, E, F], edges = [(A,B,4), (A,C,2), (B,C,1), (B,D,5), (C,D,8), (C,E,10), (D,E,2)]",
      outputDisplay: "MST Weight = 12",
      title: "Basic Example",
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
        "Sorts edges by weight: A-B(1), B-C(2), C-D(3), A-C(4), B-D(5). Accepts A-B, B-C, C-D. Skips A-C and B-D as they form cycles.",
    },
    {
      kind: "complex",
      inputDisplay:
        "vertices = [A, B, C, D, E, F], edges = [(A,B,1), (B,C,2), (C,A,3), (C,D,4), (D,E,5), (E,F,6), (F,D,7)]",
      outputDisplay: "MST Weight = 18",
      title: "Complex Edge Case",
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
        "Edges C-D(1), A-B(2), B-C(3), D-E(4) are accepted in order (4 edges for 5 nodes). Heavy edges A-C(10) and C-E(8) are rejected as cycles.",
    },
    {
      kind: "negative",
      inputDisplay: "vertices = [A, B, C], edges = [(A,B,3)]",
      outputDisplay: "Disconnected Graph",
      title: "Failing / Boundary Case",
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
        "Graph has 2 disconnected components {A,B} and {C,D}. Kruskal builds a Minimum Spanning Forest of 2 edges, unable to form a single V-1 spanning tree.",
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
