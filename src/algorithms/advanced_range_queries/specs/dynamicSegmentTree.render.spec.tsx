import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateDynamicSegmentTreeSteps, dynamicSegmentTree } from "../dynamicSegmentTree";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("dynamicSegmentTree React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateDynamicSegmentTreeSteps(dynamicSegmentTree.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["dynamic-segment-tree"] ?? dynamicSegmentTree}
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

    expect(screen.getByText("Dynamic Segment Tree (Sparse Range Queries)")).toBeInTheDocument();
  });
});
