import { cases, defineDsaExecution, input } from "./helpers";

export const dp2dExecutions = [
  defineDsaExecution({
    id: "edit-distance",
    entrypoint: "min_distance",
    invocation: { kind: "function", arguments: [input("word1"), input("word2")] },
    cases: cases(
      { label: "Three edits", input: { word1: "horse", word2: "ros" }, expected: 3 },
      { label: "Empty source", input: { word1: "", word2: "abc" }, expected: 3 },
      {
        label: "Long replacement sequence",
        input: { word1: "intention", word2: "execution" },
        expected: 5,
      },
    ),
    audit: {
      signature: "min_distance(word1: str, word2: str) -> int",
      defaultInputShape: "{ word1: string; word2: string }",
      argumentMapping: ["word1 <- $.word1", "word2 <- $.word2"],
      mutation: "Does not mutate strings.",
      returnBehavior: "Returns Levenshtein insertion/deletion/replacement distance.",
    },
  }),
  defineDsaExecution({
    id: "grid-paths-dp",
    entrypoint: "unique_paths_with_obstacles",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Center obstacle",
        input: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
        expected: 2,
      },
      { label: "Blocked start", input: [[1]], expected: 0 },
      {
        label: "Open rectangular grid",
        input: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        expected: 10,
      },
    ),
    audit: {
      signature: "unique_paths_with_obstacles(obstacleGrid: list[list[int]]) -> int",
      defaultInputShape: "number[][]",
      argumentMapping: ["obstacleGrid <- $"],
      mutation: "Does not mutate obstacleGrid.",
      returnBehavior: "Returns the number of right/down paths that avoid obstacles.",
    },
  }),
  defineDsaExecution({
    id: "counting-tilings",
    entrypoint: "count_tilings",
    invocation: { kind: "function", arguments: [input("n"), input("m")] },
    cases: cases(
      { label: "Two by three board", input: { n: 2, m: 3 }, expected: 3 },
      { label: "Odd area", input: { n: 3, m: 3 }, expected: 0 },
      { label: "Three by four board", input: { n: 3, m: 4 }, expected: 11 },
    ),
    audit: {
      signature: "count_tilings(n: int, m: int) -> int",
      defaultInputShape: "{ n: number; m: number }",
      argumentMapping: ["n <- $.n", "m <- $.m"],
      mutation: "No input mutation.",
      returnBehavior: "Returns the domino tiling count for the n-by-m board.",
    },
  }),
  defineDsaExecution({
    id: "tsp-bitmask-dp",
    entrypoint: "tsp_bitmask",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Three-city tour",
        input: [
          [0, 1, 15],
          [1, 0, 2],
          [15, 2, 0],
        ],
        expected: 18,
      },
      {
        label: "Two-city round trip",
        input: [
          [0, 5],
          [5, 0],
        ],
        expected: 10,
      },
      {
        label: "Four-city optimum",
        input: [
          [0, 10, 15, 20],
          [10, 0, 35, 25],
          [15, 35, 0, 30],
          [20, 25, 30, 0],
        ],
        expected: 80,
      },
    ),
    audit: {
      signature: "tsp_bitmask(dist: list[list[int]]) -> int",
      defaultInputShape: "number[][]",
      argumentMapping: ["dist <- $"],
      mutation: "Does not mutate the distance matrix.",
      returnBehavior: "Returns the minimum Hamiltonian cycle cost, or -1.",
    },
  }),
] as const;
