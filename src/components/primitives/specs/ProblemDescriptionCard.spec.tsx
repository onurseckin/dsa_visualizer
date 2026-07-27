import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemDescriptionCard, ProblemDescriptionCardProps } from "../../../ui";

const baseProps: ProblemDescriptionCardProps = {
  title: "Two Sum",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description: "Return the indices of the two numbers that add up to the target.",
  constraints: ["2 <= nums.length <= 10^4"],
  examples: [{ input: "nums = [2,7,11,15]", output: "[0,1]", explanation: "Because 2 + 7 == 9." }],
  expanded: false,
  onToggleExpanded: () => undefined,
};

const renderCard = (overrides: Partial<ProblemDescriptionCardProps> = {}) =>
  render(<ProblemDescriptionCard {...baseProps} {...overrides} />);

/* R5.1: the shell is achromatic and the accent marks selection, never decoration,
   so no detail block paints its text with the accent token. */
const accentTintedText = (root: ParentNode): Element[] =>
  Array.from(root.querySelectorAll("[style]")).filter((el) =>
    /(?:^|;\s*)color:\s*var\(--accent/.test(el.getAttribute("style") ?? ""),
  );

describe("ProblemDescriptionCard", () => {
  it("renders the problem statement, constraints and examples directly", () => {
    renderCard();

    expect(screen.getByText("Problem")).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();

    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("2 <= nums.length <= 10^4")).toBeInTheDocument();

    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("nums = [2,7,11,15]")).toBeInTheDocument();
    expect(screen.getByText("[0,1]")).toBeInTheDocument();
    expect(screen.getByText("Because 2 + 7 == 9.")).toBeInTheDocument();
  });

  it("never renders topic-guide content: no overview, no lesson sections, no key terms", () => {
    renderCard();

    expect(screen.queryByTestId("details-overview")).toBeNull();
    expect(screen.queryByTestId("details-key-terms")).toBeNull();
    expect(screen.queryByText("Key terms")).toBeNull();
  });

  it("constrains neither the width nor the height of any details block", () => {
    renderCard();

    const details = screen.getByTestId("problem-description-details");
    const blocks = [details, ...details.querySelectorAll<HTMLElement>("*")];

    for (const block of blocks) {
      expect(block.style.maxWidth).toBe("");
      expect(block.style.width).toBe("");
      expect(block.style.height).toBe("");
      expect(block.style.maxHeight).toBe("");
      expect(block.style.overflow).toBe("");
      expect(block.style.overflowY).toBe("");
    }
  });

  it("keeps details text neutral", () => {
    renderCard();

    const details = screen.getByTestId("problem-description-details");
    expect(accentTintedText(details)).toEqual([]);
  });

  it("lays examples out as a responsive multi-column grid", () => {
    renderCard();

    const grid = screen.getByTestId("problem-description-examples");
    expect(grid.style.display).toBe("grid");
    expect(grid.style.gridTemplateColumns).toContain("auto-fit");
    expect(grid.style.gridTemplateColumns).toContain("minmax");
  });

  it("omits constraints and examples blocks when they are empty", () => {
    renderCard({ constraints: [], examples: [] });

    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
  });

  it("omits constraints and examples blocks when they are absent", () => {
    renderCard({ constraints: undefined, examples: undefined });

    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
    expect(screen.getByText("Problem")).toBeInTheDocument();
  });
});
