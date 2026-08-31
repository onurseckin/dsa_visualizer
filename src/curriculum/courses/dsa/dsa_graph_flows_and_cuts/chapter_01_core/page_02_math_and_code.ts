import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_flows_and_cuts_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Max-Flow Min-Cut Duality & Residual Characterization",
      theorem:
        "For any flow network $G = (V, E, c, s, t)$ with flow $f$, the following three conditions are mathematically equivalent:\n1. $f$ is a maximum flow in $G$.\n2. The residual network $G_f$ contains no augmenting path from $s$ to $t$.\n3. There exists a cut $(S, T)$ of $G$ such that the value of the flow equals the capacity of the cut: $|f| = c(S, T)$.",
      proof: `
**Proof:**
**(1) $\\implies$ (2):**
Suppose $G_f$ contains an augmenting path $P$ from $s$ to $t$ with bottleneck capacity $\\delta = \\min_{(u, v) \\in P} c_f(u, v) > 0$. We can construct a new valid flow $f' = f + f_P$ with total value $|f'| = |f| + \\delta > |f|$, which contradicts the assumption that $f$ is a maximum flow.

**(2) $\\implies$ (3):**
Suppose $G_f$ contains no augmenting path from $s$ to $t$. Let $S \\subseteq V$ be the set of all vertices reachable from $s$ in $G_f$, and let $T = V \\setminus S$.
1. Clearly $s \\in S$ (reachable in 0 steps) and $t \\in T$ (otherwise an augmenting path exists), so $(S, T)$ is a valid $s-t$ cut.
2. For any pair of vertices $u \\in S$ and $v \\in T$, there cannot be a residual edge $(u, v) \\in E_f$ (otherwise $v$ would be reachable from $s$, forcing $v \\in S$).
3. This implies $c_f(u, v) = 0 \\implies f(u, v) = c(u, v)$ for all $u \\in S, v \\in T$ (forward edges are fully saturated).
4. Similarly, for any $v \\in T$ and $u \\in S$, we must have $c_f(v, u) = 0 \\implies f(v, u) = 0$ (backward edges carry zero flow).
5. By the flow-cut lemma, the net flow across any cut equals the total flow value:
   $$|f| = f(S, T) = \\sum_{u \\in S} \\sum_{v \\in T} f(u, v) - \\sum_{u \\in S} \\sum_{v \\in T} f(v, u) = \\sum_{u \\in S} \\sum_{v \\in T} c(u, v) - 0 = c(S, T)$$
Thus, $|f| = c(S, T)$.

**(3) $\\implies$ (1):**
By weak duality, for *any* flow $f$ and *any* cut $(S', T')$, $|f| \\le c(S', T')$. If we exhibit a cut $(S, T)$ where $|f| = c(S, T)$, no flow can ever exceed $c(S, T)$, and no cut can have capacity smaller than $|f|$. Therefore, $f$ is a maximum flow and $(S, T)$ is a minimum cut. $\\blacksquare$
      `,
    },
    {
      type: "prose",
      title: "Trace: Dinic's Algorithm Level Graph & Current-Arc Progress",
      content: `
### Concrete Trace: Dinic's Algorithm on 4-Node Diamond Network

**Graph:** $s \\to u (10), s \\to v (10), u \\to v (1), u \\to t (10), v \\to t (10)$.
1. **Phase 1: BFS Level Graph Construction from $s$:**
   - $\\text{Level}(s) = 0$
   - $\\text{Level}(u) = 1, \\text{Level}(v) = 1$
   - $\\text{Level}(t) = 2$
   - Admissible edges must satisfy $\\text{Level}(w) = \\text{Level}(z) + 1$.
   - Note: edge $u \\to v$ is ignored in this phase because $\\text{Level}(u) = \\text{Level}(v) = 1$ (cross-edge within same level).

2. **Phase 1: DFS Blocking Flow with Current-Arc Pointer:**
   - Path 1: $s \\to u \\to t$, Bottleneck $= \\min(10, 10) = 10$. Push $10$. Residual: $s \\to u (0), u \\to t (0)$.
   - Current-arc pointer at $s$ moves past edge $s \\to u$ to $s \\to v$.
   - Path 2: $s \\to v \\to t$, Bottleneck $= \\min(10, 10) = 10$. Push $10$. Residual: $s \\to v (0), v \\to t (0)$.
   - Total flow pushed in Phase 1 = $20$.

3. **Phase 2: BFS Level Graph Rebuild:**
   - $s \\to u$ cap 0, $s \\to v$ cap 0.
   - BFS cannot reach $t$ from $s$. $\\text{Level}(t) = -1$.
   - Algorithm terminates. Max Flow $= 20$.
   - Min Cut: Reachable set from $s$ in $G_f$ is $S = \\{s\\}$, $T = \\{u, v, t\\}$. Cut capacity $= c(s, u) + c(s, v) = 10 + 10 = 20$.
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Ford-Fulkerson (DFS Augmentation)",
          code: `export class FordFulkersonNaive {
  private cap: number[][];
  private n: number;

  constructor(n: number) {
    this.n = n;
    this.cap = Array.from({ length: n }, () => new Array(n).fill(0));
  }

  addEdge(u: number, v: number, capacity: number): void {
    this.cap[u][v] += capacity;
  }

  private dfs(u: number, t: number, minCap: number, visited: boolean[]): number {
    if (u === t) return minCap;
    visited[u] = true;

    for (let v = 0; v < this.n; v++) {
      if (!visited[v] && this.cap[u][v] > 0) {
        const pushed = this.dfs(v, t, Math.min(minCap, this.cap[u][v]), visited);
        if (pushed > 0) {
          this.cap[u][v] -= pushed;
          this.cap[v][u] += pushed; // Residual reverse edge
          return pushed;
        }
      }
    }
    return 0;
  }

  maxFlow(s: number, t: number): number {
    let totalFlow = 0;
    while (true) {
      const visited = new Array(this.n).fill(false);
      const pushed = this.dfs(s, t, Infinity, visited);
      if (pushed === 0) break;
      totalFlow += pushed;
    }
    return totalFlow;
  }
}`,
          explanation:
            "Uses unguided DFS to find augmenting paths. On networks with pathological capacity cycles (e.g. bottleneck edge of capacity 1 alternating between two large paths), DFS requires $O(E \\cdot |f|)$ iterations, making it non-polynomial and vulnerable to denial-of-service on large capacities.",
          timeComplexity: "O(E * |f*|)",
          spaceComplexity: "O(V^2) adjacency matrix",
        },
        {
          label: "Stage 2: Edmonds-Karp (BFS Shortest Path Augmentation)",
          code: `export class EdmondsKarp {
  private adj: number[][];
  private cap: number[][];
  private n: number;

  constructor(n: number) {
    this.n = n;
    this.adj = Array.from({ length: n }, () => []);
    this.cap = Array.from({ length: n }, () => new Array(n).fill(0));
  }

  addEdge(u: number, v: number, capacity: number): void {
    this.adj[u].push(v);
    this.adj[v].push(u);
    this.cap[u][v] += capacity;
  }

  maxFlow(s: number, t: number): number {
    let totalFlow = 0;
    const parent = new Int32Array(this.n);

    while (true) {
      parent.fill(-1);
      parent[s] = s;
      const queue: number[] = [s];
      let head = 0;

      // BFS to find shortest augmenting path in edge count
      while (head < queue.length) {
        const u = queue[head++];
        if (u === t) break;

        for (const v of this.adj[u]) {
          if (parent[v] === -1 && this.cap[u][v] > 0) {
            parent[v] = u;
            queue.push(v);
          }
        }
      }

      if (parent[t] === -1) break; // No augmenting path exists

      // Find bottleneck capacity along BFS path
      let bottleneck = Infinity;
      for (let v = t; v !== s; v = parent[v]) {
        const u = parent[v];
        bottleneck = Math.min(bottleneck, this.cap[u][v]);
      }

      // Apply augmentation to residual capacities
      for (let v = t; v !== s; v = parent[v]) {
        const u = parent[v];
        this.cap[u][v] -= bottleneck;
        this.cap[v][u] += bottleneck;
      }

      totalFlow += bottleneck;
    }
    return totalFlow;
  }
}`,
          explanation:
            "Edmonds-Karp uses BFS to select the augmenting path with the minimum number of edges. This guarantees that shortest path distances monotonically increase, bounding total augmentations to $O(V \\cdot E)$ and overall runtime to $O(V E^2)$, independent of capacity values.",
          timeComplexity: "O(V * E^2)",
          spaceComplexity: "O(V + E) adjacency lists",
        },
        {
          label: "Stage 3: Dinic's Algorithm with Flat Forward-Star & Current-Arc Optimization",
          code: `export class FastDinicMaxFlow {
  private n: number;
  private head: Int32Array;
  private next: Int32Array;
  private to: Int32Array;
  private cap: Float64Array;
  private edgeCount: number;
  private level: Int32Array;
  private ptr: Int32Array;
  private queue: Int32Array;

  constructor(n: number, maxEdges: number = 200000) {
    this.n = n;
    this.edgeCount = 0;
    const maxE = maxEdges * 2;
    this.head = new Int32Array(n).fill(-1);
    this.next = new Int32Array(maxE);
    this.to = new Int32Array(maxE);
    this.cap = new Float64Array(maxE);
    this.level = new Int32Array(n);
    this.ptr = new Int32Array(n);
    this.queue = new Int32Array(n);
  }

  // Uses bitwise XOR edge pairing: edge ^ 1 is the exact reverse residual edge
  public addEdge(u: number, v: number, capacity: number): void {
    const e1 = this.edgeCount++;
    this.to[e1] = v;
    this.cap[e1] = capacity;
    this.next[e1] = this.head[u];
    this.head[u] = e1;

    const e2 = this.edgeCount++;
    this.to[e2] = u;
    this.cap[e2] = 0; // Residual backward capacity
    this.next[e2] = this.head[v];
    this.head[v] = e2;
  }

  private bfs(s: number, t: number): boolean {
    this.level.fill(-1);
    this.level[s] = 0;
    let qHead = 0;
    let qTail = 0;
    this.queue[qTail++] = s;

    while (qHead < qTail) {
      const u = this.queue[qHead++];
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e];
        if (this.cap[e] > 1e-9 && this.level[v] === -1) {
          this.level[v] = this.level[u] + 1;
          this.queue[qTail++] = v;
        }
      }
    }
    return this.level[t] !== -1;
  }

  private dfs(u: number, t: number, pushed: number): number {
    if (u === t || pushed < 1e-9) return pushed;

    // Current-arc optimization: resume from ptr[u] instead of head[u]
    for (let e = this.ptr[u]; e !== -1; e = this.next[e]) {
      this.ptr[u] = e;
      const v = this.to[e];
      const residual = this.cap[e];

      if (this.level[u] + 1 === this.level[v] && residual > 1e-9) {
        const tr = this.dfs(v, t, Math.min(pushed, residual));
        if (tr > 1e-9) {
          this.cap[e] -= tr;
          this.cap[e ^ 1] += tr; // e ^ 1 is reverse edge
          return tr;
        }
      }
    }
    return 0;
  }

  public computeMaxFlow(s: number, t: number): number {
    let maxFlow = 0;
    while (this.bfs(s, t)) {
      // Reset current-arc pointers to head of list
      this.ptr.set(this.head);
      while (true) {
        const pushed = this.dfs(s, t, Infinity);
        if (pushed < 1e-9) break;
        maxFlow += pushed;
      }
    }
    return maxFlow;
  }

  // O(V + E) Min-Cut Extraction: Returns boolean mask of vertices in partition S
  public getMinCutPartitionS(s: number): Uint8Array {
    const inS = new Uint8Array(this.n);
    const q = new Int32Array(this.n);
    let qHead = 0;
    let qTail = 0;
    inS[s] = 1;
    q[qTail++] = s;

    while (qHead < qTail) {
      const u = q[qHead++];
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e];
        if (!inS[v] && this.cap[e] > 1e-9) {
          inS[v] = 1;
          q[qTail++] = v;
        }
      }
    }
    return inS;
  }
}`,
          explanation:
            "Stage 3 achieves industry-standard performance via contiguous flat-array Forward-Star representation (`head`, `next`, `to`, `cap`). The XOR identity `e ^ 1` accesses reverse residual edges in zero instructions. Current-arc pointer `ptr[u]` prunes dead paths in DFS, guaranteeing $O(V^2 E)$ total runtime.",
          timeComplexity:
            "General Networks: O(V^2 * E), Unit Networks / Bipartite Matching: O(E * sqrt(V))",
          spaceComplexity: "O(V + E) flat TypedArray buffers with zero heap allocations",
        },
      ],
      stepByStep: [
        "Construct Forward-Star adjacency array with even-numbered forward edges and odd-numbered reverse edges.",
        "Run BFS from source to construct DAG Level Graph ($L[v] = L[u] + 1$). Terminate if sink is unreachable.",
        "Initialize current-arc pointers `ptr` to `head`. Execute multi-path DFS pushing blocking flows.",
        "Extract minimum cut partition $(S, T)$ by running standard BFS on the final residual graph.",
      ],
    },
  ],
};
