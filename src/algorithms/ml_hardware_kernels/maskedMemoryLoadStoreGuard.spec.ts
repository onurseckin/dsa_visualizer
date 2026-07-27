import { describe, it, expect } from "vitest";
import { maskedMemoryLoadStoreGuard, DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT, generateMaskedMemoryLoadStoreGuardSteps } from "./maskedMemoryLoadStoreGuard";

describe("masked-memory-load-store-guard (Triton Masked Load/Store Boundary Guard)", () => {
  it("should have correct metadata", () => {
    expect(maskedMemoryLoadStoreGuard.id).toBe("masked-memory-load-store-guard");
    expect(maskedMemoryLoadStoreGuard.isMlInfra).toBe(true);
    expect(maskedMemoryLoadStoreGuard.mlInfraLevel).toBe(10);
    expect(maskedMemoryLoadStoreGuard.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(maskedMemoryLoadStoreGuard.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateMaskedMemoryLoadStoreGuardSteps(DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton Masked Load/Store Boundary Guard");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
