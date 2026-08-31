import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Correctness of the 2-DFS Tree Diameter Algorithm",
      theorem:
        "Let $T = (V, E)$ be an unrooted tree with non-negative edge weights. Let $u \\in V$ be an arbitrary starting vertex, and let $v = \\arg\\max_{x \\in V} d(u, x)$ be a vertex furthest from $u$. Let $w = \\arg\\max_{y \\in V} d(v, y)$ be a vertex furthest from $v$. Then the path between $v$ and $w$ is a diameter of $T$, and its length $d(v, w) = \\max_{a, b \\in V} d(a, b)$.",
      proof: `
**Proof by Contradiction:**
1. Let $P = (a, b)$ be an actual diameter of $T$, so $d(a, b) = \\max_{x, y} d(x, y)$.
2. Let $v$ be a furthest node from an arbitrary node $u$, so $d(u, v) \\ge d(u, x)$ for all $x \\in V$.
3. We show that $d(v, b) = d(a, b)$ or $d(v, a) = d(a, b)$, meaning $v$ is an endpoint of a diameter.
4. Consider the paths from $u$ to $v$ and from $a$ to $b$. Because $T$ is a tree, these paths must either intersect or be connected by a unique bridge path.
   - **Case 1: Path $(u, v)$ intersects diameter $(a, b)$ at some vertex $z$.**
     - Distance from $u$ to $a$ is $d(u, z) + d(z, a)$.
     - Distance from $u$ to $b$ is $d(u, z) + d(z, b)$.
     - Distance from $u$ to $v$ is $d(u, z) + d(z, v)$.
     - Since $v$ is furthest from $u$, $d(u, v) \\ge d(u, a) \\implies d(u, z) + d(z, v) \\ge d(u, z) + d(z, a) \\implies d(z, v) \\ge d(z, a)$.
     - Adding $d(z, b)$ to both sides: $d(v, b) = d(v, z) + d(z, b) \\ge d(a, z) + d(z, b) = d(a, b)$.
     - Since $d(a, b)$ is the maximum possible distance in the tree, we must have $d(v, b) = d(a, b)$. Thus $(v, b)$ is a diameter.
   - **Case 2: Path $(u, v)$ and diameter $(a, b)$ are disjoint, connected by a unique path $(x, y)$ where $x \\in (u, v)$ and $y \\in (a, b)$.**
     - Similar triangle inequality expansion shows $d(v, b) \\ge d(a, b)$.
5. Therefore, $v$ is guaranteed to be an endpoint of at least one diameter of $T$.
6. The second DFS from $v$ finds a furthest vertex $w$ from $v$, which must achieve the maximal distance from $v$, so $d(v, w) = d(a, b) = \\text{Diameter}(T)$. $\\blacksquare$
      `,
    },
    {
      type: "prose",
      title: "Trace: Binary Lifting LCA Equalization & Dyadic Jumps",
      content: `
### Concrete Trace: LCA(u=7, v=11) on Tree of Height 4

**Tree Structure:** Root is 1. Depth(7) = 4, Depth(11) = 2.
Ancestor Table $up[x][k]$ for $k \\in [0, 2]$:
- $up[7] = [4, 2, 1]$ (Parent 4, 2nd-ancestor 2, 4th-ancestor 1)
- $up[11] = [3, 1, 1]$ (Parent 3, 2nd-ancestor 1)

1. **Step 1: Equalize Depths ($Delta = \\text{Depth}(7) - \\text{Depth}(11) = 4 - 2 = 2$).**
   - Binary representation of $Delta = 2 = 2^1$.
   - Jump $u = up[7][1] = 2$.
   - Now $\\text{Depth}(u=2) = 2$ and $\\text{Depth}(v=11) = 2$.

2. **Step 2: Check Equality ($u == v$).**
   - $u = 2 \\neq v = 11$. Proceed to binary leaps together.

3. **Step 3: Binary Jumps from Largest Power of 2 ($k = 2 \\dots 0$).**
   - For $k = 1$: $up[2][1] = 1$ and $up[11][1] = 1$. Since $up[2][1] == up[11][1]$, this jump overshoots the LCA. Do NOT jump.
   - For $k = 0$: $up[2][0] = 1$ and $up[11][0] = 1$. Overshoots, do NOT jump.

4. **Step 4: Immediate Parent is LCA.**
   - Since $u$ and $v$ are now direct children of the LCA: $\\text{LCA}(7, 11) = up[u][0] = up[2][0] = 1$.
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Tree Traversal & Single-Step LCA",
          code: `export class NaiveTreeTraversal {
  private parent: number[];
  private depth: number[];

  constructor(parent: number[], depth: number[]) {
    this.parent = parent;
    this.depth = depth;
  }

  // O(N) step-by-step upward search
  getLCA(u: number, v: number): number {
    // Bring deeper node to same level
    while (this.depth[u] > this.depth[v]) u = this.parent[u];
    while (this.depth[v] > this.depth[u]) v = this.parent[v];

    // Step together
    while (u !== v) {
      u = this.parent[u];
      v = this.parent[v];
    }
    return u;
  }
}`,
          explanation:
            "Linear step-by-step parent pointer traversal. On skewed degenerate line trees of depth $N = 10^5$, answering $Q = 10^5$ queries requires $O(Q \\cdot N) \\approx 10^{10}$ operations, causing massive timeouts.",
          timeComplexity: "O(N) per query",
          spaceComplexity: "O(N)",
        },
        {
          label: "Stage 2: Standard Binary Lifting LCA & Single-Pass Tree DP Diameter",
          code: `export class BinaryLiftingTree {
  private n: number;
  private maxK: number;
  private up: Int32Array; // Flattened [u * maxK + k]
  private depth: Int32Array;

  constructor(n: number, adj: number[][], root: number = 0) {
    this.n = n;
    this.maxK = Math.max(1, 32 - Math.clz32(n));
    this.up = new Int32Array(n * this.maxK).fill(-1);
    this.depth = new Int32Array(n);

    this.dfs(root, root, 0, adj);
  }

  private dfs(u: number, p: number, d: number, adj: number[][]): void {
    this.depth[u] = d;
    this.up[u * this.maxK + 0] = p;

    for (let k = 1; k < this.maxK; k++) {
      const parentK = this.up[u * this.maxK + (k - 1)];
      this.up[u * this.maxK + k] = this.up[parentK * this.maxK + (k - 1)];
    }

    for (const v of adj[u]) {
      if (v !== p) {
        this.dfs(v, u, d + 1, adj);
      }
    }
  }

  public queryLCA(u: number, v: number): number {
    if (this.depth[u] < this.depth[v]) {
      const temp = u;
      u = v;
      v = temp;
    }

    // Step 1: Equalize depths using binary powers
    for (let k = this.maxK - 1; k >= 0; k--) {
      if (this.depth[u] - (1 << k) >= this.depth[v]) {
        u = this.up[u * this.maxK + k];
      }
    }

    if (u === v) return u;

    // Step 2: Jump together
    for (let k = this.maxK - 1; k >= 0; k--) {
      const upU = this.up[u * this.maxK + k];
      const upV = this.up[v * this.maxK + k];
      if (upU !== upV) {
        u = upU;
        v = upV;
      }
    }

    return this.up[u * this.maxK + 0];
  }

  // O(N) Tree DP Diameter calculation
  public static computeDiameter(n: number, adj: number[][]): number {
    let maxDiameter = 0;

    function postOrderDFS(u: number, p: number): number {
      let max1 = 0;
      let max2 = 0;

      for (const v of adj[u]) {
        if (v !== p) {
          const depth = postOrderDFS(v, u) + 1;
          if (depth > max1) {
            max2 = max1;
            max1 = depth;
          } else if (depth > max2) {
            max2 = depth;
          }
        }
      }
      maxDiameter = Math.max(maxDiameter, max1 + max2);
      return max1;
    }

    postOrderDFS(0, -1);
    return maxDiameter;
  }
}`,
          explanation:
            "Binary Lifting precomputes $2^k$-ancestor jump tables in $O(N \\log N)$ time, resolving any LCA query in $O(\\log N)$. Single-pass post-order tree DP calculates tree diameter in optimal $O(N)$ time.",
          timeComplexity: "Prep: O(N log N), LCA Query: O(log N), Diameter: O(N)",
          spaceComplexity: "O(N log N) flat memory",
        },
        {
          label: "Stage 3: Heavy-Light Decomposition (HLD) with 1D Segment Tree",
          code: `export class FastHLDEngine {
  private n: number;
  private parent: Int32Array;
  private depth: Int32Array;
  private heavy: Int32Array;
  private head: Int32Array;
  private pos: Int32Array;
  private subtreeSize: Int32Array;
  private curPos: number;

  // 1D Segment Tree for dynamic path queries/updates
  private segTree: Float64Array;

  constructor(n: number, adj: number[][], root: number = 0) {
    this.n = n;
    this.parent = new Int32Array(n);
    this.depth = new Int32Array(n);
    this.heavy = new Int32Array(n).fill(-1);
    this.head = new Int32Array(n);
    this.pos = new Int32Array(n);
    this.subtreeSize = new Int32Array(n);
    this.curPos = 0;
    this.segTree = new Float64Array(4 * n);

    this.dfsSize(root, root, 0, adj);
    this.dfsDecompose(root, root, adj);
  }

  // Pass 1: Compute subtree sizes and identify heavy children
  private dfsSize(u: number, p: number, d: number, adj: number[][]): number {
    let size = 1;
    let maxChildSize = 0;
    this.parent[u] = p;
    this.depth[u] = d;

    for (const v of adj[u]) {
      if (v !== p) {
        const childSize = this.dfsSize(v, u, d + 1, adj);
        size += childSize;
        if (childSize > maxChildSize) {
          maxChildSize = childSize;
          this.heavy[u] = v; // Heavy edge child
        }
      }
    }
    this.subtreeSize[u] = size;
    return size;
  }

  // Pass 2: Linearize heavy chains into contiguous segment tree positions
  private dfsDecompose(u: number, h: number, adj: number[][]): void {
    this.head[u] = h;
    this.pos[u] = this.curPos++;

    // Heavy child visits first to ensure contiguous position indices
    if (this.heavy[u] !== -1) {
      this.dfsDecompose(this.heavy[u], h, adj);
    }

    for (const v of adj[u]) {
      if (v !== this.parent[u] && v !== this.heavy[u]) {
        this.dfsDecompose(v, v, adj); // Light child starts new chain
      }
    }
  }

  // Segment tree point update
  public updateNodeValue(node: number, val: number): void {
    let idx = this.pos[node];
    this.updateSeg(1, 0, this.n - 1, idx, val);
  }

  private updateSeg(treeNode: number, l: number, r: number, target: number, val: number): void {
    if (l === r) {
      this.segTree[treeNode] = val;
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    if (target <= mid) this.updateSeg(treeNode << 1, l, mid, target, val);
    else this.updateSeg((treeNode << 1) | 1, mid + 1, r, target, val);
    this.segTree[treeNode] = Math.max(this.segTree[treeNode << 1], this.segTree[(treeNode << 1) | 1]);
  }

  // Query path maximum between u and v in O(log^2 N)
  public queryPathMax(u: number, v: number): number {
    let maxVal = -Infinity;

    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        maxVal = Math.max(maxVal, this.querySeg(1, 0, this.n - 1, this.pos[this.head[u]], this.pos[u]));
        u = this.parent[this.head[u]];
      } else {
        maxVal = Math.max(maxVal, this.querySeg(1, 0, this.n - 1, this.pos[this.head[v]], this.pos[v]));
        v = this.parent[this.head[v]];
      }
    }

    // Both are in same heavy chain
    const [start, end] = this.pos[u] < this.pos[v] ? [this.pos[u], this.pos[v]] : [this.pos[v], this.pos[u]];
    maxVal = Math.max(maxVal, this.querySeg(1, 0, this.n - 1, start, end));
    return maxVal;
  }

  private querySeg(treeNode: number, l: number, r: number, ql: number, qr: number): number {
    if (ql <= l && r <= qr) return this.segTree[treeNode];
    const mid = l + Math.floor((r - l) / 2);
    let res = -Infinity;
    if (ql <= mid) res = Math.max(res, this.querySeg(treeNode << 1, l, mid, ql, qr));
    if (qr > mid) res = Math.max(res, this.querySeg((treeNode << 1) | 1, mid + 1, r, ql, qr));
    return res;
  }
}`,
          explanation:
            "Stage 3 Heavy-Light Decomposition partitions tree paths into at most $\\log_2 N$ contiguous intervals in a 1D Segment Tree. Supports dynamic point/range node mutations and path maximum queries in $O(\\log^2 N)$ worst-case time with flat zero-garbage TypedArrays.",
          timeComplexity: "Build: O(N), Path Query / Update: O(log^2 N), Subtree Query: O(log N)",
          spaceComplexity: "O(N) flat arrays",
        },
      ],
      stepByStep: [
        "First DFS pass: calculate subtree sizes and assign heavy edge child with $\\text{size}(v) > \\text{size}(u)/2$.",
        "Second DFS pass: linearize nodes into segment tree index array `pos`, prioritizing the heavy child to maintain contiguous chain segments.",
        "Path queries jump the deeper chain head `u = parent[head[u]]`, querying the segment tree over contiguous slice $[\\text{pos}[\\text{head}[u]], \\text{pos}[u]]$ until both endpoints meet on the same chain.",
      ],
    },
  ],
};
