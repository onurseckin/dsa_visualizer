import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const KOSARAJU_SCC_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Kosaraju's algorithm partitions a directed graph $G = (V, E)$ into its **Strongly Connected Components (SCCs)**—maximal subgraphs where every pair of vertices $u, v$ is mutually reachable ($u \\rightsquigarrow v$ and $v \\rightsquigarrow u$). It operates in linear $\\mathcal{O}(V + E)$ time via a two-pass Depth-First Search (DFS) strategy: Pass 1 computes post-order vertex finishing times on $G$, while Pass 2 explores the transposed graph $G^T$ (with reversed edges) in decreasing finish order to extract each isolated component.",
  sections: [
    {
      heading: "Why It Exists & What It Solves",
      body: "In directed graphs, reachability is asymmetric: vertex $u$ can reach $v$ without $v$ being able to reach $u$. Strongly Connected Components group mutually reachable vertices into equivalence classes. Contracting each SCC into a single super-node yields the graph's **Condensation DAG**, allowing algorithms designed for acyclic graphs (such as Topological Sort or Dynamic Programming) to run on arbitrary directed graphs.",
    },
    {
      heading: "Core Concept: The Transpose Fence & Finish Stack",
      body: "Reversing all directed edges to form the transpose graph $G^T$ preserves internal SCC cycles, but reverses component-to-component implication direction. By processing nodes in decreasing order of their Pass 1 DFS finishing times, Pass 2 is guaranteed to start at a sink component in $G^T$, preventing the search from leaking into other SCCs.",
    },
    {
      heading: "Step-by-Step Intuition",
      body: "1. **Pass 1 DFS**: Run DFS on original graph $G$, pushing each node onto a finish stack when all its outgoing edges finish.\n2. **Transpose Graph**: Construct $G^T$ by flipping the direction of every edge ($u \\to v \\Rightarrow v \\to u$).\n3. **Reset Visited**: Clear visited set.\n4. **Pass 2 DFS**: Pop nodes from the finish stack: for each unvisited node $u$, launch a DFS on $G^T$ to collect all reachable nodes into a single SCC.\n5. **Repeat**: Continue until the finish stack is empty.",
    },
    {
      heading: "Trade-offs: Kosaraju vs. Tarjan's SCC Algorithm",
      body: "Kosaraju's algorithm uses two conceptually simple DFS passes and edge reversal, making it exceptionally easy to implement and verify. **Tarjan's algorithm** finds SCCs in a single DFS pass using discovery times and lowlink values $\\text{low}[u]$, avoiding explicit graph transposition and saving memory on large streams.",
    },
    {
      heading: "Complexity Analysis",
      body: "$$\\text{Time Complexity}: \\mathcal{O}(V + E)$$\n$$\\text{Space Complexity}: \\mathcal{O}(V + E)$$\n- **Time**: Pass 1 DFS takes $\\mathcal{O}(V + E)$, graph transposition takes $\\mathcal{O}(V + E)$, and Pass 2 DFS takes $\\mathcal{O}(V + E)$. Overall time is linear $\\mathcal{O}(V + E)$.\n- **Space**: Storing adjacency lists for $G$ and $G^T$, finish stack, and visited sets consumes $\\mathcal{O}(V + E)$ space.",
    },
  ],
  keyTerms: [
    {
      term: "Strongly Connected Component (SCC)",
      definition:
        "A maximal subset $S \\subseteq V$ where every vertex pair $u, v \\in S$ can reach each other along directed paths.",
    },
    {
      term: "Transpose Graph ($G^T$)",
      definition:
        "The directed graph formed by reversing the direction of every directed edge $e = (u, v) \\in E$.",
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
    2: "Initializes visited set for Pass 1 DFS.",
    3: "Initializes finish-time stack: nodes are pushed when all outgoing edges finish.",
    4: "Defines Pass 1 DFS recursive helper function dfs1(u).",
    5: "Marks current node u as visited in Pass 1.",
    6: "Iterates through all outgoing neighbors v of node u.",
    7: "Checks if neighbor v has not been visited yet.",
    8: "Recursively calls dfs1(v) on unvisited neighbor v.",
    9: "Pushes node u onto finish stack after exploring all outgoing neighbors.",
    10: "Blank line separating Pass 1 helper from main sweep.",
    11: "Sweeps all n nodes to ensure disconnected components are visited.",
    12: "Checks if node i has not been visited in Pass 1.",
    13: "Launches dfs1(i) for unvisited starting node i.",
    14: "Blank line separating Pass 1 from Pass 2 initialization.",
    15: "Clears visited set to reuse for Pass 2 on transposed graph.",
    16: "Initializes sccs list to collect discovered components.",
    17: "Defines Pass 2 DFS recursive helper function dfs2(u, component).",
    18: "Marks node u as visited in Pass 2.",
    19: "Appends node u to current strongly connected component list.",
    20: "Iterates through neighbors of u in reversed adjacency list rev_adj.",
    21: "Checks if reversed neighbor v has not been visited in Pass 2.",
    22: "Recursively calls dfs2(v, component) to expand current SCC.",
    23: "Blank line separating Pass 2 helper from stack processing loop.",
    24: "Drives Pass 2 loop while finish stack contains unvisited nodes.",
    25: "Pops node u from top of finish stack (last-finished first).",
    26: "Checks if popped node u has not been claimed by a prior SCC.",
    27: "Initializes empty component list for new SCC anchored by node u.",
    28: "Runs dfs2(u, component) on transposed graph to collect full SCC.",
    29: "Appends completed component to sccs collection.",
    30: "Returns final list of strongly connected components.",
  },
};
