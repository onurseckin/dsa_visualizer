import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LearningItemPlayground } from "../../../../learning/types";
import type { AlgorithmStep } from "../../../../types/dsa";
import { AssessmentVisualization } from "../AssessmentVisualization";

const step = (value: string, index: number): AlgorithmStep => ({
  stepIndex: index,
  codeLine: index + 1,
  explanation: {
    what: `${value} step ${index + 1}`,
    why: `Reason for ${value} ${index + 1}`,
  },
  primarySnapshot: {
    kind: "array",
    elements: [{ id: `${value}-${index}`, value, state: index === 0 ? "active" : "sorted" }],
  },
  auxiliaryState: {
    queue: [value],
  },
  variables: {
    selected: value,
  },
});

const playground: LearningItemPlayground = {
  code: "def solve(value):\n    return value",
  starterCode: "def solve(value):\n    pass",
  execution: {
    runtime: "server",
    entrypoint: "solve",
    invocation: {
      kind: "function",
      arguments: [{ from: "input", path: ["value"] }],
    },
    packages: [],
    cases: [
      {
        id: "alpha",
        label: "Alpha case",
        input: { value: "alpha" },
        expected: "alpha",
        comparison: "deep-equal",
      },
      {
        id: "beta",
        label: "Beta case",
        input: { value: "beta" },
        expected: "beta",
        comparison: "deep-equal",
      },
    ],
  },
  generateSteps: vi.fn((input: unknown) => {
    const value = String((input as { value: string }).value);
    return [step(value, 0), step(value, 1)];
  }),
};

describe("AssessmentVisualization", () => {
  afterEach(cleanup);

  it("derives visual steps from the selected executable case and supports step navigation", () => {
    render(<AssessmentVisualization title="Input-aware walkthrough" playground={playground} />);

    expect(
      screen.getByRole("region", { name: "Input-aware walkthrough visual walkthrough" }),
    ).toBeInTheDocument();
    expect(screen.getByText("alpha step 1")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Visualization case" }), {
      target: { value: "beta" },
    });
    expect(playground.generateSteps).toHaveBeenLastCalledWith({ value: "beta" });
    expect(screen.getByText("beta step 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next visual step" }));
    expect(screen.getByText("beta step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous visual step" }));
    expect(screen.getByText("beta step 1")).toBeInTheDocument();
  });

  it("reports an authored generator failure without fabricating a snapshot", () => {
    render(
      <AssessmentVisualization
        title="Broken walkthrough"
        playground={{
          ...playground,
          generateSteps: () => {
            throw new Error("bad input");
          },
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/could not produce visual steps/i);
    expect(screen.queryByTestId("canvas-container")).toBeNull();
  });

  it("reports empty steps and a missing executable case as authored-data gaps", () => {
    const view = render(
      <AssessmentVisualization
        title="Empty walkthrough"
        playground={{ ...playground, generateSteps: () => [] }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/returned no visual steps/i);

    view.rerender(
      <AssessmentVisualization
        title="Missing-case walkthrough"
        playground={{
          ...playground,
          execution: { ...playground.execution, cases: [] },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/no executable case is authored/i);
  });
});
