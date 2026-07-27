import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatrixVisualizer } from "../../../components/primitives/MatrixVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateChineseRemainderSteps,
  DEFAULT_CHINESE_REMAINDER_INPUT,
} from "../chineseRemainderTheorem";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("chineseRemainderTheorem React component spec", () => {
  it("renders MatrixVisualizer with Chinese Remainder Theorem snapshot", () => {
    const steps = generateChineseRemainderSteps(DEFAULT_CHINESE_REMAINDER_INPUT);
    const snapshot = steps[0].primarySnapshot as MatrixVisualSnapshot;

    render(
      <MatrixVisualizer
        rows={snapshot.rows}
        cols={snapshot.cols}
        cells={snapshot.cells}
        rowHeaders={snapshot.rowHeaders}
        colHeaders={snapshot.colHeaders}
        title="Chinese Remainder Theorem"
      />,
    );

    expect(screen.getByText("Chinese Remainder Theorem")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with chineseRemainderTheorem algorithm", () => {
    const steps = generateChineseRemainderSteps(DEFAULT_CHINESE_REMAINDER_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["chinese-remainder-theorem"]}
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

    expect(screen.getAllByText(/Chinese Remainder Theorem/i)[0]).toBeInTheDocument();
  });
});
