import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";

const renderRootWithHistory = (initialEntry: string) => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
};

describe("RootRoute component (__root.tsx)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders root layout with Navbar on "/" (tree view)', async () => {
    renderRootWithHistory("/");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/problems" (list view)', async () => {
    renderRootWithHistory("/problems");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/trivia" (trivia view)', async () => {
    renderRootWithHistory("/trivia");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/workspace/bubble-sort" (workspace view)', async () => {
    renderRootWithHistory("/workspace/bubble-sort");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it("navigates when Navbar app view segmented control is clicked", async () => {
    renderRootWithHistory("/trivia");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();

    const listBtn = screen.getByRole("button", { name: "Problem List" });
    fireEvent.click(listBtn);

    const treeBtn = screen.getByRole("button", { name: "Knowledge Tree" });
    fireEvent.click(treeBtn);

    const triviaBtn = screen.getByRole("button", { name: "Trivia" });
    fireEvent.click(triviaBtn);

    const workspaceBtn = screen.getByRole("button", { name: "Workspace" });
    fireEvent.click(workspaceBtn);
  });

  it("navigates when an algorithm is selected globally via search drawer", async () => {
    const { router } = renderRootWithHistory("/trivia");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();

    const searchBtn = screen.getByRole("button", { name: "Search algorithms" });
    fireEvent.click(searchBtn);

    const input = await screen.findByPlaceholderText("Search algorithms…");
    fireEvent.change(input, { target: { value: "Two Sum" } });

    const item = await screen.findByText("Two Sum");
    fireEvent.click(item);

    await waitFor(() => expect(router.state.location.pathname).toBe("/workspace/two-sum"));
  });
});
