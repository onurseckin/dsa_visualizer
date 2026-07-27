import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KnowledgeGraphNode } from "../components/KnowledgeGraphNode";
import { TopicRoadmapNode } from "../knowledgeGraphData";

const sampleNode: TopicRoadmapNode = {
  id: "two-pointers",
  title: "2. Two Pointers",
  categoryFolder: "two_pointers",
  description: "Target Sum, Sorted Arrays",
  prerequisites: ["arrays-and-hashing"],
  algorithmCount: 3,
  difficulty: "Easy",
  family: "foundations",
  x: 140,
  y: 190,
};

describe("KnowledgeGraphNode Component Spec", () => {
  it("renders node element with title, description, and difficulty", () => {
    render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId={null}
          onSelectCategoryFolder={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const button = screen.getByRole("button", { name: /2\. Two Pointers/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("2. Two Pointers")).toBeInTheDocument();
    expect(screen.getByText(/Easy/i)).toBeInTheDocument();
  });

  it("triggers onSelectCategoryFolder on click, Enter, and Space keypresses", () => {
    const onSelectCategoryFolder = vi.fn();
    render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId={null}
          onSelectCategoryFolder={onSelectCategoryFolder}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(onSelectCategoryFolder).toHaveBeenLastCalledWith("two_pointers");

    fireEvent.keyDown(button, { key: "Enter" });
    expect(onSelectCategoryFolder).toHaveBeenLastCalledWith("two_pointers");

    fireEvent.keyDown(button, { key: " " });
    expect(onSelectCategoryFolder).toHaveBeenLastCalledWith("two_pointers");

    // Ignores other keys
    fireEvent.keyDown(button, { key: "Tab" });
    expect(onSelectCategoryFolder).toHaveBeenCalledTimes(3);
  });

  it("handles mouseEnter, mouseLeave, focus, and blur events", () => {
    const onHover = vi.fn();
    render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId={null}
          onSelectCategoryFolder={vi.fn()}
          onHover={onHover}
        />
      </svg>,
    );

    const button = screen.getByRole("button");

    fireEvent.mouseEnter(button);
    expect(onHover).toHaveBeenLastCalledWith("two-pointers");

    fireEvent.mouseLeave(button);
    expect(onHover).toHaveBeenLastCalledWith(null);

    fireEvent.focus(button);
    expect(onHover).toHaveBeenLastCalledWith("two-pointers");

    fireEvent.blur(button);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("applies related styling when hovered node is a child (dependent) of this node", () => {
    // sampleNode is 'two-pointers'. 'sliding-window' has prerequisite ['two-pointers'].
    const { container } = render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId="sliding-window"
          onSelectCategoryFolder={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("stroke")).not.toBe("var(--border-default)");
    expect(rect?.getAttribute("stroke")).not.toBe("var(--border-accent)");
  });

  it("handles unknown hoveredNodeId gracefully without crashing", () => {
    const { container } = render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId="non-existent-node"
          onSelectCategoryFolder={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("stroke")).toBe("var(--border-default)");
  });

  it("renders accent text color when this node itself is hovered", () => {
    const { container } = render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId="two-pointers"
          onSelectCategoryFolder={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const textEl = container.querySelector("text");
    expect(textEl?.getAttribute("fill")).toBe("var(--accent)");
  });
});
