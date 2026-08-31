import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tree_queries_and_diameter_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Tree Query Engine Implementation",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "hld-dynamic-tree-path-sum",
      title: "Heavy-Light Decomposition: Dynamic Path Sum & Subtree Update",
      difficulty: "Hard",
      rationale:
        "Implement a complete Heavy-Light Decomposition engine that supports dynamic point value updates, tree path sum queries `queryPathSum(u, v)`, and subtree sum queries `querySubtree(u)` on a tree of $N = 10^5$ nodes. This requires precise management of heavy chain heads, DFS in-out position mappings, and a 1D Segment Tree.",
      starterCode: `/**
 * Heavy-Light Decomposition Dynamic Tree Engine
 */

export class HLDEngine {
  private n: number;
  private parent: Int32Array;
  private depth: Int32Array;
  private heavy: Int32Array;
  private head: Int32Array;
  private pos: Int32Array;
  private subtreeSize: Int32Array;
  private curPos: number;

  // Segment Tree buffers
  private segTree: Float64Array;

  constructor(n: number, adj: number[][], nodeValues: number[], root: number = 0) {
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

    // Initialize segment tree with initial node values
    for (let i = 0; i < n; i++) {
      this.updatePoint(this.pos[i], nodeValues[i]);
    }
  }

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
          this.heavy[u] = v;
        }
      }
    }
    this.subtreeSize[u] = size;
    return size;
  }

  private dfsDecompose(u: number, h: number, adj: number[][]): void {
    this.head[u] = h;
    this.pos[u] = this.curPos++;

    if (this.heavy[u] !== -1) {
      this.dfsDecompose(this.heavy[u], h, adj);
    }

    for (const v of adj[u]) {
      if (v !== this.parent[u] && v !== this.heavy[u]) {
        this.dfsDecompose(v, v, adj);
      }
    }
  }

  public updatePoint(segPos: number, val: number): void {
    this.updateSeg(1, 0, this.n - 1, segPos, val);
  }

  public updateNode(node: number, val: number): void {
    this.updatePoint(this.pos[node], val);
  }

  private updateSeg(node: number, l: number, r: number, target: number, val: number): void {
    if (l === r) {
      this.segTree[node] = val;
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    if (target <= mid) this.updateSeg(node << 1, l, mid, target, val);
    else this.updateSeg((node << 1) | 1, mid + 1, r, target, val);
    this.segTree[node] = this.segTree[node << 1] + this.segTree[(node << 1) | 1];
  }

  public queryPathSum(u: number, v: number): number {
    let totalSum = 0;

    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        totalSum += this.querySeg(1, 0, this.n - 1, this.pos[this.head[u]], this.pos[u]);
        u = this.parent[this.head[u]];
      } else {
        totalSum += this.querySeg(1, 0, this.n - 1, this.pos[this.head[v]], this.pos[v]);
        v = this.parent[this.head[v]];
      }
    }

    const [start, end] = this.pos[u] < this.pos[v] ? [this.pos[u], this.pos[v]] : [this.pos[v], this.pos[u]];
    totalSum += this.querySeg(1, 0, this.n - 1, start, end);
    return totalSum;
  }

  // O(log N) Subtree sum query (contiguous segment under DFS in-order)
  public querySubtreeSum(u: number): number {
    const start = this.pos[u];
    const end = this.pos[u] + this.subtreeSize[u] - 1;
    return this.querySeg(1, 0, this.n - 1, start, end);
  }

  private querySeg(node: number, l: number, r: number, ql: number, qr: number): number {
    if (ql <= l && r <= qr) return this.segTree[node];
    const mid = l + Math.floor((r - l) / 2);
    let sum = 0;
    if (ql <= mid) sum += this.querySeg(node << 1, l, mid, ql, qr);
    if (qr > mid) sum += this.querySeg((node << 1) | 1, mid + 1, r, ql, qr);
    return sum;
  }
}`,
    },
  ],
};
