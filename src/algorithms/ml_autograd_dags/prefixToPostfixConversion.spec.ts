import { describe, it, expect } from "vitest";
import {
  prefixToPostfixConversion,
  DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT,
  generatePrefixToPostfixConversionSteps,
} from "./prefixToPostfixConversion";

describe("prefix-to-postfix-conversion (Prefix to Postfix Expression Converter)", () => {
  it("should have correct metadata", () => {
    expect(prefixToPostfixConversion.id).toBe("prefix-to-postfix-conversion");
    expect(prefixToPostfixConversion.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(prefixToPostfixConversion.topicIds).toContain("ml_autograd_dags");
    expect(prefixToPostfixConversion.topicIds).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generatePrefixToPostfixConversionSteps(DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Prefix to Postfix Expression Converter Engine");
    expect(steps[steps.length - 1].explanation.what).toContain(
      "Return Final Converted Postfix Expression",
    );
    expect(steps[steps.length - 1].codeLine).toBe(
      prefixToPostfixConversion.code.trim().split("\n").length,
    );
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = prefixToPostfixConversion.code.trim().split("\n").length;
    expect(prefixToPostfixConversion.trivia).toBeDefined();
    expect(prefixToPostfixConversion.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = prefixToPostfixConversion.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = prefixToPostfixConversion.code.trim().split("\n").length;
    const steps = generatePrefixToPostfixConversionSteps(DEFAULT_PREFIXTOPOSTFIXCONVERSION_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
