import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KnowledgeGraphNode } from "../components/KnowledgeGraphNode";
import { DsaCurriculumPlacement } from "../knowledgeGraphData";

const sampleNode: DsaCurriculumPlacement = {
  id: "two-pointers",
  title: "2. Two Pointers",
  topicId: "two_pointers",
  description: "Target Sum, Sorted Arrays",
  prerequisites: ["arrays-and-hashing"],
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
          onSelectTopic={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const button = screen.getByRole("button", { name: /2\. Two Pointers/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("2. Two Pointers")).toBeInTheDocument();
    expect(screen.getByText(/Easy/i)).toBeInTheDocument();
  });

  it("triggers onSelectTopic on click, Enter, and Space keypresses", () => {
    const onSelectTopic = vi.fn();
    render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId={null}
          onSelectTopic={onSelectTopic}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(onSelectTopic).toHaveBeenLastCalledWith("two_pointers");

    fireEvent.keyDown(button, { key: "Enter" });
    expect(onSelectTopic).toHaveBeenLastCalledWith("two_pointers");

    fireEvent.keyDown(button, { key: " " });
    expect(onSelectTopic).toHaveBeenLastCalledWith("two_pointers");

    // Ignores other keys
    fireEvent.keyDown(button, { key: "Tab" });
    expect(onSelectTopic).toHaveBeenCalledTimes(3);
  });

  it("handles mouseEnter, mouseLeave, focus, and blur events", () => {
    const onHover = vi.fn();
    render(
      <svg>
        <KnowledgeGraphNode
          node={sampleNode}
          hoveredNodeId={null}
          onSelectTopic={vi.fn()}
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
          onSelectTopic={vi.fn()}
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
          onSelectTopic={vi.fn()}
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
          onSelectTopic={vi.fn()}
          onHover={vi.fn()}
        />
      </svg>,
    );

    const textEl = container.querySelector("text");
    expect(textEl?.getAttribute("fill")).toBe("var(--accent)");
  });
});
