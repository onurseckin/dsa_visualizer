import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaDeckBuilder } from "../../../ui";

const groupRow = (container: HTMLElement, label: string): HTMLElement => {
  const title = Array.from(container.querySelectorAll<HTMLElement>(".ui-collapsible__title")).find(
    (node) => node.textContent === label,
  );
  const row = title?.closest<HTMLElement>(".ui-collapsible");
  if (!row) throw new Error(`no group row for ${label}`);
  return row;
};

const openCategory = (container: HTMLElement, label: string): HTMLElement => {
  const row = groupRow(container, label);
  const trigger =
    row.querySelector<HTMLElement>(".ui-collapsible__trigger") ||
    row.querySelector<HTMLElement>(".ui-collapsible__header");
  if (!trigger) throw new Error(`no trigger for ${label}`);
  fireEvent.click(trigger);
  return row;
};

describe("TriviaDeckBuilderFilter", () => {
  it("filters categories and rows by the search input", () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/filter algorithms by title or topic/i);
    expect(input).toHaveClass("ui-input__field");

    fireEvent.change(input, { target: { value: "two sum" } });
    const titles = Array.from(container.querySelectorAll(".ui-collapsible__title")).map(
      (node) => node.textContent,
    );
    expect(titles).toContain("Arrays & Hashing");
    expect(titles).not.toContain("Graph Traversal");
    expect(screen.getByText(/1 shown|2 shown/)).toBeInTheDocument();

    openCategory(container, "Arrays & Hashing");
    expect(screen.getByRole("button", { name: /Two Sum/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bubble Sort/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
  });

  it("matches a category by name as well as an algorithm title", () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: "geometry" },
    });

    const titles = Array.from(container.querySelectorAll(".ui-collapsible__title")).map(
      (node) => node.textContent,
    );
    expect(titles).toEqual([
      "Geometry & Sweep Line",
      "Vector Search & Spatial Geometry",
      "Attention Geometry & RoPE",
    ]);
  });

  it("tells the user when nothing matches", () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: "zzzz" },
    });

    expect(screen.getByText(/no algorithm matches that filter/i)).toBeInTheDocument();
    expect(container.querySelectorAll(".ui-collapsible")).toHaveLength(0);
  });

  it("adds only the rows the filter left visible when adding a category", () => {
    const onChange = vi.fn();
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: "two sum" },
    });
    const row = groupRow(container, "Arrays & Hashing");
    fireEvent.click(within(row).getByRole("button", { name: /add all arrays & hashing/i }));

    expect(onChange.mock.calls[0][0]).toEqual(["two-sum"]);
  });
});
