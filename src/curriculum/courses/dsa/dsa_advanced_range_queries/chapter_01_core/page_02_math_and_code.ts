import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_advanced_range_queries_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem: Segment Tree Canonical Node Decomposition Bound",
      theorem:
        "For any interval query $[L, R] \\subseteq [0, N-1]$ on a balanced segment tree of size $N$, the query algorithm visits and combines at most $2 \\lceil \\log_2 N \\rceil$ canonical nodes, guaranteeing $O(\\log N)$ worst-case query complexity.",
      proof: `
**Proof:**
1. Let the segment tree root represent the interval $[0, N-1]$ at depth $0$. The tree height is $H = \\lceil \\log_2 N \\rceil$.
2. At any depth $d \\in [0, H]$, a query range $[L, R]$ can intersect the intervals of nodes at depth $d$.
3. We classify nodes visited during traversal into three categories:
   - **Disjoint Nodes:** Interval has empty intersection with $[L, R]$. Traversal terminates immediately ($0$ canonical contributions).
   - **Fully Contained Nodes (Canonical Nodes):** Node interval is a subset of $[L, R]$. The node's aggregated value is accumulated, and traversal does not branch deeper ($1$ canonical contribution).
   - **Partial Overlap Nodes:** Node interval strictly contains an endpoint ($L$ or $R$). Traversal branches into both children.
4. Crucial invariant: At any depth $d > 0$, there can be at most **two** nodes with partial overlap—one covering the left boundary $L$, and one covering the right boundary $R$.
   - If there were three nodes covering $[L, R]$ at depth $d$, the middle node would be strictly between $L$ and $R$, meaning its interval is fully contained within $[L, R]$, which contradicts the definition of a partial overlap.
5. Each partial overlap node produces at most two child calls. At most two of these children can be canonical nodes, while at most two continue as partial overlaps.
6. Summing over all $H$ levels, the total number of canonical nodes combined is bounded by $2H = 2 \\lceil \\log_2 N \\rceil = O(\\log N)$, and the total number of visited nodes is bounded by $4 \\lceil \\log_2 N \\rceil = O(\\log N)$. $\\blacksquare$
      `,
    },
    {
      type: "prose",
      title: "Trace: Lazy Propagation & Dyadic State Transitions",
      content: `
### Concrete Trace: Range Add $[1, 5] += 3$ on Array of Size $N=8$

**Segment Tree Root:** $[0, 7]$, Sum = $0$
1. **Visit $[0, 7]$ (Partial overlap with $[1, 5]$):**
   - Left child $[0, 3]$, Right child $[4, 7]$.
2. **Branch Left to $[0, 3]$:**
   - Child $[0, 1]$ (partial overlap) -> Branch to $[0, 0]$ (disjoint, return) and $[1, 1]$ (fully contained -> Tag lazy $= 3$, Sum $+= 3 \\times 1 = 3$).
   - Child $[2, 3]$ (fully contained in $[1, 5]$) -> Tag lazy $= 3$, Sum $+= 3 \\times 2 = 6$.
   - Pull up $[0, 3]$: $\\text{Sum} = 3 + 6 = 9$.
3. **Branch Right to $[4, 7]$:**
   - Child $[4, 5]$ (fully contained in $[1, 5]$) -> Tag lazy $= 3$, Sum $+= 3 \\times 2 = 6$.
   - Child $[6, 7]$ (disjoint, return).
   - Pull up $[4, 7]$: $\\text{Sum} = 6 + 0 = 6$.
4. **Pull up Root $[0, 7]$:** $\\text{Sum} = 9 + 6 = 15$.
Total nodes modified directly with lazy tags: 3 canonical nodes ($[1, 1], [2, 3], [4, 5]$). Sub-trees are updated lazily on demand during subsequent queries.
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Implementation Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Range Reduction Baseline",
          code: `export class NaiveRangeArray {
  private data: number[];

  constructor(nums: number[]) {
    this.data = [...nums];
  }

  // O(1) point update
  update(index: number, val: number): void {
    this.data[index] = val;
  }

  // O(R - L + 1) = O(N) linear reduction per query
  queryRangeSum(left: number, right: number): number {
    let sum = 0;
    for (let i = left; i <= right; i++) {
      sum += this.data[i];
    }
    return sum;
  }
}`,
          explanation:
            "Point updates are trivial $O(1)$ memory writes, but range sum queries require a linear scan of $\\Theta(R - L + 1)$. For $Q = 10^5$ queries on $N = 10^5$, total execution time degrades to $O(Q \\cdot N) \\approx 10^{10}$ ops, causing immediate timeout.",
          timeComplexity: "Update: O(1), Query: O(N)",
          spaceComplexity: "O(N) heap space",
        },
        {
          label: "Stage 2: Segment Tree with Lazy Tag Propagation",
          code: `export class LazySegmentTree {
  private n: number;
  private tree: Float64Array;
  private lazy: Float64Array;

  constructor(nums: number[]) {
    this.n = nums.length;
    // Size bounded by 4 * N for complete 1-indexed binary tree
    this.tree = new Float64Array(4 * this.n);
    this.lazy = new Float64Array(4 * this.n);
    if (this.n > 0) {
      this.build(nums, 1, 0, this.n - 1);
    }
  }

  private build(nums: number[], node: number, l: number, r: number): void {
    if (l === r) {
      this.tree[node] = nums[l];
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;
    this.build(nums, leftChild, l, mid);
    this.build(nums, rightChild, mid + 1, r);
    this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
  }

  private pushDown(node: number, l: number, r: number, mid: number): void {
    const tag = this.lazy[node];
    if (tag === 0) return;

    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;

    // Apply lazy delta to children sums
    this.tree[leftChild] += tag * (mid - l + 1);
    this.lazy[leftChild] += tag;

    this.tree[rightChild] += tag * (r - mid);
    this.lazy[rightChild] += tag;

    this.lazy[node] = 0; // Clear parent tag
  }

  public updateRange(ql: number, qr: number, delta: number): void {
    this.updateRangeInternal(1, 0, this.n - 1, ql, qr, delta);
  }

  private updateRangeInternal(
    node: number,
    l: number,
    r: number,
    ql: number,
    qr: number,
    delta: number
  ): void {
    if (ql <= l && r <= qr) {
      this.tree[node] += delta * (r - l + 1);
      this.lazy[node] += delta;
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    this.pushDown(node, l, r, mid);

    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;

    if (ql <= mid) this.updateRangeInternal(leftChild, l, mid, ql, qr, delta);
    if (qr > mid) this.updateRangeInternal(rightChild, mid + 1, r, ql, qr, delta);

    this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
  }

  public querySum(ql: number, qr: number): number {
    return this.querySumInternal(1, 0, this.n - 1, ql, qr);
  }

  private querySumInternal(node: number, l: number, r: number, ql: number, qr: number): number {
    if (ql <= l && r <= qr) {
      return this.tree[node];
    }
    const mid = l + Math.floor((r - l) / 2);
    this.pushDown(node, l, r, mid);

    let sum = 0;
    if (ql <= mid) sum += this.querySumInternal(node << 1, l, mid, ql, qr);
    if (qr > mid) sum += this.querySumInternal((node << 1) | 1, mid + 1, r, ql, qr);
    return sum;
  }
}`,
          explanation:
            "Canonical interval matching combined with deferred tag evaluation. Updates and queries both touch at most $O(\\log N)$ nodes. Typed arrays guarantee zero garbage collection pauses during range traversals.",
          timeComplexity: "Build: O(N), Range Update: O(log N), Range Query: O(log N)",
          spaceComplexity: "4N contiguous floats (O(N))",
        },
        {
          label: "Stage 3: Bitwise Dyadic Fenwick Tree & Static O(1) Sparse Table",
          code: `export class LowLevelRangeEngine {
  // Fenwick Tree (Binary Indexed Tree) using two internal trees for Range-Add Range-Sum
  // Based on identity: Sum(A[0..p]) = (p + 1) * sum(D1[i]) - sum(D2[i] * i)
  private n: number;
  private bit1: Float64Array;
  private bit2: Float64Array;

  constructor(n: number) {
    this.n = n;
    // 1-indexed flat buffers for hardware prefetcher efficiency
    this.bit1 = new Float64Array(n + 2);
    this.bit2 = new Float64Array(n + 2);
  }

  private addInternal(bit: Float64Array, idx: number, delta: number): void {
    // lowbit(i) = i & (-i)
    for (; idx <= this.n; idx += idx & -idx) {
      bit[idx] += delta;
    }
  }

  private queryPrefixInternal(bit: Float64Array, idx: number): number {
    let sum = 0;
    for (; idx > 0; idx -= idx & -idx) {
      sum += bit[idx];
    }
    return sum;
  }

  // Range addition [l, r] += delta (0-indexed input converted to 1-indexed)
  public rangeAdd(l: number, r: number, delta: number): void {
    const l1 = l + 1;
    const r1 = r + 1;
    this.addInternal(this.bit1, l1, delta);
    this.addInternal(this.bit1, r1 + 1, -delta);
    this.addInternal(this.bit2, l1, delta * l1);
    this.addInternal(this.bit2, r1 + 1, -delta * (r1 + 1));
  }

  // Prefix sum A[0..idx]
  private prefixSum(idx: number): number {
    if (idx < 0) return 0;
    const i = idx + 1;
    return (i + 1) * this.queryPrefixInternal(this.bit1, i) - this.queryPrefixInternal(this.bit2, i);
  }

  // Range sum query A[l..r]
  public rangeSum(l: number, r: number): number {
    return this.prefixSum(r) - this.prefixSum(l - 1);
  }
}

// O(1) Static Range Minimum Query (RMQ) Sparse Table
export class FlatSparseTable {
  private st: Int32Array; // Flattened 2D table: row-major [k * n + i]
  private n: number;
  private maxK: number;

  constructor(arr: Int32Array) {
    this.n = arr.length;
    this.maxK = 31 - Math.clz32(Math.max(1, this.n)) + 1;
    this.st = new Int32Array(this.maxK * this.n);

    // Base level k=0
    this.st.set(arr, 0);

    // Compute intervals of length 2^k
    for (let k = 1; k < this.maxK; k++) {
      const prevRow = (k - 1) * this.n;
      const currRow = k * this.n;
      const halfLen = 1 << (k - 1);
      for (let i = 0; i + (1 << k) <= this.n; i++) {
        const leftVal = this.st[prevRow + i];
        const rightVal = this.st[prevRow + i + halfLen];
        this.st[currRow + i] = leftVal < rightVal ? leftVal : rightVal;
      }
    }
  }

  // O(1) RMQ using single-cycle MSB bit-twiddling (Math.clz32)
  public queryMin(l: number, r: number): number {
    const len = r - l + 1;
    const k = 31 - Math.clz32(len); // Fast floor(log2(len))
    const rowOffset = k * this.n;
    const leftVal = this.st[rowOffset + l];
    const rightVal = this.st[rowOffset + r - (1 << k) + 1];
    return leftVal < rightVal ? leftVal : rightVal;
  }
}`,
          explanation:
            "Stage 3 combines dual-BIT algebra for range-add/range-sum without tree recursion overhead, and a flattened 1D Sparse Table utilizing branch-free hardware `clz` (count leading zeros) instruction for absolute $O(1)$ static RMQ.",
          timeComplexity:
            "BIT Range Add/Query: O(log N), Sparse Table Build: O(N log N), Sparse Table RMQ: O(1)",
          spaceComplexity: "BIT: 2N floats, Sparse Table: N * log(N) flat 32-bit ints",
        },
      ],
      stepByStep: [
        "Select Fenwick Tree for commutative invertible monoids requiring lowest constant-factor overhead and zero tree-pointer allocations.",
        "Select Segment Tree with Lazy Propagation when operations are non-invertible (Min/Max/Matrix) or require complex range mutation tags.",
        "Select Flattened Sparse Table for static arrays where $O(1)$ RMQ query latency is critical.",
      ],
    },
  ],
};
