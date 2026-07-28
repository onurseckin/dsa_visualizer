import { describe, it, expect } from "vitest";
import { randomHyperplaneSignHash } from "./randomHyperplaneSignHash";
import { requireExampleInputs } from "../specs/assertions";

describe("random-hyperplane-sign-hash", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(randomHyperplaneSignHash).toBeDefined();
    expect(randomHyperplaneSignHash.id).toBe("random-hyperplane-sign-hash");
    expect(randomHyperplaneSignHash.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(randomHyperplaneSignHash.topicIds).toContain("ml_vector_search");
  });

  it("should have clean Python code without docstrings or comments", () => {
    expect(randomHyperplaneSignHash.code).not.toContain("#");
    expect(randomHyperplaneSignHash.code).not.toContain('"""');
    expect(randomHyperplaneSignHash.code).not.toContain("'''");
  });

  it("should generate steps with accurate code lines and vector snapshot kind", () => {
    const steps = randomHyperplaneSignHash.generateSteps(randomHyperplaneSignHash.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
    expect(steps[0].codeLine).toBe(2);
    expect(steps[0].primarySnapshot?.kind).toBe("vector");

    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThan(0);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot?.kind).toBe("vector");
    });
  });

  it("should execute step generation for all examples without runtime errors", () => {
    requireExampleInputs(
      randomHyperplaneSignHash,
      (value): value is typeof randomHyperplaneSignHash.defaultInput =>
        typeof value === "object" && value !== null,
    ).forEach((input) => {
      const steps = randomHyperplaneSignHash.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
    });
  });
});
