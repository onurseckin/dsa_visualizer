import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_graph_shortest_paths_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Dijkstra Greedy Choice Invariant & Non-Negative Correctness",
      theorem:
        "Let $G = (V, E)$ have non-negative weights $w(e) \\ge 0$ for all $e \\in E$. When Dijkstra's algorithm adds a vertex $u$ to the set of finalized vertices $S$ (i.e. extracts $u$ with minimum tentative distance from unvisited set $V \\setminus S$), the tentative distance equals the true shortest path distance: $d[u] = \\delta(s, u)$.",
      proof: `
**Proof by Induction / Contradiction:**
1. Base case: At initialization, $S = \\emptyset$. $d[s] = 0 = \\delta(s, s)$ because all edge weights are non-negative, so no path from $s$ to $s$ can have cost $< 0$.
2. Inductive step: Assume that for all vertices $x \\in S$, $d[x] = \\delta(s, x)$. Let $u \\in V \\setminus S$ be the next vertex chosen with minimum tentative distance: $d[u] = \\min_{x \\in V \\setminus S} d[x]$.
3. Assume for contradiction that $d[u] > \\delta(s, u)$. This implies there exists an actual shorter path $P$ from $s$ to $u$ with weight $w(P) < d[u]$.
4. Let $P$ start in $S$ ($s \\in S$) and eventually leave $S$ to reach $u \\notin S$. Let $(x, y)$ be the first edge on path $P$ such that $x \\in S$ and $y \\in V \\setminus S$. (Note: $y$ could be $u$).
5. Decompose path $P$ as $s \\overset{P_1}{\\rightsquigarrow} x \\to y \\overset{P_2}{\\rightsquigarrow} u$.
6. Because $x \\in S$, by inductive hypothesis its distance is optimal: $d[x] = \\delta(s, x)$.
7. When $x$ was finalized into $S$, edge $(x, y)$ was relaxed, ensuring $d[y] \\le d[x] + w(x, y) = \\delta(s, x) + w(x, y) = \\delta(s, y)$.
8. Because all edge weights along subpath $P_2$ from $y$ to $u$ are non-negative ($w(e) \\ge 0$), we have $\\delta(s, y) \\le \\delta(s, u)$.
9. Combining the inequalities:
   $$d[y] \\le \\delta(s, y) \\le \\delta(s, u) < d[u]$$
10. This implies $d[y] < d[u]$. But $y \\in V \\setminus S$, which directly contradicts the greedy choice of $u$ as the vertex in $V \\setminus S$ with the minimum tentative distance $d[u]$.
11. Therefore, no such shorter path $P$ can exist, and $d[u] = \\delta(s, u)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Johnson's Reweighting Potential Invariant",
      theorem:
        "Let $G = (V, E, w)$ have arbitrary real edge weights with no negative-weight cycles. Let $s_0$ be an auxiliary source connected to all $v \\in V$ with $w(s_0, v) = 0$, and let $h(v) = \\delta(s_0, v)$ be the shortest path distance from $s_0$ computed by Bellman-Ford. Then:\n1. The reweighted edge weights $w'(u, v) = w(u, v) + h(u) - h(v) \\ge 0$ for all $(u, v) \\in E$.\n2. For any path $P$ from $u$ to $v$, $w'(P) = w(P) + h(u) - h(v)$. Thus, a path $P$ is a shortest path under $w$ if and only if it is a shortest path under $w'$.",
      proof: `
**Proof of Non-Negativity:**
1. By the triangle inequality on shortest path distances from $s_0$, for any edge $(u, v) \\in E$:
   $$\\delta(s_0, v) \\le \\delta(s_0, u) + w(u, v) \\implies h(v) \\le h(u) + w(u, v)$$
2. Rearranging terms:
   $$w'(u, v) = w(u, v) + h(u) - h(v) \\ge 0$$
Thus, all reweighted edge weights are strictly non-negative.

