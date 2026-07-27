import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SolutionApproachCard, SolutionApproachCardProps } from "../../../ui";
import { TopicGuide } from "../../../types/dsa";

const topicGuide: TopicGuide = {
  overview: "Hashing trades memory for speed by remembering what you have already seen.",
  sections: [
    { heading: "The core idea", body: "You keep a map from value to index as you scan." },
    { heading: "Why it is correct", body: "Every earlier element is already in the map." },
    { heading: "When to reach for it", body: "Use it when order does not matter." },
    {
      heading: "Common pitfalls",
      body: "Do not insert before you look up, or you match yourself.",
    },
  ],
  keyTerms: [
    { term: "hash map", definition: "A structure giving average constant-time lookup by key." },
    {
      term: "complement",
      definition: "The value that pairs with the current one to hit the target.",
    },
  ],
};

const baseProps: SolutionApproachCardProps = {
  topicGuide,
  expanded: false,
  onToggleExpanded: () => undefined,
};

const renderCard = (overrides: Partial<SolutionApproachCardProps> = {}) =>
  render(<SolutionApproachCard {...baseProps} {...overrides} />);

/* R5.1: the shell is achromatic and the accent marks selection, never decoration,
   so no detail block paints its text with the accent token. */
const accentTintedText = (root: ParentNode): Element[] =>
  Array.from(root.querySelectorAll("[style]")).filter((el) =>
    /(?:^|;\s*)color:\s*var\(--accent/.test(el.getAttribute("style") ?? ""),
  );

describe("SolutionApproachCard", () => {
  it("shows its own title and Details toggle but hides the lesson when collapsed", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Solution approach" })).toBeInTheDocument();
    expect(screen.queryByText(topicGuide.overview)).toBeNull();
    expect(screen.queryByText("The core idea")).toBeNull();
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders the overview and every walkthrough section when expanded", () => {
    renderCard({ expanded: true });

    expect(screen.getByText(topicGuide.overview)).toBeInTheDocument();

    for (const section of topicGuide.sections) {
      expect(screen.getByRole("heading", { name: section.heading })).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    }

    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  /* This is the deep lesson only — the problem statement (description,
     constraints, examples) moved to ProblemDescriptionCard (9.6). */
  it("never renders problem-statement content: no Problem, Constraints or Examples label", () => {
    renderCard({ expanded: true });

    expect(screen.queryByText("Problem")).toBeNull();
    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
  });

  it("constrains neither the width nor the height of any details block", () => {
    renderCard({ expanded: true });

    const details = screen.getByTestId("solution-approach-details");
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

    const details = screen.getByTestId("solution-approach-details");
    // Surface and card sit ~1.09x apart, so only a real border draws the seam.
    expect(details.style.borderTop).toBe("1px solid var(--border-default)");

    const terms = Array.from(details.querySelectorAll<HTMLElement>("dt"));
    expect(terms.length).toBe(2);
    terms.forEach((term) => expect(term.style.color).toBe("var(--text-primary)"));

    expect(accentTintedText(details)).toEqual([]);
  });

  it("lays key terms out as a responsive multi-column grid", () => {
    renderCard({ expanded: true });

    const grid = screen.getByTestId("details-key-terms");
    expect(grid.style.display).toBe("grid");
    expect(grid.style.gridTemplateColumns).toContain("auto-fit");
    expect(grid.style.gridTemplateColumns).toContain("minmax");
  });

  it("renders key terms as a real definition list", () => {
    const { container } = renderCard({ expanded: true });

    const list = container.querySelector("dl");
    expect(list).not.toBeNull();
    expect(screen.getByText("Key terms")).toBeInTheDocument();

    const terms = container.querySelectorAll("dt");
    const definitions = container.querySelectorAll("dd");
    expect(terms).toHaveLength(2);
    expect(definitions).toHaveLength(2);
    expect(terms[0]).toHaveTextContent("hash map");
    expect(definitions[0]).toHaveTextContent(
      "A structure giving average constant-time lookup by key.",
    );
    expect(terms[1]).toHaveTextContent("complement");
  });

  it("omits the key-terms block when the guide has none", () => {
    const { container } = renderCard({
      expanded: true,
      topicGuide: { overview: topicGuide.overview, sections: topicGuide.sections },
    });

    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("Key terms")).toBeNull();
  });

  it("calls onToggleExpanded when the Details button is pressed", () => {
    const onToggleExpanded = vi.fn();
    renderCard({ onToggleExpanded });

    fireEvent.click(screen.getByRole("button", { name: "Details" }));

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it("renders no reset-layout control, leaving Details as its only button", () => {
    renderCard({ expanded: true });

    expect(screen.queryByRole("button", { name: /reset/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /layout/i })).toBeNull();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Details"]);
  });
});
