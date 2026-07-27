import { describe, it, expect } from "vitest";
import { columnParallelLinearReshaper, DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT, generateColumnParallelLinearReshaperSteps } from "./columnParallelLinearReshaper";

describe("column-parallel-linear-reshaper (Megatron-LM Column Parallel Linear Layer Reshaper)", () => {
  it("should have correct metadata", () => {
    expect(columnParallelLinearReshaper.id).toBe("column-parallel-linear-reshaper");
    expect(columnParallelLinearReshaper.isMlInfra).toBe(true);
    expect(columnParallelLinearReshaper.mlInfraLevel).toBe(11);
    expect(columnParallelLinearReshaper.mlInfraCategory).toBe("ml_distributed_systems");
    expect(columnParallelLinearReshaper.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateColumnParallelLinearReshaperSteps(DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Megatron-LM Column Parallel Linear Layer Reshaper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
