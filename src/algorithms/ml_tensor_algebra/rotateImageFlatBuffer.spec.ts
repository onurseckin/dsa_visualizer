import { describe, it, expect } from "vitest";
import {
  rotateImageFlatBuffer,
  DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT,
  generateRotateImageFlatBufferSteps,
  ROTATEIMAGEFLATBUFFER_CODE,
} from "./rotateImageFlatBuffer";

describe("rotate-image-flat-buffer (Rotate 2D Tensor 90 Degrees in Flat Memory)", () => {
  it("should have correct metadata and structure", () => {
    expect(rotateImageFlatBuffer.id).toBe("rotate-image-flat-buffer");
    expect(rotateImageFlatBuffer.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(rotateImageFlatBuffer.topicIds).toContain("ml_tensor_algebra");
    expect(rotateImageFlatBuffer.topicIds).toContain("ml_tensor_algebra");
    expect(rotateImageFlatBuffer.topicGuide?.sections.length).toBe(5);
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const totalLines = ROTATEIMAGEFLATBUFFER_CODE.split("\n").length;
    const explanations = rotateImageFlatBuffer.trivia?.lineExplanations ?? {};
    for (let line = 1; line <= totalLines; line++) {
      expect(explanations[line], `Line ${line} missing in lineExplanations`).toBeDefined();
      expect(explanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should generate >= 20 steps for default input and use matrix snapshot", () => {
    const steps = generateRotateImageFlatBufferSteps(DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("90° Matrix Rotation Engine");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Rotated Matrix");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
  });

  it("should correctly rotate matrix 90 degrees clockwise", () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const steps = generateRotateImageFlatBufferSteps({ matrix });
    const lastStep = steps[steps.length - 1];
    const parsedMatrix = JSON.parse(String(lastStep.variables.matrix));
    expect(parsedMatrix).toEqual([
      [7, 4, 1],
      [8, 5, 2],
      [9, 6, 3],
    ]);
  });
});
