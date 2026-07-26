import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GraphVisualizer from '../GraphVisualizer';
import type { GraphEdgeItem, GraphNodeItem } from '../../../types/dsa';

describe('GraphVisualizer', () => {
  const nodes: GraphNodeItem[] = [
    { id: 'A', label: 'Node A', state: 'active', group: 0 },
    { id: 'B', label: 'Node B', state: 'default', group: 0 },
    { id: 'C', label: 'Node C', state: 'visited', group: 1 },
  ];

  const edges: GraphEdgeItem[] = [
    { from: 'A', to: 'B', weight: 5, isTraversed: true },
    { from: 'B', to: 'C', weight: 10, isPath: true },
  ];

  it('renders graph nodes, edges, weights, title, and legend', () => {
    render(<GraphVisualizer nodes={nodes} edges={edges} isDirected={true} title="Graph Sample" />);

    expect(screen.getByText('Graph Sample')).toBeInTheDocument();
    expect(screen.getByText('Node A')).toBeInTheDocument();
    expect(screen.getByText('Node B')).toBeInTheDocument();
    expect(screen.getByText('Node C')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('Traversed')).toBeInTheDocument();
    expect(screen.getByText('Final path')).toBeInTheDocument();
  });
});
