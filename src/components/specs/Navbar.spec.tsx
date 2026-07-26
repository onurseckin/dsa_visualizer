import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanelKey, PanelVisibility } from '../../types/dsa';
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
    soundEnabled: true,
    onToggleSound: vi.fn(),
    ...overrides,
  });

  it('renders brand, app-view segmented switcher, five toggles, and search trigger', () => {
    render(<Navbar {...makeProps()} />);

    expect(screen.getByText('DSA')).toBeInTheDocument();
    expect(screen.getByText('.Visualizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knowledge Tree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Problem List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Workspace' })).toBeInTheDocument();

    for (const label of [...Object.values(PANEL_LABELS), 'Sound']) {
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
          soundEnabled: false,
        })}
      />,
    );

    const expected: [string, string][] = [
      ['Visualizer', 'true'],
      ['Code', 'false'],
      ['Tutorial', 'true'],
      ['Aux data', 'false'],
      ['Sound', 'false'],
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

  it('calls onToggleSound from the sound toggle without touching panel state', () => {
    const onToggleSound = vi.fn();
    const onTogglePanel = vi.fn();
    render(<Navbar {...makeProps({ onToggleSound, onTogglePanel })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sound' }));

    expect(onToggleSound).toHaveBeenCalledTimes(1);
    expect(onTogglePanel).not.toHaveBeenCalled();
  });

  it('shows panel toggles only in workspace view while sound stays available', () => {
    const { rerender } = render(<Navbar {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Visualizer' })).toBeInTheDocument();

    for (const appView of ['tree', 'list'] as const) {
      rerender(<Navbar {...makeProps({ appView })} />);
      for (const label of Object.values(PANEL_LABELS)) {
        expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
      }
      expect(screen.getByRole('button', { name: 'Sound' })).toBeInTheDocument();
    }
  });

  it('calls onSetAppView when clicking a non-selected app-view segment', () => {
    const onSetAppView = vi.fn();
    render(<Navbar {...makeProps({ onSetAppView })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Knowledge Tree' }));
    expect(onSetAppView).toHaveBeenCalledWith('tree');
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
});
