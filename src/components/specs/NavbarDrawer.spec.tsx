import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PanelVisibility } from "../../types/dsa";
import { Navbar, NavbarProps } from "../../ui";

const ALL_VISIBLE: PanelVisibility = {
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
};

import { useSearchStore } from "../../app/useSearchStore";

describe("NavbarDrawer Component Spec", () => {
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

  it("opens the QuickAccessDrawer when clicking the search trigger", () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Search algorithms/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it('opens the drawer on global "/" keypress', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it('opens the drawer on global "Cmd+K" keypress', () => {
    render(<Navbar {...makeProps()} />);
    (document.activeElement as HTMLElement)?.blur();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it('ignores "/" typed inside an input field', () => {
    render(
      <>
        <Navbar {...makeProps()} />
        <input aria-label="Unrelated text field" />
      </>,
    );

    const field = screen.getByRole("textbox", { name: /Unrelated text field/i });
    field.focus();
    fireEvent.keyDown(field, { key: "/" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('still opens the search drawer on "/" from trivia view', () => {
    render(<Navbar {...makeProps({ appView: "trivia" })} />);

    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it('ignores "/" keypress when a dialog is open', () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.appendChild(dialog);

    render(<Navbar {...makeProps()} />);
    fireEvent.keyDown(window, { key: "/" });
    expect(screen.queryByRole("dialog", { name: /search/i })).not.toBeInTheDocument();

    document.body.removeChild(dialog);
  });
});
