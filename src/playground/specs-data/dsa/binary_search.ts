import { cases, defineDsaExecution, input } from "./helpers";

export const binarySearchExecutions = [
  defineDsaExecution({
    id: "binary-search-matrix",
    entrypoint: "search_matrix",
    invocation: { kind: "function", arguments: [input("matrix"), input("target")] },
    cases: cases(
      {
        label: "Present target",
        input: {
          matrix: [
            [1, 3, 5],
            [7, 9, 11],
          ],
          target: 9,
        },
        expected: true,
      },
      { label: "Empty matrix", input: { matrix: [], target: 1 }, expected: false },
      {
        label: "Missing interior target",
        input: {
          matrix: [
            [-5, -2, 0],
            [4, 8, 12],
            [20, 25, 30],
          ],
          target: 6,
        },
        expected: false,
      },
    ),
    audit: {
      signature: "search_matrix(matrix: list[list[int]], target: int) -> bool",
      defaultInputShape: "{ matrix: number[][]; target: number }",
      argumentMapping: ["matrix <- $.matrix", "target <- $.target"],
      mutation: "Does not mutate matrix.",
      returnBehavior: "Returns whether target occurs in row-major sorted order.",
    },
  }),
  defineDsaExecution({
    id: "binary-search-1d",
    entrypoint: "binary_search_1d",
    invocation: { kind: "function", arguments: [input("array"), input("target")] },
    cases: cases(
      {
        label: "Present middle target",
        input: { array: [1, 3, 5, 7, 9], target: 5 },
        expected: 2,
      },
      { label: "Empty input", input: { array: [], target: 2 }, expected: -1 },
      {
        label: "Missing signed target",
        input: { array: [-10, -3, 0, 4, 12, 18], target: 11 },
        expected: -1,
      },
    ),
    audit: {
      signature: "binary_search_1d(arr: list[int], target: int) -> int",
      defaultInputShape: "{ array: number[]; target: number }",
      argumentMapping: ["arr <- $.array", "target <- $.target"],
      mutation: "Does not mutate arr.",
      returnBehavior: "Returns a matching index, or -1.",
    },
  }),
  defineDsaExecution({
    id: "meet-in-the-middle",
    entrypoint: "meet_in_the_middle",
    invocation: { kind: "function", arguments: [input("nums"), input("target")] },
    cases: cases(
      {
        label: "Subset exists",
        input: { nums: [3, 34, 4, 12, 5, 2], target: 9 },
        expected: true,
      },
      { label: "Empty zero subset", input: { nums: [], target: 0 }, expected: true },
      {
        label: "Signed subset unavailable",
        input: { nums: [-7, -3, 2, 5, 8], target: 20 },
        expected: false,
      },
    ),
    audit: {
      signature: "meet_in_the_middle(nums: list[int], target: int) -> bool",
      defaultInputShape: "{ nums: number[]; target: number }",
      argumentMapping: ["nums <- $.nums", "target <- $.target"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns whether any subset sums to target.",
    },
  }),
] as const;
