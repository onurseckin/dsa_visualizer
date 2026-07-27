import { describe, it, expect } from "vitest";
import { zero3ParameterShardingDynamicAllgather, DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT, generateZero3ParameterShardingDynamicAllgatherSteps } from "./zero3ParameterShardingDynamicAllgather";

describe("zero3-parameter-sharding-dynamic-allgather (DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine)", () => {
  it("should have correct metadata", () => {
    expect(zero3ParameterShardingDynamicAllgather.id).toBe("zero3-parameter-sharding-dynamic-allgather");
    expect(zero3ParameterShardingDynamicAllgather.isMlInfra).toBe(true);
    expect(zero3ParameterShardingDynamicAllgather.mlInfraLevel).toBe(11);
    expect(zero3ParameterShardingDynamicAllgather.mlInfraCategory).toBe("ml_distributed_systems");
    expect(zero3ParameterShardingDynamicAllgather.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateZero3ParameterShardingDynamicAllgatherSteps(DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
