import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KRUSKAL_CODE } from "./pythonCode";
import { generateKruskalSteps, type KruskalInput } from "./stepGenerator";

export const DEFAULT_KRUSKAL_INPUT: KruskalInput = {
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
};

const KRUSKAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A minimum spanning tree is the cheapest set of edges that keeps every vertex of an undirected weighted graph connected without any redundancy. This is the shape of problem you have whenever you must link things together at minimum total cost — laying cable between buildings, wiring a circuit, choosing which roads to pave — and note that it is about total cost, not about any single pair being close. Kruskal's algorithm builds that tree by sorting every edge by weight and walking the list from cheapest to most expensive, keeping an edge whenever it joins two pieces that are not yet connected. Its whole engine is a disjoint-set (union-find) structure, so learning Kruskal is really learning two topics at once.",
  sections: [
    {
      heading: "Cheapest edge that does not close a loop",
      body: "Picture the vertices as a pile of separate fragments, each initially alone, that you are trying to fuse into one piece. Walking the edges in increasing weight order, an edge is useful exactly when its two endpoints sit in different fragments, because then it merges them and reduces the fragment count by one. If both endpoints already sit in the same fragment they are connected by a path already, so the edge would only create a cycle and add weight for nothing. You therefore need to answer one question quickly, over and over: are these two vertices already in the same fragment? Everything else in the algorithm is bookkeeping around that question.",
    },
    {
      heading: "Union-find is the engine",
      body: "Each fragment is represented by a tree of parent pointers, and its identity is whichever vertex sits at the root. To test two endpoints you follow parent pointers from each up to its root and compare the two roots; to merge fragments you make one root point at the other. Left alone those trees can grow into long chains, so two refinements keep them flat: path compression rewires every vertex you walked past to point straight at the root, and union by rank or size always hangs the smaller tree under the larger. With both in place, the connectivity queries cost so little that sorting the edges dominates the entire run. A useful stopping rule falls out of the same structure — once you have accepted one fewer edge than there are vertices, the tree is complete and the rest of the sorted list can be ignored.",
    },
    {
      heading: "Why greedy is provably optimal here",
      body: "The guarantee comes from the cut property: if you split the vertices into two groups in any way at all, the lightest edge crossing that split belongs to some minimum spanning tree. Every edge Kruskal accepts is the lightest remaining edge crossing the boundary between the fragment it joins and everything else, which is precisely a cut of that form, so no accepted edge is ever a mistake. The mirror image is the cycle property: the heaviest edge of any cycle can always be left out, which justifies every edge Kruskal skips. Put together they say that the greedy order never paints you into a corner, and you can also see it as an exchange argument — swapping in a cheaper crossing edge could only improve a supposedly optimal tree, so the cheap one must have been safe to take.",
    },
    {
      heading: "Kruskal, Prim, or something else",
      body: "Prim's algorithm solves the identical problem from the other side: it grows one connected tree outward from a starting vertex, always absorbing the cheapest edge leaving the current tree, which is the same greedy principle applied to a single cut. Prim tends to win on dense graphs because it never needs a global sort and works naturally from an adjacency structure, while Kruskal shines on sparse graphs and especially when the edges arrive already sorted or can be sorted cheaply, since then the algorithm is little more than a scan. Kruskal also degrades gracefully into a very useful tool when you feed it a disconnected graph — it returns a minimum spanning forest, one tree per connected component, which Prim from a single seed cannot do. And if you need the maximum spanning tree instead, just walk the sorted list in the opposite direction; nothing else changes.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Negative edge weights are entirely harmless here, unlike in shortest-path problems, because a spanning tree must contain a fixed number of edges no matter what and there is no cycle to exploit. Equal weights mean several different minimum spanning trees may exist; your tie-breaking decides which one you get, but the total weight is identical, so a test asserting a specific edge set can be wrong while the algorithm is right. The algorithm assumes undirected edges — the directed analogue, a minimum spanning arborescence, needs a genuinely different method and cannot be obtained by ignoring direction. Two implementation traps are worth naming: comparing endpoint labels instead of their roots, which misses cycles created through intermediate vertices, and skipping path compression, which quietly turns the union-find into a linked list on adversarial inputs.",
    },
    {
      heading: "Where this pattern shows up again",
      body: 'The accept-or-skip loop over sorted edges is a general recipe for "combine cheapest first" problems. Stop Kruskal early, after accepting a chosen number of merges, and you have single-linkage clustering, where the fragments are the clusters and the next edge you would have taken measures the separation between them. The minimum spanning tree also solves the minimum-bottleneck path problem for free: the path between any two vertices inside the tree minimizes the heaviest edge you must cross, which is why the same structure answers maximum-capacity routing questions. More broadly, processing edges in weight order while maintaining connectivity is the standard offline technique for questions like "at what threshold do these two vertices first become connected", and recording the merge history as a tree turns those into simple ancestor lookups.',
    },
  ],
  keyTerms: [
    {
      term: "Spanning tree",
      definition:
        "A subset of edges that connects every vertex while containing no cycle, which forces it to have exactly one fewer edge than there are vertices. The minimum spanning tree is the one whose edge weights sum to the smallest possible total.",
    },
    {
      term: "Disjoint-set union (union-find)",
      definition:
        "The structure that tracks which vertices currently belong to the same fragment, supporting a find operation that names a fragment and a union operation that merges two of them.",
    },
    {
      term: "Path compression",
      definition:
        "Re-pointing every vertex encountered during a find directly at the root, so later queries on the same fragment take a single step. It is what keeps union-find effectively constant time.",
    },
    {
      term: "Cut property",
      definition:
        "The theorem doing all the work: for any way of splitting the vertices into two groups, the lightest edge crossing the split belongs to some minimum spanning tree. Each edge Kruskal accepts is such an edge.",
    },
    {
      term: "Spanning forest",
      definition:
        "What you get when the graph is not connected: one minimum spanning tree per connected component. Kruskal produces it naturally, since it simply runs out of merging edges.",
    },
  ],
};

