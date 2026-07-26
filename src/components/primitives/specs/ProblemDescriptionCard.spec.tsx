import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProblemDescriptionCard, ProblemDescriptionCardProps } from "../ProblemDescriptionCard";

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
  it("shows the title and badges but hides the problem statement when collapsed", () => {
    renderCard();

    expect(screen.getByRole("heading", { level: 1, name: "Two Sum" })).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Arrays and hashing")).toBeInTheDocument();

    expect(screen.queryByText(baseProps.description)).toBeNull();
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders the problem statement, constraints and examples when expanded", () => {
    renderCard({ expanded: true });

    expect(screen.getByText("Problem")).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();

    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("2 <= nums.length <= 10^4")).toBeInTheDocument();

    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("nums = [2,7,11,15]")).toBeInTheDocument();
    expect(screen.getByText("[0,1]")).toBeInTheDocument();
    expect(screen.getByText("Because 2 + 7 == 9.")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  /* This card is the problem statement only — the deep topic lesson (overview,
     walkthrough sections, key terms) moved to SolutionApproachCard (9.6). */
  it("never renders topic-guide content: no overview, no lesson sections, no key terms", () => {
    renderCard({ expanded: true });

    expect(screen.queryByTestId("details-overview")).toBeNull();
    expect(screen.queryByTestId("details-key-terms")).toBeNull();
    expect(screen.queryByText("Key terms")).toBeNull();
  });

  it("constrains neither the width nor the height of any details block", () => {
    renderCard({ expanded: true });

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

  it("separates the details with a visible divider and keeps their text neutral", () => {
    renderCard({ expanded: true });

    const details = screen.getByTestId("problem-description-details");
    // Surface and card sit ~1.09x apart, so only a real border draws the seam.
    expect(details.style.borderTop).toBe("1px solid var(--border-default)");
    expect(accentTintedText(details)).toEqual([]);
  });

  it("lays examples out as a responsive multi-column grid", () => {
    renderCard({ expanded: true });

    const grid = screen.getByTestId("problem-description-examples");
    expect(grid.style.display).toBe("grid");
    expect(grid.style.gridTemplateColumns).toContain("auto-fit");
    expect(grid.style.gridTemplateColumns).toContain("minmax");
  });

  it("calls onToggleExpanded when the Details button is pressed", () => {
    const onToggleExpanded = vi.fn();
    renderCard({ onToggleExpanded });

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  /* Reset governs the whole workspace, not this strip, so it lives in the navbar
     and this card offers exactly one control. */
  it("renders no reset-layout control, leaving Details as its only button", () => {
    renderCard({ expanded: true });

    expect(screen.queryByRole("button", { name: /reset/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /layout/i })).toBeNull();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Details"]);
  });

  it("omits constraints and examples blocks when they are empty", () => {
    renderCard({ expanded: true, constraints: [], examples: [] });

    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
  });

  it("omits constraints and examples blocks when they are absent", () => {
    renderCard({ expanded: true, constraints: undefined, examples: undefined });

    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
    expect(screen.getByText("Problem")).toBeInTheDocument();
  });

  it("defaults difficulty to Easy when omitted", () => {
    renderCard({ difficulty: undefined });

    expect(screen.getByText("Easy")).toBeInTheDocument();
  });
});
