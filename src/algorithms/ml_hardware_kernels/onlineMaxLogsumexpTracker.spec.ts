import { describe, it, expect } from "vitest";
import { onlineMaxLogsumexpTracker } from "./onlineMaxLogsumexpTracker";

describe("onlineMaxLogsumexpTracker", () => {
  it("should have valid metadata", () => {
    expect(onlineMaxLogsumexpTracker.id).toBeDefined();
    expect(onlineMaxLogsumexpTracker.title).toBeDefined();
    expect(onlineMaxLogsumexpTracker.code).toBeDefined();
    expect(onlineMaxLogsumexpTracker.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = onlineMaxLogsumexpTracker.generateSteps(onlineMaxLogsumexpTracker.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
