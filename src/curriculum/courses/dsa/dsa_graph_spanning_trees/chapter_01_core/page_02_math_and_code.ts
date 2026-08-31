import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_spanning_trees_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: The Cut Property & Safe Edge Invariant",
      theorem:
        "Let $G = (V, E)$ be a connected, undirected weighted graph. Let $(S, V \\setminus S)$ be any cut of $G$. If $e = (u, v)$ is a light edge crossing the cut (i.e. $w(e) = \\min \\{ w(x, y) \\mid x \\in S, y \\in V \\setminus S \\}$), then $e$ belongs to some Minimum Spanning Tree of $G$.",
      proof: `
**Proof via Exchange Argument:**
1. Let $T$ be an arbitrary Minimum Spanning Tree of $G$.
2. If $e \\in T$, the claim holds immediately.
3. If $e \\notin T$, adding $e$ to $T$ creates a unique simple cycle $C$ in the graph $T \\cup \\{e\\}$.
4. Because $e = (u, v)$ has one endpoint $u \\in S$ and one endpoint $v \\in V \\setminus S$, the cycle $C$ must cross the cut $(S, V \\setminus S)$ at least once more along some other edge $e' = (u', v') \\neq e$ with $u' \\in S$ and $v' \\in V \\setminus S$.
5. Because $e' \\in T$, removing $e'$ breaks the cycle $C$ and produces a new spanning tree $T' = (T \\setminus \\{e'\\}) \\cup \\{e\\}$.
6. We compare the total weights of $T$ and $T'$:
   $$w(T') = w(T) - w(e') + w(e) = w(T) + (w(e) - w(e'))$$
7. Because $e$ is a light edge crossing the cut $(S, V \\setminus S)$, by definition $w(e) \\le w(e')$, which implies $w(e) - w(e') \\le 0$.
8. Thus, $w(T') \\le w(T)$.
9. But $T$ was already a Minimum Spanning Tree, so we cannot have $w(T') < w(T)$. Hence $w(T') = w(T)$, proving that $T'$ is also an MST of $G$.
10. Since $e \\in T'$, edge $e$ is guaranteed to belong to an MST. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Graphic Matroid Greedy Basis Optimality",
      theorem:
        "Let $E$ be the edge set of an undirected graph $G = (V, E)$, and let $\\mathcal{I} = \\{ F \\subseteq E \\mid F \\text{ contains no cycles (is a forest)} \\}$. The pair $M = (E, \\mathcal{I})$ forms a Graphic Matroid. By the Rado-Edmonds Theorem, the greedy algorithm (Kruskal's Algorithm) is mathematically guaranteed to find a minimum-weight basis (Minimum Spanning Tree).",
      proof: `
**Verification of Matroid Axioms:**
1. **Hereditary Property:** If $F \\in \\mathcal{I}$ and $F' \\subseteq F$, then $F'$ is a subgraph of an acyclic forest, so $F'$ contains no cycles. Thus $F' \\in \\mathcal{I}$.
2. **Augmentation / Exchange Property:** Let $F_1, F_2 \\in \\mathcal{I}$ with $|F_1| < |F_2|$.
   - $F_1$ is a forest with $|V| - |F_1|$ connected components.
   - $F_2$ is a forest with $|V| - |F_2|$ connected components.
   - Because $|F_1| < |F_2|$, $F_1$ has strictly more connected components than $F_2$.
   - By the Pigeonhole Principle, there must exist some component $C$ of $F_2$ whose vertices span across at least two distinct connected components of $F_1$.
   - Therefore, there exists an edge $e \\in F_2 \\setminus F_1$ that connects two different trees in $F_1$.
   - Adding $e$ to $F_1$ cannot create a cycle. Thus $F_1 \\cup \\{e\\} \\in \\mathcal{I}$.
