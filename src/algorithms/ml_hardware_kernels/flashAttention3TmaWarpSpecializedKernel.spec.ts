import { describe, it, expect } from "vitest";
import { flashAttention3TmaWarpSpecializedKernel } from "./flashAttention3TmaWarpSpecializedKernel";

describe("flashAttention3TmaWarpSpecializedKernel", () => {
  it("should have valid metadata", () => {
    expect(flashAttention3TmaWarpSpecializedKernel.id).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.title).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.code).toBeDefined();
    expect(flashAttention3TmaWarpSpecializedKernel.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = flashAttention3TmaWarpSpecializedKernel.generateSteps(
      flashAttention3TmaWarpSpecializedKernel.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
