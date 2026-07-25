import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { fenwickTree, generateFenwickTreeSteps } from '../fenwickTree';

describe('fenwickTree React component spec', () => {
  it('renders algorithm title in MainLayout', () => {
    const steps = generateFenwickTreeSteps(fenwickTree.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={fenwickTree}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText('Binary Indexed Tree (Fenwick Tree)')).toBeInTheDocument();
  });
});
