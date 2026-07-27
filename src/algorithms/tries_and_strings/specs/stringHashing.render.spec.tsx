import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { generateStringHashingSteps, DEFAULT_STRING_HASHING_INPUT } from "../stringHashing";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("stringHashing React component spec", () => {
  it("renders ArrayVisualizer with generated string hash snapshot", () => {
    const steps = generateStringHashingSteps(DEFAULT_STRING_HASHING_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Polynomial Rolling String Hashing" />);

    expect(screen.getByText("Polynomial Rolling String Hashing")).toBeInTheDocument();
  });

  it("finds pattern matches accurately", () => {
    const steps = generateStringHashingSteps({ text: "abracadabra", pattern: "abra" });
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.matchCount).toBe(2);
  });
});
