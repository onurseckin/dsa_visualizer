import { cases, defineDsaExecution, extraCases, input, instance } from "./helpers";

export const advancedRangeQueriesExecutions = [
  defineDsaExecution({
    id: "fenwick-tree",
    entrypoint: "FenwickTree",
    invocation: {
      kind: "class-method",
      constructor: [input("size")],
      setup: [
        { method: "update", arguments: [input("index1"), input("delta1")] },
        { method: "update", arguments: [input("index2"), input("delta2")] },
      ],
      method: "range_query",
      arguments: [input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Two point additions",
        input: {
          size: 5,
          index1: 1,
          delta1: 3,
          index2: 3,
          delta2: 5,
          left: 1,
          right: 3,
        },
        expected: 8,
      },
      {
        label: "Single index cancellation",
        input: {
          size: 1,
          index1: 1,
          delta1: -2,
          index2: 1,
          delta2: 7,
          left: 1,
          right: 1,
        },
        expected: 5,
      },
      {
        label: "Sparse signed updates",
        input: {
          size: 8,
          index1: 2,
          delta1: 4,
          index2: 7,
          delta2: -3,
          left: 3,
          right: 8,
        },
        expected: -3,
      },
    ),
    audit: {
      signature: "FenwickTree(size).update(index, delta); range_query(left, right) -> int",
      defaultInputShape: "{ size: number; operations: FenwickOperation[] }",
      argumentMapping: [
        "size <- $.size",
        "setup update($.index1, $.delta1)",
        "setup update($.index2, $.delta2)",
        "range_query($.left, $.right)",
      ],
      mutation: "Setup updates mutate the Fenwick tree array.",
      returnBehavior: "Returns the inclusive range sum after both point additions.",
    },
  }),
  defineDsaExecution({
    id: "segment-tree",
    entrypoint: "SegmentTree",
    invocation: {
      kind: "class-method",
      constructor: [input("arr")],
      setup: [
        {
          method: "update",
          arguments: [input("node"), input("start"), input("end"), input("index"), input("value")],
        },
      ],
      method: "query",
      arguments: [input("node"), input("start"), input("end"), input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Middle update and partial sum",
        input: {
          arr: [1, 3, 5, 7],
          node: 1,
          start: 0,
          end: 3,
          index: 1,
          value: 10,
          left: 0,
          right: 2,
        },
        expected: 16,
      },
      {
        label: "Single leaf update",
        input: {
          arr: [5],
          node: 1,
          start: 0,
          end: 0,
          index: 0,
          value: -2,
          left: 0,
          right: 0,
        },
        expected: -2,
      },
      {
        label: "Signed suffix after replacement",
        input: {
          arr: [2, -1, 4, 8, 3],
          node: 1,
          start: 0,
          end: 4,
          index: 3,
          value: 0,
          left: 1,
          right: 4,
        },
        expected: 6,
      },
    ),
    audit: {
      signature: "SegmentTree(arr).update(...); query(node, start, end, l, r) -> int",
      defaultInputShape: "{ array: number[]; operations: SegmentTreeOperation[] }",
      argumentMapping: ["arr <- $.arr", "setup update authored indices", "query authored range"],
      mutation: "Setup replacement mutates the segment-tree sums.",
      returnBehavior: "Returns the inclusive range sum after the point replacement.",
    },
  }),
  defineDsaExecution({
    id: "segment-tree-lazy",
    entrypoint: "SegmentTreeLazy",
    invocation: {
      kind: "class-method",
      constructor: [input("arr")],
      setup: [
        {
          method: "update_range",
          arguments: [
            input("node"),
            input("start"),
            input("end"),
            input("updateLeft"),
            input("updateRight"),
            input("delta"),
          ],
        },
      ],
      method: "query_range",
      arguments: [input("node"), input("start"), input("end"), input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Interior range addition",
        input: {
          arr: [1, 2, 3, 4],
          node: 1,
          start: 0,
          end: 3,
          updateLeft: 1,
          updateRight: 2,
          delta: 5,
          left: 0,
          right: 3,
        },
        expected: 20,
      },
      {
        label: "Single leaf addition",
        input: {
          arr: [5],
          node: 1,
          start: 0,
          end: 0,
          updateLeft: 0,
          updateRight: 0,
          delta: -3,
          left: 0,
          right: 0,
        },
        expected: 2,
      },
      {
        label: "Signed suffix update",
        input: {
          arr: [2, -1, 4, 0, 3],
          node: 1,
          start: 0,
          end: 4,
          updateLeft: 1,
          updateRight: 4,
          delta: 2,
          left: 2,
          right: 4,
        },
        expected: 13,
      },
    ),
    audit: {
      signature: "SegmentTreeLazy(arr).update_range(...); query_range(...) -> int",
      defaultInputShape: "{ array: number[]; operations: LazySegmentTreeOperation[] }",
      argumentMapping: [
        "arr <- $.arr",
        "setup update_range authored range",
        "query_range authored range",
      ],
      mutation: "Setup mutates tree and lazy propagation state.",
      returnBehavior: "Returns the requested sum after the lazy range addition.",
    },
  }),
  defineDsaExecution({
    id: "sparse-table-rmq",
    entrypoint: "SparseTableRMQ",
    invocation: {
      kind: "class-method",
      constructor: [input("arr")],
      method: "query",
      arguments: [input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Interior minimum",
        input: { arr: [4, 6, 1, 5, 7], left: 1, right: 3 },
        expected: 1,
      },
      {
        label: "Single negative value",
        input: { arr: [-3], left: 0, right: 0 },
        expected: -3,
      },
      {
        label: "Descending suffix",
        input: { arr: [9, 8, 7, 6, 5, 4], left: 2, right: 5 },
        expected: 4,
      },
    ),
    audit: {
      signature: "SparseTableRMQ(arr).query(left, right) -> int",
      defaultInputShape: "{ array: number[]; queries: Array<{ left; right }> }",
      argumentMapping: ["arr <- $.arr", "left <- $.left", "right <- $.right"],
      mutation: "Constructor builds immutable lookup columns.",
      returnBehavior: "Returns the inclusive static range minimum.",
    },
  }),
  defineDsaExecution({
    id: "sqrt-decomposition",
    entrypoint: "SqrtDecomposition",
    invocation: {
      kind: "class-method",
      constructor: [input("arr")],
      setup: [{ method: "update", arguments: [input("index"), input("value")] }],
      method: "query",
      arguments: [input("left"), input("right")],
    },
    cases: [
      ...cases(
        {
          label: "Middle block update",
          input: { arr: [1, 2, 3, 4], index: 2, value: 10, left: 1, right: 3 },
          expected: 16,
        },
        {
          label: "Single element replacement",
          input: { arr: [5], index: 0, value: -2, left: 0, right: 0 },
          expected: -2,
        },
        {
          label: "Cross-block signed range",
          input: { arr: [2, -1, 4, 0, 3, 8], index: 4, value: 9, left: 2, right: 5 },
          expected: 21,
        },
      ),
      ...extraCases(
        {
          label: "No-op replacement",
          input: { arr: [1, 2], index: 0, value: 1, left: 0, right: 1 },
          expected: 3,
        },
        {
          label: "Interior block boundary",
          input: { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9], index: 4, value: 1, left: 3, right: 5 },
          expected: 11,
        },
        {
          label: "Replace first element",
          input: { arr: [9, 1, 1, 1], index: 0, value: -9, left: 0, right: 3 },
          expected: -6,
        },
        {
          label: "Replace last element",
          input: { arr: [1, 2, 3, 4], index: 3, value: 0, left: 2, right: 3 },
          expected: 3,
        },
        {
          label: "Negative block total",
          input: { arr: [-4, -3, -2, -1], index: 1, value: 5, left: 0, right: 2 },
          expected: -1,
        },
      ),
    ],
    audit: {
      signature: "SqrtDecomposition(arr).update(idx, val); query(left, right) -> int",
      defaultInputShape: "{ array: number[]; operations: SqrtOperation[] }",
      argumentMapping: ["arr <- $.arr", "setup update($.index, $.value)", "query authored range"],
      mutation: "Setup mutates the copied array and one block sum.",
      returnBehavior: "Returns the inclusive range sum after replacement.",
    },
  }),
  defineDsaExecution({
    id: "mo-algorithm",
    entrypoint: "mo_algorithm",
    invocation: { kind: "function", arguments: [input("arr"), input("queries")] },
    cases: [
      ...cases(
        {
          label: "Two reordered queries",
          input: {
            arr: [1, 2, 3, 4],
            queries: [
              [0, 1],
              [1, 3],
            ],
          },
          expected: [3, 9],
        },
        { label: "Empty array", input: { arr: [], queries: [[0, 0]] }, expected: [] },
        {
          label: "Signed overlapping ranges",
          input: {
            arr: [-2, 5, 1, -3, 4],
            queries: [
              [0, 4],
              [1, 2],
              [2, 3],
            ],
          },
          expected: [5, 6, -2],
        },
      ),
      ...extraCases(
        { label: "Single element query", input: { arr: [42], queries: [[0, 0]] }, expected: [42] },
        {
          label: "Repeated identical query",
          input: {
            arr: [4, 1, 6],
            queries: [
              [0, 2],
              [0, 2],
            ],
          },
          expected: [11, 11],
        },
        {
          label: "Original order survives sorting",
          input: {
            arr: [3, 1, 4, 1, 5],
            queries: [
              [3, 4],
              [0, 0],
              [1, 3],
            ],
          },
          expected: [6, 3, 6],
        },
        {
          label: "All zero values",
          input: {
            arr: [0, 0, 0, 0],
            queries: [
              [0, 3],
              [2, 2],
            ],
          },
          expected: [0, 0],
        },
        {
          label: "Many block crossings",
          input: {
            arr: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            queries: [
              [0, 8],
              [2, 6],
              [4, 8],
            ],
          },
          expected: [45, 25, 35],
        },
      ),
    ],
    audit: {
      signature: "mo_algorithm(arr, queries) -> list[int]",
      defaultInputShape: "{ array: number[]; queries: Array<[number, number]> }",
      argumentMapping: ["arr <- $.arr", "queries <- $.queries"],
      mutation: "Does not mutate arr; sorts an internal indexed-query list.",
      returnBehavior: "Returns inclusive range sums in original query order.",
    },
  }),
  defineDsaExecution({
    id: "dynamic-segment-tree",
    entrypoint: "DynamicSegmentTree",
    invocation: {
      kind: "class-method",
      constructor: [input("minimum"), input("maximum")],
      setup: [
        {
          method: "update",
          arguments: [instance("root"), input("index1"), input("value1")],
        },
        {
          method: "update",
          arguments: [instance("root"), input("index2"), input("value2")],
        },
      ],
      method: "query",
      arguments: [instance("root"), input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Sparse point sums",
        input: {
          minimum: 0,
          maximum: 10,
          index1: 2,
          value1: 5,
          index2: 7,
          value2: 3,
          left: 0,
          right: 5,
        },
        expected: 5,
      },
      {
        label: "Single coordinate cancellation",
        input: {
          minimum: 0,
          maximum: 0,
          index1: 0,
          value1: -2,
          index2: 0,
          value2: 1,
          left: 0,
          right: 0,
        },
        expected: -1,
      },
      {
        label: "Wide sparse signed range",
        input: {
          minimum: 0,
          maximum: 100,
          index1: 25,
          value1: 7,
          index2: 75,
          value2: -4,
          left: 20,
          right: 80,
        },
        expected: 3,
      },
    ),
    audit: {
      signature: "DynamicSegmentTree(l, r).update(root, idx, val); query(root, ql, qr) -> int",
      defaultInputShape: "{ range: [number, number]; operations: DynamicSegmentTreeOperation[] }",
      argumentMapping: [
        "constructor <- $.minimum, $.maximum",
        "setup updates receive instance.root",
        "query receives instance.root and authored bounds",
      ],
      mutation: "Setup allocates sparse nodes and mutates aggregate values.",
      returnBehavior: "Returns the queried sparse inclusive range sum.",
    },
  }),
  defineDsaExecution({
    id: "persistent-segment-tree",
    entrypoint: "persistent_segment_tree_operations",
    invocation: {
      kind: "function",
      arguments: [input("arr"), input("index"), input("value"), input("left"), input("right")],
    },
    cases: cases(
      {
        label: "Middle path-copy update",
        input: { arr: [1, 2, 3, 4], index: 1, value: 10, left: 0, right: 2 },
        expected: { before: 6, after: 14, originalTotal: 10, updatedTotal: 18 },
      },
      {
        label: "Single value version",
        input: { arr: [5], index: 0, value: -2, left: 0, right: 0 },
        expected: { before: 5, after: -2, originalTotal: 5, updatedTotal: -2 },
      },
      {
        label: "Negative replacement and partial range",
        input: { arr: [2, -1, 5, 3, 7], index: 2, value: -4, left: 1, right: 4 },
        expected: { before: 14, after: 5, originalTotal: 16, updatedTotal: 7 },
      },
    ),
    audit: {
      signature: "persistent_segment_tree_operations(arr, index, value, left, right) -> dict",
      defaultInputShape:
        "{ array: number[]; index: number; value: number; left: number; right: number }",
      argumentMapping: [
        "arr <- $.arr",
        "index <- $.index",
        "value <- $.value",
        "left <- $.left",
        "right <- $.right",
      ],
      mutation: "No input mutation.",
      returnBehavior: "Returns before/after range sum totals.",
    },
  }),
  defineDsaExecution({
    id: "sqrt-heavy-light",
    entrypoint: "sqrt_heavy_light",
    invocation: { kind: "function", arguments: [input("n"), input("queries")] },
    cases: cases(
      {
        label: "Nodes and threshold",
        input: {
          n: 5,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
          ],
          queries: [[0, 1]],
        },
        expected: [1],
      },
      { label: "Single node", input: { n: 1, edges: [], queries: [] }, expected: [] },
      {
        label: "Star graph",
        input: {
          n: 4,
          edges: [
            [0, 1],
            [0, 2],
            [0, 3],
          ],
          queries: [[0, 1]],
        },
        expected: [1],
      },
    ),
    audit: {
      signature: "solve(input: dict) -> list",
      defaultInputShape: "{ n: number; edges: number[][]; queries: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns SQRT heavy-light query results.",
    },
  }),
  defineDsaExecution({
    id: "integer-partition-sqrt",
    entrypoint: "solve",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "N=10", input: 10, expected: 10 },
      { label: "N=1", input: 1, expected: 1 },
      { label: "N=5", input: 5, expected: 5 },
    ),
    audit: {
      signature: "solve(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns partition count.",
    },
  }),
  defineDsaExecution({
    id: "merge-sort-tree",
    entrypoint: "merge_sort_tree",
    invocation: {
      kind: "function",
      arguments: [input("arr"), input("ql"), input("qr"), input("k")],
    },
    cases: cases(
      { label: "Array [5,2,6,1]", input: { nums: [5, 2, 6, 1] }, expected: [2, 1, 1, 0] },
      { label: "Single element", input: { nums: [1] }, expected: [0] },
      { label: "Sorted array", input: { nums: [1, 2, 3] }, expected: [0, 0, 0] },
    ),
    audit: {
      signature: "solve(input: dict) -> list[int]",
      defaultInputShape: "{ nums: number[] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns counts of smaller numbers after self.",
    },
  }),
  defineDsaExecution({
    id: "segment-tree-2d",
    entrypoint: "segment_tree_2d",
    invocation: {
      kind: "function",
      arguments: [input("matrix"), input("r1"), input("c1"), input("r2"), input("c2")],
    },
    cases: cases(
      {
        label: "3x3 Matrix",
        input: {
          matrix: [
            [3, 0, 1, 4, 2],
            [5, 6, 3, 2, 1],
            [1, 2, 0, 1, 5],
            [4, 1, 0, 1, 7],
            [1, 0, 3, 0, 5],
          ],
          queries: [[2, 1, 4, 3]],
        },
        expected: [8],
      },
      { label: "1x1 Matrix", input: { matrix: [[5]], queries: [[0, 0, 0, 0]] }, expected: [5] },
      {
        label: "2x2 Matrix",
        input: {
          matrix: [
            [1, 2],
            [3, 4],
          ],
          queries: [[0, 0, 1, 1]],
        },
        expected: [10],
      },
    ),
    audit: {
      signature: "solve(input: dict) -> list[int]",
      defaultInputShape: "{ matrix: number[][]; queries: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns 2D range sum query results.",
    },
  }),
];
