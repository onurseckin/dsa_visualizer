import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreeLink } from "../tree/TreeLink";
import { TreeNode } from "../tree/TreeNode";
import { ComputedTreeNode } from "../tree/treeTypes";

describe("TreeLink Component Spec", () => {
  const defaultParent: ComputedTreeNode = {
    id: "p1",
    val: 10,
    cx: 100,
    cy: 100,
    state: "default",
  };

  const defaultChild: ComputedTreeNode = {
    id: "c1",
    val: 5,
    cx: 50,
    cy: 200,
    state: "default",
  };

  it("renders a default tree link line between parent and child", () => {
    const { container } = render(
      <svg>
        <TreeLink
          parent={defaultParent}
          child={defaultChild}
          nodeRadius={20}
          linkStroke={2}
          pathStroke={4}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line).toHaveAttribute("stroke", "var(--border-default)");
    expect(line).toHaveAttribute("stroke-width", "2");
    expect(line).toHaveAttribute("stroke-dasharray", "4 4");
  });

  it("renders highlighted path link when both parent and child are on active/path/traversed state", () => {
    const pathParent: ComputedTreeNode = { ...defaultParent, isPath: true };
    const pathChild: ComputedTreeNode = { ...defaultChild, isTraversed: true };

    const { container } = render(
      <svg>
        <TreeLink
          parent={pathParent}
          child={pathChild}
          nodeRadius={20}
          linkStroke={2}
          pathStroke={4}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line).toHaveAttribute("stroke", "var(--state-active)");
    expect(line).toHaveAttribute("stroke-width", "4");
    expect(line).not.toHaveAttribute("stroke-dasharray");
  });

  it("handles coincident parent and child positions (dist = 0)", () => {
    const coincidentChild: ComputedTreeNode = { ...defaultChild, cx: 100, cy: 100 };

    const { container } = render(
      <svg>
        <TreeLink
          parent={defaultParent}
          child={coincidentChild}
          nodeRadius={20}
          linkStroke={2}
          pathStroke={4}
        />
      </svg>,
    );

    const line = container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line).toHaveAttribute("x1", "100");
    expect(line).toHaveAttribute("y1", "100");
  });
});

describe("TreeNode Component Spec", () => {
  const node: ComputedTreeNode = {
    id: "n1",
    val: 42,
    cx: 150,
    cy: 150,
    state: "default",
  };

  it("renders a default tree node without group slot or ring", () => {
    const { container, getByText } = render(
      <svg>
        <TreeNode node={node} nodeRadius={24} nodeStroke={2} labelFont={12} />
      </svg>,
    );

    expect(getByText("42")).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1); // main circle only, no group ring
  });

  it("renders node with group slot color when state is default", () => {
    const { container } = render(
      <svg>
        <TreeNode node={node} nodeRadius={24} nodeStroke={2} labelFont={12} slot={0} />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(1); // default state -> no group ring
    expect(circles[0]).toHaveAttribute("fill", "color-mix(in srgb, var(--viz-1) 22%, transparent)");
  });

  it("renders node in active semantic state with group ring when slot and state are present", () => {
    const activeNode: ComputedTreeNode = { ...node, state: "active" };

    const { container } = render(
      <svg>
        <TreeNode node={activeNode} nodeRadius={24} nodeStroke={2} labelFont={12} slot={1} />
      </svg>,
    );

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2); // group ring + node circle
    expect(circles[0]).toHaveAttribute("stroke", "var(--viz-2)"); // group ring
    expect(circles[1]).toHaveAttribute("fill", "var(--state-active-bg)"); // semantic fill
  });
});
