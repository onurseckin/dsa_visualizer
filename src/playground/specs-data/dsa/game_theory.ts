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
        label: "Large winning reduction",
        input: [7, 4, 5],
        expected: { winner: "First Player", winning_pile: 0, target_size: 1, remove: 6 },
      },
    ),
    audit: {
      signature: "nim_game(piles: list[int]) -> dict[str, str | int]",
      defaultInputShape: "{ piles: number[] }",
      argumentMapping: ["piles <- $"],
      mutation: "Does not mutate piles.",
      returnBehavior: "Returns the winner and one canonical winning reduction when available.",
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
      argumentMapping: ["pile_sizes <- $.piles", "allowed_moves <- $.moves"],
      mutation: "Does not mutate authored arrays.",
      returnBehavior: "Returns the Grundy table through the largest pile and the combined nim sum.",
    },
  }),
] as const;
