import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader } from "../index";

describe("PanelHeader render spec", () => {
  it("renders title, icon, subtitle and actions", () => {
    render(
      <PanelHeader
        title="Settings"
        icon={<span data-testid="icon">I</span>}
        subtitle="Manage deck"
        actions={<button type="button">Save</button>}
      />,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Manage deck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders minimal PanelHeader without icon, subtitle, or actions", () => {
    const { container } = render(<PanelHeader title="Bare Header" />);
    expect(screen.getByText("Bare Header")).toBeInTheDocument();
    expect(container.querySelector(".ui-panel-header__icon")).toBeNull();
    expect(container.querySelector(".ui-panel-header__subtitle")).toBeNull();
    expect(container.querySelector(".ui-panel-header__actions")).toBeNull();
  });

  it("merges custom className and passes rest HTML attributes", () => {
    render(<PanelHeader title="Custom" className="my-header" data-testid="header-container" />);
    const header = screen.getByTestId("header-container");
    expect(header).toHaveClass("ui-panel-header", "my-header");
  });
});
