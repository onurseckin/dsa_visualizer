import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import { Navbar } from '../../components/Navbar';
import { SettingsProvider, useSettings } from '../SettingsContext';

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

  it('hides the workspace panel toggles outside the workspace route', async () => {
    const router = buildRouter(['/problems']);
    render(<RouterProvider router={router} />);

    await screen.findByRole('button', { name: 'All categories' });
    expect(screen.queryByRole('button', { name: 'Visualizer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aux data' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sound' })).toBeInTheDocument();
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

/* Panel visibility lives in SettingsContext and reaches the user through the
   navbar toggles, so these specs drive the real provider with the exact wiring
   __root uses — no router needed, and no dependency on workspace internals. */
function SettingsNavbarHarness() {
  const { panels, togglePanel, soundEnabled, setSoundEnabled } = useSettings();
  return (
    <Navbar
      appView="workspace"
      onSetAppView={() => {}}
      onGlobalSelectAlgorithm={() => {}}
      panels={panels}
      onTogglePanel={togglePanel}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(!soundEnabled)}
    />
  );
}

describe('Panel visibility settings spec', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderHarness = () =>
    render(
      <SettingsProvider>
        <SettingsNavbarHarness />
      </SettingsProvider>,
    );

  const pressed = (name: string) =>
    screen.getByRole('button', { name }).getAttribute('aria-pressed');

  it('defaults every panel and sound to on with nothing stored', () => {
    renderHarness();

    expect(pressed('Visualizer')).toBe('true');
    expect(pressed('Code')).toBe('true');
    expect(pressed('Tutorial')).toBe('true');
    expect(pressed('Aux data')).toBe('true');
    expect(pressed('Sound')).toBe('true');
  });

  it.each([
    ['split', 'true', 'true'],
    ['visual', 'true', 'false'],
    ['code', 'false', 'true'],
  ] as const)(
    'migrates a legacy view_mode of %s to independent panel booleans',
    (viewMode, visualizer, code) => {
      window.localStorage.setItem('dsa_visualizer_view_mode', JSON.stringify(viewMode));

      renderHarness();

      expect(pressed('Visualizer')).toBe(visualizer);
      expect(pressed('Code')).toBe(code);
      // Tutorial and auxiliary were already independent, so they keep their values.
      expect(pressed('Tutorial')).toBe('true');
      expect(pressed('Aux data')).toBe('true');
    },
  );

  it('keeps legacy show_tutorial/show_auxiliary values while migrating view_mode', () => {
    window.localStorage.setItem('dsa_visualizer_view_mode', JSON.stringify('code'));
    window.localStorage.setItem('dsa_visualizer_show_tutorial', 'false');
    window.localStorage.setItem('dsa_visualizer_show_auxiliary', 'false');

    renderHarness();

    expect(pressed('Visualizer')).toBe('false');
    expect(pressed('Code')).toBe('true');
    expect(pressed('Tutorial')).toBe('false');
    expect(pressed('Aux data')).toBe('false');
  });

  it('prefers a stored panel boolean over the legacy view_mode', () => {
    window.localStorage.setItem('dsa_visualizer_view_mode', JSON.stringify('code'));
    window.localStorage.setItem('dsa_visualizer_panel_visualizer', 'true');

    renderHarness();

    expect(pressed('Visualizer')).toBe('true');
    expect(pressed('Code')).toBe('true');
  });

  it('ignores garbage stored values instead of throwing', () => {
    window.localStorage.setItem('dsa_visualizer_panel_code', '{oops');
    window.localStorage.setItem('dsa_visualizer_panel_tutorial', '"yes"');
    window.localStorage.setItem('dsa_visualizer_view_mode', JSON.stringify('sideways'));

    renderHarness();

    expect(pressed('Code')).toBe('true');
    expect(pressed('Tutorial')).toBe('true');
    expect(pressed('Visualizer')).toBe('true');
  });

  it.each([
    ['Visualizer', 'dsa_visualizer_panel_visualizer'],
    ['Code', 'dsa_visualizer_panel_code'],
    ['Tutorial', 'dsa_visualizer_panel_tutorial'],
    ['Aux data', 'dsa_visualizer_panel_auxiliary'],
  ] as const)('toggling %s flips aria-pressed and persists the boolean', (label, storageKey) => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(pressed(label)).toBe('false');
    expect(window.localStorage.getItem(storageKey)).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(pressed(label)).toBe('true');
    expect(window.localStorage.getItem(storageKey)).toBe('true');
  });

  it('toggles sound independently of the panels', () => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Sound' }));

    expect(pressed('Sound')).toBe('false');
    expect(window.localStorage.getItem('dsa_visualizer_sound_enabled')).toBe('false');
    expect(pressed('Visualizer')).toBe('true');
    expect(pressed('Code')).toBe('true');
  });
});
