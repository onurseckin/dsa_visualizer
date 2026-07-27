import { describe, it, expect } from "vitest";
import { rowParallelLinearAllreducer, DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT, generateRowParallelLinearAllreducerSteps } from "./rowParallelLinearAllreducer";

describe("row-parallel-linear-allreducer (Megatron-LM Row Parallel Linear All-Reduce Engine)", () => {
  it("should have correct metadata", () => {
    expect(rowParallelLinearAllreducer.id).toBe("row-parallel-linear-allreducer");
    expect(rowParallelLinearAllreducer.isMlInfra).toBe(true);
    expect(rowParallelLinearAllreducer.mlInfraLevel).toBe(11);
    expect(rowParallelLinearAllreducer.mlInfraCategory).toBe("ml_distributed_systems");
    expect(rowParallelLinearAllreducer.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRowParallelLinearAllreducerSteps(DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Megatron-LM Row Parallel Linear All-Reduce Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
