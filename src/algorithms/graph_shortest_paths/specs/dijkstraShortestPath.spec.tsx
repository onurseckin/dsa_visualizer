import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from '../../../components/MainLayout';
import { dijkstraShortestPath } from '../dijkstraShortestPath';

describe('dijkstraShortestPath React component spec', () => {
  it('renders algorithm title and layout properly', () => {
    const steps = dijkstraShortestPath.generateSteps(dijkstraShortestPath.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={dijkstraShortestPath}
        currentStep={steps[0]}
        viewMode="split"
        showTutorial={true}
        showAuxiliary={true}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByText("Dijkstra's Shortest Path Algorithm")).toBeInTheDocument();
  });
});
