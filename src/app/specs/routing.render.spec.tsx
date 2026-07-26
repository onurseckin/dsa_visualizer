import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';
import { Navbar } from '../../components/Navbar';
import { SettingsProvider, useSettings } from '../SettingsContext';

/* Real router + real generated route tree: these specs exercise the actual
   navigation wiring (search params, redirects, history) end to end in jsdom. */
function buildRouter(initialEntries: string[]): ReturnType<typeof createRouter> {
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

    expect(
      await screen.findByRole('region', {
        name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i,
      })
    ).toBeInTheDocument();
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

    const select = (await screen.findByRole('combobox', { name: 'Filter by Category' })) as HTMLSelectElement;
    expect(select.value).toBe('arrays_and_hashing');
    expect(await screen.findByText('Bubble Sort')).toBeInTheDocument();
    expect(screen.queryByText('N-Queens Backtracking')).not.toBeInTheDocument();
  });

  it('changing the category filter on /problems writes the new category to the URL', async () => {
    const router = buildRouter(['/problems']);
    render(<RouterProvider router={router} />);

    const select = (await screen.findByRole('combobox', { name: 'Filter by Category' })) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'backtracking' } });

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ category: 'backtracking' });
    });
    expect(await screen.findByText('N-Queens Backtracking')).toBeInTheDocument();
    expect(screen.queryByText('Bubble Sort')).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'All' } });
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

    await screen.findByRole('combobox', { name: 'Filter by Category' });
    const navbar = within(screen.getByRole('banner'));
    for (const label of ['Visualizer', 'Code', 'Tutorial', 'Aux data', 'Reset layout']) {
      expect(navbar.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
    /* The rest of the navbar is untouched, so the toggles are genuinely gated on
       the route rather than the whole header having failed to render. */
    expect(navbar.getByRole('button', { name: 'Problem List' })).toBeInTheDocument();
    expect(navbar.getByRole('button', { name: 'Search algorithms' })).toBeInTheDocument();
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
    expect(
      await screen.findByRole('region', {
        name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i,
      })
    ).toBeInTheDocument();
  });
});

/* R6.6: the shortcuts live in the workspace route because that is where the step
   engine lives, so they are only meaningful against the real route + engine +
   control panel. Everything here drives the real router. */
