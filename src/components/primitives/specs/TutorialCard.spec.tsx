import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TutorialCard, hasTutorialContent } from "../TutorialCard";

describe("hasTutorialContent helper", () => {
  it("returns false when no explanation, what, or why is present", () => {
    expect(hasTutorialContent()).toBe(false);
    expect(hasTutorialContent(undefined, "", "   ")).toBe(false);
    expect(hasTutorialContent({ what: "", why: "" })).toBe(false);
  });

  it("returns true when explanation.what or explanation.why is present", () => {
    expect(hasTutorialContent({ what: "Pointers advance", why: "" })).toBe(true);
    expect(hasTutorialContent({ what: "", why: "To find target" })).toBe(true);
  });

  it("returns true when direct what or why props are present", () => {
    expect(hasTutorialContent(undefined, "Direct what")).toBe(true);
    expect(hasTutorialContent(undefined, undefined, "Direct why")).toBe(true);
  });
});

describe("TutorialCard Component Spec", () => {
  it("returns null when there is no content to display", () => {
    const { container } = render(<TutorialCard what="" why="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders step explanation with punctuation formatting and step index label", () => {
    render(
      <TutorialCard
        explanation={{
          what: "Swapping elements 3 and 7",
          why: "Element 7 is smaller than element 3",
        }}
        stepIndex={2}
        totalSteps={10}
      />,
    );

    expect(screen.getByText("Step 3 of 10")).toBeInTheDocument();
    // Period added to lead text automatically because it didn't end in punctuation
    expect(screen.getByText("Swapping elements 3 and 7.")).toBeInTheDocument();
    expect(screen.getByText(/Element 7 is smaller than element 3/)).toBeInTheDocument();
  });

  it("renders step index without totalSteps", () => {
    render(<TutorialCard what="Comparing nodes." stepIndex={0} />);

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Comparing nodes.")).toBeInTheDocument();
  });

  it("renders close button and triggers onClose callback when clicked", () => {
    const onClose = vi.fn();
    render(<TutorialCard what="Inspecting root" onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Hide tutorial" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
