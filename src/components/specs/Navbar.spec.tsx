import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppView, PanelKey, PanelVisibility } from '../../types/dsa';
import {
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WORKSPACE_LAYOUT_VERSION,
} from '../../app/workspaceLayout';
import { Navbar, NavbarProps } from '../Navbar';

const ALL_VISIBLE: PanelVisibility = {
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
};

/* Every toggle is looked up by its exact accessible name: the brand button
   ("DSA Visualizer home") and the Workspace segment would otherwise match. */
const PANEL_LABELS: Record<PanelKey, string> = {
  visualizer: 'Visualizer',
  code: 'Code',
  tutorial: 'Tutorial',
  auxiliary: 'Aux data',
};

/* R5.1: the shell is achromatic and the accent marks selection, never decoration,
   so nothing in the navbar paints its text with the accent token. */
const accentTintedText = (root: ParentNode): Element[] =>
  Array.from(root.querySelectorAll('[style]')).filter((el) =>
    /(?:^|;\s*)color:\s*var\(--accent/.test(el.getAttribute('style') ?? ''),
  );

describe('Navbar Component Spec', () => {
  const makeProps = (overrides: Partial<NavbarProps> = {}): NavbarProps => ({
    appView: 'workspace' as const,
    onSetAppView: vi.fn(),
    activeAlgorithmId: 'bubble-sort',
    onGlobalSelectAlgorithm: vi.fn(),
    panels: ALL_VISIBLE,
    onTogglePanel: vi.fn(),
    ...overrides,
  });

  it('renders brand, app-view segmented switcher, five toggles, and search trigger', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.getByText('DSA')).toBeInTheDocument();
    expect(screen.getByText('.Visualizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knowledge Tree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Problem List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trivia' })).toBeInTheDocument();

    for (const label of Object.values(PANEL_LABELS)) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Search algorithms/i })).toBeInTheDocument();
  });

  it('renders the wordmark as a neutral ghost button with library icon sizing', () => {
    const { container } = render(<Navbar {...makeProps()} />);

    const brand = screen.getByRole('button', { name: 'DSA Visualizer home' });
    expect(brand).toHaveClass('ui-btn', 'ui-btn--ghost', 'ui-btn--sm');
    // Icon sizing comes from ui.css, never an inline px value.
    expect(brand.querySelector('svg')?.getAttribute('style')).toBeNull();
    expect(screen.getByText('.Visualizer').getAttribute('style')).toContain(
      'var(--text-secondary)',
    );

    expect(accentTintedText(container)).toEqual([]);
  });

  it('no longer renders the removed Split/Visual/Code view-mode segmented', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole('button', { name: 'Split' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Visual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /View mode/i })).not.toBeInTheDocument();
  });

  it('renders the five toggles as one uniform sm row with aria-pressed on each', () => {
    render(
      <Navbar
        {...makeProps({
          panels: { visualizer: true, code: false, tutorial: true, auxiliary: false },
        })}
      />,
    );

    const expected: [string, string][] = [
      ['Visualizer', 'true'],
      ['Code', 'false'],
      ['Tutorial', 'true'],
      ['Aux data', 'false'],
    ];

    for (const [label, pressed] of expected) {
      const toggle = screen.getByRole('button', { name: label });
      expect(toggle).toHaveAttribute('aria-pressed', pressed);
      expect(toggle).toHaveClass('ui-btn', 'ui-btn--sm');
      expect(toggle.classList.contains('ui-btn--selected')).toBe(pressed === 'true');
    }
  });

  it('calls onTogglePanel with the matching key for each panel toggle', () => {
    const onTogglePanel = vi.fn();
    render(<Navbar {...makeProps({ onTogglePanel })} />);

    for (const [key, label] of Object.entries(PANEL_LABELS)) {
      onTogglePanel.mockClear();
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(onTogglePanel).toHaveBeenCalledTimes(1);
      expect(onTogglePanel).toHaveBeenCalledWith(key);
    }
  });


  it('shows panel toggles only in workspace view', () => {
    const { rerender } = render(<Navbar {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Visualizer' })).toBeInTheDocument();

    for (const appView of ['tree', 'list', 'trivia'] as const) {
      rerender(<Navbar {...makeProps({ appView })} />);
      for (const label of Object.values(PANEL_LABELS)) {
        expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
      }
    }
  });

  it('calls onSetAppView when clicking a non-selected app-view segment', () => {
    const onSetAppView = vi.fn();
    render(<Navbar {...makeProps({ onSetAppView })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Knowledge Tree' }));
    expect(onSetAppView).toHaveBeenCalledWith('tree');
  });

  /* R8.4: trivia is a fourth mutually exclusive app view, so it belongs in the
     same Segmented as the other three — not in the toggle row. */
  describe('trivia app view', () => {
    const APP_VIEW_LABELS: Record<AppView, string> = {
      tree: 'Knowledge Tree',
      list: 'Problem List',
      workspace: 'Workspace',
      trivia: 'Trivia',
    };

    it('renders Trivia as the fourth segment of the app-view group', () => {
      render(<Navbar {...makeProps()} />);

      const group = screen.getByRole('group', { name: 'App view' });
      const labels = Array.from(group.querySelectorAll('button')).map((btn) => btn.textContent);
      expect(labels).toEqual([
        'Knowledge Tree',
        'Problem List',
        'Workspace',
        'Trivia',
      ]);
    });

    it('switches the app view when the Trivia segment is clicked', () => {
      const onSetAppView = vi.fn();
      render(<Navbar {...makeProps({ onSetAppView })} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trivia' }));
      expect(onSetAppView).toHaveBeenCalledTimes(1);
      expect(onSetAppView).toHaveBeenCalledWith('trivia');
    });

    it('marks exactly the active segment as pressed for every app view', () => {
      const { rerender } = render(<Navbar {...makeProps()} />);

      for (const [appView, activeLabel] of Object.entries(APP_VIEW_LABELS)) {
        rerender(<Navbar {...makeProps({ appView: appView as AppView })} />);
        for (const label of Object.values(APP_VIEW_LABELS)) {
          expect(screen.getByRole('button', { name: label })).toHaveAttribute(
            'aria-pressed',
            String(label === activeLabel),
          );
        }
      }
    });

    it('does not re-fire onSetAppView when the active Trivia segment is clicked', () => {
      const onSetAppView = vi.fn();
      render(<Navbar {...makeProps({ appView: 'trivia', onSetAppView })} />);

      fireEvent.click(screen.getByRole('button', { name: 'Trivia' }));
      expect(onSetAppView).not.toHaveBeenCalled();
    });

    it('hides the workspace-only reset action in trivia view but keeps search', () => {
      render(<Navbar {...makeProps({ appView: 'trivia' })} />);

      expect(screen.queryByRole('button', { name: 'Reset layout' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Search algorithms/i })).toBeInTheDocument();
    });

    it('still opens the search drawer on "/" from trivia view', () => {
      render(<Navbar {...makeProps({ appView: 'trivia' })} />);

      fireEvent.keyDown(window, { key: '/' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens the QuickAccessDrawer when clicking the search trigger', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Search algorithms/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens the drawer on global "/" keypress', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ignores "/" typed inside an input field', () => {
    render(
      <>
        <Navbar {...makeProps()} />
        <input aria-label="Unrelated text field" />
      </>,
    );

    const field = screen.getByRole('textbox', { name: /Unrelated text field/i });
    field.focus();
    fireEvent.keyDown(field, { key: '/' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render old standalone category and algorithm select dropdowns', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.queryByText(/^Category:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Algorithm:$/i)).not.toBeInTheDocument();
  });

  /* R6.5: the reset moved out of ProblemHeader because it governs the whole
     workspace, and destroying persisted geometry always goes through a dialog. */
  describe('layout reset', () => {
    /* Built from the exported version so the fixture cannot silently become a
       stale-version blob the reader would discard anyway. */
    const STORED_LAYOUT = JSON.stringify({
      version: WORKSPACE_LAYOUT_VERSION,
      splitPercent: 55,
      panelHeights: { visualizer: 400, code: null, complexity: null },
    });

    let resetEvents: number;
    const countReset = () => {
      resetEvents += 1;
    };

    beforeEach(() => {
      resetEvents = 0;
      window.localStorage.clear();
      window.localStorage.setItem(WORKSPACE_LAYOUT_KEY, STORED_LAYOUT);
      window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, countReset);
    });

    afterEach(() => {
      window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, countReset);
      window.localStorage.clear();
    });

    const resetTrigger = () => screen.getByRole('button', { name: 'Reset layout' });

    it('renders as a workspace-only sm control that matches the toggles but is not one', () => {
      const { rerender } = render(<Navbar {...makeProps()} />);

      const trigger = resetTrigger();
      expect(trigger).toHaveClass('ui-btn', 'ui-btn--sm');
      // An action, not a toggle: no pressed state to report.
      expect(trigger).not.toHaveAttribute('aria-pressed');
      expect(trigger).toHaveAttribute('title');

      for (const appView of ['tree', 'list'] as const) {
        rerender(<Navbar {...makeProps({ appView })} />);
        expect(screen.queryByRole('button', { name: 'Reset layout' })).not.toBeInTheDocument();
      }
    });

    it('opens a destructive confirm dialog and changes nothing yet', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(/Reset workspace layout\?/i);
      expect(dialog).toHaveTextContent(/details panel is expanded/i);
      expect(screen.getByRole('button', { name: 'Reset to defaults' })).toHaveClass(
        'ui-btn--danger',
      );
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it('keeps the stored layout when cancelled', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.click(screen.getByRole('button', { name: 'Keep my layout' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it('keeps the stored layout when dismissed with Escape', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBe(STORED_LAYOUT);
      expect(resetEvents).toBe(0);
    });

    it('clears storage and announces the reset once confirmed', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));

      expect(window.localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
      expect(resetEvents).toBe(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not hijack "/" into the search drawer while the dialog is open', () => {
      render(<Navbar {...makeProps()} />);

      fireEvent.click(resetTrigger());
      fireEvent.keyDown(window, { key: '/' });

      // Still exactly one dialog — the confirm, not the drawer stacked over it.
      expect(screen.getByRole('dialog')).toHaveTextContent(/Reset workspace layout\?/i);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });
  });
});
