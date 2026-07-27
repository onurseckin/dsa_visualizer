import { describe, it, expect } from "vitest";
import {
  cudaIpcSharedMemoryPointerMapper,
  CUDAIPCSHAREDMEMORYPOINTERMAPPER_CODE,
  DEFAULT_CUDAIPCSHAREDMEMORYPOINTERMAPPER_INPUT,
  generateCudaIpcSharedMemoryPointerMapperSteps,
} from "./cudaIpcSharedMemoryPointerMapper";

describe("cuda-ipc-shared-memory-pointer-mapper (CUDA IPC Zero-Copy Shared Memory Pointer Mapper)", () => {
  it("should have correct metadata", () => {
    expect(cudaIpcSharedMemoryPointerMapper.id).toBe("cuda-ipc-shared-memory-pointer-mapper");
    expect(cudaIpcSharedMemoryPointerMapper.isMlInfra).toBe(true);
    expect(cudaIpcSharedMemoryPointerMapper.mlInfraLevel).toBe(11);
    expect(cudaIpcSharedMemoryPointerMapper.mlInfraCategory).toBe("ml_distributed_systems");
    expect(cudaIpcSharedMemoryPointerMapper.categories).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateCudaIpcSharedMemoryPointerMapperSteps(
      DEFAULT_CUDAIPCSHAREDMEMORYPOINTERMAPPER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Enter cuda_ipc_shared_memory_pointer_mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Return Mapped Handles Dictionary");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = CUDAIPCSHAREDMEMORYPOINTERMAPPER_CODE.trimEnd().split("\n").length;
    const explanations = cudaIpcSharedMemoryPointerMapper.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
