export interface LazySegmentTreeOperation {
  type: "rangeUpdate" | "rangeQuery" | "update" | "query";
  left: number;
  right: number;
  value?: number;
}

export interface SegmentTreeLazyInput {
  array: number[];
  operations?: LazySegmentTreeOperation[];
}

export const SEGMENT_TREE_LAZY_CODE = `class SegmentTreeLazy:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self.build(arr, 1, 0, self.n - 1)

    def build(self, arr: list[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self.build(arr, 2 * node, start, mid)
        self.build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def push(self, node: int, start: int, end: int):
        if self.lazy[node] != 0:
            mid = (start + end) // 2
            self.lazy[2 * node] += self.lazy[node]
            self.tree[2 * node] += self.lazy[node] * (mid - start + 1)
            self.lazy[2 * node + 1] += self.lazy[node]
            self.tree[2 * node + 1] += self.lazy[node] * (end - mid)
            self.lazy[node] = 0

    def update_range(self, node: int, start: int, end: int, l: int, r: int, val: int):
        if self.lazy[node] != 0 and start != end:
            self.push(node, start, end)

        if r < start or end < l:
            return

        if l <= start and end <= r:
            self.tree[node] += (end - start + 1) * val
            if start != end:
                self.lazy[node] += val
            return

        mid = (start + end) // 2
        self.update_range(2 * node, start, mid, l, r, val)
        self.update_range(2 * node + 1, mid + 1, end, l, r, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query_range(self, node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0

        if self.lazy[node] != 0 and start != end:
            self.push(node, start, end)

        if l <= start and end <= r:
            return self.tree[node]

        mid = (start + end) // 2
        left_sum = self.query_range(2 * node, start, mid, l, r)
        right_sum = self.query_range(2 * node + 1, mid + 1, end, l, r)
        return left_sum + right_sum`;

export const DEFAULT_SEGMENT_TREE_LAZY_INPUT: SegmentTreeLazyInput = {
  array: [1, 2, 3, 4, 5],
  operations: [
    { type: "rangeQuery", left: 1, right: 3 },
    { type: "rangeUpdate", left: 1, right: 3, value: 5 },
    { type: "rangeQuery", left: 1, right: 3 },
    { type: "rangeQuery", left: 0, right: 4 },
  ],
};

export interface InternalNode {
  nodeIdx: number;
  start: number;
  end: number;
}
