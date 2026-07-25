import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Navbar } from '../Navbar';

describe('Navbar Component Spec', () => {
  const defaultProps = {
    appView: 'workspace' as const,
    onSetAppView: vi.fn(),
    activeCategory: 'arrays_and_hashing' as const,
    activeAlgorithmId: 'bubble-sort',
    onGlobalSelectAlgorithm: vi.fn(),
    viewMode: 'split' as const,
    onSetViewMode: vi.fn(),
    showTutorial: true,
    onToggleTutorial: vi.fn(),
    showAuxiliary: true,
    onToggleAuxiliary: vi.fn(),
    soundEnabled: true,
    onToggleSound: vi.fn(),
  };

  it('renders brand, app-view segmented switcher, toggles, and search trigger', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.getByText('DSA')).toBeInTheDocument();
    expect(screen.getByText('.Visualizer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Knowledge Tree/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Problem List/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Workspace$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tutorial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Aux Data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mute sound/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search algorithms/i })).toBeInTheDocument();
  });

  it('calls onSetAppView when clicking a non-selected app-view segment', () => {
    const handleSetAppView = vi.fn();
    render(<Navbar {...defaultProps} onSetAppView={handleSetAppView} />);

    fireEvent.click(screen.getByRole('button', { name: /Knowledge Tree/i }));
    expect(handleSetAppView).toHaveBeenCalledWith('tree');
  });

  it('shows the view-mode segmented only in workspace view and calls onSetViewMode', () => {
    const handleSetViewMode = vi.fn();
    const { rerender } = render(<Navbar {...defaultProps} onSetViewMode={handleSetViewMode} />);

    fireEvent.click(screen.getByRole('button', { name: /Visual$/i }));
    expect(handleSetViewMode).toHaveBeenCalledWith('visual');

    rerender(<Navbar {...defaultProps} appView="tree" onSetViewMode={handleSetViewMode} />);
    expect(screen.queryByRole('button', { name: /^Split$/i })).not.toBeInTheDocument();
  });

  it('fires toggle handlers for tutorial, aux data, and sound controls', () => {
    render(<Navbar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Tutorial/i }));
    expect(defaultProps.onToggleTutorial).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Aux Data/i }));
    expect(defaultProps.onToggleAuxiliary).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Mute sound/i }));
    expect(defaultProps.onToggleSound).toHaveBeenCalled();
  });

  it('opens the QuickAccessDrawer when clicking the search trigger', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Search algorithms/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens the drawer on global "/" keypress', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ignores "/" typed inside an input field', () => {
    render(
      <>
        <Navbar {...defaultProps} />
        <input aria-label="Unrelated text field" />
      </>,
    );

    const field = screen.getByRole('textbox', { name: /Unrelated text field/i });
    field.focus();
    fireEvent.keyDown(field, { key: '/' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render old standalone category and algorithm select dropdowns', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.queryByText(/^Category:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Algorithm:$/i)).not.toBeInTheDocument();
  });
});
