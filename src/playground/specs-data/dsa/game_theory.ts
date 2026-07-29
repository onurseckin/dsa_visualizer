import { cases, defineDsaExecution, extraCases, input } from "./helpers";

export const gameTheoryExecutions = [
  defineDsaExecution({
    id: "nim-game",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "canWinNim",
      arguments: [input()],
    },
    cases: cases(
      { label: "Four stones (losing)", input: 4, expected: false },
      { label: "One stone (winning)", input: 1, expected: true },
      { label: "Five stones (winning)", input: 5, expected: true },
    ),
    audit: {
      signature: "Solution().canWinNim(n: int) -> bool",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns True if first player can force a win in Nim.",
    },
  }),
  defineDsaExecution({
    id: "sprague-grundy-theorem",
    entrypoint: "Solution",
    invocation: { kind: "class-method", constructor: [], method: "nimGame", arguments: [input()] },
    cases: cases(
      { label: "Piles [1, 2, 3]", input: [1, 2, 3], expected: false },
      { label: "Piles [1, 1]", input: [1, 1], expected: false },
      { label: "Piles [1, 2]", input: [1, 2], expected: true },
    ),
    audit: {
      signature: "Solution().nimGame(piles: list[int]) -> bool",
      defaultInputShape: "number[]",
      argumentMapping: ["piles <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns True if first player wins Nim game with piles.",
    },
  }),
  defineDsaExecution({
    id: "game-state-minimax",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "canIWin",
      arguments: [input("maxChoosableInteger"), input("desiredTotal")],
    },
    cases: cases(
      { label: "10, 11", input: { maxChoosableInteger: 10, desiredTotal: 11 }, expected: false },
      { label: "10, 0", input: { maxChoosableInteger: 10, desiredTotal: 0 }, expected: true },
      { label: "10, 1", input: { maxChoosableInteger: 10, desiredTotal: 1 }, expected: true },
    ),
    audit: {
      signature: "Solution().canIWin(maxChoosableInteger: int, desiredTotal: int) -> bool",
      defaultInputShape: "{ maxChoosableInteger: number; desiredTotal: number }",
      argumentMapping: [
        "maxChoosableInteger <- $.maxChoosableInteger",
        "desiredTotal <- $.desiredTotal",
      ],
      mutation: "No input mutation.",
      returnBehavior: "Returns True if first player can force a win.",
    },
  }),
  defineDsaExecution({
    id: "mex-subtraction-game",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "grundy",
      arguments: [input("n"), input("moves")],
    },
    cases: [
      ...cases(
        { label: "Three moves, four stones", input: { n: 4, moves: [1, 2, 3] }, expected: 0 },
        { label: "Empty pile", input: { n: 0, moves: [1, 2, 3] }, expected: 0 },
        { label: "Three moves, seven stones", input: { n: 7, moves: [1, 2, 3] }, expected: 3 },
      ),
      ...extraCases(
        { label: "One reachable move", input: { n: 1, moves: [1, 2, 3] }, expected: 1 },
        { label: "Five stones", input: { n: 5, moves: [1, 2, 3] }, expected: 1 },
        { label: "No move reaches one", input: { n: 1, moves: [2, 3] }, expected: 0 },
        { label: "Custom move set", input: { n: 4, moves: [2, 3] }, expected: 2 },
        { label: "Single subtraction", input: { n: 8, moves: [1] }, expected: 0 },
      ),
    ],
    audit: {
      signature: "Solution().grundy(n: int, moves: list[int]) -> int",
      defaultInputShape: "{ n: number; moves: number[] }",
      argumentMapping: ["n <- $.n", "moves <- $.moves"],
      mutation: "No input mutation.",
      returnBehavior: "Returns the Grundy value of a subtraction-game pile.",
    },
  }),
  defineDsaExecution({
    id: "stone-game-dp",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "stoneGameIII",
      arguments: [input()],
    },
    cases: cases(
      { label: "Piles [1, 2, 3, 7]", input: [1, 2, 3, 7], expected: "Bob" },
      { label: "Piles [1, 2, 3, -9]", input: [1, 2, 3, -9], expected: "Alice" },
      { label: "Piles [1, 2, 3, 6]", input: [1, 2, 3, 6], expected: "Tie" },
    ),
    audit: {
      signature: "Solution().stoneGameIII(stoneValue: list[int]) -> str",
      defaultInputShape: "number[]",
      argumentMapping: ["stoneValue <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns winner name ('Alice', 'Bob', or 'Tie').",
    },
  }),
];
