import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import {
  DEFAULT_KRUSKAL_INPUT,
  generateKruskalSteps,
  kruskalMst,
} from '../kruskalMst';

describe('kruskalMst React component spec', () => {
  it('renders algorithm title and description header in MainLayout', () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={kruskalMst}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText("Kruskal's Minimum Spanning Tree")).toBeInTheDocument();
  });
});
