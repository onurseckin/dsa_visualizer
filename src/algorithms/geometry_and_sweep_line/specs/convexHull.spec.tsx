import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GraphVisualizer from '../../../components/primitives/GraphVisualizer';
import {
  generateConvexHullSteps,
  DEFAULT_CONVEX_HULL_INPUT,
} from '../convexHull';
import type { GraphVisualSnapshot } from '../../../types/dsa';

describe('convexHull React component spec', () => {
  it('renders GraphVisualizer with generated convex hull graph snapshot', () => {
    const steps = generateConvexHullSteps(DEFAULT_CONVEX_HULL_INPUT);
    const snapshot = steps[0].primarySnapshot as GraphVisualSnapshot;

    render(
      <GraphVisualizer
        nodes={snapshot.nodes}
        edges={snapshot.edges}
        title="Convex Hull Visualization"
      />
    );

    expect(screen.getByText('Convex Hull Visualization')).toBeInTheDocument();
  });

  it('renders completed hull polygon with edges without crash', () => {
    const steps = generateConvexHullSteps(DEFAULT_CONVEX_HULL_INPUT);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot as GraphVisualSnapshot;

    const { container } = render(
      <GraphVisualizer nodes={snapshot.nodes} edges={snapshot.edges} />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
