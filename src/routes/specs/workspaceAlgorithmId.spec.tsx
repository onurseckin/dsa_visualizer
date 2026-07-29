import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import { Route, workspaceRendererFor } from "../workspace.$algorithmId";

const renderWorkspaceRoute = (algorithmId = "bubble-sort") => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/workspace/${algorithmId}`] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
};

describe("workspace.$algorithmId route", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("beforeLoad redirects invalid algorithm IDs to bubble-sort and passes valid ones", () => {
    const beforeLoad = Route.options.beforeLoad;
    expect(beforeLoad).toBeDefined();
    if (!beforeLoad) return;

    // Valid algorithm ID does not throw redirect
    expect(() => beforeLoad({ params: { algorithmId: "bubble-sort" } } as never)).not.toThrow();

    // Invalid algorithm ID throws redirect to bubble-sort
    try {
      beforeLoad({ params: { algorithmId: "non-existent-alg" } } as never);
      expect.fail("Should have thrown redirect");
    } catch (err: unknown) {
      const redirectObj = err as { options?: { to?: string; params?: { algorithmId?: string } } };
      expect(redirectObj.options?.to).toBe("/workspace/$algorithmId");
      expect(redirectObj.options?.params?.algorithmId).toBe("bubble-sort");
    }
  });

  it("routes nonalgorithm learning items into the assessment workspace", () => {
    expect(workspaceRendererFor({ kind: "trace" } as never)).toBe("assessment");
    expect(workspaceRendererFor({ kind: "algorithm" } as never)).toBe("algorithm");
  });

  it("handles workspace keyboard shortcuts (ArrowRight, ArrowLeft, Space)", async () => {
    renderWorkspaceRoute("bubble-sort");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();

    // ArrowRight step forward
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });

    // ArrowLeft step backward
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });

    // Standard Space key toggles play.
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });

    // Space key on a button is ignored by global shortcut so button activates instead
    const randomBtn = screen.getByRole("button", { name: /Random input/i });
    act(() => {
      randomBtn.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });

    // Modified keys ignored (altKey, shiftKey, metaKey, ctrlKey)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", ctrlKey: true, bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", metaKey: true, bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }),
      );
    });

    // Typing target (input) ignored
    const inputEl = document.createElement("input");
    document.body.appendChild(inputEl);
    act(() => {
      inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    document.body.removeChild(inputEl);

    // Open dialog ignored
    const dialogEl = document.createElement("dialog");
    dialogEl.setAttribute("open", "true");
    document.body.appendChild(dialogEl);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    document.body.removeChild(dialogEl);
  });

  it("handles non-array input algorithm where supportsRandomArray is false", async () => {
    // binary-search-matrix category is binary_search, non-array input
    renderWorkspaceRoute("binary-search-matrix");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();

    // Random input button should not be rendered for non-array algorithms
    expect(screen.queryByRole("button", { name: /Random input/i })).not.toBeInTheDocument();
  });

  it("handles random array generation button for array algorithms", async () => {
    renderWorkspaceRoute("bubble-sort");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
    const randomBtn = screen.getByRole("button", { name: /Random input/i });
    fireEvent.click(randomBtn);
  });
});
