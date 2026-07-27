import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROPE_INPUT,
  ROPE_EXAMPLES,
  ROPE_ROTARY_POSITION_CODE,
  generateRopeSteps,
  ropeRotaryPosition,
} from "../ropeRotaryPosition";

describe("ropeRotaryPosition (Level 7 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(ropeRotaryPosition.id).toBe("rope-rotary-position");
    expect(ropeRotaryPosition.isMlInfra).toBe(true);
    expect(ropeRotaryPosition.mlInfraLevel).toBe(7);
    expect(ropeRotaryPosition.category).toBe("ml_attention_geometry");
    expect(ropeRotaryPosition.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(ROPE_ROTARY_POSITION_CODE).toContain("def rope_rotary_position");
    expect(ropeRotaryPosition.code).toBe(ROPE_ROTARY_POSITION_CODE);
    expect(ropeRotaryPosition.defaultInput).toEqual(DEFAULT_ROPE_INPUT);
  });

  it("generates steps for default input", () => {
    const steps = generateRopeSteps(DEFAULT_ROPE_INPUT);
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
    expect(ROPE_EXAMPLES).toHaveLength(3);
    for (const example of ROPE_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateRopeSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
