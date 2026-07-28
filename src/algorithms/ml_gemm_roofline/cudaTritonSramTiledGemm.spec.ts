import { describe, it, expect } from "vitest";
import {
  cudaTritonSramTiledGemm,
  DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
  generateCudaTritonSramTiledGemmSteps,
  CUDATRITONSRAMTILEDGEMM_CODE,
} from "./cudaTritonSramTiledGemm";
import { requireLineExplanations } from "../specs/assertions";

describe("cuda-triton-sram-tiled-gemm (CUDA/Triton SRAM Tiled GEMM Engine)", () => {
  it("should have correct metadata", () => {
    expect(cudaTritonSramTiledGemm.id).toBe("cuda-triton-sram-tiled-gemm");
    expect(cudaTritonSramTiledGemm.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(cudaTritonSramTiledGemm.topicIds).toContain("ml_gemm_roofline");
    expect(cudaTritonSramTiledGemm.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshots", () => {
    const steps = generateCudaTritonSramTiledGemmSteps(DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("CUDA/Triton SRAM Tiled GEMM Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("SRAM Tiled GEMM Complete");

    for (const step of steps) {
      expect(step.primarySnapshot?.kind).toBe("matrix");
    }
  });

  it("should map every line of code in lineExplanations", () => {
    const lines = CUDATRITONSRAMTILEDGEMM_CODE.trim().split("\n");
    const lineCount = lines.length;
    const explanations = requireLineExplanations(cudaTritonSramTiledGemm);

    for (let i = 1; i <= lineCount; i++) {
      expect(explanations[i]).toBeDefined();
      expect(typeof explanations[i]).toBe("string");
      expect(explanations[i].length).toBeGreaterThan(0);
    }
  });
});
