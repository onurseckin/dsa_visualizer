import { cases, defineDsaExecution, input } from "./helpers";

export const heapAndPriorityQueueExecutions = [
  defineDsaExecution({
    id: "kth-largest-element",
    entrypoint: "findKthLargest",
    invocation: { kind: "function", arguments: [input("nums"), input("k")] },
    cases: cases(
      {
        label: "Second largest",
        input: { nums: [3, 2, 1, 5, 6, 4], k: 2 },
        expected: 5,
      },
      { label: "Single value", input: { nums: [5], k: 1 }, expected: 5 },
      {
        label: "Duplicates and negatives",
        input: { nums: [-1, -1, 4, 2, 4], k: 3 },
        expected: 2,
      },
    ),
    audit: {
      signature: "findKthLargest(nums, k) -> number",
      defaultInputShape: "{ nums: number[]; k: number }",
      argumentMapping: ["nums <- $.nums", "k <- $.k"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns the kth largest value using a size-k min-heap.",
    },
  }),
] as const;
