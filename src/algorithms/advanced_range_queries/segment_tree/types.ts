export interface SegmentTreeOperation {
  type: "update" | "query";
  index?: number;
  value?: number;
  left?: number;
  right?: number;
}

export interface SegmentTreeInput {
  array: number[];
  operations?: SegmentTreeOperation[];
}

export const SEGMENT_TREE_CODE = `class SegmentTree:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.build(arr, 1, 0, self.n - 1)

    def build(self, arr: list[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self.build(arr, 2 * node, start, mid)
        self.build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, node: int, start: int, end: int, idx: int, val: int):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        if idx <= mid:
            self.update(2 * node, start, mid, idx, val)
        else:
            self.update(2 * node + 1, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        left_sum = self.query(2 * node, start, mid, l, r)
        right_sum = self.query(2 * node + 1, mid + 1, end, l, r)
        return left_sum + right_sum`;

export const DEFAULT_SEGMENT_TREE_INPUT: SegmentTreeInput = {
  array: [1, 3, 5, 7, 9, 11],
  operations: [
    { type: "query", left: 1, right: 3 },
    { type: "update", index: 2, value: 6 },
    { type: "query", left: 1, right: 3 },
  ],
};

export interface InternalNode {
  nodeIdx: number;
  start: number;
  end: number;
  val: number;
}