describe('Workspace keyboard playback spec', () => {
  const spareFields: HTMLElement[] = [];

  beforeAll(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    spareFields.splice(0).forEach((field) => field.remove());
  });

  const renderWorkspace = async () => {
    const router = buildRouter(['/workspace/bubble-sort']);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { name: 'Bubble Sort' })).toBeInTheDocument();
    return router;
  };

  /* The playback readout is the observable truth about the engine's index. */
  const readout = () => screen.getByLabelText(/^Step \d+ of \d+$/).getAttribute('aria-label');

  const pressKey = (key: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    act(() => {
      window.dispatchEvent(event);
    });
    return event;
  };

  /* Typing has to be simulated from a real focused field: the guard reads
     event.target, so dispatching on window would prove nothing. */
  const pressKeyInTextField = (key: string) => {
    const field = document.createElement('input');
    document.body.appendChild(field);
    spareFields.push(field);
    field.focus();
    act(() => {
      fireEvent.keyDown(field, { key });
    });
  };

  it('steps forward with ArrowRight and back with ArrowLeft', async () => {
    await renderWorkspace();
    expect(readout()).toMatch(/^Step 1 of/);

    pressKey('ArrowRight');
    expect(readout()).toMatch(/^Step 2 of/);

    pressKey('ArrowRight');
    expect(readout()).toMatch(/^Step 3 of/);

    pressKey('ArrowLeft');
    expect(readout()).toMatch(/^Step 2 of/);
  });

  it('does not step below the first step', async () => {
    await renderWorkspace();

    pressKey('ArrowLeft');
    expect(readout()).toMatch(/^Step 1 of/);
  });

  it('toggles play/pause on Space and preventDefaults so the page cannot scroll', async () => {
    await renderWorkspace();

    const play = pressKey(' ');
    expect(play.defaultPrevented).toBe(true);
    expect(await screen.findByRole('button', { name: 'Pause playback' })).toBeInTheDocument();

    const pause = pressKey(' ');
    expect(pause.defaultPrevented).toBe(true);
    expect(await screen.findByRole('button', { name: 'Play all steps' })).toBeInTheDocument();
  });

  it('takes the wheel from playback when an arrow key steps', async () => {
    await renderWorkspace();

    pressKey(' ');
    expect(await screen.findByRole('button', { name: 'Pause playback' })).toBeInTheDocument();

    pressKey('ArrowRight');

    /* Stepping stops the interval, otherwise the next tick would advance again on
       its own and ArrowLeft would read as a no-op. */
    expect(await screen.findByRole('button', { name: 'Play all steps' })).toBeInTheDocument();
    expect(readout()).toMatch(/^Step (?:2|3|4) of/);

    pressKey('ArrowLeft');
    expect(readout()).toMatch(/^Step (?:1|2|3) of/);
  });

  it('ignores every shortcut while the user is typing in a field', async () => {
    await renderWorkspace();
    const before = readout();

    pressKeyInTextField('ArrowRight');
    pressKeyInTextField('ArrowLeft');
    pressKeyInTextField(' ');

    expect(readout()).toBe(before);
    expect(screen.getByRole('button', { name: 'Play all steps' })).toBeInTheDocument();
  });

  it('ignores every shortcut while a modifier is held', async () => {
    await renderWorkspace();
    const before = readout();

    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey'] as const) {
      const event = pressKey('ArrowRight', { [modifier]: true });
      expect(event.defaultPrevented).toBe(false);
      pressKey(' ', { [modifier]: true });
    }

    expect(readout()).toBe(before);
    expect(screen.getByRole('button', { name: 'Play all steps' })).toBeInTheDocument();
  });

  it('yields Space to whatever button has focus', async () => {
    await renderWorkspace();

    const panelToggle = within(screen.getByRole('banner')).getByRole('button', {
      name: 'Tutorial',
    });
    panelToggle.focus();
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    act(() => {
      panelToggle.dispatchEvent(event);
    });

    // Untouched: the browser still activates the focused control.
    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByRole('button', { name: 'Play all steps' })).toBeInTheDocument();
  });

  it('keeps the "/" search shortcut working and stops stepping while the drawer is open', async () => {
    await renderWorkspace();
    const before = readout();

    fireEvent.keyDown(window, { key: '/' });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    pressKey('ArrowRight');
    expect(readout()).toBe(before);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    pressKey('ArrowRight');
    expect(readout()).not.toBe(before);
  });

  it('stops stepping while the navbar reset dialog is open', async () => {
    await renderWorkspace();
    const before = readout();

    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Reset layout' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    pressKey('ArrowRight');
    expect(readout()).toBe(before);
  });

  it('exposes the shortcuts on the playback controls themselves', async () => {
    await renderWorkspace();

    const expected: [string, string][] = [
      ['Step backward', 'ArrowLeft'],
      ['Play all steps', 'Space'],
      ['Step forward', 'ArrowRight'],
    ];

    for (const [name, keys] of expected) {
      const control = screen.getByRole('button', { name });
      expect(control).toHaveAttribute('aria-keyshortcuts', keys);
      expect(control.getAttribute('title')).toContain(keys === 'Space' ? 'Space' : 'arrow');
    }
  });
});

describe('Workspace layout reset spec', () => {
  beforeAll(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('offers the reset in the navbar on the workspace route only', async () => {
    const router = buildRouter(['/workspace/bubble-sort']);
    render(<RouterProvider router={router} />);
    await screen.findByRole('heading', { name: 'Bubble Sort' });

    const navbar = () => within(screen.getByRole('banner'));
    expect(navbar().getByRole('button', { name: 'Reset layout' })).toBeInTheDocument();

    act(() => {
      router.navigate({ to: '/problems', search: {} });
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/problems');
    });
    await waitFor(() => {
      expect(navbar().queryByRole('button', { name: 'Reset layout' })).not.toBeInTheDocument();
    });
  });
});

/* Panel visibility lives in SettingsContext and reaches the user through the
   navbar toggles, so these specs drive the real provider with the exact wiring
   __root uses — no router needed, and no dependency on workspace internals. */
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

  it('defaults every panel to on with nothing stored', () => {
    renderHarness();

    expect(pressed('Visualizer')).toBe('true');
    expect(pressed('Code')).toBe('true');
    expect(pressed('Tutorial')).toBe('true');
    expect(pressed('Aux data')).toBe('true');
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

  /* Each toggle owns exactly one panel (R4.4), so flipping one must not drag the
     others with it — the regression a shared "view mode" used to cause. */
  it('leaves the other three panels alone when one toggle flips', () => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Tutorial' }));

    expect(pressed('Tutorial')).toBe('false');
    expect(pressed('Visualizer')).toBe('true');
    expect(pressed('Code')).toBe('true');
    expect(pressed('Aux data')).toBe('true');
    expect(window.localStorage.getItem('dsa_visualizer_panel_visualizer')).toBeNull();
    expect(window.localStorage.getItem('dsa_visualizer_panel_code')).toBeNull();
    expect(window.localStorage.getItem('dsa_visualizer_panel_auxiliary')).toBeNull();
  });
});
