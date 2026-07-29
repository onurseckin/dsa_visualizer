import { cases, defineDsaExecution, input } from "./helpers";

export const gameTheoryExecutions = [
  defineDsaExecution({
    id: "nim-game",
    entrypoint: "nim_game",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Winning final pile",
        input: [1, 1, 2],
        expected: { winner: "First Player", winning_pile: 2, target_size: 0, remove: 2 },
      },
      {
        label: "Balanced xor",
        input: [1, 2, 3],
        expected: { winner: "Second Player", winning_pile: -1, target_size: 0 },
      },
      {
        label: "Unique winning reduction",
        input: [1, 2, 4],
        expected: { winner: "First Player", winning_pile: 2, target_size: 3, remove: 1 },
      },
    ),
    audit: {
      signature: "nim_game(piles: list[int]) -> dict[str, str | int]",
      defaultInputShape: "{ piles: number[] }",
      argumentMapping: ["piles <- $"],
      mutation: "Does not mutate piles.",
      returnBehavior:
        "Returns the winner and the uniquely determined winning reduction in the authored fixtures.",
    },
  }),
  defineDsaExecution({
    id: "sprague-grundy-theorem",
    entrypoint: "sprague_grundy",
    invocation: { kind: "function", arguments: [input("piles"), input("moves")] },
    cases: cases(
      {
        label: "Balanced subtraction games",
        input: { piles: [1, 2, 3], moves: [1, 2, 3] },
        expected: [[0, 1, 2, 3], 0],
      },
      { label: "No piles", input: { piles: [], moves: [1] }, expected: [[0], 0] },
      {
        label: "Irregular move set",
        input: { piles: [4, 5], moves: [1, 3, 4] },
        expected: [[0, 1, 0, 1, 2, 3], 1],
      },
    ),
    audit: {
      signature: "sprague_grundy(pile_sizes, allowed_moves) -> tuple[list[int], int]",
      defaultInputShape: "{ pileSizes: number[]; allowedMoves: number[] }",
      argumentMapping: ["piles <- $.pileSizes", "moves <- $.allowedMoves"],
      mutation: "No input mutation.",
      returnBehavior: "Returns Grundy values.",
    },
  }),
  defineDsaExecution({
    id: "game-state-minimax",
    entrypoint: "game_state_minimax",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "String++++", input: { currentState: "++++" }, expected: true },
      { label: "String++", input: { currentState: "++" }, expected: true },
      { label: "String--", input: { currentState: "--" }, expected: false },
    ),
    audit: {
      signature: "solve(input: dict) -> bool",
      defaultInputShape: "{ currentState: string }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Evaluates game state winning outcome.",
    },
  }),
  defineDsaExecution({
    id: "stone-game-dp",
    entrypoint: "stone_game_dp",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Piles [5,3,4,5]", input: { piles: [5, 3, 4, 5] }, expected: true },
      { label: "Piles [3,7,2,3]", input: { piles: [3, 7, 2, 3] }, expected: true },
      { label: "Piles [1,2]", input: { piles: [1, 2] }, expected: true },
    ),
    audit: {
      signature: "solve(input: dict) -> bool",
      defaultInputShape: "{ piles: number[] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Evaluates stone game DP outcome.",
    },
  }),
  defineDsaExecution({
    id: "mex-subtraction-game",
    entrypoint: "mex_subtraction_game",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Heap 10 moves [1,2,3]", input: { n: 10, moves: [1, 2, 3] }, expected: 2 },
      { label: "Heap 0", input: { n: 0, moves: [1, 2, 3] }, expected: 0 },
      { label: "Heap 5 moves [1,4]", input: { n: 5, moves: [1, 4] }, expected: 1 },
    ),
    audit: {
      signature: "solve(input: dict) -> int",
      defaultInputShape: "{ n: number; moves: number[] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns Grundy value of subtraction game.",
    },
  }),
];
