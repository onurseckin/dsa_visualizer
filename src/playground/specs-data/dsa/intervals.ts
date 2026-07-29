import { cases, defineDsaExecution, input } from "./helpers";

export const intervalsExecutions = [
  defineDsaExecution({
    id: "merge-intervals",
    entrypoint: "merge",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Overlapping ranges",
        input: [
          [1, 3],
          [2, 6],
          [8, 10],
        ],
        expected: [
          [1, 6],
          [8, 10],
        ],
      },
      { label: "Empty input", input: [], expected: [] },
      {
        label: "Unsorted touching ranges",
        input: [
          [5, 7],
          [-3, -1],
          [-1, 2],
          [6, 8],
        ],
        expected: [
          [-3, 2],
          [5, 8],
        ],
      },
    ),
    audit: {
      signature: "merge(intervals) -> list[list[number]]",
      defaultInputShape: "{ intervals: Array<{ id; start; end }> }",
      argumentMapping: ["intervals <- $"],
      mutation: "Sorts intervals and extends overlapping interval pairs in place.",
      returnBehavior: "Returns the merged interval list.",
    },
  }),
] as const;
