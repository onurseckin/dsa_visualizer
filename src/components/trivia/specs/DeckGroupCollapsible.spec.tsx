import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeckGroupCollapsible } from "../components/DeckGroupCollapsible";
import type { DeckGroup } from "../components/DeckGroupCollapsible";

describe("DeckGroupCollapsible component", () => {
  const sampleGroup: DeckGroup = {
    id: "arrays_and_hashing",
    label: "Arrays & Hashing",
    entries: [
      { id: "bubble-sort", title: "Bubble Sort", difficulty: "Easy" },
      { id: "two-sum", title: "Two Sum", difficulty: "Easy" },
    ],
  };

  it("renders group with item count badge and toggle entries", () => {
    const onAddMany = vi.fn();
    const onToggleOne = vi.fn();

    render(
      <DeckGroupCollapsible
        group={sampleGroup}
        selected={new Set(["bubble-sort"])}
        onAddMany={onAddMany}
        onToggleOne={onToggleOne}
      />,
    );

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Arrays & Hashing")).toBeInTheDocument();

    const addAll = screen.getByRole("button", { name: "Add all Arrays & Hashing" });
    fireEvent.click(addAll);
    expect(onAddMany).toHaveBeenCalledWith(["bubble-sort", "two-sum"]);

    // KeyDown Enter
    fireEvent.keyDown(addAll, { key: "Enter" });
    expect(onAddMany).toHaveBeenCalledTimes(2);

    // KeyDown Space
    fireEvent.keyDown(addAll, { key: " " });
    expect(onAddMany).toHaveBeenCalledTimes(3);
  });

  it("disables Add all when all items are selected", () => {
    const onAddMany = vi.fn();
    const onToggleOne = vi.fn();

    render(
      <DeckGroupCollapsible
        group={sampleGroup}
        selected={new Set(["bubble-sort", "two-sum"])}
        onAddMany={onAddMany}
        onToggleOne={onToggleOne}
      />,
    );

    expect(screen.getByText("2/2")).toBeInTheDocument();
    const addAll = screen.getByRole("button", { name: "Add all Arrays & Hashing" });
    fireEvent.click(addAll);
    expect(onAddMany).not.toHaveBeenCalled();
  });

  it("renders entries without difficulty badge when difficulty is undefined", () => {
    const noDiffGroup: DeckGroup = {
      id: "arrays_and_hashing",
      label: "Arrays & Hashing",
      entries: [{ id: "no-diff", title: "No Difficulty Alg" }],
    };
    render(
      <DeckGroupCollapsible
        group={noDiffGroup}
        selected={new Set()}
        onAddMany={vi.fn()}
        onToggleOne={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByText("Arrays & Hashing", { selector: "span.ui-collapsible__title" }),
    );
    expect(screen.getByText("No Difficulty Alg")).toBeInTheDocument();
  });
});
