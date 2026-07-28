import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";

function buildRouter(initialEntries: string[]): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
}

describe("Workspace keyboard playback spec", () => {
  const spareFields: HTMLElement[] = [];

  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    spareFields.splice(0).forEach((field) => field.remove());
    vi.restoreAllMocks();
  });

  const renderWorkspace = async () => {
    const router = buildRouter(["/workspace/bubble-sort"]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "Bubble Sort" })).toBeInTheDocument();
    return router;
  };

  const readout = () => screen.getByLabelText(/^Step \d+ of \d+$/).getAttribute("aria-label");

  const pressKey = (key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    act(() => {
      window.dispatchEvent(event);
    });
    return event;
  };

  const pressKeyInTextField = (key: string) => {
    const field = document.createElement("input");
    document.body.appendChild(field);
    spareFields.push(field);
    field.focus();
    act(() => {
      fireEvent.keyDown(field, { key });
    });
  };

  it("steps forward with ArrowRight and back with ArrowLeft", async () => {
    await renderWorkspace();
    expect(readout()).toMatch(/^Step 1 of/);

    pressKey("ArrowRight");
    expect(readout()).toMatch(/^Step 2 of/);

    pressKey("ArrowRight");
    expect(readout()).toMatch(/^Step 3 of/);

    pressKey("ArrowLeft");
    expect(readout()).toMatch(/^Step 2 of/);
  });

  it("does not step below the first step", async () => {
    await renderWorkspace();

    pressKey("ArrowLeft");
    expect(readout()).toMatch(/^Step 1 of/);
  });

  it("toggles play/pause on Space and preventDefaults so the page cannot scroll", async () => {
    await renderWorkspace();

    const play = pressKey(" ");
    expect(play.defaultPrevented).toBe(true);
    expect(await screen.findByRole("button", { name: "Pause playback" })).toBeInTheDocument();

    const pause = pressKey(" ");
    expect(pause.defaultPrevented).toBe(true);
    expect(await screen.findByRole("button", { name: "Play all steps" })).toBeInTheDocument();
  });

  it("takes the wheel from playback when an arrow key steps", async () => {
    await renderWorkspace();

    pressKey(" ");
    expect(await screen.findByRole("button", { name: "Pause playback" })).toBeInTheDocument();

    pressKey("ArrowRight");

    expect(await screen.findByRole("button", { name: "Play all steps" })).toBeInTheDocument();
    expect(readout()).toMatch(/^Step (?:2|3|4) of/);

    pressKey("ArrowLeft");
    expect(readout()).toMatch(/^Step (?:1|2|3) of/);
  });

  it("ignores every shortcut while the user is typing in a field", async () => {
    await renderWorkspace();
    const before = readout();

    pressKeyInTextField("ArrowRight");
    pressKeyInTextField("ArrowLeft");
    pressKeyInTextField(" ");

    expect(readout()).toBe(before);
    expect(screen.getByRole("button", { name: "Play all steps" })).toBeInTheDocument();
  });

  it("ignores every shortcut while a modifier is held", async () => {
    await renderWorkspace();
    const before = readout();

    for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"] as const) {
      const event = pressKey("ArrowRight", { [modifier]: true });
      expect(event.defaultPrevented).toBe(false);
      pressKey(" ", { [modifier]: true });
    }

    expect(readout()).toBe(before);
    expect(screen.getByRole("button", { name: "Play all steps" })).toBeInTheDocument();
  });

  it("yields Space to whatever button has focus", async () => {
    await renderWorkspace();

    const panelToggle = within(screen.getByRole("banner")).getByRole("button", {
      name: "Tutorial",
    });
    panelToggle.focus();
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    act(() => {
      panelToggle.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByRole("button", { name: "Play all steps" })).toBeInTheDocument();
  });

  it('keeps the "/" search shortcut working and stops stepping while the drawer is open', async () => {
    await renderWorkspace();
    const before = readout();

    fireEvent.keyDown(window, { key: "/" });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    pressKey("ArrowRight");
    expect(readout()).toBe(before);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    pressKey("ArrowRight");
    expect(readout()).not.toBe(before);
  });

  it("stops stepping while the navbar reset dialog is open", async () => {
    await renderWorkspace();
    const before = readout();

    fireEvent.click(
      within(screen.getByRole("banner")).getByRole("button", { name: "Reset layout" }),
    );
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    pressKey("ArrowRight");
    expect(readout()).toBe(before);
  });

  it("exposes the shortcuts on the playback controls themselves", async () => {
    await renderWorkspace();

    const expected: [string, string][] = [
      ["Step backward", "ArrowLeft"],
      ["Play all steps", "Space"],
      ["Step forward", "ArrowRight"],
    ];

    for (const [name, keys] of expected) {
      const control = screen.getByRole("button", { name });
      expect(control).toHaveAttribute("aria-keyshortcuts", keys);
      expect(control.getAttribute("title")).toContain(keys === "Space" ? "Space" : "arrow");
    }
  });
});
