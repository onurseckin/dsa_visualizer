import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const FORD_FULKERSON_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A flow network is a directed graph whose edges carry capacities, and the maximum-flow problem asks how much you can ship from a source to a sink without exceeding any capacity or letting material pile up at an intermediate vertex. Ford-Fulkerson answers it with a strikingly plain loop: while some path from source to sink still has spare capacity, push as much as that path allows, then look again. The idea that makes the loop work is the residual graph, a piece of bookkeeping that lets a later path undo part of an earlier commitment. Because the finished flow is certified by a cut, this one algorithm also delivers minimum cuts, bipartite matchings, and a surprising range of problems that look nothing like plumbing.",
  sections: [
    {
      heading: "The core idea: never treat a routing decision as final",
      body: "A feasible flow assigns each edge a non-negative amount no larger than its capacity, and every vertex other than the source and the sink must send out exactly what it takes in. The obvious greedy approach — find any path, saturate it, repeat — can strand you, because committing traffic to a middle edge such as A to B in the default network can leave capacity elsewhere unusable, and no purely additive repair recovers it. Ford-Fulkerson escapes that trap by making every commitment reversible: each unit you push forward is simultaneously recorded as permission to push a unit back the other way. The greedy loop becomes correct not because it chooses well but because it can always change its mind.",
    },
    {
      heading: "How the residual graph actually works",
      body: "Rather than searching the original network you search the residual graph, where a forward edge from u to v offers capacity minus current flow, and a matching reverse edge from v to u offers exactly the flow already pushed forward. Sending flow along that reverse edge is not shipping anything upstream; it cancels part of a previous decision and frees the original edge to serve a different route. An augmenting path is any source-to-sink path through this residual graph, and its bottleneck is the smallest residual capacity along it, which is the most you can push without breaking a capacity. Augmenting means subtracting the bottleneck from every forward residual on the path and adding it to every reverse one, and doing both keeps conservation intact automatically at each intermediate vertex.",
    },
    {
      heading: "Why it stops at the true maximum",
      body: "The loop ends when a search finds no augmenting path, and the reason that means maximum is worth understanding rather than memorising. Let S be the set of vertices still reachable from the source in the final residual graph; the sink is not in S, so the edges leaving S form a cut. Every edge leaving S must be saturated, or the search would have crossed it, and every edge entering S must carry zero flow, or its reverse residual would have offered a way across. So the flow value equals the capacity of that cut, and since no flow can ever exceed the capacity of any cut, the flow is maximum and the cut is minimum at the same moment. That reachable set is also how you read the real bottleneck edges out of a finished run rather than just the final number.",
    },
    {
      heading: "Which path to pick, and why people say Edmonds-Karp",
      body: "Ford-Fulkerson deliberately does not say how to find the augmenting path, and that freedom is the source of its reputation for fragility. With integer capacities every augmentation moves at least one unit, so the loop always terminates, but a depth-first search that keeps rediscovering a small middle edge can need as many rounds as the answer is large. Always choosing the shortest augmenting path with a breadth-first search gives Edmonds-Karp, whose round count no longer depends on the capacity values at all, and Dinic's algorithm goes further by pushing along many shortest paths per phase. Use plain depth-first augmentation while you are learning or when capacities are small, switch to breadth-first the moment capacities grow, and reach for Dinic on large dense networks.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "The reverse edge is where implementations go wrong: omit it and you get a greedy answer that is quietly too small, or double-count it and you produce a flow that violates capacities. Store residuals so an edge's twin is reachable in constant time, and reset the visited set before every search rather than once at the start. Real-valued capacities are the classic pathological case, since adversarial path choice can make the loop converge without ever terminating, which is one more argument for shortest-path augmentation. Then check the small inputs deliberately: a source that equals the sink, a network with no path at all, antiparallel edges between the same pair of vertices, and duplicate edges between the same pair all need a deliberate decision instead of a silent assumption.",
    },
    {
      heading: "How the pattern generalises: problems in disguise",
      body: "Most of the value of maximum flow lies in modelling rather than in the loop itself. Bipartite matching becomes a flow problem when you add a source feeding every left vertex, a sink drawing from every right vertex, and unit capacities everywhere, at which point the maximum flow is the size of the maximum matching. A capacity on a vertex is modelled by splitting it into an in-copy and an out-copy joined by an edge of that capacity, several sources and sinks collapse into one super-source and one super-sink, and counting edge-disjoint paths is just maximum flow with every capacity set to one. Once you recognise these gadgets, image segmentation, project selection, and assignment problems all turn into a network you already know how to solve.",
    },
  ],
  keyTerms: [
    {
      term: "Residual capacity",
      definition:
        "How much more flow an edge can still accept, equal to its capacity minus the flow currently on it. The reverse direction of that edge carries a residual equal to the flow already pushed, which represents the option to cancel.",
    },
    {
      term: "Augmenting path",
      definition:
        "A source-to-sink path whose every edge has positive residual capacity. Its existence means the current flow is not yet maximum, and its absence is the proof that it is.",
    },
    {
      term: "Bottleneck",
      definition:
        "The minimum residual capacity along an augmenting path, which is the amount of flow that path can carry. Pushing more than the bottleneck would overfill the tightest edge on the route.",
    },
    {
      term: "Cut",
      definition:
        "A split of the vertices into two sides with the source on one and the sink on the other; its capacity is the total capacity of the edges crossing forward. Every flow is bounded by every cut, which is why matching one to the other proves optimality.",
    },
    {
      term: "Flow conservation",
      definition:
        "The requirement that every vertex except the source and the sink sends out exactly as much as it receives. Updating forward and reverse residuals together along a whole path is what preserves it without extra checks.",
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
