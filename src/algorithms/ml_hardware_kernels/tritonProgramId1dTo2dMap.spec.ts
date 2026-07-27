import { describe, it, expect } from "vitest";
import { tritonProgramId1dTo2dMap } from "./tritonProgramId1dTo2dMap";

describe("tritonProgramId1dTo2dMap", () => {
  it("should have valid metadata", () => {
    expect(tritonProgramId1dTo2dMap.id).toBeDefined();
    expect(tritonProgramId1dTo2dMap.title).toBeDefined();
    expect(tritonProgramId1dTo2dMap.code).toBeDefined();
    expect(tritonProgramId1dTo2dMap.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tritonProgramId1dTo2dMap.generateSteps(tritonProgramId1dTo2dMap.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
