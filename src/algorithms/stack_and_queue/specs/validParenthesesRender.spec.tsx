import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  DEFAULT_VALID_PARENTHESES_INPUT,
  generateValidParenthesesSteps,
} from "../validParentheses";

describe("ValidParentheses React Component Spec", () => {
  it("renders valid parentheses title and header details", () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["valid-parentheses"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Valid Parentheses")).toBeInTheDocument();

    expect(screen.getAllByText(/Determine if an input string of brackets/i)[0]).toBeInTheDocument();
    expect(
      screen.getAllByText(/most recent unfinished thing must be resolved first/i)[0],
    ).toBeInTheDocument();
  });

  it("renders call stack auxiliary panel during bracket pushing/popping", () => {
    const steps = generateValidParenthesesSteps(DEFAULT_VALID_PARENTHESES_INPUT);
    // step index 3 has stack pushed
    const stepWithStack = steps.find((s) => (s.auxiliaryState.stack?.length ?? 0) > 0) || steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["valid-parentheses"]}
        currentStep={stepWithStack}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    // Pushed brackets land in the AuxiliaryPanel's "Stack" row of the "Working data" card.
    expect(screen.getByText(/Working Data/i)).toBeInTheDocument();
    expect(screen.getAllByText("Stack")[0]).toBeInTheDocument();
  });
});
