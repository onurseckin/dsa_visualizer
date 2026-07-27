import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemDescriptionCard, ProblemDescriptionCardProps } from "../../../ui";

const baseProps: ProblemDescriptionCardProps = {
  title: "Two Sum",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description: "Return the indices of the two numbers that add up to the target.",
  constraints: ["2 <= nums.length <= 10^4"],
  expanded: true,
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
  it("renders the problem statement and constraints directly without rendering examples", () => {
    renderCard();

    expect(screen.getByText("Problem")).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();

    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("2 <= nums.length <= 10^4")).toBeInTheDocument();

    expect(screen.queryByText("Examples")).toBeNull();
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

  it("omits constraints block when constraints are empty or absent", () => {
    renderCard({ constraints: [] });

    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.getByText("Problem")).toBeInTheDocument();
  });

  it("keeps title, difficulty badge, and category tag visible when collapsed (expanded=false)", () => {
    renderCard({ expanded: false });

    // Header elements remain visible
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Arrays and hashing")).toBeInTheDocument();

    // Details content is collapsed/hidden
    expect(screen.queryByTestId("problem-description-details")).toBeNull();
    expect(screen.queryByText(baseProps.description)).toBeNull();
  });
});
