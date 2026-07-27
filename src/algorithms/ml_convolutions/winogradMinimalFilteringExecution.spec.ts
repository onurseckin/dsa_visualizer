import { describe, it, expect } from "vitest";
import {
  winogradMinimalFilteringExecution,
  DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
  generateWinogradMinimalFilteringExecutionSteps,
} from "./winogradMinimalFilteringExecution";

describe("winogradMinimalFilteringExecution", () => {
  it("should have correct metadata", () => {
    expect(winogradMinimalFilteringExecution.id).toBe("winogradMinimalFilteringExecution");
    expect(winogradMinimalFilteringExecution.isMlInfra).toBe(true);
    expect(winogradMinimalFilteringExecution.mlInfraLevel).toBe(8);
    expect(winogradMinimalFilteringExecution.mlInfraCategory).toBe("ml_convolutions");
    expect(winogradMinimalFilteringExecution.categories).toContain("ml_convolutions");
    expect(winogradMinimalFilteringExecution.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateWinogradMinimalFilteringExecutionSteps(
      DEFAULT_WINOGRADMINIMALFILTERINGEXECUTION_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Winograd F(2x2, 3x3) Minimal Filtering Execution Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