3. Because $(E, \\mathcal{I})$ satisfies both matroid axioms, the greedy strategy of sorting elements and iteratively adding minimal-weight independent elements (Kruskal's algorithm) provably constructs a minimum-weight maximal independent set (spanning forest/tree). $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Edge-Sorting Kruskal Baseline with DFS Cycle Detection",
          code: `export interface Edge {
  u: number;
  v: number;
  w: number;
}

export function kruskalNaive(n: number, edges: Edge[]): number {
  // Sort edges by weight O(E log E)
  const sorted = [...edges].sort((a, b) => a.w - b.w);
  const mstEdges: Edge[] = [];
  let totalWeight = 0;

  function hasPath(u: number, target: number, visited: boolean[], adj: number[][]): boolean {
    if (u === target) return true;
    visited[u] = true;
    for (const v of adj[u]) {
      if (!visited[v] && hasPath(v, target, visited, adj)) return true;
    }
    return false;
  }

  const adj: number[][] = Array.from({ length: n }, () => []);

  for (const { u, v, w } of sorted) {
    // O(V) DFS to check if adding edge (u, v) creates a cycle
    const visited = new Array(n).fill(false);
    if (!hasPath(u, v, visited, adj)) {
      adj[u].push(v);
      adj[v].push(u);
      mstEdges.push({ u, v, w });
      totalWeight += w;
      if (mstEdges.length === n - 1) break;
    }
  }

  return mstEdges.length === n - 1 ? totalWeight : -1;
}`,
          explanation:
            "Uses unguided DFS for cycle detection on every candidate edge. For $E = 10^5$ edges on $N = 10^4$ vertices, checking connectivity takes $O(E \\cdot V) \\approx 10^9$ operations, causing severe execution timeouts.",
          timeComplexity: "O(E log E + E * V)",
          spaceComplexity: "O(V + E) adjacency lists",
        },
        {
          label: "Stage 2: Standard Disjoint-Set Union (DSU) Kruskal",
          code: `export class DisjointSetUnion {
  private parent: Int32Array;
  private rank: Uint8Array;
  public numComponents: number;

  constructor(n: number) {
    this.parent = new Int32Array(n);
    this.rank = new Uint8Array(n);
    this.numComponents = n;
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }

  // Find with Path Compression: O(alpha(N)) amortized
  find(i: number): number {
    let root = i;
    while (root !== this.parent[root]) {
      root = this.parent[root];
    }
    // Path compression pass
    let curr = i;
    while (curr !== root) {
      const nxt = this.parent[curr];
      this.parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  // Union by Rank: maintains tree depth <= log(N)
  union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false;

    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    this.numComponents--;
    return true;
  }
}

export function kruskalDSU(n: number, edges: Edge[]): number {
  const sorted = [...edges].sort((a, b) => a.w - b.w);
  const dsu = new DisjointSetUnion(n);
  let totalWeight = 0;
  let edgesCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const { u, v, w } = sorted[i];
    if (dsu.union(u, v)) {
      totalWeight += w;
      edgesCount++;
      if (edgesCount === n - 1) break;
    }
  }

  return edgesCount === n - 1 ? totalWeight : -1;
}`,
          explanation:
            "Combines full path compression and union by rank. Each find/union runs in inverse Ackermann time $\\alpha(N) < 5$, reducing overall time to $O(E \\log E + E \\alpha(V))$.",
          timeComplexity: "O(E log E + E * alpha(V))",
          spaceComplexity: "O(V) flat arrays",
        },
        {
          label: "Stage 3: Flat-Array Borůvka & Cache-Aligned Dense Prim Engine",
          code: `export class FastMSTEngine {
  // Ultra-fast dense Prim MST using flat cache-friendly 1D arrays (optimal for E ~ V^2)
  public static primDense(n: number, matrix: Float64Array): number {
    const minDist = new Float64Array(n).fill(Infinity);
    const inMST = new Uint8Array(n);
    minDist[0] = 0;
    let totalMST = 0;

    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let minD = Infinity;

      // Sequential scan over L1 cache line (vectorizable by SIMD)
      for (let v = 0; v < n; v++) {
        if (!inMST[v] && minDist[v] < minD) {
          minD = minDist[v];
          u = v;
        }
      }

      if (u === -1 || minD === Infinity) return -1;
      inMST[u] = 1;
      totalMST += minD;

      const rowOffset = u * n;
      for (let v = 0; v < n; v++) {
        const w = matrix[rowOffset + v];
        if (w > 0 && !inMST[v] && w < minDist[v]) {
          minDist[v] = w;
        }
      }
    }
    return totalMST;
  }

  // Boruvka's Algorithm on Flat Edge Arrays (Halves components per phase in O(E log V))
  public static boruvkaMST(n: number, uArr: Int32Array, vArr: Int32Array, wArr: Float64Array, m: number): number {
    const dsu = new DisjointSetUnion(n);
    const cheapest = new Int32Array(n);
    let totalWeight = 0;
    let numTrees = n;

    while (numTrees > 1) {
      cheapest.fill(-1);

      // Find cheapest edge for each component
      for (let i = 0; i < m; i++) {
        const u = dsu.find(uArr[i]);
        const v = dsu.find(vArr[i]);
        if (u === v) continue;

        const w = wArr[i];
        if (cheapest[u] === -1 || w < wArr[cheapest[u]]) cheapest[u] = i;
        if (cheapest[v] === -1 || w < wArr[cheapest[v]]) cheapest[v] = i;
      }

      let edgeAdded = false;
      for (let i = 0; i < n; i++) {
        const edgeIdx = cheapest[i];
        if (edgeIdx !== -1) {
          const u = uArr[edgeIdx];
          const v = vArr[edgeIdx];
          if (dsu.union(u, v)) {
            totalWeight += wArr[edgeIdx];
            numTrees--;
            edgeAdded = true;
          }
        }
      }

      if (!edgeAdded) break; // Graph is disconnected
    }

    return numTrees === 1 ? totalWeight : -1;
  }
}`,
          explanation:
            "Stage 3 demonstrates two hardware-optimal algorithms: Flat Dense Prim (which executes in $O(V^2)$ with zero heap overhead and SIMD vectorizable inner loops) and Flat Borůvka (which contracts components simultaneously without sorting, executing in at most $\\lceil \\log_2 V \\rceil$ passes).",
          timeComplexity: "Prim Dense: Theta(V^2), Boruvka: O(E log V)",
          spaceComplexity: "Zero-GC contiguous flat arrays",
        },
      ],
      stepByStep: [
        "Use Dense Prim when $E = \\Theta(V^2)$ to eliminate heap priority queue operations and achieve cache-line vectorization.",
        "Use Kruskal with DSU (Path Compression + Union by Rank) for standard sparse graph networks.",
        "Use Borůvka's Algorithm when executing on parallel SIMD / multi-threaded GPU hardware.",
      ],
    },
  ],
};
