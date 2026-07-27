import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateTasksAndDeadlinesSteps, DEFAULT_TASKS_AND_DEADLINES_INPUT } from "../tasksAndDeadlines";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("tasksAndDeadlines React component spec", () => {
  it("renders ArrayVisualizer with Tasks and Deadlines snapshot", () => {
    const steps = generateTasksAndDeadlinesSteps(DEFAULT_TASKS_AND_DEADLINES_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Tasks and Deadlines" />);

    expect(screen.getByText("Tasks and Deadlines")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with tasksAndDeadlines algorithm", () => {
    const steps = generateTasksAndDeadlinesSteps(DEFAULT_TASKS_AND_DEADLINES_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["tasks-and-deadlines"]}
        currentStep={steps[0]}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/Tasks and Deadlines/i)[0]).toBeInTheDocument();
  });
});
