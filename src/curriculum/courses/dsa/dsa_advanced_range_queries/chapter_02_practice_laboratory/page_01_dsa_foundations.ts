import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_advanced_range_queries_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Range Query Engine Implementation",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "dynamic-range-affine-segment-tree",
      title: "Dynamic Range Affine Transformation & Range Sum",
      difficulty: "Hard",
      rationale:
        "Implement a fully functional Segment Tree with Lazy Propagation capable of handling simultaneous range multiplication ($x \\mapsto a \\cdot x$), range addition ($x \\mapsto x + b$), and range sum queries modulo $10^9 + 7$. This requires rigorous management of non-commutative lazy tag composition and modulo arithmetic.",
      starterCode: `/**
 * Dynamic Range Affine Segment Tree
 * Operations supported:
 * 1. rangeMultiply(l, r, mulFactor, mod) -> multiplies all elements in [l, r] by mulFactor
 * 2. rangeAdd(l, r, addTerm, mod)       -> adds addTerm to all elements in [l, r]
 * 3. rangeSum(l, r, mod)                -> returns sum of elements in [l, r] modulo mod
 */

export interface AffineTag {
  mul: bigint;
  add: bigint;
}

export class DynamicAffineSegmentTree {
  private n: number;
  private tree: BigInt64Array;
  private lazyMul: BigInt64Array;
  private lazyAdd: BigInt64Array;
  private MOD: bigint;

  constructor(nums: number[], mod: number = 1_000_000_007) {
    this.n = nums.length;
    this.MOD = BigInt(mod);
    const size = 4 * Math.max(1, this.n);
    this.tree = new BigInt64Array(size);
    this.lazyMul = new BigInt64Array(size).fill(1n);
    this.lazyAdd = new BigInt64Array(size).fill(0n);

    if (this.n > 0) {
      this.build(nums, 1, 0, this.n - 1);
    }
  }

  private build(nums: number[], node: number, l: number, r: number): void {
    if (l === r) {
      this.tree[node] = BigInt(nums[l]) % this.MOD;
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;
    this.build(nums, leftChild, l, mid);
    this.build(nums, rightChild, mid + 1, r);
    this.tree[node] = (this.tree[leftChild] + this.tree[rightChild]) % this.MOD;
  }

  private applyTag(node: number, len: bigint, mul: bigint, add: bigint): void {
    // Current sum -> (sum * mul + add * len) % MOD
    this.tree[node] = (this.tree[node] * mul + add * len) % this.MOD;
    this.lazyMul[node] = (this.lazyMul[node] * mul) % this.MOD;
    this.lazyAdd[node] = (this.lazyAdd[node] * mul + add) % this.MOD;
  }

  private pushDown(node: number, l: number, r: number, mid: number): void {
    const mul = this.lazyMul[node];
    const add = this.lazyAdd[node];
    if (mul === 1n && add === 0n) return;

    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;
    const leftLen = BigInt(mid - l + 1);
    const rightLen = BigInt(r - mid);

    this.applyTag(leftChild, leftLen, mul, add);
    this.applyTag(rightChild, rightLen, mul, add);

    this.lazyMul[node] = 1n;
    this.lazyAdd[node] = 0n;
  }

  public rangeMultiply(ql: number, qr: number, factor: number): void {
    this.updateRangeInternal(1, 0, this.n - 1, ql, qr, BigInt(factor), 0n);
  }

  public rangeAdd(ql: number, qr: number, delta: number): void {
    this.updateRangeInternal(1, 0, this.n - 1, ql, qr, 1n, BigInt(delta));
  }

  private updateRangeInternal(
    node: number,
    l: number,
    r: number,
    ql: number,
    qr: number,
    mul: bigint,
    add: bigint
  ): void {
    if (ql <= l && r <= qr) {
      this.applyTag(node, BigInt(r - l + 1), mul, add);
      return;
    }
    const mid = l + Math.floor((r - l) / 2);
    this.pushDown(node, l, r, mid);

    const leftChild = node << 1;
    const rightChild = (node << 1) | 1;

    if (ql <= mid) this.updateRangeInternal(leftChild, l, mid, ql, qr, mul, add);
    if (qr > mid) this.updateRangeInternal(rightChild, mid + 1, r, ql, qr, mul, add);

    this.tree[node] = (this.tree[leftChild] + this.tree[rightChild]) % this.MOD;
  }

  public querySum(ql: number, qr: number): number {
    return Number(this.querySumInternal(1, 0, this.n - 1, ql, qr));
  }

  private querySumInternal(node: number, l: number, r: number, ql: number, qr: number): bigint {
    if (ql <= l && r <= qr) {
      return this.tree[node];
    }
    const mid = l + Math.floor((r - l) / 2);
    this.pushDown(node, l, r, mid);

    let sum = 0n;
    if (ql <= mid) sum = (sum + this.querySumInternal(node << 1, l, mid, ql, qr)) % this.MOD;
    if (qr > mid) sum = (sum + this.querySumInternal((node << 1) | 1, mid + 1, r, ql, qr)) % this.MOD;
    return sum;
  }
}`,
    },
  ],
};
