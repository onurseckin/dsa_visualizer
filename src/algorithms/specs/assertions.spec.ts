import { describe, expect, it } from "vitest";
import { requireExampleInputs, requireLineExplanations } from "./assertions";

describe("algorithm spec assertions", () => {
  it("returns authored examples after narrowing their input type", () => {
    const inputs = requireExampleInputs(
      { examples: [{ input: [1, 2, 3] }, { input: [4, 5] }] },
      (input): input is number[] => Array.isArray(input),
    );

    expect(inputs).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });

  it("rejects missing examples and display-only example inputs", () => {
    expect(() =>
      requireExampleInputs<number[]>({ examples: undefined }, (input): input is number[] =>
        Array.isArray(input),
      ),
    ).toThrow("expected authored examples");
    expect(() =>
      requireExampleInputs<number[]>(
        { examples: [{ input: "1, 2, 3" }] },
        (input): input is number[] => Array.isArray(input),
      ),
    ).toThrow("must use a typed input");
  });

  it("returns line explanations and rejects missing metadata", () => {
    expect(requireLineExplanations({ trivia: { lineExplanations: { 1: "Initialize." } } })).toEqual(
      {
        1: "Initialize.",
      },
    );
    expect(() => requireLineExplanations({ trivia: {} })).toThrow(
      "expected trivia line explanations",
    );
  });
});
