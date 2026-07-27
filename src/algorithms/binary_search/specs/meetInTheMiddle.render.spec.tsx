import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateMeetInTheMiddleSteps, meetInTheMiddle } from "../meetInTheMiddle";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("meetInTheMiddle React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateMeetInTheMiddleSteps(meetInTheMiddle.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["meet-in-the-middle"] ?? meetInTheMiddle}
        currentStep={steps[0]}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Meet in the Middle (Subset Sum Technique)")).toBeInTheDocument();
  });
});
