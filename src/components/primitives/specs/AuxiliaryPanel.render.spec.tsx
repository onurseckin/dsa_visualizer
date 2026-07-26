import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuxiliaryPanel, { hasAuxiliaryContent } from '../AuxiliaryPanel';

describe('hasAuxiliaryContent', () => {
  it('returns false for empty state and variables', () => {
    expect(hasAuxiliaryContent(undefined, undefined)).toBe(false);
    expect(hasAuxiliaryContent({}, {})).toBe(false);
  });

  it('returns true when variables are present', () => {
    expect(hasAuxiliaryContent(undefined, { x: 10 })).toBe(true);
  });

  it('returns true when stack, queue, visited, hashMap, distanceTable or customState are present', () => {
    expect(hasAuxiliaryContent({ stack: [1] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ queue: ['a'] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ visited: ['n1'] }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ hashMap: { a: 1 } }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ distanceTable: { n1: 5, n2: Infinity } }, undefined)).toBe(true);
    expect(hasAuxiliaryContent({ customState: { mode: 'active' } }, undefined)).toBe(true);
  });
});

describe('AuxiliaryPanel', () => {
  it('returns null when no data groups present', () => {
    const { container } = render(<AuxiliaryPanel state={{}} variables={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all data groups and handles onClose', () => {
    const onClose = vi.fn();
    render(
      <AuxiliaryPanel
        state={{
          stack: [10, 20],
          queue: ['a', 'b'],
          visited: ['v1', 'v2'],
          hashMap: { key1: 'val1' },
          distanceTable: { n1: 0, n2: Infinity },
          customState: { step: 3 },
        }}
        variables={{ i: 0, found: true }}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Working Data & Variables')).toBeInTheDocument();
    expect(screen.getByText('Stack')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Visited (2)')).toBeInTheDocument();
    expect(screen.getByText('Hash map')).toBeInTheDocument();
    expect(screen.getByText('Distances')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Variables')).toBeInTheDocument();

    expect(screen.getByText('top')).toBeInTheDocument();
    expect(screen.getByText('front')).toBeInTheDocument();
    expect(screen.getByText('∞')).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: 'Hide auxiliary panel' });
    fireEvent.click(hideButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
