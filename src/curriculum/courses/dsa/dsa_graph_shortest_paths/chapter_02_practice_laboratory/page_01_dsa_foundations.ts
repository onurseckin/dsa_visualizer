import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_graph_shortest_paths_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Shortest Path Routing Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "johnsons-all-pairs-shortest-path",
      title: "Johnson's All-Pairs Shortest Path with Potential Reweighting",
      difficulty: "Hard",
      rationale:
        "Implement Johnson's Algorithm for All-Pairs Shortest Paths: Given a directed graph with positive and negative edge weights, detect if a negative cycle exists. If no negative cycle exists, compute the full $N \\times N$ all-pairs shortest path matrix by computing Bellman-Ford node potentials $h(u)$, reweighting all edges $w'(u, v) \\ge 0$, and executing $N$ instances of Min-Heap Dijkstra.",
      starterCode: `/**
 * Johnson's All-Pairs Shortest Path Algorithm
 * @param n Number of vertices (0 to n-1)
 * @param edges Array of directed edges [u, v, weight]
 * @returns 2D matrix of shortest distances, or null if a negative cycle exists
 */

export interface DirectedEdge {
  u: number;
  v: number;
  w: number;
}

export function solveJohnsonAPSP(n: number, edges: DirectedEdge[]): Float64Array[] | null {
  // Step 1: Add auxiliary source vertex s0 = n connected to all vertices with weight 0
  const augEdges: DirectedEdge[] = [...edges];
  const s0 = n;
  for (let v = 0; v < n; v++) {
    augEdges.push({ u: s0, v, w: 0 });
  }

  // Step 2: Run Bellman-Ford from s0 on (n + 1) vertices to find potentials h[u]
  const h = new Float64Array(n + 1).fill(0);

  // Relax all edges n times (on n+1 vertices, max simple path has n edges)
  for (let iter = 0; iter < n; iter++) {
    for (const { u, v, w } of augEdges) {
      if (h[u] !== Infinity && h[u] + w < h[v]) {
        h[v] = h[u] + w;
      }
    }
  }

  // Check for negative-weight cycles on (n+1)-th pass
  for (const { u, v, w } of augEdges) {
    if (h[u] !== Infinity && h[u] + w < h[v]) {
      return null; // Negative cycle detected!
    }
  }

  // Step 3: Reweight original edges: w'(u, v) = w(u, v) + h[u] - h[v] >= 0
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const { u, v, w } of edges) {
    const reweightedW = w + h[u] - h[v];
    adj[u].push([v, reweightedW]);
  }

  // Step 4: Run Dijkstra from each vertex u in 0..n-1
  const resultMatrix: Float64Array[] = [];

  for (let src = 0; src < n; src++) {
    const dPrime = new Float64Array(n).fill(Infinity);
    const visited = new Uint8Array(n);
    dPrime[src] = 0;

    // Dijkstra with priority queue or flat scan
    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let minD = Infinity;
      for (let v = 0; v < n; v++) {
        if (!visited[v] && dPrime[v] < minD) {
          minD = dPrime[v];
          u = v;
        }
      }

      if (u === -1 || minD === Infinity) break;
      visited[u] = 1;

      for (const [v, rw] of adj[u]) {
        if (dPrime[u] + rw < dPrime[v]) {
          dPrime[v] = dPrime[u] + rw;
        }
      }
    }

    // Step 5: Convert reweighted distances back: d(u, v) = d'(u, v) - h[u] + h[v]
    const realDist = new Float64Array(n);
    for (let v = 0; v < n; v++) {
      if (dPrime[v] === Infinity) {
        realDist[v] = Infinity;
      } else {
        realDist[v] = dPrime[v] - h[src] + h[v];
      }
    }
    resultMatrix.push(realDist);
  }

  return resultMatrix;
}`,
    },
  ],
};
