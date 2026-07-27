import { describe, it, expect } from "vitest";
import {
  zero3ParameterShardingDynamicAllgather,
  DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT,
  generateZero3ParameterShardingDynamicAllgatherSteps,
} from "./zero3ParameterShardingDynamicAllgather";

describe("zero3-parameter-sharding-dynamic-allgather (DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(zero3ParameterShardingDynamicAllgather.id).toBe(
      "zero3-parameter-sharding-dynamic-allgather",
    );
    expect(zero3ParameterShardingDynamicAllgather.isMlInfra).toBe(true);
    expect(zero3ParameterShardingDynamicAllgather.mlInfraLevel).toBe(11);
    expect(zero3ParameterShardingDynamicAllgather.mlInfraCategory).toBe("ml_distributed_systems");
    expect(zero3ParameterShardingDynamicAllgather.categories).toContain("ml_distributed_systems");
    expect(zero3ParameterShardingDynamicAllgather.defaultInput).toEqual(
      DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT,
    );

    const codeLines = zero3ParameterShardingDynamicAllgather.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      zero3ParameterShardingDynamicAllgather.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(zero3ParameterShardingDynamicAllgather.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateZero3ParameterShardingDynamicAllgatherSteps(
      DEFAULT_ZERO3PARAMETERSHARDINGDYNAMICALLGATHER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize");
    expect(steps[steps.length - 1].explanation.what).toContain("Return");
  });
});
