import { describe, expect, it } from "vitest";
import {
  coinChangeDp,
  generateCoinChangeSteps,
  DEFAULT_COIN_CHANGE_INPUT,
  type CoinChangeInput,
} from "../coinChangeDp";

describe("coinChangeDp algorithm logic spec", () => {
  it("has category dp_1d and valid metadata", () => {
    expect(coinChangeDp.id).toBe("coin-change-dp");
    expect(coinChangeDp.category).toBe("dp_1d");
    expect(coinChangeDp.difficulty).toBe("Medium");
    expect(coinChangeDp.code).toContain("def coin_change");
  });

  it("generates valid steps for default input", () => {
    const steps = generateCoinChangeSteps(DEFAULT_COIN_CHANGE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.primarySnapshot.kind).toBe("array");
    if (lastStep.primarySnapshot.kind === "array") {
      expect(lastStep.primarySnapshot.elements.length).toBe(DEFAULT_COIN_CHANGE_INPUT.amount + 1);
    }
    expect(lastStep.variables.result).toBe(2);
  });

  it("handles edge case when amount cannot be made", () => {
    const steps = generateCoinChangeSteps({ coins: [3, 5], amount: 1 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(-1);
  });

  it("handles base case when amount is 0", () => {
    const steps = generateCoinChangeSteps({ coins: [1, 2], amount: 0 });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(0);
  });

  it("handles empty/undefined inputs and unreachable subproblems", () => {
    const steps1 = generateCoinChangeSteps({} as CoinChangeInput);
    expect(steps1.length).toBeGreaterThan(0);

    const steps2 = generateCoinChangeSteps({ coins: [3], amount: 4 });
    const lastStep = steps2[steps2.length - 1];
    expect(lastStep.variables.result).toBe(-1);
  });

  it("provides 3 typed examples (basic, complex, negative) that generate steps without errors", () => {
    expect(coinChangeDp.examples).toHaveLength(3);
    expect(coinChangeDp.examples?.map((ex) => ex.kind)).toEqual(["basic", "complex", "negative"]);
    expect(coinChangeDp.examples?.map((ex) => ex.title)).toEqual([
      "Basic Example",
      "Complex Edge Case",
      "Failing / Boundary Case",
    ]);

    for (const example of coinChangeDp.examples!) {
      const steps = coinChangeDp.generateSteps(example.input as CoinChangeInput);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