**Proof of Path Weight Invariance via Telescoping Sum:**
1. Let $P = (v_0, v_1, v_2, \\dots, v_k)$ be any path from $u = v_0$ to $v = v_k$.
2. The weight of $P$ under $w'$ is:
   $$w'(P) = \\sum_{i=1}^k w'(v_{i-1}, v_i) = \\sum_{i=1}^k \\left( w(v_{i-1}, v_i) + h(v_{i-1}) - h(v_i) \\right)$$
3. Splitting the summation:
   $$w'(P) = \\sum_{i=1}^k w(v_{i-1}, v_i) + \\sum_{i=1}^k (h(v_{i-1}) - h(v_i))$$
4. The second summation telescopes: $(h(v_0) - h(v_1)) + (h(v_1) - h(v_2)) + \\dots + (h(v_{k-1}) - h(v_k)) = h(v_0) - h(v_k) = h(u) - h(v)$.
5. Therefore:
   $$w'(P) = w(P) + h(u) - h(v)$$
6. Since $h(u) - h(v)$ depends only on the endpoints $u$ and $v$ and is completely independent of the path $P$ chosen between them, any path that minimizes $w'(P)$ also minimizes $w(P)$. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive O(V^2) Matrix Dijkstra (Dense Baseline)",
          code: `export function dijkstraMatrix(graph: number[][], src: number): Float64Array {
  const n = graph.length;
  const dist = new Float64Array(n).fill(Infinity);
  const visited = new Uint8Array(n);

  dist[src] = 0;

  for (let iter = 0; iter < n; iter++) {
    // Linear O(V) scan to find minimum unvisited vertex
    let u = -1;
    let minD = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[v] < minD) {
        minD = dist[v];
        u = v;
      }
    }

    if (u === -1 || minD === Infinity) break;
    visited[u] = 1;

    // Relax all outgoing edges
    for (let v = 0; v < n; v++) {
      const weight = graph[u][v];
      if (weight > 0 && !visited[v]) {
        if (dist[u] + weight < dist[v]) {
          dist[v] = dist[u] + weight;
        }
      }
    }
  }

  return dist;
}`,
          explanation:
            "Linear scan finds the minimum unvisited vertex in $O(V)$ time per iteration. Total runtime $\\Theta(V^2 + E)$. Optimal for complete dense graphs where $E = \\Theta(V^2)$, but slow for sparse networks.",
          timeComplexity: "O(V^2)",
          spaceComplexity: "O(V^2) adjacency matrix",
        },
        {
          label: "Stage 2: Min-Heap Dijkstra with Stale Pop Invalidation",
          code: `export interface HeapNode {
  node: number;
  dist: number;
}

export class MinHeap {
  private data: HeapNode[] = [];

  push(item: HeapNode): void {
    this.data.push(item);
    this.siftUp(this.data.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[i].dist < this.data[p].dist) {
        const tmp = this.data[i];
        this.data[i] = this.data[p];
        this.data[p] = tmp;
        i = p;
      } else break;
    }
  }

  private siftDown(i: number): void {
    const len = this.data.length;
    while ((i << 1) + 1 < len) {
      let best = (i << 1) + 1;
      const r = best + 1;
      if (r < len && this.data[r].dist < this.data[best].dist) best = r;
      if (this.data[best].dist < this.data[i].dist) {
        const tmp = this.data[i];
        this.data[i] = this.data[best];
        this.data[best] = tmp;
        i = best;
      } else break;
    }
  }
}

export function dijkstraHeap(
  n: number,
  adj: [number, number][][], // adj[u] = [[v, weight], ...]
  src: number
): Float64Array {
  const dist = new Float64Array(n).fill(Infinity);
  const pq = new MinHeap();

  dist[src] = 0;
  pq.push({ node: src, dist: 0 });

  while (!pq.isEmpty()) {
    const { node: u, dist: d } = pq.pop()!;

    // Stale pop check: discard outdated heap entries in O(1)
    if (d > dist[u]) continue;

    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pq.push({ node: v, dist: dist[v] });
      }
    }
  }

  return dist;
}`,
          explanation:
            "Standard sparse-graph Dijkstra using a binary min-heap. Inserting updated distances creates stale duplicate entries, which are efficiently skipped in $O(1)$ via the stale pop check `d > dist[u]`.",
          timeComplexity: "O((V + E) * log V)",
          spaceComplexity: "O(V + E) heap space",
        },
        {
          label: "Stage 3: Low-Level 0-1 BFS & CSR-Mapped SPFA with SLF Heuristic",
          code: `export class Fast01BFSAndSPFA {
  // Ultra-fast 0-1 BFS using double-ended circular buffer queue
  public static solve01BFS(
    n: number,
    head: Int32Array,
    next: Int32Array,
    to: Int32Array,
    weight: Uint8Array, // Weights in {0, 1}
    src: number
  ): Int32Array {
    const dist = new Int32Array(n).fill(0x3f3f3f3f);
    const deque = new Int32Array(2 * n + 10);
    let headPtr = n + 5;
    let tailPtr = n + 5;

    dist[src] = 0;
    deque[tailPtr++] = src;

    while (headPtr < tailPtr) {
      const u = deque[headPtr++];
      const d = dist[u];

      for (let e = head[u]; e !== -1; e = next[e]) {
        const v = to[e];
        const w = weight[e];
        const newDist = d + w;

        if (newDist < dist[v]) {
          dist[v] = newDist;
          if (w === 0) {
            // 0-cost edge prepended to front
            deque[--headPtr] = v;
          } else {
            // 1-cost edge appended to back
            deque[tailPtr++] = v;
          }
        }
      }
    }
    return dist;
  }

  // Shortest Path Faster Algorithm (SPFA) with Small Label First (SLF) optimization
  public static solveSPFA_SLF(
    n: number,
    head: Int32Array,
    next: Int32Array,
    to: Int32Array,
    weight: Float64Array,
    src: number
  ): { dist: Float64Array; hasNegativeCycle: boolean } {
    const dist = new Float64Array(n).fill(Infinity);
    const inQueue = new Uint8Array(n);
    const count = new Int32Array(n); // Relaxation count per vertex
    const deque = new Int32Array(4 * n);
    let qHead = 2 * n;
    let qTail = 2 * n;

    dist[src] = 0;
    deque[qTail++] = src;
    inQueue[src] = 1;
    count[src] = 1;

    while (qHead < qTail) {
      const u = deque[qHead++];
      inQueue[u] = 0;

      for (let e = head[u]; e !== -1; e = next[e]) {
        const v = to[e];
        const w = weight[e];

        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;

          if (!inQueue[v]) {
            count[v]++;
            // If any vertex is relaxed >= N times, a negative-weight cycle exists
            if (count[v] >= n) {
              return { dist, hasNegativeCycle: true };
            }

            // SLF Heuristic: If dist[v] < dist[front], push to front; else push to back
            if (qHead < qTail && dist[v] < dist[deque[qHead]]) {
              deque[--qHead] = v;
            } else {
              deque[qTail++] = v;
            }
            inQueue[v] = 1;
          }
        }
      }
    }

    return { dist, hasNegativeCycle: false };
  }
}`,
          explanation:
            "Stage 3 utilizes flat Forward-Star contiguous TypedArrays with a zero-allocation circular deque. 0-1 BFS executes in strictly $\\Theta(V + E)$ linear time without heap logs. SPFA with Small Label First (SLF) optimizes general edge relaxation and detects negative cycles in $O(N)$ passes.",
          timeComplexity: "0-1 BFS: Theta(V + E), SPFA average: O(E), worst-case: O(V * E)",
          spaceComplexity: "O(V + E) flat TypedArray memory",
        },
      ],
      stepByStep: [
        "Select 0-1 BFS when edge weights are restricted to $\\{0, 1\\}$, eliminating priority queue logarithmic overhead.",
        "Select Min-Heap Dijkstra for general non-negative graphs, applying stale pop invalidation to avoid costly decrease-key operations.",
        "Select Johnson's Algorithm for All-Pairs Shortest Paths in sparse graphs, using Bellman-Ford potentials to eliminate negative edges before running $V$ Dijkstra instances.",
      ],
    },
  ],
};
