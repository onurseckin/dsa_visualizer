import { describe, it, expect } from "vitest";
import { cudaTritonSramTiledGemm, DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT, generateCudaTritonSramTiledGemmSteps } from "./cudaTritonSramTiledGemm";

describe("cuda-triton-sram-tiled-gemm (CUDA/Triton SRAM Tiled GEMM Engine)", () => {
  it("should have correct metadata", () => {
    expect(cudaTritonSramTiledGemm.id).toBe("cuda-triton-sram-tiled-gemm");
    expect(cudaTritonSramTiledGemm.isMlInfra).toBe(true);
    expect(cudaTritonSramTiledGemm.mlInfraLevel).toBe(2);
    expect(cudaTritonSramTiledGemm.mlInfraCategory).toBe("ml_gemm_roofline");
    expect(cudaTritonSramTiledGemm.categories).toContain("ml_gemm_roofline");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateCudaTritonSramTiledGemmSteps(DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("CUDA/Triton SRAM Tiled GEMM Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
