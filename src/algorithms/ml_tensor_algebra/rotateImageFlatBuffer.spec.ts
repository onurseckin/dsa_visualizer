import { describe, it, expect } from "vitest";
import {
  rotateImageFlatBuffer,
  DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT,
  generateRotateImageFlatBufferSteps,
} from "./rotateImageFlatBuffer";

describe("rotate-image-flat-buffer (Rotate 2D Tensor 90 Degrees in Flat Memory)", () => {
  it("should have correct metadata", () => {
    expect(rotateImageFlatBuffer.id).toBe("rotate-image-flat-buffer");
    expect(rotateImageFlatBuffer.isMlInfra).toBe(true);
    expect(rotateImageFlatBuffer.mlInfraLevel).toBe(1);
    expect(rotateImageFlatBuffer.mlInfraCategory).toBe("ml_tensor_algebra");
    expect(rotateImageFlatBuffer.categories).toContain("ml_tensor_algebra");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRotateImageFlatBufferSteps(DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Rotate 2D Tensor 90 Degrees in Flat Memory");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
