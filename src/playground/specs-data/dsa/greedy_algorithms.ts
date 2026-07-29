import { cases, defineDsaExecution, input } from "./helpers";

export const greedyAlgorithmsExecutions = [
  defineDsaExecution({
    id: "huffman-coding",
    entrypoint: "huffman_codes",
    invocation: { kind: "function", arguments: [input("text")] },
    cases: cases(
      {
        label: "Four unique frequencies",
        input: { text: "aaaaaaaabbbbccd" },
        expected: { a: "1", b: "01", c: "001", d: "000" },
      },
      { label: "Single symbol", input: { text: "z" }, expected: { z: "0" } },
      {
        label: "Five unique frequencies",
        input: { text: "aaaaaaaaaaaaaaaabbbbbbbbccccdde" },
        expected: { a: "1", b: "01", c: "001", d: "0001", e: "0000" },
      },
    ),
    audit: {
      signature: "huffman_codes(text) -> dict[str, str]",
      defaultInputShape: "{ text: string }",
      argumentMapping: ["text <- $.text"],
      mutation: "Consumes the canonical Huffman heap/tree; does not mutate text.",
      returnBehavior:
        "Returns the canonical prefix-free map fixed by stable heap insertion and left-zero/right-one tree construction.",
    },
  }),
  defineDsaExecution({
    id: "interval-scheduling",
    entrypoint: "interval_scheduling",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Three compatible intervals",
        input: [
          [1, 3],
          [2, 5],
          [4, 6],
          [6, 7],
        ],
        expected: [
          [1, 3],
          [4, 6],
          [6, 7],
        ],
      },
      { label: "No intervals", input: [], expected: [] },
      {
        label: "Signed and touching intervals",
        input: [
          [-3, -1],
          [-2, 2],
          [0, 1],
          [2, 3],
        ],
        expected: [
          [-3, -1],
          [0, 1],
          [2, 3],
        ],
      },
    ),
    audit: {
      signature: "interval_scheduling(intervals) -> list[tuple[int, int]]",
      defaultInputShape: "Array<{ id: string; start: number; end: number }>",
      argumentMapping: ["intervals <- $"],
      mutation: "Does not mutate intervals; sorts a copy by finish time.",
      returnBehavior: "Returns the greedy maximum compatible subset.",
    },
  }),
  defineDsaExecution({
    id: "tasks-and-deadlines",
    entrypoint: "tasks_and_deadlines",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Three durations",
        input: [
          [3, 10],
          [1, 5],
          [2, 8],
        ],
        expected: 13,
      },
      { label: "No tasks", input: [], expected: 0 },
      {
        label: "Mixed positive and late rewards",
        input: [
          [4, 4],
          [2, 10],
          [1, 3],
          [3, 12],
        ],
        expected: 9,
      },
    ),
    audit: {
      signature: "tasks_and_deadlines(tasks: list[tuple[int, int]]) -> int",
      defaultInputShape: "Array<{ id: string; duration: number; deadline: number }>",
      argumentMapping: ["tasks <- $"],
      mutation: "Sorts the task list in place by duration.",
      returnBehavior: "Returns total deadline-minus-completion reward.",
    },
  }),
] as const;
