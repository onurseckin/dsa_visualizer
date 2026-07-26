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
    1: 'Packages the union-find (disjoint-set) structure that answers "are these two nodes already connected?" in near-constant time — the engine the whole greedy algorithm runs on.',
    2: "Constructor: sets up one parent pointer per node before any edges are considered.",
    3: "Every node starts as its own parent — its own singleton component — since nothing has been merged yet.",
    5: "Answers which component a node belongs to by walking parent pointers up to the root.",
    6: "A node that is its own parent is the root of its component — the base case of the walk.",
    7: "Found the root; hand it back as the component's identity.",
    8: "Path compression: rewires this node to point straight at the root it just found, so future find() calls on it are near-instant.",
    9: "Returns the (now directly linked) root after compression.",
    11: "Merges the components containing i and j, but only if they are not already the same component.",
    12: "Looks up which component the first endpoint belongs to.",
    13: "Looks up which component the second endpoint belongs to.",
    14: "The critical test: different roots mean this edge would connect two previously separate pieces rather than close a cycle.",
    15: "Fuses the two components by pointing one root at the other.",
    16: "Signals that a real merge happened — this edge belongs in the spanning tree.",
    17: "Same-root case: the endpoints were already connected, so keeping this edge would only create a cycle.",
    19: "Entry point: builds the minimum spanning tree from every node and every weighted edge.",
    20: "Creates the union-find structure, starting every node in its own component.",
    21: "Sorts edges cheapest-first — the whole greedy idea depends on always considering the lightest possible connector before any heavier one.",
    22: "The growing set of accepted edges that will form the spanning tree.",
    24: "Walks the edges in increasing weight order, exactly the order the cut-property argument requires.",
    25: "Accepts the edge only if its endpoints were in different components — union both tests and merges in one call.",
    26: "Keeps this edge: it was the cheapest way to connect its two components, so including it can never turn out to be a mistake.",
    28: "Once every edge has been considered, the accepted set is a minimum spanning tree — cheapest total weight, no cycles.",
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
      input: "4 nodes (A,B,C,D), 5 edges: [A-B(1), B-C(2), C-D(3), A-C(4), B-D(5)]",
      output: "MST Edges: [A-B(1), B-C(2), C-D(3)], Total Weight = 6",
      explanation:
        "1. Sort edges: A-B(1), B-C(2), C-D(3), A-C(4), B-D(5). 2. Accept A-B(1). 3. Accept B-C(2). 4. Accept C-D(3). 5. Edge A-C(4) forms cycle (roots A & C connected via B), skipped. MST total weight = 6.",
    },
    {
      input: "3 nodes (A,B,C) forming a triangle with weights A-B(5), B-C(5), A-C(10)",
      output: "MST Edges: [A-B(5), B-C(5)], Total Weight = 10",
      explanation:
        "Selecting the two lightest edges connects all 3 vertices into an MST without forming the triangle cycle.",
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
  defaultInput: DEFAULT_KRUSKAL_INPUT,
  generateSteps: generateKruskalSteps,
};

export default kruskalMst;
