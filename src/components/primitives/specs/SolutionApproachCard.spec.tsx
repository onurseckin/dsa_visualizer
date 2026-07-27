import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("renders the overview and every walkthrough section directly", () => {
    renderCard();

    expect(screen.getByText(topicGuide.overview)).toBeInTheDocument();

    for (const section of topicGuide.sections) {
      expect(screen.getByRole("heading", { name: section.heading })).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    }
  });

  it("never renders problem-statement content: no Problem, Constraints or Examples label", () => {
    renderCard();

    expect(screen.queryByText("Problem")).toBeNull();
    expect(screen.queryByText("Constraints")).toBeNull();
    expect(screen.queryByText("Examples")).toBeNull();
  });

  it("constrains neither the width nor the height of any details block", () => {
    renderCard();

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

  it("keeps text neutral", () => {
    renderCard();

    const details = screen.getByTestId("solution-approach-details");
    const terms = Array.from(details.querySelectorAll<HTMLElement>("dt"));
    expect(terms.length).toBe(2);
    terms.forEach((term) => expect(term.style.color).toBe("var(--text-primary)"));

    expect(accentTintedText(details)).toEqual([]);
  });

  it("lays key terms out as a responsive multi-column grid", () => {
    renderCard();

    const grid = screen.getByTestId("details-key-terms");
    expect(grid.style.display).toBe("grid");
    expect(grid.style.gridTemplateColumns).toContain("auto-fit");
    expect(grid.style.gridTemplateColumns).toContain("minmax");
  });

  it("renders key terms as a real definition list", () => {
    const { container } = renderCard();

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
      topicGuide: { overview: topicGuide.overview, sections: topicGuide.sections },
    });

    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("Key terms")).toBeNull();
  });
});
