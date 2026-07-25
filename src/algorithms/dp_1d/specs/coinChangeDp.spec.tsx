import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { coinChangeDp } from '../coinChangeDp';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('coinChangeDp React component spec', () => {
  it('renders ArrayVisualizer with generated snapshot steps', () => {
    const steps = coinChangeDp.generateSteps(coinChangeDp.defaultInput);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Coin Change Minimum Coins"
      />
    );

    expect(screen.getByText('Coin Change Minimum Coins')).toBeInTheDocument();
  });
});
