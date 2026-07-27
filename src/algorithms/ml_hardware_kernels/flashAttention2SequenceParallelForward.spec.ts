import { describe, it, expect } from "vitest";
import { flashAttention2SequenceParallelForward } from "./flashAttention2SequenceParallelForward";

describe("flashAttention2SequenceParallelForward", () => {
  it("should have valid metadata", () => {
    expect(flashAttention2SequenceParallelForward.id).toBeDefined();
    expect(flashAttention2SequenceParallelForward.title).toBeDefined();
    expect(flashAttention2SequenceParallelForward.code).toBeDefined();
    expect(flashAttention2SequenceParallelForward.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = flashAttention2SequenceParallelForward.generateSteps(
      flashAttention2SequenceParallelForward.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
