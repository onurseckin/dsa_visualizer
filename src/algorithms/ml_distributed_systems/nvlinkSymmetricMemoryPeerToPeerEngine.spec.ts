import { describe, it, expect } from "vitest";
import {
  nvlinkSymmetricMemoryPeerToPeerEngine,
  NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_CODE,
  DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT,
  generateNvlinkSymmetricMemoryPeerToPeerEngineSteps,
} from "./nvlinkSymmetricMemoryPeerToPeerEngine";

describe("nvlink-symmetric-memory-peer-to-peer-engine (NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine)", () => {
  it("should have correct metadata", () => {
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.id).toBe(
      "nvlink-symmetric-memory-peer-to-peer-engine",
    );
    expect(
      nvlinkSymmetricMemoryPeerToPeerEngine.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.topicIds).toContain("ml_distributed_systems");
    expect(nvlinkSymmetricMemoryPeerToPeerEngine.topicIds).toContain("ml_distributed_systems");
  });

  it("should generate >= 20 algorithm steps", () => {
    const steps = generateNvlinkSymmetricMemoryPeerToPeerEngineSteps(
      DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Enter nvlink_symmetric_memory_peer_to_peer_engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Return Peer Transfers List");
  });

  it("should have lineExplanations mapping every code line", () => {
    const codeLines = NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_CODE.trimEnd().split("\n").length;
    const explanations = nvlinkSymmetricMemoryPeerToPeerEngine.trivia?.lineExplanations || {};
    expect(Object.keys(explanations).length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(explanations[i]).toBeDefined();
    }
  });
});
