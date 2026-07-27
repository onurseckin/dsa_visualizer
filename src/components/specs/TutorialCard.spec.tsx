import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TutorialCard, hasTutorialContent } from "../../ui";
import type { StepExplanation } from "../../types/dsa";

describe("TutorialCard Component Spec", () => {
  const sampleExplanation: StepExplanation = {
    what: "Compare 5 with the pivot 3",
    why: "We need smaller elements on the left side, so we check where 5 belongs before moving on.",
  };

  const prose = (): HTMLElement =>
    screen.getByText(/We need smaller elements on the left side/i, { selector: "p" });

  it("renders the step label and one flowing paragraph with a bold lead-in", () => {
    render(<TutorialCard explanation={sampleExplanation} stepIndex={2} totalSteps={10} />);

    expect(screen.getByText("Step 3 of 10")).toBeInTheDocument();

    // The "what" becomes a bold lead-in sentence with terminal punctuation.
    const lead = screen.getByText("Compare 5 with the pivot 3.");
    expect(lead.tagName).toBe("STRONG");
    expect(lead.style.color).toBe("var(--text-primary)");

    expect(prose()).toBeInTheDocument();
    expect(prose().style.color).toBe("var(--text-secondary)");

    // No WHAT/WHY section headers in the teacher strip.
    expect(screen.queryByText(/^what$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^why$/i)).not.toBeInTheDocument();
  });

  it("omits the total when only stepIndex is known", () => {
    render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it('invokes onClose from the "Hide tutorial" icon button', () => {
    const handleClose = vi.fn();
    render(<TutorialCard explanation={sampleExplanation} stepIndex={0} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /Hide tutorial/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders nothing when there is no explanation text", () => {
    const { container } = render(<TutorialCard stepIndex={0} totalSteps={5} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exports the predicate the panel gates the strip on", () => {
    expect(hasTutorialContent(sampleExplanation)).toBe(true);
    expect(hasTutorialContent()).toBe(false);
    expect(hasTutorialContent({ what: "  ", why: "" })).toBe(false);
    expect(hasTutorialContent(undefined, "", "only a why")).toBe(true);
  });

  /* The user's complaint about this strip was that it is too small to read
     (DESIGN.md R6.4). These assertions are the fix, not the intention. */
  describe("readable prose, not a caption", () => {
    it("sets the body at --text-md with 1.6 line-height and reserves two lines", () => {
      render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);

      const paragraph = prose();
      expect(paragraph.style.fontSize).toBe("var(--text-md)");
      expect(paragraph.style.lineHeight).toBe("1.6");
      // Two lines are held open so the canvas boundary stops moving every step.
      expect(paragraph.style.minHeight).toBe("calc(var(--text-md) * 1.6 * 2)");
    });

    it("uses --text-xs nowhere, including the step counter", () => {
      const { container } = render(
        <TutorialCard
          explanation={sampleExplanation}
          stepIndex={2}
          totalSteps={10}
          onClose={vi.fn()}
        />,
      );

      const sized = Array.from(container.querySelectorAll<HTMLElement>("[style]")).filter(
        (el) => el.style.fontSize !== "",
      );
      expect(sized.length).toBeGreaterThan(0);
      for (const el of sized) {
        expect(el.style.fontSize).not.toBe("var(--text-xs)");
      }
      expect(screen.getByText("Step 3 of 10").style.fontSize).toBe("var(--text-md)");
    });

    it("never truncates: no ellipsis, no clamp, no nowrap on the prose", () => {
      render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);

      const paragraph = prose();
      expect(paragraph.style.textOverflow).toBe("");
      expect(paragraph.style.whiteSpace).toBe("");
      expect(paragraph.style.overflow).toBe("");
      expect(paragraph.style.maxHeight).toBe("");
      expect(paragraph.style.getPropertyValue("-webkit-line-clamp")).toBe("");
    });

    it("gives the strip real padding and the prose the panel’s full measure", () => {
      const { container } = render(
        <TutorialCard
          explanation={sampleExplanation}
          stepIndex={2}
          totalSteps={10}
          onClose={vi.fn()}
        />,
      );

      const body =
        (container.querySelector(".ui-card > div") as HTMLElement) ||
        (container.querySelector('[data-testid="tutorial-card"] > div') as HTMLElement);
      expect(body.className).toContain("p-6");
      expect(body.className).toContain("flex-col");

      // The counter row is above the prose, so the sentence is not squeezed into
      // a leftover column next to the label and the dismiss button.
      const label = screen.getByText("Step 3 of 10");
      expect(label.parentElement).not.toBe(prose().parentElement);
      expect(label.parentElement?.nextElementSibling).toBe(prose());
    });
  });

  it("renders with visible border, rounded-xl corners, and surface background", () => {
    const { container } = render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);

    const card = container.querySelector('[data-testid="tutorial-card"]');
    expect(card).toBeInstanceOf(HTMLElement);
    expect(card?.className).toContain("border border-[var(--border-default)]");
    expect(card?.className).toContain("rounded-xl");
    expect(card?.className).toContain("bg-[var(--bg-surface)]");
  });

  it("renders no card header band above the strip", () => {
    const { container } = render(<TutorialCard explanation={sampleExplanation} stepIndex={0} />);
    expect(container.querySelector(".ui-card__header")).toBeNull();
  });
});
