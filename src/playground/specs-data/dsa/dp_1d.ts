import { cases, defineDsaExecution, input } from "./helpers";

export const dp1dExecutions = [
  defineDsaExecution({
    id: "coin-change-dp",
    entrypoint: "coin_change",
    invocation: { kind: "function", arguments: [input("coins"), input("amount")] },
    cases: cases(
      { label: "Canonical change", input: { coins: [1, 2, 5], amount: 11 }, expected: 3 },
      { label: "Zero amount", input: { coins: [2], amount: 0 }, expected: 0 },
      { label: "Unreachable amount", input: { coins: [2], amount: 3 }, expected: -1 },
    ),
    audit: {
      signature: "coin_change(coins: list[int], amount: int) -> int",
      defaultInputShape: "{ coins: number[]; amount: number }",
      argumentMapping: ["coins <- $.coins", "amount <- $.amount"],
      mutation: "Does not mutate coins.",
      returnBehavior: "Returns the minimum coin count, or -1 when unreachable.",
    },
  }),
  defineDsaExecution({
    id: "longest-increasing-subsequence",
    entrypoint: "length_of_lis",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Canonical mixed sequence",
        input: [10, 9, 2, 5, 3, 7, 101, 18],
        expected: 4,
      },
      { label: "Empty input", input: [], expected: 0 },
      { label: "Repeated dips", input: [0, 1, 0, 3, 2, 3], expected: 4 },
    ),
    audit: {
      signature: "length_of_lis(nums: list[int]) -> int",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns the length of the longest strictly increasing subsequence.",
    },
  }),
  defineDsaExecution({
    id: "knapsack-01",
    entrypoint: "knapsack_01",
    invocation: {
      kind: "function",
      arguments: [input("weights"), input("values"), input("capacity")],
    },
    cases: cases(
      {
        label: "Mixed item choices",
        input: { weights: [1, 3, 4, 5], values: [1, 4, 5, 7], capacity: 7 },
        expected: 9,
      },
      {
        label: "Zero capacity",
        input: { weights: [1, 2], values: [3, 4], capacity: 0 },
        expected: 0,
      },
      {
        label: "Nonadjacent optimum",
        input: { weights: [2, 3, 4], values: [4, 5, 10], capacity: 6 },
        expected: 14,
      },
    ),
    audit: {
      signature: "knapsack_01(weights, values, capacity) -> int",
      defaultInputShape: "{ weights: number[]; values: number[]; capacity: number }",
      argumentMapping: ["weights <- $.weights", "values <- $.values", "capacity <- $.capacity"],
      mutation: "Does not mutate weights or values.",
      returnBehavior: "Returns the maximum value under the 0/1 capacity constraint.",
    },
  }),
] as const;
