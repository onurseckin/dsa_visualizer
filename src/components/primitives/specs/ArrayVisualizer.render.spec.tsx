import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ArrayVisualizer from '../ArrayVisualizer';
import type { ArrayElement } from '../../../types/dsa';

describe('ArrayVisualizer', () => {
  const sampleElements: ArrayElement[] = [
    { id: '1', value: 15, state: 'default', pointers: ['i', 'left'] },
    { id: '2', value: 42, state: 'active', pointers: ['j'] },
    { id: '3', value: 8, state: 'sorted' },
  ];

  it('renders elements in bar mode with title and pointers', () => {
    render(<ArrayVisualizer elements={sampleElements} title="Sample Array" mode="bar" />);

    expect(screen.getByText('Sample Array')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('[0]')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();
    expect(screen.getByText('i')).toBeInTheDocument();
    expect(screen.getByText('left')).toBeInTheDocument();
    expect(screen.getByText('j')).toBeInTheDocument();
  });

  it('renders elements in box mode', () => {
    render(<ArrayVisualizer elements={sampleElements} mode="box" />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
