import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPECULATIVE_DECODING_INPUT,
  SPECULATIVE_DECODING_EXAMPLES,
  SPECULATIVE_DECODING_VERIFIER_CODE,
  generateSpeculativeDecodingSteps,
  speculativeDecodingVerifier,
} from "../speculativeDecodingVerifier";

describe("speculativeDecodingVerifier (Level 10 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(speculativeDecodingVerifier.id).toBe("speculative-decoding-verifier");
    expect(speculativeDecodingVerifier.isMlInfra).toBe(true);
    expect(speculativeDecodingVerifier.mlInfraLevel).toBe(10);
    expect(speculativeDecodingVerifier.category).toBe("ml_llm_serving");
    expect(speculativeDecodingVerifier.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(SPECULATIVE_DECODING_VERIFIER_CODE).toContain("def speculative_decoding_verifier");
    expect(speculativeDecodingVerifier.code).toBe(SPECULATIVE_DECODING_VERIFIER_CODE);
    expect(speculativeDecodingVerifier.defaultInput).toEqual(DEFAULT_SPECULATIVE_DECODING_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateSpeculativeDecodingSteps(DEFAULT_SPECULATIVE_DECODING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
      expect(steps[i].primarySnapshot.kind).toBe("array");
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(SPECULATIVE_DECODING_EXAMPLES).toHaveLength(3);
    for (const example of SPECULATIVE_DECODING_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateSpeculativeDecodingSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
