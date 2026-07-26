import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const KOSARAJU_SCC_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Strong connectivity asks a sharper question than plain reachability: not whether you can get from u to v, but whether you can get back again. In a directed graph the vertices fall into maximal groups where every member reaches every other member, and those groups are the strongly connected components. Kosaraju's algorithm finds all of them with two ordinary depth-first sweeps and one edge reversal, and as a bonus it hands you the condensation — the graph you get by collapsing each component to a single node, which is always acyclic. That is the real payoff, because it lets you run DAG techniques such as topological ordering or longest-path dynamic programming on graphs that were never acyclic to begin with.",
  sections: [
    {
      heading: "The core idea: components are the maximal cycles",
      body: "Two vertices belong to the same component exactly when a round trip passes through both of them, and mutual reachability is an equivalence relation, so the components partition the vertices with no overlaps and no leftovers. A vertex that sits on no cycle at all is still a component — one of size one — which is why isolated vertices must never be skipped. Collapse each component to a point and every surviving edge runs from one component to another with no way back, so the condensation is guaranteed to be a directed acyclic graph. Seeing the problem this way reframes it: you are hunting for the maximal cycles, and everything acyclic then arranges itself into a layered hierarchy above and below them.",
    },
    {
      heading: "How the first pass builds an ordering",
      body: "The first depth-first search ignores components entirely; all it wants is an order. You walk the original graph, and the moment a vertex has no unexplored outgoing edge left you push it onto a stack, which records its finish time. Because a vertex can only finish after everything still reachable from it has finished, the stack ends up with upstream vertices on top and downstream vertices buried beneath them. This is not a topological order — the graph has cycles, so none exists — but it is exactly the weaker property you need: for any edge running from component C to component C', some vertex of C finishes later than every vertex of C'.",
    },
    {
      heading: "How the second pass peels components off the transpose",
      body: "Now you reverse every edge to form the transpose, then pop vertices off the finish stack and launch a fresh search from each one you have not yet visited. Anything that search reaches in the transpose is a vertex that could reach your starting vertex in the original graph, and because the stack handed you a vertex from a component with no unvisited predecessors, the only vertices that qualify are the ones that also reach back. The search therefore halts precisely at the component boundary, and the set it collects is one entire component. Mark those vertices, keep popping until you meet another unvisited one, and repeat; each restart peels off the next component in condensation order.",
    },
    {
      heading: "Why two passes are enough",
      body: "Correctness rests on the finish-time claim from the first pass, which turns the stack into a topological order of the condensation. Given that order, every root you choose in the second pass comes from a component whose predecessors have already been consumed, and the transpose makes the fence self-sustaining: at the moment you start from root r, every component that could leak into r's component through a reversed edge is already visited, so the traversal is boxed in. Both halves are load-bearing. Search the original graph in the second pass and you sweep up entire downstream subgraphs, and pick roots in arbitrary order and separate components fuse into one, so the reported answer is too coarse either way.",
    },
    {
      heading: "When to reach for Kosaraju versus Tarjan",
      body: "Kosaraju and Tarjan both decompose a graph in linear time, so the choice is about shape rather than speed. Tarjan finds components during a single traversal using a lowlink value and an on-stack marker, which avoids materialising the transpose and is what you want when memory is tight or the edges come from a stream you cannot cheaply reverse. Kosaraju wins on explainability — two plain depth-first searches with nothing clever inside either of them — which makes it the version worth learning first and the one easiest to reconstruct under pressure. Union-find is not a candidate here, because disjoint-set structures merge symmetric relationships and directed reachability is not symmetric.",
    },
    {
      heading: "Pitfalls and what the components unlock",
      body: "The most common bug is sharing one visited set across both passes, which leaves the second pass with nothing to do; each pass needs its own. Next comes draining the finish stack in the wrong direction, since it must be last-finished first, and after that recursion depth, because a graph shaped like a long chain overflows the call stack and wants an explicit stack instead. Self-loops and parallel edges are harmless, and a graph with no edges simply yields one component per vertex. Once components are labelled you can build the condensation and treat any directed graph as a DAG, which is how counting mutually reachable groups, finding the longest path in a cyclic graph, and 2-SAT all reduce to this one decomposition — a 2-SAT formula is satisfiable exactly when no variable shares a component with its own negation.",
    },
  ],
  keyTerms: [
    {
      term: "Strongly connected component",
      definition:
        "A maximal set of vertices in which every vertex can reach every other vertex by following edge directions. Maximal matters: you cannot add another vertex without breaking the mutual-reachability property.",
    },
    {
      term: "Transpose graph",
      definition:
        "The same vertex set with every edge direction flipped. Reachability in the transpose is exactly backwards reachability in the original, which is what lets the second pass fence a component in.",
    },
    {
      term: "Finish time",
      definition:
        "The moment a depth-first search finishes exploring a vertex, after all of its outgoing edges have been examined. Pushing vertices onto a stack in finish order is how the first pass encodes the component ordering.",
    },
    {
      term: "Condensation",
      definition:
        "The graph obtained by contracting each strongly connected component into one node. It is always acyclic, so it lets you apply DAG algorithms to graphs full of cycles.",
    },
    {
      term: "Mutual reachability",
      definition:
        "The relation that holds between u and v when a directed path runs both ways between them. Because it is reflexive, symmetric, and transitive, it partitions the vertices into components rather than merely grouping some of them.",
    },
  ],
};

