import { describe, it, expect } from "vitest";
import {
  referenceCountingCowBeamSearchBrancher,
  DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
  generateReferenceCountingCowBeamSearchBrancherSteps,
} from "./referenceCountingCowBeamSearchBrancher";

describe("reference-counting-cow-beam-search-brancher (Copy-On-Write (CoW) Reference-Counted Beam Search Brancher)", () => {
  it("should have correct metadata", () => {
    expect(referenceCountingCowBeamSearchBrancher.id).toBe(
      "reference-counting-cow-beam-search-brancher",
    );
    expect(referenceCountingCowBeamSearchBrancher.isMlInfra).toBe(true);
    expect(referenceCountingCowBeamSearchBrancher.mlInfraLevel).toBe(12);
    expect(referenceCountingCowBeamSearchBrancher.mlInfraCategory).toBe("ml_llm_serving");
    expect(referenceCountingCowBeamSearchBrancher.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateReferenceCountingCowBeamSearchBrancherSteps(
      DEFAULT_REFERENCECOUNTINGCOWBEAMSEARCHBRANCHER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Copy-On-Write (CoW) Reference-Counted Beam Search Brancher",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
