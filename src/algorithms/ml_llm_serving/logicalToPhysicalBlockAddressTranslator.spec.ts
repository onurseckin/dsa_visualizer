import { describe, it, expect } from "vitest";
import {
  logicalToPhysicalBlockAddressTranslator,
  DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
  generateLogicalToPhysicalBlockAddressTranslatorSteps,
} from "./logicalToPhysicalBlockAddressTranslator";

describe("logical-to-physical-block-address-translator (PagedAttention Logical to Physical Address Translator)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(logicalToPhysicalBlockAddressTranslator.id).toBe(
      "logical-to-physical-block-address-translator",
    );
    expect(logicalToPhysicalBlockAddressTranslator.isMlInfra).toBe(true);
    expect(logicalToPhysicalBlockAddressTranslator.mlInfraLevel).toBe(12);
    expect(logicalToPhysicalBlockAddressTranslator.mlInfraCategory).toBe("ml_llm_serving");
    expect(logicalToPhysicalBlockAddressTranslator.categories).toContain("ml_llm_serving");
    expect(logicalToPhysicalBlockAddressTranslator.defaultInput).toEqual(
      DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
    );

    const codeLines = logicalToPhysicalBlockAddressTranslator.code.trim().split("\n").length;
    const explanationKeys = Object.keys(
      logicalToPhysicalBlockAddressTranslator.trivia?.lineExplanations || {},
    ).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(
        logicalToPhysicalBlockAddressTranslator.trivia?.lineExplanations?.[i],
      ).toBeDefined();
    }
  });

  it("should generate valid algorithm steps and produce >= 20 steps", () => {
    const steps = generateLogicalToPhysicalBlockAddressTranslatorSteps(
      DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].codeLine).toBe(1);
    expect(steps[steps.length - 1].codeLine).toBe(23);
  });
});
