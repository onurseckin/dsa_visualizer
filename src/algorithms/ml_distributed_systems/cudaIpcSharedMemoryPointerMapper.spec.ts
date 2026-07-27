import { describe, it, expect } from "vitest";
import {
  cudaIpcSharedMemoryPointerMapper,
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

  it("should generate valid algorithm steps", () => {
    const steps = generateCudaIpcSharedMemoryPointerMapperSteps(
      DEFAULT_CUDAIPCSHAREDMEMORYPOINTERMAPPER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("CUDA IPC Zero-Copy Shared Memory Pointer Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
