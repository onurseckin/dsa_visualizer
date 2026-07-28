import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";

const renderRootWithHistory = async (initialEntry: string) => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  const result = render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
  return { router, ...result };
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
    await renderRootWithHistory("/");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/problems" (list view)', async () => {
    await renderRootWithHistory("/problems");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/trivia" (trivia view)', async () => {
    await renderRootWithHistory("/trivia");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it('renders root layout on "/workspace/bubble-sort" (workspace view)', async () => {
    await renderRootWithHistory("/workspace/bubble-sort");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();
  });

  it("navigates when Navbar app view segmented control is clicked", async () => {
    const { router } = await renderRootWithHistory("/trivia");
    expect(await screen.findByRole("navigation")).toBeInTheDocument();

    const selectView = async (name: string, pathname: string) => {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name }));
        await router.load();
      });
      await waitFor(() => expect(router.state.location.pathname).toBe(pathname));
    };

    await selectView("Problem List", "/problems");
    await selectView("Knowledge Tree", "/");
    await selectView("Trivia", "/trivia");
    await selectView("Workspace", "/workspace/bubble-sort");
  });

  it("navigates when an algorithm is selected globally via search drawer", async () => {
    const { router } = await renderRootWithHistory("/trivia");
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
