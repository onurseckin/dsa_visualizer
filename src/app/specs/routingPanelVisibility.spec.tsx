import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "../../components/Navbar";
import { SettingsProvider, useSettings } from "../SettingsContext";

function SettingsNavbarHarness(): React.ReactElement {
  const { panels, togglePanel } = useSettings();
  return (
    <Navbar
      appView="workspace"
      onSetAppView={() => {}}
      onGlobalSelectAlgorithm={() => {}}
      panels={panels}
      onTogglePanel={togglePanel}
    />
  );
}

describe("Panel visibility settings spec", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderHarness = () =>
    render(
      <SettingsProvider>
        <SettingsNavbarHarness />
      </SettingsProvider>,
    );

  const pressed = (name: string) =>
    screen.getByRole("button", { name }).getAttribute("aria-pressed");

  it("defaults every panel to on with nothing stored", () => {
    renderHarness();

    expect(pressed("Visualizer")).toBe("true");
    expect(pressed("Code")).toBe("true");
    expect(pressed("Tutorial")).toBe("true");
    expect(pressed("Aux data")).toBe("true");
  });

  it.each([
    ["split", "true", "true"],
    ["visual", "true", "false"],
    ["code", "false", "true"],
  ] as const)(
    "migrates a legacy view_mode of %s to independent panel booleans",
    (viewMode, visualizer, code) => {
      window.localStorage.setItem("dsa_visualizer_view_mode", JSON.stringify(viewMode));

      renderHarness();

      expect(pressed("Visualizer")).toBe(visualizer);
      expect(pressed("Code")).toBe(code);
      expect(pressed("Tutorial")).toBe("true");
      expect(pressed("Aux data")).toBe("true");
    },
  );

  it("keeps legacy show_tutorial/show_auxiliary values while migrating view_mode", () => {
    window.localStorage.setItem("dsa_visualizer_view_mode", JSON.stringify("code"));
    window.localStorage.setItem("dsa_visualizer_show_tutorial", "false");
    window.localStorage.setItem("dsa_visualizer_show_auxiliary", "false");

    renderHarness();

    expect(pressed("Visualizer")).toBe("false");
    expect(pressed("Code")).toBe("true");
    expect(pressed("Tutorial")).toBe("false");
    expect(pressed("Aux data")).toBe("false");
  });

  it("prefers a stored panel boolean over the legacy view_mode", () => {
    window.localStorage.setItem("dsa_visualizer_view_mode", JSON.stringify("code"));
    window.localStorage.setItem("dsa_visualizer_panel_visualizer", "true");

    renderHarness();

    expect(pressed("Visualizer")).toBe("true");
    expect(pressed("Code")).toBe("true");
  });

  it("ignores garbage stored values instead of throwing", () => {
    window.localStorage.setItem("dsa_visualizer_panel_code", "{oops");
    window.localStorage.setItem("dsa_visualizer_panel_tutorial", '"yes"');
    window.localStorage.setItem("dsa_visualizer_view_mode", JSON.stringify("sideways"));

    renderHarness();

    expect(pressed("Code")).toBe("true");
    expect(pressed("Tutorial")).toBe("true");
    expect(pressed("Visualizer")).toBe("true");
  });

  it.each([
    ["Visualizer", "dsa_visualizer_panel_visualizer"],
    ["Code", "dsa_visualizer_panel_code"],
    ["Tutorial", "dsa_visualizer_panel_tutorial"],
    ["Aux data", "dsa_visualizer_panel_auxiliary"],
  ] as const)("toggling %s flips aria-pressed and persists the boolean", (label, storageKey) => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(pressed(label)).toBe("false");
    expect(window.localStorage.getItem(storageKey)).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(pressed(label)).toBe("true");
    expect(window.localStorage.getItem(storageKey)).toBe("true");
  });

  it("leaves the other three panels alone when one toggle flips", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Tutorial" }));

    expect(pressed("Tutorial")).toBe("false");
    expect(pressed("Visualizer")).toBe("true");
    expect(pressed("Code")).toBe("true");
    expect(pressed("Aux data")).toBe("true");
    expect(window.localStorage.getItem("dsa_visualizer_panel_visualizer")).toBeNull();
    expect(window.localStorage.getItem("dsa_visualizer_panel_code")).toBeNull();
    expect(window.localStorage.getItem("dsa_visualizer_panel_auxiliary")).toBeNull();
  });
});
