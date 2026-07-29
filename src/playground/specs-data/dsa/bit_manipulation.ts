import { cases, defineDsaExecution, input } from "./helpers";

export const bitManipulationExecutions = [
  defineDsaExecution({
    id: "counting-bits",
    entrypoint: "countBits",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Counts through five", input: 5, expected: [0, 1, 1, 2, 1, 2] },
      { label: "Zero only", input: 0, expected: [0] },
      {
        label: "Counts through ten",
        input: 10,
        expected: [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2],
      },
    ),
    audit: {
      signature: "countBits(n: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns popcounts for every integer from 0 through n.",
    },
  }),
] as const;
