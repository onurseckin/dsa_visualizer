import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnowledgeGraphConnections } from "../components/KnowledgeGraphConnections";

describe("KnowledgeGraphConnections Component Spec", () => {
  it("renders defs and svg paths for default (unhovered) state", () => {
    const { container } = render(
      <svg>
        <KnowledgeGraphConnections hoveredNodeId={null} />
      </svg>,
    );

    expect(container.querySelector("defs")).not.toBeNull();
    const paths = container.querySelectorAll("path[stroke]");
    expect(paths.length).toBeGreaterThan(0);
    // Unhovered paths have stroke-dasharray="5 5"
    expect(paths[0].getAttribute("stroke-dasharray")).toBe("5 5");
  });

  it("renders highlighted path when node or parent is hovered", () => {
    // two-pointers has prerequisite arrays-and-hashing
    const { container } = render(
      <svg>
        <KnowledgeGraphConnections hoveredNodeId="two-pointers" />
      </svg>,
    );

    const activePath = container.querySelector('path[stroke="var(--accent)"]');
    expect(activePath).not.toBeNull();
    expect(activePath?.getAttribute("stroke-dasharray")).toBe("none");
    expect(activePath?.getAttribute("marker-end")).toBe("url(#arrow-active)");
  });

  it("handles horizontal connections when parent.y === node.y with parent to the right of node", () => {
    const placements = [
      {
        id: "test-parent-right",
        title: "Parent Right",
        topicId: "arrays_and_hashing",
        description: "Desc",
        prerequisites: [],
        difficulty: "Easy",
        family: "foundations",
        x: 400,
        y: 200,
      },
      {
        id: "test-child-left",
        title: "Child Left",
        topicId: "arrays_and_hashing",
        description: "Desc",
        prerequisites: ["test-parent-right"],
        difficulty: "Easy",
        family: "foundations",
        x: 100,
        y: 200,
      },
    ] as const;

    const { container } = render(
      <svg>
        <KnowledgeGraphConnections hoveredNodeId="test-child-left" placements={placements} />
      </svg>,
    );

    const path = container.querySelector('path[stroke="var(--accent)"]');
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toContain("M 310 200");
  });

  it("handles horizontal connections when parent.y === node.y with parent to the left of node", () => {
    const placements = [
      {
        id: "test-parent-left",
        title: "Parent Left",
        topicId: "arrays_and_hashing",
        description: "Desc",
        prerequisites: [],
        difficulty: "Easy",
        family: "foundations",
        x: 100,
        y: 300,
      },
      {
        id: "test-child-right",
        title: "Child Right",
        topicId: "arrays_and_hashing",
        description: "Desc",
        prerequisites: ["test-parent-left"],
        difficulty: "Easy",
        family: "foundations",
        x: 400,
        y: 300,
      },
    ] as const;

    const { container } = render(
      <svg>
        <KnowledgeGraphConnections hoveredNodeId="test-child-right" placements={placements} />
      </svg>,
    );

    const path = container.querySelector('path[stroke="var(--accent)"]');
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toContain("M 190 300");
  });
});
