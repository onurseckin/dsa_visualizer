import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnowledgeGraphConnections } from "../components/KnowledgeGraphConnections";
import { TOPIC_ROADMAP_NODES } from "../knowledgeGraphData";

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
    const origLength = TOPIC_ROADMAP_NODES.length;
    try {
      TOPIC_ROADMAP_NODES.push(
        {
          id: "test-parent-right",
          title: "Parent Right",
          categoryFolder: "arrays_and_hashing",
          description: "Desc",
          prerequisites: [],
          algorithmCount: 1,
          difficulty: "Easy",
          family: "foundations",
          x: 400,
          y: 200,
        },
        {
          id: "test-child-left",
          title: "Child Left",
          categoryFolder: "arrays_and_hashing",
          description: "Desc",
          prerequisites: ["test-parent-right"],
          algorithmCount: 1,
          difficulty: "Easy",
          family: "foundations",
          x: 100,
          y: 200, // Same Y, parent is to the right
        },
      );

      const { container } = render(
        <svg>
          <KnowledgeGraphConnections hoveredNodeId="test-child-left" />
        </svg>,
      );

      const path = container.querySelector('path[stroke="var(--accent)"]');
      expect(path).not.toBeNull();
      // startX = parent.x - 90 = 310, startY = 200
      expect(path?.getAttribute("d")).toContain("M 310 200");
    } finally {
      TOPIC_ROADMAP_NODES.length = origLength;
    }
  });

  it("handles horizontal connections when parent.y === node.y with parent to the left of node", () => {
    const origLength = TOPIC_ROADMAP_NODES.length;
    try {
      TOPIC_ROADMAP_NODES.push(
        {
          id: "test-parent-left",
          title: "Parent Left",
          categoryFolder: "arrays_and_hashing",
          description: "Desc",
          prerequisites: [],
          algorithmCount: 1,
          difficulty: "Easy",
          family: "foundations",
          x: 100,
          y: 300,
        },
        {
          id: "test-child-right",
          title: "Child Right",
          categoryFolder: "arrays_and_hashing",
          description: "Desc",
          prerequisites: ["test-parent-left"],
          algorithmCount: 1,
          difficulty: "Easy",
          family: "foundations",
          x: 400,
          y: 300, // Same Y, parent is to the left
        },
      );

      const { container } = render(
        <svg>
          <KnowledgeGraphConnections hoveredNodeId="test-child-right" />
        </svg>,
      );

      const path = container.querySelector('path[stroke="var(--accent)"]');
      expect(path).not.toBeNull();
      // startX = parent.x + 90 = 190, startY = 300
      expect(path?.getAttribute("d")).toContain("M 190 300");
    } finally {
      TOPIC_ROADMAP_NODES.length = origLength;
    }
  });
});
