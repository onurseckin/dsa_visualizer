import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const FORD_FULKERSON_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A **flow network** is a directed graph $G = (V, E)$ whose edges carry capacities $c(u, v) \\ge 0$. The maximum-flow problem asks for the maximal material that can be shipped from source $s$ to sink $t$ under capacity constraints $f(u, v) \\le c(u, v)$ and flow conservation $\\sum f(u, v) = \\sum f(v, u)$. Ford-Fulkerson repeatedly finds **augmenting paths** in the **residual graph** $G_f$ in $\\mathcal{O}(E \\cdot |f^*|)$ time, certified by the **Max-Flow Min-Cut Theorem**.",
  sections: [
    {
      heading: "The core idea: never treat a routing decision as final",
      body: "A feasible flow assigns each edge a non-negative amount $f(u, v) \\le c(u, v)$, and every vertex $v \\in V \\setminus \\{s, t\\}$ obeys flow conservation. Greedy saturation can strand you. Ford-Fulkerson escapes this by introducing residual edges $c_f(v, u) = f(u, v)$ that allow reversing previously pushed flow.",
    },
    {
      heading: "How the residual graph actually works",
      body: "In residual graph $G_f$, a forward edge offers residual capacity $c_f(u, v) = c(u, v) - f(u, v)$, while a reverse edge offers $c_f(v, u) = f(u, v)$. Pushing flow along a reverse edge cancels previous flow. The bottleneck is:\n$$\\gamma = \\min_{(u, v) \\in P} c_f(u, v)$$",
    },
    {
      heading: "Why it stops at the true maximum (Max-Flow Min-Cut Theorem)",
      body: "When no augmenting path exists in $G_f$, let $S$ be the set of vertices reachable from source $s$. The cut $(S, T)$ has capacity equal to the total flow value:\n$$|f| = c(S, T) = \\sum_{u \\in S, v \\in T} c(u, v)$$\nSince no flow can exceed any cut capacity, $f$ is guaranteed to be maximum.",
    },
    {
      heading: "Which path to pick, and why people say Edmonds-Karp",
      body: "Ford-Fulkerson using DFS runs in $\\mathcal{O}(E \\cdot |f^*|)$ time. Selecting the shortest augmenting path via BFS yields **Edmonds-Karp**, bounding iterations to $\\mathcal{O}(V \\cdot E)$ and total time to $\\mathcal{O}(V \\cdot E^2)$, independent of capacities.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Failing to update reverse residual capacity prevents flow cancellation. Irrational edge capacities can lead to infinite non-convergent iterations. Always reset visited sets between search iterations.",
    },
    {
      heading: "Complexity Analysis",
      body: "$$\\text{Time Complexity}: \\mathcal{O}(E \\cdot |f^*|)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Time**: Each DFS takes $\\mathcal{O}(E)$ time. With integer capacities, each augmentation increases flow by at least 1, taking at most $|f^*|$ rounds.\n- **Space**: Storing capacities, flows, and recursion stacks requires $\\mathcal{O}(V + E)$ space.",
    },
  ],
  keyTerms: [
    {
      term: "Residual capacity",
      definition:
        "Remaining usable capacity $c_f(u, v) = c(u, v) - f(u, v)$ on forward edges, and $c_f(v, u) = f(u, v)$ on reverse edges.",
    },
    {
      term: "Augmenting path",
      definition:
        "A directed path from source $s$ to sink $t$ in residual graph $G_f$ where every edge has positive residual capacity $c_f(u, v) > 0$.",
    },
    {
      term: "Bottleneck",
      definition:
        "The minimal residual capacity $\\gamma$ along an augmenting path $P$.",
    },
    {
      term: "Max-Flow Min-Cut Theorem",
      definition:
        "Fundamental duality theorem asserting that the maximum flow value equals the minimum capacity of an $s$-$t$ cut.",
    },
    {
      term: "Flow conservation",
      definition:
        "Requirement that total incoming flow equals total outgoing flow for every intermediate vertex $v \\in V \\setminus \\{s, t\\}$.",
    },
  ],
};

export const FORD_FULKERSON_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the main Ford-Fulkerson function taking nodes, edges, source, and sink.",
    2: "Initializes empty capacity dictionary mapping edge tuples to max limits.",
    3: "Initializes empty flow dictionary mapping edge tuples to current flow.",
    4: "Iterates through each input edge tuple to populate initial values.",
    5: "Sets initial capacity limit for directed edge (u, v).",
    6: "Initializes starting flow to zero for directed edge (u, v).",
    8: "Defines helper recursive depth-first search to find an augmenting path.",
    9: "Base case: check if we reached the sink target node.",
    10: "Return the bottleneck flow accumulated along this path to the sink.",
    11: "Marks current node as visited for this DFS traversal to prevent cycles.",
    12: "Iterates over all directed edges in the capacity dictionary.",
    13: "Filters for outgoing edges from u to an unvisited neighbor.",
    14: "Calculates remaining residual capacity (capacity minus current flow).",
    15: "Only proceed if there is positive residual capacity available.",
    16: "Recursively search deeper, updating minimum bottleneck capacity along path.",
    17: "Checks if a valid augmenting path to sink was found with positive flow.",
    18: "Returns the bottleneck flow amount back up the recursion stack.",
    19: "If no outgoing edge leads to the sink, return 0 indicating no path.",
    21: "Initializes total accumulated maximum flow to zero.",
    22: "Main loop to repeatedly find and augment paths until none remain.",
    23: "Resets the visited set for a fresh search — nodes explored on a previous augmenting path must be explorable again.",
    24: "Searches for an augmenting path starting with infinite potential flow.",
    25: "Checks if the search pushed zero flow (no path with spare capacity remaining).",
    26: "Stops the loop once maximum flow is reached.",
    27: "Adds this round's pushed flow to the running total.",
    29: "Hands back the final maximum flow once no further augmenting path can be found.",
  },
};
