import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const FORD_FULKERSON_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>flow network</strong> is a directed graph <code>G = (V, E)</code> whose edges carry non-negative capacities <code>c(u, v) &ge; 0</code>. The maximum-flow problem asks for the maximal material that can be shipped from source <code>s</code> to sink <code>t</code> under capacity constraints <code>f(u, v) &le; c(u, v)</code> and flow conservation. Ford-Fulkerson repeatedly finds <strong>augmenting paths</strong> in the <strong>residual graph</strong> <code>G<sub>f</sub></code> in <code>O(E &middot; |f*|)</code> time, certified by the <strong>Max-Flow Min-Cut Theorem</strong>.</p>",
  sections: [
    {
      heading: "The Core Idea: Dynamic Flow Cancellation",
      body: "<p>A feasible flow assigns each edge a non-negative amount <code>f(u, v) &le; c(u, v)</code>, and every vertex <code>v &isin; V &setminus; {s, t}</code> obeys flow conservation. Greedy saturation can strand the algorithm in a non-optimal state. Ford-Fulkerson escapes this by introducing residual edges with reverse capacity <code>c<sub>f</sub>(v, u) = f(u, v)</code> that allow reversing previously pushed flow.</p>",
    },
    {
      heading: "How the Residual Graph Works",
      body: "<p>In residual graph <code>G<sub>f</sub></code>, a forward edge offers residual capacity <code>c<sub>f</sub>(u, v) = c(u, v) - f(u, v)</code>, while a reverse edge offers <code>c<sub>f</sub>(v, u) = f(u, v)</code>. Pushing flow along a reverse edge cancels previous flow. The path bottleneck is the minimum residual capacity along the augmenting path: <code>&gamma; = min_{(u, v) &isin; P} c<sub>f</sub>(u, v)</code>.</p>",
    },
    {
      heading: "Max-Flow Min-Cut Theorem",
      body: "<p>When no augmenting path exists in <code>G<sub>f</sub></code>, let <code>S</code> be the set of vertices reachable from source <code>s</code>. The cut <code>(S, T)</code> has capacity equal to the total flow value: <code>|f| = c(S, T) = &sum; c(u, v)</code>. Since no flow can exceed any cut capacity, <code>f</code> is guaranteed to be maximum.</p>",
    },
    {
      heading: "Which Path to Pick: Edmonds-Karp Variant",
      body: "<p>Ford-Fulkerson using Depth-First Search (DFS) runs in <code>O(E &middot; |f*|)</code> time. Selecting the shortest augmenting path via Breadth-First Search (BFS) yields <strong>Edmonds-Karp</strong>, bounding iterations to <code>O(V &middot; E)</code> and total execution time to <code>O(V &middot; E<sup>2</sup>)</code>, independent of numeric capacities.</p>",
    },
    {
      heading: "Pitfalls and Edge Cases",
      body: "<p>Failing to update reverse residual capacity prevents flow cancellation. Irrational edge capacities can lead to infinite non-convergent iterations. Always reset visited sets between search iterations.</p>",
    },
    {
      heading: "Complexity Analysis",
      body: "<p><strong>Time Complexity:</strong> <code>O(E &middot; |f*|)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code></p><ul><li><strong>Time:</strong> Each DFS takes <code>O(E)</code> time. With integer capacities, each augmentation increases flow by at least 1, taking at most <code>|f*|</code> rounds.</li><li><strong>Space:</strong> Storing capacities, flows, and recursion stacks requires <code>O(V + E)</code> space.</li></ul>",
    },
  ],
  keyTerms: [
    {
      term: "Residual capacity",
      definition:
        "Remaining usable capacity c_f(u, v) = c(u, v) - f(u, v) on forward edges, and c_f(v, u) = f(u, v) on reverse edges.",
    },
    {
      term: "Augmenting path",
      definition:
        "A directed path from source s to sink t in residual graph G_f where every edge has positive residual capacity c_f(u, v) > 0.",
    },
    {
      term: "Bottleneck",
      definition: "The minimal residual capacity &gamma; along an augmenting path P.",
    },
    {
      term: "Max-Flow Min-Cut Theorem",
      definition:
        "Fundamental duality theorem asserting that the maximum flow value equals the minimum capacity of an s-t cut.",
    },
    {
      term: "Flow conservation",
      definition:
        "Requirement that total incoming flow equals total outgoing flow for every intermediate vertex v &isin; V &setminus; {s, t}.",
    },
  ],
};

export const FORD_FULKERSON_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the main Ford-Fulkerson function taking nodes, edges, source, and sink.",
    2: "Initializes an empty capacity dictionary mapping directed edge tuples.",
    3: "Iterates through each input edge tuple to populate initial values.",
    4: "Sets initial capacity limit for directed edge (u, v).",
    5: "Iterates over authored edges again to create reverse residual edges.",
    6: "Adds a zero-capacity reverse edge without overwriting an authored antiparallel edge.",
    7: "Initializes zero skew-symmetric flow for every forward and reverse edge.",
    9: "Defines helper recursive depth-first search to find an augmenting path.",
    10: "Base case: check if we reached the sink target node.",
    11: "Return the bottleneck flow accumulated along this path to the sink.",
    12: "Marks current node as visited for this DFS traversal to prevent cycles.",
    13: "Iterates over all forward and reverse residual edges.",
    14: "Filters for outgoing edges from u to an unvisited neighbor.",
    15: "Calculates remaining residual capacity (capacity minus skew-symmetric flow).",
    16: "Only proceeds if there is positive residual capacity available.",
    17: "Recursively searches deeper, updating the minimum path bottleneck.",
    18: "Checks whether the recursive search reached the sink.",
    19: "Augments flow along the selected residual edge.",
    20: "Updates reverse flow so a later augmenting path can cancel this routing.",
    21: "Returns the bottleneck flow amount back up the recursion stack.",
    22: "If no outgoing edge leads to the sink, returns 0 indicating no path.",
    24: "Initializes total accumulated maximum flow to zero.",
    25: "Main loop repeatedly finds and augments paths until none remain.",
    26: "Resets the visited set for a fresh residual search.",
    27: "Searches for an augmenting path starting with infinite potential flow.",
    28: "Checks if the search pushed zero flow.",
    29: "Stops once no augmenting path remains.",
    30: "Adds this round's pushed flow to the running total.",
    32: "Returns the final maximum flow.",
  },
};
