import { describe, it, expect } from "vitest";
import { flashAttention1ForwardTiling } from "./flashAttention1ForwardTiling";

describe("flashAttention1ForwardTiling", () => {
  it("should have valid metadata", () => {
    expect(flashAttention1ForwardTiling.id).toBeDefined();
    expect(flashAttention1ForwardTiling.title).toBeDefined();
    expect(flashAttention1ForwardTiling.code).toBeDefined();
    expect(flashAttention1ForwardTiling.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = flashAttention1ForwardTiling.generateSteps(
      flashAttention1ForwardTiling.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
