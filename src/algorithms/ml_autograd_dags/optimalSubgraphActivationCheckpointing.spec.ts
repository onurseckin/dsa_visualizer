import { describe, it, expect } from "vitest";
import {
  optimalSubgraphActivationCheckpointing,
  DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
  generateOptimalSubgraphActivationCheckpointingSteps,
} from "./optimalSubgraphActivationCheckpointing";

describe("optimal-subgraph-activation-checkpointing (Optimal Subgraph Activation Checkpointing Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(optimalSubgraphActivationCheckpointing.id).toBe(
      "optimal-subgraph-activation-checkpointing",
    );
    expect(optimalSubgraphActivationCheckpointing.isMlInfra).toBe(true);
    expect(optimalSubgraphActivationCheckpointing.mlInfraLevel).toBe(3);
    expect(optimalSubgraphActivationCheckpointing.mlInfraCategory).toBe("ml_autograd_dags");
    expect(optimalSubgraphActivationCheckpointing.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateOptimalSubgraphActivationCheckpointingSteps(
      DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "Optimal Subgraph Activation Checkpointing Scheduler",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
