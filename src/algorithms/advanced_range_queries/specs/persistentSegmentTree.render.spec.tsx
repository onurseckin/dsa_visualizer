import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generatePersistentSegmentTreeSteps, persistentSegmentTree } from "../persistentSegmentTree";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("persistentSegmentTree React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generatePersistentSegmentTreeSteps(persistentSegmentTree.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["persistent-segment-tree"] ?? persistentSegmentTree}
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

    expect(screen.getByText("Persistent Segment Tree (Versioned Range Queries)")).toBeInTheDocument();
  });
});
