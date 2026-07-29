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
      method: "canWin",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Five signs is losing", input: 5, expected: false },
        { label: "No legal pair", input: 1, expected: false },
        { label: "Eight signs has a winning split", input: 8, expected: true },
      ),
      ...extraCases(
        { label: "Empty board", input: 0, expected: false },
        { label: "One legal move", input: 2, expected: true },
        { label: "Three signs", input: 3, expected: true },
        { label: "Four signs", input: 4, expected: true },
        { label: "Nine signs is losing", input: 9, expected: false },
      ),
    ],
    audit: {
      signature: "Solution().canWin(n: int) -> bool",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns True if the first player wins Flip Game II on n plus signs.",
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
      method: "canWin",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Symmetric four-pile win", input: [5, 3, 4, 5], expected: true },
        { label: "Equal pair ties", input: [2, 2], expected: false },
        { label: "Asymmetric four piles", input: [3, 9, 1, 2], expected: true },
      ),
      ...extraCases(
        { label: "Single pile", input: [1], expected: true },
        { label: "Increasing pair", input: [1, 2], expected: true },
        { label: "Odd-length losing position", input: [1, 5, 2], expected: false },
        { label: "Equal endpoints with a central pair", input: [7, 8, 8, 7], expected: false },
        { label: "Large center pile", input: [8, 15, 3, 7], expected: true },
      ),
    ],
    audit: {
      signature: "Solution().canWin(piles: list[int]) -> bool",
      defaultInputShape: "number[]",
      argumentMapping: ["piles <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns True when the first player can obtain a strictly larger total.",
    },
  }),
];
