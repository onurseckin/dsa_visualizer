import { describe, it, expect } from "vitest";
import { tritonProgramId1dTo2dMap, DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT, generateTritonProgramId1dTo2dMapSteps } from "./tritonProgramId1dTo2dMap";

describe("triton-program-id-1d-to-2d-map (Triton `tl.program_id` 1D-to-2D Coordinate Mapper)", () => {
  it("should have correct metadata", () => {
    expect(tritonProgramId1dTo2dMap.id).toBe("triton-program-id-1d-to-2d-map");
    expect(tritonProgramId1dTo2dMap.isMlInfra).toBe(true);
    expect(tritonProgramId1dTo2dMap.mlInfraLevel).toBe(10);
    expect(tritonProgramId1dTo2dMap.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tritonProgramId1dTo2dMap.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTritonProgramId1dTo2dMapSteps(DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton `tl.program_id` 1D-to-2D Coordinate Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
