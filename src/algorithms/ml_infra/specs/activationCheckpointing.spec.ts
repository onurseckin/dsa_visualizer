import { describe, expect, it } from "vitest";
import {
  activationCheckpointing,
  DEFAULT_ACTIVATION_CHECKPOINTING_INPUT,
  generateActivationCheckpointingSteps,
} from "../activationCheckpointing";

describe("activationCheckpointing algorithm definition", () => {
  it("has valid metadata and ML Infra markers", () => {
    expect(activationCheckpointing.id).toBe("activation-checkpointing");
    expect(activationCheckpointing.topicIds).toContain("ml_autograd_dags");
    expect(activationCheckpointing.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(activationCheckpointing.sources?.[0].type).toBe("ml_infra");
  });

  it("calculates basic checkpoint schedule and VRAM savings correctly", () => {
    const steps = generateActivationCheckpointingSteps(DEFAULT_ACTIVATION_CHECKPOINTING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.vram_saved_mb).toBe(2000);
  });

  it("handles deep model with larger checkpoint interval", () => {
    const steps = generateActivationCheckpointingSteps({
      numLayers: 16,
      checkpointInterval: 4,
      activationSizePerLayerMb: 1000,
      recomputeFlopsPerLayerGflop: 5.0,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.vram_saved_mb).toBe(12000);
  });

  it("handles zero layer invalid input boundary condition", () => {
    const steps = generateActivationCheckpointingSteps({
      numLayers: 0,
      checkpointInterval: 2,
      activationSizePerLayerMb: 500,
      recomputeFlopsPerLayerGflop: 2.0,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.vram_saved_mb).toBe(0);
  });
});
