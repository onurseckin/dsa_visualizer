import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_TOPO_SORT_INPUT,
  generateTopologicalSortSteps,
  topologicalSort,
} from '../topologicalSort';

describe('topologicalSort React component spec', () => {
  it('renders algorithm title and description header in MainLayout', () => {
    const steps = generateTopologicalSortSteps(DEFAULT_TOPO_SORT_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={topologicalSort}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText("Topological Sort (Kahn's Algorithm)")).toBeInTheDocument();
  });
});