const KRUSKAL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Packages the UnionFind structure with ranking and path compression to track component roots and merge sets efficiently.',
    2: "Constructor initializes root and rank arrays for a given size.",
    3: "Root array maps each node to itself initially, forming singleton components.",
    4: "Rank array tracks tree height, initialized to 1 for each component.",
    6: "Finds the component root of element x by following root pointers.",
    7: "Loops up parent pointers until reaching a node pointing to itself.",
    8: "Advances x to its parent node.",
    9: "Returns the root node representing x's component.",
    11: "Unites the components containing x and y using rank heuristics.",
    12: "Finds the component root of x.",
    13: "Finds the component root of y.",
    14: "Only merges if x and y belong to different components.",
    15: "Hangs lower-rank rootY under higher-rank rootX.",
    16: "Sets rootX as the parent of rootY.",
    17: "Hangs lower-rank rootX under higher-rank rootY.",
    18: "Sets rootY as the parent of rootX.",
    19: "Equal rank case: arbitrarily hangs rootY under rootX.",
    20: "Sets rootX as the parent of rootY.",
    21: "Increments rank of rootX since tree depth increased.",
    23: "Checks if elements x and y belong to the same component.",
    24: "Returns true if x and y share the same component root.",
    26: "Entry point: builds minimum spanning tree using UnionFind and greedy edge selection.",
    27: "Maps string node IDs to 0-based integer indices for UnionFind.",
    28: "Creates UnionFind instance sized to total number of nodes.",
    29: "Sorts edges in ascending order by weight so lightest edges are processed first.",
    30: "Initializes list to collect accepted MST edges.",
    31: "Iterates through edges from lightest to heaviest.",
    32: "Translates edge endpoint node IDs to integer indices.",
    33: "Checks if endpoints u and v are already connected.",
    34: "Merges the components of u and v to accept the edge.",
    35: "Appends accepted edge to the MST.",
    36: "Returns completed Minimum Spanning Tree.",
  },
};

export const kruskalMst: AlgorithmDefinition<KruskalInput> = {
  id: "kruskal-mst",
  title: "Kruskal's Minimum Spanning Tree",
  category: "graph_spanning_trees",
  difficulty: "Medium",
  description:
    "Kruskal's algorithm builds the Minimum Spanning Tree (MST) of a connected, undirected weighted graph — the cheapest possible set of edges that connects all V vertices without any cycles. It works greedily: sort every edge by weight, then walk the list from lightest to heaviest. For each edge (u, v), a union-find (DSU) structure with path compression checks whether u and v already belong to the same component. If they don't, the edge is kept and the two components are merged; if they do, the edge would close a cycle, so it is skipped.",
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
      inputDisplay: "vertices = [A, B, C, D, E, F], edges = [(A,B,4), (A,C,2), (B,C,1), (B,D,5), (C,D,8), (C,E,10), (D,E,2)]",
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
      inputDisplay: "vertices = [A, B, C, D, E, F], edges = [(A,B,1), (B,C,2), (C,A,3), (C,D,4), (D,E,5), (E,F,6), (F,D,7)]",
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
