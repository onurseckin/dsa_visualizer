import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TreeVisualizer from '../TreeVisualizer';
import type { TreeNodeItem } from '../../../types/dsa';

describe('TreeVisualizer', () => {
  it('returns null when nodes array is empty', () => {
    const { container } = render(<TreeVisualizer nodes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders tree nodes with automatic layout', () => {
    const sampleNodes: TreeNodeItem[] = [
      { id: '1', val: 50, leftId: '2', rightId: '3', state: 'active' },
      { id: '2', val: 25, state: 'visited' },
      { id: '3', val: 75, state: 'path' },
    ];

    render(
      <TreeVisualizer
        nodes={sampleNodes}
        rootId="1"
        title="Tree Sample"
        groups={{ '1': 0, '2': 0, '3': 1 }}
      />
    );

    expect(screen.getByText('Tree Sample')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
  });

  it('renders tree nodes with explicit coordinates', () => {
    const explicitNodes: TreeNodeItem[] = [
      { id: 'r', val: 100, x: 200, y: 50, leftId: 'l', state: 'default' },
      { id: 'l', val: 50, x: 100, y: 150, state: 'default' },
    ];

    render(<TreeVisualizer nodes={explicitNodes} rootId="r" />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
