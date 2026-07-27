import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  TopicFamily,
  TopicRoadmapNode,
  TOPIC_FAMILIES,
  TOPIC_ROADMAP_NODES,
  topicFamilyColor,
  topicFamilyLabel,
} from "../../components/knowledge-graph/knowledgeGraphData";
import { KnowledgeGraph } from "../../ui";
import { VIZ_SLOT_COUNT, vizSlotBg } from "../primitives/vizPalette";

describe("KnowledgeGraph Component Spec", () => {
  it("renders SVG region and interactive roadmap nodes", () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    expect(
      screen.getByRole("region", {
        name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i,
      }),
    ).toBeInTheDocument();
  });

  it("triggers category selection when SVG node is clicked", () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const buttons = screen.getAllByRole("button", { name: /1\. Arrays & Hashing/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);

    // Click SVG node button
    fireEvent.click(buttons[0]);
    expect(onSelectMock).toHaveBeenCalledWith("arrays_and_hashing");
  });

  it("supports keyboard navigation via Enter and Space keypresses", () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const twoPointersButtons = screen.getAllByRole("button", { name: /2\. Two Pointers/i });

    // Press Enter on SVG node
    fireEvent.keyDown(twoPointersButtons[0], { key: "Enter" });
    expect(onSelectMock).toHaveBeenCalledWith("two_pointers");

    // Press Space on SVG node
    fireEvent.keyDown(twoPointersButtons[0], { key: " " });
    expect(onSelectMock).toHaveBeenCalledWith("two_pointers");
  });

  it("handles mouse enter, mouse leave, focus, and blur events on interactive elements", () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const button = screen.getAllByRole("button", { name: /1\. Arrays & Hashing/i })[0];

    // Hover mouse enter & leave
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    // Focus & blur
    fireEvent.focus(button);
    fireEvent.blur(button);
  });

  it("contains all 21 topic roadmap nodes with valid properties and prerequisite structure", () => {
    expect(TOPIC_ROADMAP_NODES.length).toBe(21);
    const familyIds = TOPIC_FAMILIES.map((family: TopicFamily) => family.id);
    TOPIC_ROADMAP_NODES.forEach((node: TopicRoadmapNode) => {
      expect(node.id).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.categoryFolder).toBeDefined();
      expect(node.description).toBeDefined();
      expect(Array.isArray(node.prerequisites)).toBe(true);
      expect(node.algorithmCount).toBeGreaterThan(0);
      expect(["Easy", "Medium", "Hard"]).toContain(node.difficulty);
      expect(familyIds).toContain(node.family);
      expect(typeof node.x).toBe("number");
      expect(typeof node.y).toBe("number");
    });
  });

  it("assigns every topic family a distinct viz slot in fixed order", () => {
    expect(TOPIC_FAMILIES.map((family: TopicFamily) => family.slot)).toEqual(
      Array.from({ length: VIZ_SLOT_COUNT }, (_, index) => index),
    );

    const colors = TOPIC_FAMILIES.map((family: TopicFamily) => topicFamilyColor(family.id));
    expect(colors).toEqual([
      "var(--viz-1)",
      "var(--viz-2)",
      "var(--viz-3)",
      "var(--viz-4)",
      "var(--viz-5)",
      "var(--viz-6)",
      "var(--viz-7)",
      "var(--viz-8)",
    ]);
    expect(new Set(colors).size).toBe(TOPIC_FAMILIES.length);
    expect(topicFamilyLabel("graphs")).toBe("Graphs");
  });

  it("every family is actually used by at least one topic", () => {
    const usedFamilies = new Set(TOPIC_ROADMAP_NODES.map((node: TopicRoadmapNode) => node.family));
    TOPIC_FAMILIES.forEach((family: TopicFamily) => {
      expect(usedFamilies.has(family.id)).toBe(true);
    });
  });

  it("renders a family color legend and tints roadmap nodes by family", () => {
    render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const legend = screen.getByRole("list", { name: /Topic family colors/i });
    expect(legend).toBeInTheDocument();
    TOPIC_FAMILIES.forEach((family: TopicFamily) => {
      expect(screen.getAllByText(family.label).length).toBeGreaterThan(0);
    });

    const graphsNode = screen.getAllByRole("button", { name: /11\. Graph Traversal/i })[0];
    const familyBar = graphsNode.querySelectorAll("rect")[1];
    expect(familyBar).toHaveAttribute("fill", topicFamilyColor("graphs"));
  });

  it("keeps family swatches as the data key", () => {
    render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const swatches = screen
      .getByRole("list", { name: /Topic family colors/i })
      .querySelectorAll<HTMLElement>('span[aria-hidden="true"]');
    expect(Array.from(swatches).map((swatch) => swatch.style.background)).toEqual(
      TOPIC_FAMILIES.map((family: TopicFamily) => topicFamilyColor(family.id)),
    );
  });

  it("fills roadmap nodes with their family hue and keeps that hue on hover", () => {
    render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    // The graphs family owns slot 5, so its nodes mix --viz-6 into the raised tier.
    const node = screen.getAllByRole("button", { name: /11\. Graph Traversal/i })[0];
    expect(node.querySelectorAll("rect")[0]).toHaveAttribute(
      "fill",
      vizSlotBg(5, 26, "var(--bg-elevated)"),
    );

    fireEvent.mouseEnter(node);
    // Hover strengthens the same mix instead of washing the family out to accent.
    expect(node.querySelectorAll("rect")[0]).toHaveAttribute(
      "fill",
      vizSlotBg(5, 40, "var(--bg-elevated)"),
    );

    fireEvent.mouseLeave(node);
    expect(node.querySelectorAll("rect")[0]).toHaveAttribute(
      "fill",
      vizSlotBg(5, 26, "var(--bg-elevated)"),
    );
  });

  it("tints prerequisite edges with the unlocked topic family color", () => {
    const { container } = render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const strokes = Array.from(container.querySelectorAll("path[stroke]")).map((p) =>
      p.getAttribute("stroke"),
    );
    expect(strokes).toContain(topicFamilyColor("graphs"));
    expect(strokes).toContain(topicFamilyColor("dynamic-programming"));
  });
});
