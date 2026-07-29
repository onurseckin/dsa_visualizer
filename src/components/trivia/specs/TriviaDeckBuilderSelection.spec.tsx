import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CODE_LEARNING_ITEMS } from "../../../learning/registry";
import { getLearningItemTopics } from "../../../app/topics";
import { isTriviaEligibleLearningItem } from "../../../learning/types";
import { TriviaDeckBuilder } from "../../../ui";

const ALL = CODE_LEARNING_ITEMS.filter(isTriviaEligibleLearningItem);
const TOTAL = ALL.length;

const arraysIds = ALL.filter((item) =>
  getLearningItemTopics(item).includes("arrays_and_hashing"),
).map((item) => item.id);

const groupRow = (container: HTMLElement, label: string): HTMLElement => {
  const title = Array.from(container.querySelectorAll<HTMLElement>(".ui-collapsible__title")).find(
    (node) => node.textContent === label,
  );
  const row = title?.closest<HTMLElement>(".ui-collapsible");
  if (!row) throw new Error(`no group row for ${label}`);
  return row;
};

const openTopic = (container: HTMLElement, label: string): HTMLElement => {
  const row = groupRow(container, label);
  const trigger =
    row.querySelector<HTMLElement>(".ui-collapsible__trigger") ||
    row.querySelector<HTMLElement>(".ui-collapsible__header");
  if (!trigger) throw new Error(`no trigger for ${label}`);
  fireEvent.click(trigger);
  return row;
};

describe("TriviaDeckBuilderSelection", () => {
  it("groups the whole registry by topic in roadmap order", () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const titles = Array.from(container.querySelectorAll(".ui-collapsible__title")).map(
      (node) => node.textContent,
    );
    expect(titles[0]).toBe("Arrays & Hashing");
    expect(titles).toContain("Graph Traversal");
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("adds a whole topic in one click", () => {
    const onChange = vi.fn();
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    const row = groupRow(container, "Arrays & Hashing");
    fireEvent.click(within(row).getByRole("button", { name: /add all arrays & hashing/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual(arraysIds);
  });

  it("keeps ids already in the deck when adding a topic", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TriviaDeckBuilder deck={["bfs-graph", arraysIds[0]]} onChange={onChange} />,
    );

    const row = groupRow(container, "Arrays & Hashing");
    fireEvent.click(within(row).getByRole("button", { name: /add all arrays & hashing/i }));

    const next: string[] = onChange.mock.calls[0][0];
    expect(next[0]).toBe("bfs-graph");
    expect(next.filter((id) => id === arraysIds[0])).toHaveLength(1);
    arraysIds.forEach((id) => expect(next).toContain(id));
  });

  it("disables the topic add button once that topic is complete", () => {
    const { container } = render(<TriviaDeckBuilder deck={arraysIds} onChange={vi.fn()} />);

    const row = groupRow(container, "Arrays & Hashing");
    expect(within(row).getByRole("button", { name: /add all arrays & hashing/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("adds every algorithm in one click", () => {
    const onChange = vi.fn();
    render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /add every algorithm/i }));

    expect(onChange.mock.calls[0][0]).toHaveLength(TOTAL);
  });

  it("clears the deck, and offers nothing to clear when it is already empty", () => {
    const onChange = vi.fn();
    const { rerender } = render(<TriviaDeckBuilder deck={["two-sum"]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /clear deck/i }));
    expect(onChange).toHaveBeenCalledWith([]);

    rerender(<TriviaDeckBuilder deck={[]} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /clear deck/i })).toBeDisabled();
  });

  it("toggles a single row on and off with the standard selected treatment", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    openTopic(container, "Arrays & Hashing");
    const row = screen.getByRole("button", { name: /Two Sum/i });
    expect(row).not.toHaveClass("ui-btn--selected");

    fireEvent.click(row);
    expect(onChange).toHaveBeenLastCalledWith(["two-sum"]);

    rerender(<TriviaDeckBuilder deck={["two-sum"]} onChange={onChange} />);
    const selectedRow = screen.getByRole("button", { name: /Two Sum/i });
    expect(selectedRow).toHaveClass("ui-btn--selected");
    expect(selectedRow).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(selectedRow);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("reports per-topic and overall counts", () => {
    const { container, rerender } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    expect(screen.getByText("0 in deck")).toBeInTheDocument();
    expect(screen.getByText(`0 of ${TOTAL} algorithms selected`)).toBeInTheDocument();

    const emptyRow = groupRow(container, "Arrays & Hashing");
    expect(within(emptyRow).getByText(`0/${arraysIds.length}`)).toBeInTheDocument();

    rerender(<TriviaDeckBuilder deck={[arraysIds[0], "bfs-graph"]} onChange={vi.fn()} />);
    expect(screen.getByText("2 in deck")).toBeInTheDocument();
    expect(screen.getByText(`2 of ${TOTAL} algorithms selected`)).toBeInTheDocument();

    const filledRow = groupRow(container, "Arrays & Hashing");
    const badge = within(filledRow).getByText(`1/${arraysIds.length}`);
    expect(badge).toHaveClass("ui-badge--info");
  });

  it("gives each row its semantic difficulty badge and refuses to wrap the title", () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const row = openTopic(container, "Arrays & Hashing");
    const rowButtons = Array.from(
      row.querySelectorAll<HTMLElement>(".ui-collapsible__content .ui-btn"),
    );
    expect(rowButtons.length).toBe(arraysIds.length);

    const variants = new Set<string>();
    rowButtons.forEach((button) => {
      const title = button.querySelector<HTMLElement>("span");
      expect(title?.className).toContain("whitespace-nowrap");
      expect(title?.className).toContain("text-ellipsis");

      const badges = button.querySelectorAll(".ui-badge");
      const badge = badges[badges.length - 1];
      expect(badge).not.toBeNull();
      const variant = Array.from(badge?.classList ?? []).find(
        (name) => name.startsWith("ui-badge--") && !name.endsWith("--sm") && !name.endsWith("--md"),
      );
      expect(["ui-badge--success", "ui-badge--warning", "ui-badge--danger"]).toContain(variant);
      if (variant !== undefined) variants.add(variant);
    });
    expect(variants.size).toBeGreaterThan(1);
  });

  it("paints every panel edge with the visible border token and no raw hex", () => {
    const { container } = render(<TriviaDeckBuilder deck={["two-sum"]} onChange={vi.fn()} />);

    const card = container.querySelector<HTMLElement>(".ui-card");
    expect(card?.className).toContain("border-[var(--border-default)]");
    container.querySelectorAll<HTMLElement>(".ui-collapsible").forEach((group) => {
      expect(group.className).toMatch(/border-\[var\(--border-(default|subtle)\)\]/);
    });
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
