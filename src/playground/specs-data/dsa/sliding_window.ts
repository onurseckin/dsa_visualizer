import { cases, defineDsaExecution, input } from "./helpers";

export const slidingWindowExecutions = [
  defineDsaExecution({
    id: "sliding-window-min",
    entrypoint: "sliding_window_min",
    invocation: { kind: "function", arguments: [input("nums"), input("k")] },
    cases: cases(
      {
        label: "Overlapping windows",
        input: { nums: [4, 2, 12, 11, 5], k: 3 },
        expected: [2, 2, 5],
      },
      {
        label: "Full-width window",
        input: { nums: [10, 20, 30, 40], k: 4 },
        expected: [10],
      },
      {
        label: "Decreasing then increasing",
        input: { nums: [9, 7, 5, 3, 1, 2, 4], k: 4 },
        expected: [3, 1, 1, 1],
      },
    ),
    audit: {
      signature: "sliding_window_min(nums: list[int], k: int) -> list[int]",
      defaultInputShape: "{ nums: number[]; k: number }",
      argumentMapping: ["nums <- $.nums", "k <- $.k"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns one minimum per complete window.",
    },
  }),
] as const;
