import { describe, it, expect } from "vitest";
import {
  nvlinkSymmetricMemoryPeerToPeerEngine,
  DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT,
  generateNvlinkSymmetricMemoryPeerToPeerEngineSteps,
} from "./nvlinkSymmetricMemoryPeerToPeerEngine";

describe("nvlink-symmetric-memory-peer-to-peer-engine (NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine)", () => {
  it("should have correct metadata", () => {
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.id).toBe(
      "nvlink-symmetric-memory-peer-to-peer-engine",
    );
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.isMlInfra).toBe(true);
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.mlInfraLevel).toBe(11);
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.mlInfraCategory).toBe("ml_distributed_systems");
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.categories).toContain("ml_distributed_systems");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateNvlinkSymmetricMemoryPeerToPeerEngineSteps(
      DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
