import { describe, it, expect } from "vitest";
import {
  referenceCountingCowBeamSearchBrancher,
  DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
  generateReferenceCountingCowBeamSearchBrancherSteps,
} from "./referenceCountingCowBeamSearchBrancher";

describe("reference-counting-cow-beam-search-brancher (Copy-On-Write (CoW) Reference-Counted Beam Search Brancher)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(referenceCountingCowBeamSearchBrancher.id).toBe(
      "reference-counting-cow-beam-search-brancher",
    );
    expect(
      referenceCountingCowBeamSearchBrancher.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(referenceCountingCowBeamSearchBrancher.topicIds).toContain("ml_llm_serving");
    expect(referenceCountingCowBeamSearchBrancher.topicIds).toContain("ml_llm_serving");
    expect(referenceCountingCowBeamSearchBrancher.defaultInput).toEqual(
      DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
    );

    const codeLines = referenceCountingCowBeamSearchBrancher.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      referenceCountingCowBeamSearchBrancher.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(referenceCountingCowBeamSearchBrancher.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 15 steps", () => {
    const steps = generateReferenceCountingCowBeamSearchBrancherSteps(
      DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(15);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(11);
  });
});
