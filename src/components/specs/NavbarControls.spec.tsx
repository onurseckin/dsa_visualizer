import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppView, PanelKey, PanelVisibility } from "../../types/dsa";
import { Navbar, NavbarProps } from "../../ui";

const ALL_VISIBLE: PanelVisibility = {
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
};

const PANEL_LABELS: Record<PanelKey, string> = {
  visualizer: "Visualizer",
  code: "Code",
  tutorial: "Tutorial",
  auxiliary: "Aux data",
};

const accentTintedText = (root: ParentNode): Element[] =>
  Array.from(root.querySelectorAll("[style]")).filter((el) =>
    /(?:^|;\s*)color:\s*var\(--accent/.test(el.getAttribute("style") ?? ""),
  );

import { useSearchStore } from "../../app/useSearchStore";

describe("NavbarControls Component Spec", () => {
  beforeEach(() => {
    (document.activeElement as HTMLElement)?.blur();
    document.body.innerHTML = "";
    useSearchStore.setState({ isDrawerOpen: false });
  });

  afterEach(() => {
    (document.activeElement as HTMLElement)?.blur();
    cleanup();
    document.body.innerHTML = "";
  });

  const makeProps = (overrides: Partial<NavbarProps> = {}): NavbarProps => ({
    appView: "workspace" as const,
    onSetAppView: vi.fn(),
    activeAlgorithmId: "bubble-sort",
    onGlobalSelectAlgorithm: vi.fn(),
    panels: ALL_VISIBLE,
    onTogglePanel: vi.fn(),
    ...overrides,
  });

  it("renders brand, app-view segmented switcher, five toggles, and search trigger", () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.getByRole("button", { name: "DSA Visualizer home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Knowledge Tree" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Problem List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trivia" })).toBeInTheDocument();

    for (const label of Object.values(PANEL_LABELS)) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Search algorithms/i })).toBeInTheDocument();
  });

  it("renders the brand button as a graph icon badge button in a bordered container", () => {
    const { container } = render(<Navbar {...makeProps()} />);

    const brand = screen.getByRole("button", { name: "DSA Visualizer home" });
    expect(brand).toHaveClass("ui-btn", "ui-btn--secondary", "ui-btn--md");
    expect(brand.querySelector("svg")).toBeInTheDocument();

    expect(accentTintedText(container)).toEqual([]);
  });

  it("no longer renders the removed Split/Visual/Code view-mode segmented", () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole("button", { name: "Split" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Visual" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /View mode/i })).not.toBeInTheDocument();
  });

  it("renders the five toggles as one uniform sm row with aria-pressed on each", () => {
    render(
      <Navbar
        {...makeProps({
          panels: { visualizer: true, code: false, tutorial: true, auxiliary: false },
        })}
      />,
    );

    const expected: [string, string][] = [
      ["Visualizer", "true"],
      ["Code", "false"],
      ["Tutorial", "true"],
      ["Aux data", "false"],
    ];

    for (const [label, pressed] of expected) {
      const toggle = screen.getByRole("button", { name: label });
      expect(toggle).toHaveAttribute("aria-pressed", pressed);
      expect(toggle).toHaveClass("ui-btn", "ui-btn--sm");
      expect(toggle.classList.contains("ui-btn--selected")).toBe(pressed === "true");
    }
  });

  it("calls onTogglePanel with the matching key for each panel toggle", () => {
    const onTogglePanel = vi.fn();
    render(<Navbar {...makeProps({ onTogglePanel })} />);

    for (const [key, label] of Object.entries(PANEL_LABELS)) {
      onTogglePanel.mockClear();
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(onTogglePanel).toHaveBeenCalledTimes(1);
      expect(onTogglePanel).toHaveBeenCalledWith(key);
    }
  });

  it("shows panel toggles only in workspace view", () => {
    const { rerender } = render(<Navbar {...makeProps()} />);
    expect(screen.getByRole("button", { name: "Visualizer" })).toBeInTheDocument();

    for (const appView of ["tree", "list", "trivia"] as const) {
      rerender(<Navbar {...makeProps({ appView })} />);
      for (const label of Object.values(PANEL_LABELS)) {
        expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
      }
    }
  });

  it("calls onSetAppView when clicking a non-selected app-view segment", () => {
    const onSetAppView = vi.fn();
    render(<Navbar {...makeProps({ onSetAppView })} />);

    fireEvent.click(screen.getByRole("button", { name: "Knowledge Tree" }));
    expect(onSetAppView).toHaveBeenCalledWith("tree");
  });

  describe("trivia app view", () => {
    const APP_VIEW_LABELS: Record<AppView, string> = {
      tree: "Knowledge Tree",
      list: "Problem List",
      workspace: "Workspace",
      trivia: "Trivia",
    };

    it("renders Trivia as the fourth segment of the app-view group", () => {
      render(<Navbar {...makeProps()} />);

      const group = screen.getByRole("group", { name: "App view" });
      const labels = Array.from(group.querySelectorAll("button")).map((btn) => btn.textContent);
      expect(labels).toEqual(["Knowledge Tree", "Problem List", "Workspace", "Trivia"]);
    });

    it("switches the app view when the Trivia segment is clicked", () => {
      const onSetAppView = vi.fn();
      render(<Navbar {...makeProps({ onSetAppView })} />);

      fireEvent.click(screen.getByRole("button", { name: "Trivia" }));
      expect(onSetAppView).toHaveBeenCalledTimes(1);
      expect(onSetAppView).toHaveBeenCalledWith("trivia");
    });

    it("marks exactly the active segment as pressed for every app view", () => {
      const { rerender } = render(<Navbar {...makeProps()} />);

      for (const [appView, activeLabel] of Object.entries(APP_VIEW_LABELS)) {
        rerender(<Navbar {...makeProps({ appView: appView as AppView })} />);
        for (const label of Object.values(APP_VIEW_LABELS)) {
          expect(screen.getByRole("button", { name: label })).toHaveAttribute(
            "aria-pressed",
            String(label === activeLabel),
          );
        }
      }
    });

    it("does not re-fire onSetAppView when the active Trivia segment is clicked", () => {
      const onSetAppView = vi.fn();
      render(<Navbar {...makeProps({ appView: "trivia", onSetAppView })} />);

      fireEvent.click(screen.getByRole("button", { name: "Trivia" }));
      expect(onSetAppView).not.toHaveBeenCalled();
    });

    it("hides the workspace-only reset action in trivia view but keeps search", () => {
      render(<Navbar {...makeProps({ appView: "trivia" })} />);

      expect(screen.queryByRole("button", { name: "Reset layout" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Search algorithms/i })).toBeInTheDocument();
    });
  });

  it("does not render old standalone category and algorithm select dropdowns", () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByText(/^Category:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Algorithm:$/i)).not.toBeInTheDocument();
  });
});
