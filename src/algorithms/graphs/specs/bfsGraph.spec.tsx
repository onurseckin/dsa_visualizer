import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GraphVisualizer from '../../../components/primitives/GraphVisualizer';
import { generateBFSGraphSteps, DEFAULT_BFS_INPUT } from '../bfsGraph';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('bfsGraph React component spec', () => {
  it('renders GraphVisualizer with generated graph snapshot', () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(
      <GraphVisualizer
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        title="BFS Graph Traversal"
      />
    );

    expect(screen.getByText('BFS Graph Traversal')).toBeInTheDocument();
  });
});
