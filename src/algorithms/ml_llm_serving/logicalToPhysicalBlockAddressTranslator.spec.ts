import { describe, it, expect } from "vitest";
import {
  logicalToPhysicalBlockAddressTranslator,
  DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
  generateLogicalToPhysicalBlockAddressTranslatorSteps,
} from "./logicalToPhysicalBlockAddressTranslator";

describe("logical-to-physical-block-address-translator (PagedAttention Logical to Physical Address Translator)", () => {
  it("should have correct metadata", () => {
    expect(logicalToPhysicalBlockAddressTranslator.id).toBe(
      "logical-to-physical-block-address-translator",
    );
    expect(logicalToPhysicalBlockAddressTranslator.isMlInfra).toBe(true);
    expect(logicalToPhysicalBlockAddressTranslator.mlInfraLevel).toBe(12);
    expect(logicalToPhysicalBlockAddressTranslator.mlInfraCategory).toBe("ml_llm_serving");
    expect(logicalToPhysicalBlockAddressTranslator.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateLogicalToPhysicalBlockAddressTranslatorSteps(
      DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain(
      "PagedAttention Logical to Physical Address Translator",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
