import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ArrayVisualizer from '../../../components/primitives/ArrayVisualizer';
import { generateNimGameSteps, DEFAULT_NIM_INPUT } from '../nimGame';
import type { ArrayVisualSnapshot } from '../../../types/dsa';

describe('nimGame React component spec', () => {
  it('renders ArrayVisualizer with nim game snapshot', () => {
    const steps = generateNimGameSteps(DEFAULT_NIM_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(
      <ArrayVisualizer
        elements={snapshot.elements}
        title="Nim Game Sprague-Grundy"
      />
    );

    expect(screen.getByText('Nim Game Sprague-Grundy')).toBeInTheDocument();
  });
});
