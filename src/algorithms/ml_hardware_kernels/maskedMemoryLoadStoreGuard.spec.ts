import { describe, it, expect } from "vitest";
import { maskedMemoryLoadStoreGuard } from "./maskedMemoryLoadStoreGuard";

describe("maskedMemoryLoadStoreGuard", () => {
  it("should have valid metadata", () => {
    expect(maskedMemoryLoadStoreGuard.id).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.title).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.code).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = maskedMemoryLoadStoreGuard.generateSteps(maskedMemoryLoadStoreGuard.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
