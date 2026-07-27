import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  DEFAULT_REVERSE_LINKED_LIST_INPUT,
  generateReverseLinkedListSteps,
} from "../reverseLinkedList";

describe("ReverseLinkedList React Component Spec", () => {
  it("renders algorithm title and problem description", () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["reverse-linked-list"]}
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

    expect(screen.getByText("Reverse Linked List")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(screen.getAllByText(/invert pointer directions/i)[0]).toBeInTheDocument();
  });

  it("renders step visualizer with auxiliary pointers state", () => {
    const steps = generateReverseLinkedListSteps(DEFAULT_REVERSE_LINKED_LIST_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["reverse-linked-list"]}
        currentStep={lastStep}
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

    expect(screen.getByText(/Return prev \(new head node 6\)/i)).toBeInTheDocument();
  });
});
