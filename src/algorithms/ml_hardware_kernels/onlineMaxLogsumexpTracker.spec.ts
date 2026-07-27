import { describe, it, expect } from "vitest";
import { onlineMaxLogsumexpTracker, DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT, generateOnlineMaxLogsumexpTrackerSteps } from "./onlineMaxLogsumexpTracker";

describe("online-max-logsumexp-tracker (Online Softmax Running Max & LSE Tracker)", () => {
  it("should have correct metadata", () => {
    expect(onlineMaxLogsumexpTracker.id).toBe("online-max-logsumexp-tracker");
    expect(onlineMaxLogsumexpTracker.isMlInfra).toBe(true);
    expect(onlineMaxLogsumexpTracker.mlInfraLevel).toBe(10);
    expect(onlineMaxLogsumexpTracker.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(onlineMaxLogsumexpTracker.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateOnlineMaxLogsumexpTrackerSteps(DEFAULT_ONLINEMAXLOGSUMEXPTRACKER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Online Softmax Running Max & LSE Tracker");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
