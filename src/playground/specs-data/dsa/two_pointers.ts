import { cases, defineDsaExecution, input, result } from "./helpers";

export const twoPointersExecutions = [
  defineDsaExecution({
    id: "two-sum-sorted",
    entrypoint: "two_sum_sorted",
    invocation: { kind: "function", arguments: [input("nums"), input("target")] },
    cases: cases(
      {
        label: "Outer pair",
        input: { nums: [2, 7, 11, 15], target: 17 },
        expected: [0, 3],
      },
      { label: "No pair", input: { nums: [], target: 4 }, expected: [] },
      {
        label: "Signed sorted values",
        input: { nums: [-8, -3, 0, 4, 7], target: -3 },
        expected: [1, 2],
      },
    ),
    audit: {
      signature: "two_sum_sorted(nums: list[int], target: int) -> list[int]",
      defaultInputShape: "{ nums: number[]; target: number }",
      argumentMapping: ["nums <- $.nums", "target <- $.target"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns a zero-based matching pair, or an empty list.",
    },
  }),
  defineDsaExecution({
    id: "two-pointers",
    entrypoint: "subarray_sum",
    invocation: { kind: "function", arguments: [input("array"), input("target")] },
    cases: cases(
      {
        label: "Middle window",
        input: { array: [1, 2, 3, 7, 5], target: 12 },
        expected: [1, 3],
      },
      {
        label: "Target unavailable",
        input: { array: [1, 2, 3], target: 100 },
        expected: [-1, -1],
      },
      {
        label: "Long prefix window",
        input: { array: [1, 2, 3, 4, 5, 6], target: 15 },
        expected: [0, 4],
      },
    ),
    audit: {
      signature: "subarray_sum(arr: list[int], target: int) -> list[int]",
      defaultInputShape: "{ array: number[]; target: number }",
      argumentMapping: ["arr <- $.array", "target <- $.target"],
      mutation: "Does not mutate arr.",
      returnBehavior: "Returns inclusive bounds for a positive-value target window, or [-1, -1].",
    },
  }),
  defineDsaExecution({
    id: "quick-sort",
    entrypoint: "quick_sort",
    invocation: {
      kind: "function",
      arguments: [input("arr"), input("low"), input("high")],
      result: result("input", ["arr"]),
    },
    cases: cases(
      {
        label: "Full unsorted range",
        input: { arr: [4, 2, 7, 1, 3], low: 0, high: 4 },
        expected: [1, 2, 3, 4, 7],
      },
      {
        label: "Empty range",
        input: { arr: [], low: 0, high: -1 },
        expected: [],
      },
      {
        label: "Duplicates and negatives",
        input: { arr: [9, -3, 5, 2, -3, 8], low: 0, high: 5 },
        expected: [-3, -3, 2, 5, 8, 9],
      },
    ),
    audit: {
      signature: "quick_sort(arr: list[int], low: int, high: int) -> None",
      defaultInputShape: "number[]",
      argumentMapping: ["arr <- $.arr", "low <- $.low", "high <- $.high"],
      mutation: "Sorts the selected arr range in place.",
      returnBehavior: "Returns None; the contract explicitly compares the mutated arr.",
    },
  }),
  defineDsaExecution({
    id: "merge-sort",
    entrypoint: "merge_sort",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Unsorted values", input: [4, 1, 3, 2], expected: [1, 2, 3, 4] },
      { label: "Empty input", input: [], expected: [] },
      {
        label: "Duplicates and negatives",
        input: [5, -1, 5, 0, -3],
        expected: [-3, -1, 0, 5, 5],
      },
    ),
    audit: {
      signature: "merge_sort(arr: list[int]) -> list[int]",
      defaultInputShape: "number[]",
      argumentMapping: ["arr <- $"],
      mutation: "Does not mutate the caller list.",
      returnBehavior: "Returns a newly merged ascending list.",
    },
  }),
] as const;