export const KOSARAJU_SCC_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines main function taking node count and directed edge list.",
    2: "Comment marking Pass 1 setup: DFS to record vertices on a stack in finish-time order.",
    3: "Visited set for Pass 1 to prevent visiting nodes more than once.",
    4: "Finish-time stack: nodes are pushed when all their outgoing edges are done.",
    5: "Pass 1 DFS helper for a single vertex.",
    6: "Marks u visited in Pass 1.",
    7: "Iterates through outgoing neighbors of u.",
    8: "Recurses on unvisited neighbor v.",
    9: "Recurses first, so u can only finish after everything reachable from it has already finished.",
    10: "Pushes u onto the stack the moment it finishes — exactly the post-order that puts upstream vertices on top.",
    12: "Sweeps every vertex to make sure disconnected pieces of the graph get their own DFS too.",
    13: "Only launches a fresh DFS from vertices no prior call has already reached.",
    14: "Starts pass 1 from this unvisited vertex, extending the finish-order stack to cover its whole reachable region.",
    16: "Marks the transition to the phase that actually extracts components, using the finish order and the reversed graph together.",
    17: "Resets visited tracking for pass 2 — reusing pass 1's set here would make the second sweep do nothing, since everything would already look visited.",
    18: "Will collect each discovered strongly connected component as its own list of vertices.",
    19: "A depth-first search on the transposed (edge-reversed) graph that collects every vertex it reaches into one component.",
    20: "Marks u claimed by the component currently being built, using pass 2's own visited set.",
    21: "Adds u to the SCC currently under construction.",
    22: "Walks u's neighbors in the reversed graph — reachability here corresponds to backward reachability in the original graph.",
    23: "Skips any vertex already claimed by this or an earlier component.",
    24: "Recurses to pull v into the same component; the reversed edges keep this search fenced inside one true SCC.",
    26: "Processes vertices in reverse finish order — last-finished first — which is what guarantees each restart lands on an unclaimed component root.",
    27: "Pops the top of the finish stack, the latest-finishing vertex still remaining.",
    28: "Only starts a new component search if u hasn't already been swept into an earlier one.",
    29: "Opens a fresh, empty component list to be filled by this round of DFS.",
    30: "Runs the fenced search on the transpose, collecting exactly one full strongly connected component starting from u.",
    31: "Records the completed component before moving on to the next unclaimed vertex on the stack.",
    32: "Every vertex has now been assigned to exactly one component — the full SCC decomposition of the graph.",
  },
};
