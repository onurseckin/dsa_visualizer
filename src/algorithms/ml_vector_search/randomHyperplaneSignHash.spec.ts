import { describe, it, expect } from "vitest";
import { randomHyperplaneSignHash } from "./randomHyperplaneSignHash";

describe("randomHyperplaneSignHash", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(randomHyperplaneSignHash).toBeDefined();
    expect(randomHyperplaneSignHash.id).toBe("randomHyperplaneSignHash");
    expect(randomHyperplaneSignHash.isMlInfra).toBe(true);
    expect(randomHyperplaneSignHash.mlInfraLevel).toBe(5);
    expect(randomHyperplaneSignHash.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = randomHyperplaneSignHash.generateSteps(randomHyperplaneSignHash.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
