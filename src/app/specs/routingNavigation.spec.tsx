import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";

function buildRouter(initialEntries: string[]): ReturnType<typeof createRouter> {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
}

describe("App routing spec", () => {
  beforeAll(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the knowledge tree view at "/"', async () => {
    const router = buildRouter(["/"]);
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("region", {
        name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i,
      }),
    ).toBeInTheDocument();
  });

  it("clicking a tree category node lands on /problems pre-filtered to that category", async () => {
    const router = buildRouter(["/"]);
    render(<RouterProvider router={router} />);

    const nodes = await screen.findAllByRole("button", { name: /1\. Arrays & Hashing/i });
    fireEvent.click(nodes[0]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/problems");
    });
    expect(router.state.location.search).toEqual({ category: "arrays_and_hashing" });

    const select = (await screen.findByRole("combobox", {
      name: "Filter by Category",
    })) as HTMLSelectElement;
    expect(select.value).toBe("arrays_and_hashing");
    expect(await screen.findByText("Bubble Sort")).toBeInTheDocument();
    expect(screen.queryByText("N-Queens Backtracking")).not.toBeInTheDocument();
  });

  it("changing the category filter on /problems writes the new category to the URL", async () => {
    const router = buildRouter(["/problems"]);
    render(<RouterProvider router={router} />);

    const select = (await screen.findByRole("combobox", {
      name: "Filter by Category",
    })) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "backtracking" } });

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ category: "backtracking" });
    });
    expect(await screen.findByText("N-Queens Backtracking")).toBeInTheDocument();
    expect(screen.queryByText("Bubble Sort")).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: "All" } });
    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
    });
  });

  it("renders the Two Sum workspace at /workspace/two-sum", async () => {
    const router = buildRouter(["/workspace/two-sum"]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Two Sum" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/workspace/two-sum");
  });

  it("redirects an unknown workspace id to bubble-sort", async () => {
    const router = buildRouter(["/workspace/nope"]);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/workspace/bubble-sort");
    });
    expect(await screen.findByRole("heading", { name: "Bubble Sort" })).toBeInTheDocument();
  });

  it("hides the workspace panel toggles outside the workspace route", async () => {
    const router = buildRouter(["/problems"]);
    render(<RouterProvider router={router} />);

    await screen.findByRole("combobox", { name: "Filter by Category" });
    const navbar = within(screen.getByRole("banner"));
    for (const label of ["Visualizer", "Code", "Tutorial", "Aux data", "Reset layout"]) {
      expect(navbar.queryByRole("button", { name: label })).not.toBeInTheDocument();
    }
    expect(navbar.getByRole("button", { name: "Problem List" })).toBeInTheDocument();
    expect(navbar.getByRole("button", { name: "Search algorithms" })).toBeInTheDocument();
  });

  it('returns from /problems to "/" via history.back()', async () => {
    const router = buildRouter(["/"]);
    render(<RouterProvider router={router} />);

    const nodes = await screen.findAllByRole("button", { name: /2\. Two Pointers/i });
    fireEvent.click(nodes[0]);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/problems");
    });

    act(() => {
      router.history.back();
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(
      await screen.findByRole("region", {
        name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i,
      }),
    ).toBeInTheDocument();
  });
});

describe("Workspace layout reset spec", () => {
  beforeAll(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers the reset in the navbar on the workspace route only", async () => {
    const router = buildRouter(["/workspace/bubble-sort"]);
    render(<RouterProvider router={router} />);
    await screen.findByRole("heading", { name: "Bubble Sort" });

    const navbar = () => within(screen.getByRole("banner"));
    expect(navbar().getByRole("button", { name: "Reset layout" })).toBeInTheDocument();

    act(() => {
      router.navigate({ to: "/problems", search: {} });
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/problems");
    });
    await waitFor(() => {
      expect(navbar().queryByRole("button", { name: "Reset layout" })).not.toBeInTheDocument();
    });
  });
});
