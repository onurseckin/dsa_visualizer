import { describe, it, expect } from "vitest";
import { im2col4dTo2dUnroller, DEFAULT_IM2COL4DTO2DUNROLLER_INPUT, generateIm2col4dTo2dUnrollerSteps } from "./im2col4dTo2dUnroller";

describe("im2col-4d-to-2d-unroller (Strided im2col 4D-to-2D Matrix Unroller)", () => {
  it("should have correct metadata", () => {
    expect(im2col4dTo2dUnroller.id).toBe("im2col-4d-to-2d-unroller");
    expect(im2col4dTo2dUnroller.isMlInfra).toBe(true);
    expect(im2col4dTo2dUnroller.mlInfraLevel).toBe(8);
    expect(im2col4dTo2dUnroller.mlInfraCategory).toBe("ml_convolutions");
    expect(im2col4dTo2dUnroller.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateIm2col4dTo2dUnrollerSteps(DEFAULT_IM2COL4DTO2DUNROLLER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Strided im2col 4D-to-2D Matrix Unroller");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
