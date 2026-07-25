import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';

/* Real router + real generated route tree: these specs exercise the actual
   navigation wiring (search params, redirects, history) end to end in jsdom. */
function buildRouter(initialEntries: string[]) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
  });
}

describe('App routing spec', () => {
  beforeAll(() => {
    // jsdom does not implement scrolling; the router scrolls to top on navigation.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Settings persist under the dsa_visualizer_ prefix; isolate each test.
    window.localStorage.clear();
  });

  it('renders the knowledge tree view at "/"', async () => {
    const router = buildRouter(['/']);
    render(<RouterProvider router={router} />);

    expect(await screen.findByText(/Topic prerequisite roadmap/i)).toBeInTheDocument();
    expect(screen.getByText(/All Categorized Topic Modules/i)).toBeInTheDocument();
  });

  it('clicking a tree category node lands on /problems pre-filtered to that category', async () => {
    const router = buildRouter(['/']);
    render(<RouterProvider router={router} />);

    // Both the SVG roadmap node and the grid card carry this accessible name.
    const nodes = await screen.findAllByRole('button', { name: /1\. Arrays & Hashing/i });
    fireEvent.click(nodes[0]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/problems');
    });
    expect(router.state.location.search).toEqual({ category: 'arrays_and_hashing' });

    const chip = await screen.findByRole('button', { name: 'Arrays & Hashing' });
    expect(chip).toHaveClass('ui-btn--selected');
    expect(await screen.findByText('Bubble Sort')).toBeInTheDocument();
    expect(screen.queryByText('N-Queens Backtracking')).not.toBeInTheDocument();
  });

  it('changing the category filter on /problems writes the new category to the URL', async () => {
    const router = buildRouter(['/problems']);
    render(<RouterProvider router={router} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Backtracking' }));

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ category: 'backtracking' });
    });
    expect(await screen.findByText('N-Queens Backtracking')).toBeInTheDocument();
    expect(screen.queryByText('Bubble Sort')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All categories' }));
    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
    });
  });

  it('renders the Two Sum workspace at /workspace/two-sum', async () => {
    const router = buildRouter(['/workspace/two-sum']);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/workspace/two-sum');
  });

  it('redirects an unknown workspace id to bubble-sort', async () => {
    const router = buildRouter(['/workspace/nope']);
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/workspace/bubble-sort');
    });
    expect(await screen.findByRole('heading', { name: 'Bubble Sort' })).toBeInTheDocument();
  });

  it('returns from /problems to "/" via history.back()', async () => {
    const router = buildRouter(['/']);
    render(<RouterProvider router={router} />);

    const nodes = await screen.findAllByRole('button', { name: /2\. Two Pointers/i });
    fireEvent.click(nodes[0]);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/problems');
    });

    act(() => {
      router.history.back();
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
    expect(await screen.findByText(/Topic prerequisite roadmap/i)).toBeInTheDocument();
  });
});
