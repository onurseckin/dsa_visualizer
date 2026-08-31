import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_heap_and_priority_queue_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Priority Queue & Heap Engine Implementation",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "find-median-from-data-stream-heaps",
      title: "Find Median from Data Stream via Dual-Heap Balancing",
      difficulty: "Hard",
      rationale:
        "Implement a continuous real-time median tracker supporting `addNum(num)` in $O(\\log N)$ and `findMedian()` in $O(1)$ time by maintaining size balance between a Max-Heap (lower half) and a Min-Heap (upper half).",
      starterCode: `/**
 * Dual-Heap Continuous Median Tracker
 */

export class MedianFinder {
  private lowMaxHeap: number[]; // Max-heap storing the smaller half
  private highMinHeap: number[]; // Min-heap storing the larger half

  constructor() {
    this.lowMaxHeap = [];
    this.highMinHeap = [];
  }

  public addNum(num: number): void {
    // 1. Push to Max-Heap (lower half)
    this.pushMaxHeap(num);

    // 2. Balance property: max of low <= min of high
    if (
      this.lowMaxHeap.length > 0 &&
      this.highMinHeap.length > 0 &&
      this.lowMaxHeap[0] > this.highMinHeap[0]
    ) {
      const val = this.popMaxHeap()!;
      this.pushMinHeap(val);
    }

    // 3. Balance sizes: lowMaxHeap size is equal to or 1 greater than highMinHeap
    if (this.lowMaxHeap.length > this.highMinHeap.length + 1) {
      const val = this.popMaxHeap()!;
      this.pushMinHeap(val);
    } else if (this.highMinHeap.length > this.lowMaxHeap.length) {
      const val = this.popMinHeap()!;
      this.pushMaxHeap(val);
    }
  }

  public findMedian(): number {
    if (this.lowMaxHeap.length > this.highMinHeap.length) {
      return this.lowMaxHeap[0];
    }
    return (this.lowMaxHeap[0] + this.highMinHeap[0]) / 2.0;
  }

  // --- Heap Helper Methods ---
  private pushMaxHeap(val: number): void {
    this.lowMaxHeap.push(val);
    let i = this.lowMaxHeap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.lowMaxHeap[i] > this.lowMaxHeap[p]) {
        const tmp = this.lowMaxHeap[i];
        this.lowMaxHeap[i] = this.lowMaxHeap[p];
        this.lowMaxHeap[p] = tmp;
        i = p;
      } else break;
    }
  }

  private popMaxHeap(): number | undefined {
    if (this.lowMaxHeap.length === 0) return undefined;
    const top = this.lowMaxHeap[0];
    const last = this.lowMaxHeap.pop()!;
    if (this.lowMaxHeap.length > 0) {
      this.lowMaxHeap[0] = last;
      this.siftDownMax(0);
    }
    return top;
  }

  private siftDownMax(i: number): void {
    const n = this.lowMaxHeap.length;
    while ((i << 1) + 1 < n) {
      let largest = i;
      const left = (i << 1) + 1;
      const right = left + 1;
      if (left < n && this.lowMaxHeap[left] > this.lowMaxHeap[largest]) largest = left;
      if (right < n && this.lowMaxHeap[right] > this.lowMaxHeap[largest]) largest = right;
      if (largest !== i) {
        const tmp = this.lowMaxHeap[i];
        this.lowMaxHeap[i] = this.lowMaxHeap[largest];
        this.lowMaxHeap[largest] = tmp;
        i = largest;
      } else break;
    }
  }

  private pushMinHeap(val: number): void {
    this.highMinHeap.push(val);
    let i = this.highMinHeap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.highMinHeap[i] < this.highMinHeap[p]) {
        const tmp = this.highMinHeap[i];
        this.highMinHeap[i] = this.highMinHeap[p];
        this.highMinHeap[p] = tmp;
        i = p;
      } else break;
    }
  }

  private popMinHeap(): number | undefined {
    if (this.highMinHeap.length === 0) return undefined;
    const top = this.highMinHeap[0];
    const last = this.highMinHeap.pop()!;
    if (this.highMinHeap.length > 0) {
      this.highMinHeap[0] = last;
      this.siftDownMin(0);
    }
    return top;
  }

  private siftDownMin(i: number): void {
    const n = this.highMinHeap.length;
    while ((i << 1) + 1 < n) {
      let smallest = i;
      const left = (i << 1) + 1;
      const right = left + 1;
      if (left < n && this.highMinHeap[left] < this.highMinHeap[smallest]) smallest = left;
      if (right < n && this.highMinHeap[right] < this.highMinHeap[smallest]) smallest = right;
      if (smallest !== i) {
        const tmp = this.highMinHeap[i];
        this.highMinHeap[i] = this.highMinHeap[smallest];
        this.highMinHeap[smallest] = tmp;
        i = smallest;
      } else break;
    }
  }
}`,
    },
  ],
};
