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

  it('renders branding title, view switcher buttons, search bar, and control toggles', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.getByText('DSA')).toBeInTheDocument();
    expect(screen.getByText('.Visualizer')).toBeInTheDocument();
    expect(screen.getByText(/Knowledge Tree/i)).toBeInTheDocument();
    expect(screen.getByText(/Problem List/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualizer Workspace/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search problems.../i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Problems/i)).toBeInTheDocument();
  });

  it('toggles QuickAccessDrawer when clicking Quick Problems button', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const drawerBtn = screen.getByText(/Quick Problems/i);
    fireEvent.click(drawerBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search problems or categories.../i)).toBeInTheDocument();
  });

  it('does not render old standalone category and algorithm select dropdowns', () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.queryByText(/^Category:$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Algorithm:$/i)).not.toBeInTheDocument();
  });

  it('handles appView navigation button clicks', () => {
    const handleSetAppView = vi.fn();
    render(<Navbar {...defaultProps} onSetAppView={handleSetAppView} />);

    const treeBtn = screen.getByText(/Knowledge Tree/i);
    fireEvent.click(treeBtn);
    expect(handleSetAppView).toHaveBeenCalledWith('tree');
  });
});
