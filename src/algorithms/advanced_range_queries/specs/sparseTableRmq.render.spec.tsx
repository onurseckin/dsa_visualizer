import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateSparseTableRmqSteps, sparseTableRmq } from "../sparseTableRmq";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("sparseTableRmq React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateSparseTableRmqSteps(sparseTableRmq.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["sparse-table-rmq"] ?? sparseTableRmq}
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

    expect(screen.getByText("Sparse Table (Range Minimum Query)")).toBeInTheDocument();
  });
});
