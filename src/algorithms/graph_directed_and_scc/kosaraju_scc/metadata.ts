import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const KOSARAJU_SCC_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Kosaraju's algorithm partitions a directed graph <code>G = (V, E)</code> into its <strong>Strongly Connected Components (SCCs)</strong>—maximal subgraphs where every pair of vertices <em>u, v</em> is mutually reachable (<code>u &rarr; v</code> and <code>v &rarr; u</code>). It operates in linear <code>O(V + E)</code> time via a two-pass Depth-First Search (DFS) strategy: Pass 1 computes post-order vertex finishing times on <code>G</code>, while Pass 2 explores the transposed graph <code>G<sup>T</sup></code> (with reversed edges) in decreasing finish order to extract each isolated component.</p>",
  sections: [
    {
      heading: "Why It Exists & What It Solves",
      body: "<p>In directed graphs, reachability is asymmetric: vertex <em>u</em> can reach <em>v</em> without <em>v</em> being able to reach <em>u</em>. Strongly Connected Components group mutually reachable vertices into equivalence classes. Contracting each SCC into a single super-node yields the graph's <strong>Condensation DAG</strong>, allowing algorithms designed for acyclic graphs (such as Topological Sort or Dynamic Programming) to run on arbitrary directed graphs.</p>",
    },
    {
      heading: "Core Concept: The Transpose Fence & Finish Stack",
      body: "<p>Reversing all directed edges to form the transpose graph <code>G<sup>T</sup></code> preserves internal SCC cycles, but reverses component-to-component implication direction. By processing nodes in decreasing order of their Pass 1 DFS finishing times, Pass 2 is guaranteed to start at a sink component in <code>G<sup>T</sup></code>, preventing the search from leaking into other SCCs.</p>",
    },
    {
      heading: "Step-by-Step Intuition",
      body: "<ul><li><strong>Pass 1 DFS:</strong> Run DFS on original graph <code>G</code>, pushing each node onto a finish stack when all its outgoing edges finish.</li><li><strong>Transpose Graph:</strong> Construct <code>G<sup>T</sup></code> by flipping the direction of every edge (<code>u &rarr; v</code> to <code>v &rarr; u</code>).</li><li><strong>Reset Visited:</strong> Clear the visited set.</li><li><strong>Pass 2 DFS:</strong> Pop nodes from the finish stack: for each unvisited node <em>u</em>, launch a DFS on <code>G<sup>T</sup></code> to collect all reachable nodes into a single SCC.</li><li><strong>Repeat:</strong> Continue until the finish stack is empty.</li></ul>",
    },
    {
      heading: "Trade-offs: Kosaraju vs. Tarjan's SCC Algorithm",
      body: "<p>Kosaraju's algorithm uses two conceptually simple DFS passes and edge reversal, making it exceptionally easy to implement and verify. <strong>Tarjan's algorithm</strong> finds SCCs in a single DFS pass using discovery times and lowlink values <code>low[u]</code>, avoiding explicit graph transposition and saving memory on large streams.</p>",
    },
    {
      heading: "Complexity Analysis",
      body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code></p><ul><li><strong>Time:</strong> Pass 1 DFS takes <code>O(V + E)</code>, graph transposition takes <code>O(V + E)</code>, and Pass 2 DFS takes <code>O(V + E)</code>. Overall time is linear <code>O(V + E)</code>.</li><li><strong>Space:</strong> Storing adjacency lists for <code>G</code> and <code>G<sup>T</sup></code>, finish stack, and visited sets consumes <code>O(V + E)</code> space.</li></ul>",
    },
  ],
  keyTerms: [
    {
      term: "Strongly Connected Component (SCC)",
      definition:
        "A maximal subset <em>S &subseteq; V</em> where every vertex pair <em>u, v &isin; S</em> can reach each other along directed paths.",
    },
    {
      term: "Transpose Graph (G^T)",
      definition:
        "The directed graph formed by reversing the direction of every directed edge <em>e = (u, v) &isin; E</em>.",
    },
    {
      term: "Finish Stack",
      definition:
        "A LIFO stack recording post-order vertex exploration completion times from Pass 1 DFS.",
    },
    {
      term: "Condensation Graph",
      definition:
        "The Directed Acyclic Graph (DAG) formed by collapsing each SCC into a single meta-node.",
    },
  ],
};

export const KOSARAJU_SCC_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines main kosaraju_scc(n, edges) function returning list of strongly connected components.",
    2: "Allocates the original graph adjacency list for all n vertices.",
    3: "Allocates the transposed graph adjacency list for all n vertices.",
    4: "Iterates through each directed edge.",
    5: "Adds the edge to the original adjacency list.",
    6: "Adds the reversed edge to the transpose adjacency list.",
    7: "Blank line separating graph construction from Pass 1.",
    8: "Initializes visited set for Pass 1 DFS.",
    9: "Initializes finish-time stack: nodes are pushed when all outgoing edges finish.",
    10: "Defines Pass 1 DFS recursive helper function dfs1(u).",
    11: "Marks current node u as visited in Pass 1.",
    12: "Iterates through all outgoing neighbors v of node u.",
    13: "Checks if neighbor v has not been visited yet.",
    14: "Recursively calls dfs1(v) on unvisited neighbor v.",
    15: "Pushes node u onto finish stack after exploring all outgoing neighbors.",
    16: "Blank line separating Pass 1 helper from main sweep.",
    17: "Sweeps all n nodes to ensure disconnected components are visited.",
    18: "Checks if node i has not been visited in Pass 1.",
    19: "Launches dfs1(i) for unvisited starting node i.",
    20: "Blank line separating Pass 1 from Pass 2 initialization.",
    21: "Clears visited set to reuse for Pass 2 on transposed graph.",
    22: "Initializes sccs list to collect discovered components.",
    23: "Defines Pass 2 DFS recursive helper function dfs2(u, component).",
    24: "Marks node u as visited in Pass 2.",
    25: "Appends node u to current strongly connected component list.",
    26: "Iterates through neighbors of u in reversed adjacency list rev_adj.",
    27: "Checks if reversed neighbor v has not been visited in Pass 2.",
    28: "Recursively calls dfs2(v, component) to expand current SCC.",
    29: "Blank line separating Pass 2 helper from stack processing loop.",
    30: "Drives Pass 2 loop while finish stack contains unvisited nodes.",
    31: "Pops node u from top of finish stack (last-finished first).",
    32: "Checks if popped node u has not been claimed by a prior SCC.",
    33: "Initializes empty component list for new SCC anchored by node u.",
    34: "Runs dfs2(u, component) on transposed graph to collect full SCC.",
    35: "Appends completed component to sccs collection.",
    36: "Returns final list of strongly connected components.",
  },
};
