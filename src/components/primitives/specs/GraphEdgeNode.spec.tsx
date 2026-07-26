import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphEdge } from "../graph/GraphEdge";
import { GraphNode } from "../graph/GraphNode";
import { PositionedNode } from "../graph/graphTypes";
import { GraphEdgeItem } from "../../../types/dsa";

describe("GraphEdge Component Spec", () => {
  const fromNode: PositionedNode = { id: "A", label: "Node A", state: "default", x: 100, y: 100 };
  const toNode: PositionedNode = { id: "B", label: "Node B", state: "default", x: 300, y: 100 };

  const defaultProps = {
    nodeRadius: 20,
    markerScope: "scope1",
    plainStroke: 2,
    traversedStroke: 3,
    pathStroke: 4,
    dash: 5,
    weightFont: 12,
    weightW: 24,
    weightH: 16,
  };

  it("renders undirected plain edge without markerEnd or weight", () => {
    const edge: GraphEdgeItem = { from: "A", to: "B" };

    const { container } = render(
      <svg>
        <GraphEdge
          edge={edge}
          fromNode={fromNode}
          toNode={toNode}
          isDirected={false}
          {...defaultProps}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line).toHaveAttribute("stroke", "var(--border-default)");
    expect(line).toHaveAttribute("stroke-width", "2");
    expect(line).not.toHaveAttribute("marker-end");
    expect(container.querySelector("rect")).toBeNull();
  });

  it("renders directed edge with arrowhead marker and weight badge", () => {
    const edge: GraphEdgeItem = { from: "A", to: "B", weight: 42, isTraversed: true };

    const { container, getByText } = render(
      <svg>
        <GraphEdge
          edge={edge}
          fromNode={fromNode}
          toNode={toNode}
          isDirected={true}
          {...defaultProps}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("stroke", "var(--state-active)");
    expect(line).toHaveAttribute("stroke-width", "3");
    expect(line).toHaveAttribute("marker-end", "url(#arrowhead-traversed-scope1)");

    expect(getByText("42")).toBeInTheDocument();
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("renders final path edge with path styling and explicit edge group", () => {
    const edge: GraphEdgeItem = { from: "A", to: "B", isPath: true, weight: 7 };

    const { container } = render(
      <svg>
        <GraphEdge
          edge={edge}
          fromNode={fromNode}
          toNode={toNode}
          edgeGroup={0}
          isDirected={true}
          {...defaultProps}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("stroke", "var(--state-path)");
    expect(line).toHaveAttribute("stroke-width", "4");
    expect(line).toHaveAttribute("marker-end", "url(#arrowhead-path-scope1)");
  });

  it("handles coincident from and to nodes (dist = 0)", () => {
    const coincidentToNode: PositionedNode = { ...toNode, x: 100, y: 100 };
    const edge: GraphEdgeItem = { from: "A", to: "A" };

    const { container } = render(
      <svg>
        <GraphEdge
          edge={edge}
          fromNode={fromNode}
          toNode={coincidentToNode}
          isDirected={false}
          {...defaultProps}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).toHaveAttribute("x1", "100");
    expect(line).toHaveAttribute("y1", "100");
  });
});

describe("GraphNode Component Spec", () => {
  const node: PositionedNode = {
    id: "A",
    label: "Custom Label",
    state: "default",
    x: 150,
    y: 150,
  };

  it("renders node label and single circle when state is default and slot is undefined", () => {
    const { container, getByText } = render(
      <svg>
        <GraphNode node={node} nodeRadius={20} nodeStroke={2} labelFont={12} />
      </svg>,
    );

    expect(getByText("Custom Label")).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1);
  });

  it("falls back to node id when label is empty or omitted", () => {
    const nodeWithoutLabel: PositionedNode = {
      id: "NodeIdOnly",
      label: "",
      state: "default",
      x: 50,
      y: 50,
    };

    const { getByText } = render(
      <svg>
        <GraphNode node={nodeWithoutLabel} nodeRadius={20} nodeStroke={2} labelFont={12} />
      </svg>,
    );

    expect(getByText("NodeIdOnly")).toBeInTheDocument();
  });

  it("renders group ring when slot is provided and node is in a non-default state", () => {
    const activeNode: PositionedNode = { ...node, state: "visited" };

    const { container } = render(
      <svg>
        <GraphNode node={activeNode} nodeRadius={20} nodeStroke={2} labelFont={12} slot={0} />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2); // group ring + node circle
    expect(circles[0]).toHaveAttribute("stroke", "var(--viz-1)");
  });
});
