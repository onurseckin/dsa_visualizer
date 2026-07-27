import { describe, it, expect } from "vitest";
import { prefixToPostfixConversion, DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT, generatePrefixToPostfixConversionSteps } from "./prefixToPostfixConversion";

describe("prefix-to-postfix-conversion (Prefix to Postfix Expression Converter)", () => {
  it("should have correct metadata", () => {
    expect(prefixToPostfixConversion.id).toBe("prefix-to-postfix-conversion");
    expect(prefixToPostfixConversion.isMlInfra).toBe(true);
    expect(prefixToPostfixConversion.mlInfraLevel).toBe(3);
    expect(prefixToPostfixConversion.mlInfraCategory).toBe("ml_autograd_dags");
    expect(prefixToPostfixConversion.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePrefixToPostfixConversionSteps(DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Prefix to Postfix Expression Converter");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
