import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PanelVisibility } from "../../types/dsa";
import {
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WORKSPACE_LAYOUT_VERSION,
} from "../../app/workspaceLayout";
import { Navbar, NavbarProps } from "../../ui";

const ALL_VISIBLE: PanelVisibility = {
  problem: true,
  solution: true,
  examples: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  complexity: true,
};

describe("NavbarReset Component Spec", () => {
  beforeEach(() => {
    (document.activeElement as HTMLElement)?.blur();
    document.body.innerHTML = "";
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

  describe("layout reset", () => {
    const STORED_LAYOUT = JSON.stringify({
      version: WORKSPACE_LAYOUT_VERSION,
      splitPercent: 55,
      panelHeights: { visualizer: 400, code: null, complexity: null },
    });

    let resetEvents: number;
    const countReset = () => {
      resetEvents += 1;
    };

    beforeEach(() => {
      resetEvents = 0;
      window.localStorage.clear();
      window.localStorage.setItem(WORKSPACE_LAYOUT_KEY, STORED_LAYOUT);
      window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, countReset);
    });

    afterEach(() => {
      window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, countReset);
      window.localStorage.clear();
    });

    const resetTrigger = () => screen.getByRole("button", { name: "Reset layout" });

    it("renders as a workspace-only sm control that matches the toggles but is not one", () => {
      const { rerender } = render(<Navbar {...makeProps()} />);

      const trigger = resetTrigger();
      expect(trigger).toHaveClass("ui-btn", "ui-btn--sm");
      expect(trigger).not.toHaveAttribute("aria-pressed");
      expect(trigger).toHaveAttribute("title");

      for (const appView of ["tree", "list"] as const) {
        rerender(<Navbar {...makeProps({ appView })} />);
        expect(screen.queryByRole("button", { name: "Reset layout" })).not.toBeInTheDocument();
      }
    });

    it("opens a destructive confirm dialog and changes nothing yet", () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveTextContent(/Reset workspace layout\?/i);
      expect(dialog).toHaveTextContent(/details panel is expanded/i);
      expect(screen.getByRole("button", { name: "Reset to defaults" })).toHaveClass(
        "ui-btn--danger",
      );
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it("keeps the stored layout when cancelled", () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.click(screen.getByRole("button", { name: "Keep my layout" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it("keeps the stored layout when dismissed with Escape", () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it("clears storage and announces the reset once confirmed", () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));

      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
      expect(resetEvents).toBe(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it('does not hijack "/" into the search drawer while the dialog is open', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.keyDown(window, { key: "/" });

      expect(screen.getByRole("dialog")).toHaveTextContent(/Reset workspace layout\?/i);
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });
  });
});
