import { describe, it, expect } from "vitest";
import { missingValueDefaultDirectionSplitter } from "./missingValueDefaultDirectionSplitter";

describe("missingValueDefaultDirectionSplitter", () => {
  it("should have valid metadata", () => {
    expect(missingValueDefaultDirectionSplitter.id).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.title).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.code).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = missingValueDefaultDirectionSplitter.generateSteps(
      missingValueDefaultDirectionSplitter.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
