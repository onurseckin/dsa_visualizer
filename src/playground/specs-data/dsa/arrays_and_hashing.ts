import { cases, defineDsaExecution, input } from "./helpers";

export const arraysAndHashingExecutions = [
  defineDsaExecution({
    id: "prefix-sum",
    entrypoint: "prefix_sum",
    invocation: { kind: "function", arguments: [input("nums")] },
    cases: cases(
      { label: "Positive values", input: { nums: [1, 2, 3] }, expected: [0, 1, 3, 6] },
      { label: "Empty input", input: { nums: [] }, expected: [0] },
      {
        label: "Mixed signs",
        input: { nums: [-2, 5, -1, 3] },
        expected: [0, -2, 3, 2, 5],
      },
    ),
    audit: {
      signature: "prefix_sum(nums: list[int]) -> list[int]",
      defaultInputShape: "{ nums: number[] }",
      argumentMapping: ["nums <- $.nums"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns a leading-zero prefix-sum array.",
    },
  }),
  defineDsaExecution({
    id: "two-sum",
    entrypoint: "two_sum",
    invocation: { kind: "function", arguments: [input("nums"), input("target")] },
    cases: cases(
      {
        label: "Pair exists",
        input: { nums: [2, 7, 11, 15], target: 9 },
        expected: [0, 1],
      },
      { label: "No pair", input: { nums: [1, 2, 3], target: 10 }, expected: [] },
      {
        label: "Negative complement",
        input: { nums: [-4, 0, 5, 9], target: 1 },
        expected: [0, 2],
      },
    ),
    audit: {
      signature: "two_sum(nums: list[int], target: int) -> list[int]",
      defaultInputShape: "{ nums: number[]; target: number }",
      argumentMapping: ["nums <- $.nums", "target <- $.target"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns the first matching index pair, or an empty list.",
    },
  }),
  defineDsaExecution({
    id: "kadane-max-subarray",
    entrypoint: "kadane_max_subarray",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Mixed values", input: [1, -2, 3, 4], expected: 7 },
      { label: "Single negative", input: [-5], expected: -5 },
      {
        label: "Long mixed run",
        input: [-2, -3, 4, -1, -2, 1, 5, -3],
        expected: 7,
      },
    ),
    audit: {
      signature: "kadane_max_subarray(nums: list[int]) -> int",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns the maximum non-empty contiguous-subarray sum.",
    },
  }),
  defineDsaExecution({
    id: "bubble-sort",
    entrypoint: "bubble_sort",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Unsorted values", input: [3, 1, 2], expected: [1, 2, 3] },
      { label: "Empty input", input: [], expected: [] },
      {
        label: "Duplicates and negatives",
        input: [5, -1, 5, 0, -3],
        expected: [-3, -1, 0, 5, 5],
      },
    ),
    audit: {
      signature: "bubble_sort(arr: list[int]) -> list[int]",
      defaultInputShape: "number[]",
      argumentMapping: ["arr <- $"],
      mutation: "Sorts arr in place.",
      returnBehavior: "Returns the same sorted list.",
    },
  }),
] as const;
