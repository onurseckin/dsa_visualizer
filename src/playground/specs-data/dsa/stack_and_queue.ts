import { cases, defineDsaExecution, input } from "./helpers";

export const stackAndQueueExecutions = [
  defineDsaExecution({
    id: "valid-parentheses",
    entrypoint: "is_valid",
    invocation: { kind: "function", arguments: [input("s")] },
    cases: cases(
      { label: "Nested pairs", input: { s: "({[]})" }, expected: true },
      { label: "Empty string", input: { s: "" }, expected: true },
      { label: "Crossed delimiters", input: { s: "([)]" }, expected: false },
    ),
    audit: {
      signature: "is_valid(s: str) -> bool",
      defaultInputShape: "{ s: string }",
      argumentMapping: ["s <- $.s"],
      mutation: "Does not mutate s.",
      returnBehavior: "Returns whether all bracket pairs are balanced and correctly nested.",
    },
  }),
  defineDsaExecution({
    id: "nearest-smaller-element",
    entrypoint: "nearest_smaller_element",
    invocation: { kind: "function", arguments: [input("nums")] },
    cases: cases(
      {
        label: "Mixed stack changes",
        input: { nums: [4, 5, 2, 10, 8] },
        expected: [-1, 4, -1, 2, 2],
      },
      { label: "Empty input", input: { nums: [] }, expected: [] },
      {
        label: "Strictly decreasing",
        input: { nums: [5, 4, 3, 2, 1] },
        expected: [-1, -1, -1, -1, -1],
      },
    ),
    audit: {
      signature: "nearest_smaller_element(nums: list[int]) -> list[int]",
      defaultInputShape: "{ nums: number[] }",
      argumentMapping: ["nums <- $.nums"],
      mutation: "Does not mutate nums.",
      returnBehavior: "Returns each element's nearest strictly smaller value to its left, or -1.",
    },
  }),
] as const;
