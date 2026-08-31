import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_traversal_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Graph Traversal & SCC Condensation Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "critical-connections-in-a-network",
      title: "Critical Connections in a Network via Tarjan's Bridge-Finding DFS",
      difficulty: "Hard",
      rationale:
        "Implement Tarjan's bridge-finding algorithm on an undirected network of $N$ servers. An edge $(u, v)$ is a critical bridge if and only if $low[v] > dfn[u]$. Solve in strictly $\\Theta(V + E)$ linear time and $O(V + E)$ space.",
      starterCode: `/**
 * Critical Connections (Bridge-Finding) Solver
 */

export function criticalConnections(n: number, connections: number[][]): number[][] {
  // Build adjacency list
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of connections) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const dfn = new Int32Array(n);
  const low = new Int32Array(n);
  let timer = 0;
  const bridges: number[][] = [];

  function dfs(u: number, parent: number): void {
    dfn[u] = low[u] = ++timer;

    for (const v of adj[u]) {
      if (v === parent) continue; // Skip direct parent edge in undirected graph

      if (dfn[v] === 0) {
        // Tree edge
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);

        // Bridge condition: child v cannot reach u or any ancestor of u
        if (low[v] > dfn[u]) {
          bridges.push([u, v]);
        }
      } else {
        // Back edge to ancestor
        low[u] = Math.min(low[u], dfn[v]);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (dfn[i] === 0) {
      dfs(i, -1);
    }
  }

  return bridges;
}`,
    },
  ],
};
