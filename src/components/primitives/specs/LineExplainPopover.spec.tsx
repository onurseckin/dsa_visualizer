import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CodeExplainToggle,
  LineExplainPopover,
  useHoveredCodeLine,
} from '../LineExplainPopover';

const ZERO_RECT: DOMRect = {
  x: 0,
  y: 0,
  top: 100,
  left: 200,
  right: 260,
  bottom: 120,
  width: 60,
  height: 20,
  toJSON: () => ({}),
};

describe('CodeExplainToggle Component Spec', () => {
  it('renders as pressed when enabled and unpressed when disabled', () => {
    const { rerender } = render(<CodeExplainToggle enabled onToggle={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Toggle line explanations' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    rerender(<CodeExplainToggle enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Toggle line explanations' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('calls onToggle on click without managing its own on/off state', () => {
    const onToggle = vi.fn();
    render(<CodeExplainToggle enabled onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle line explanations' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('LineExplainPopover Component Spec', () => {
  it('renders the explanation with a line-number header and a side-appropriate connector', () => {
    render(
      <LineExplainPopover line={7} explanation="Builds the frequency map." anchorRect={ZERO_RECT} side="left" />,
    );

    const popover = screen.getByTestId('line-explain-popover-7');
    expect(popover).toHaveAttribute('data-side', 'left');
    expect(popover).toHaveTextContent('Line 7');
    expect(popover).toHaveTextContent('Builds the frequency map.');
    expect(popover).toHaveAttribute('role', 'tooltip');

    const connector = screen.getByTestId('line-explain-connector-7');
    // Left-side popover: tip points right, toward the code — a colored
    // left border with no right border creates that rightward triangle.
    expect(connector.style.borderLeft).not.toBe('');
    expect(connector.style.borderRight).toBe('');
  });

  it('flips the connector to point the other way for a right-side placement', () => {
    render(
      <LineExplainPopover line={3} explanation="Reveals the answer." anchorRect={ZERO_RECT} side="right" />,
    );

    const popover = screen.getByTestId('line-explain-popover-3');
    expect(popover).toHaveAttribute('data-side', 'right');

    const connector = screen.getByTestId('line-explain-connector-3');
    expect(connector.style.borderRight).not.toBe('');
    expect(connector.style.borderLeft).toBe('');
  });

  it('positions itself with fixed positioning derived from the anchor rect, never inline in the code flow', () => {
    render(
      <LineExplainPopover line={7} explanation="Builds the frequency map." anchorRect={ZERO_RECT} side="left" />,
    );

    const popover = screen.getByTestId('line-explain-popover-7');
    expect(popover.style.position).toBe('fixed');
    // Rendered through a portal straight onto <body>, not nested under
    // whatever scrolling well happened to render it — this is what lets it
    // escape the code well's `overflow: auto` clipping.
    expect(popover.parentElement).toBe(document.body);
  });
});

function HoverHarness(): React.ReactElement {
  const [enabled, setEnabled] = useState(true);
  const { hovered, rowHoverHandlers } = useHoveredCodeLine(enabled);

  return (
    <div>
      <button onClick={() => setEnabled((current) => !current)}>toggle</button>
      <div data-testid="row-1" {...rowHoverHandlers(1)} />
      <div data-testid="row-2" {...rowHoverHandlers(2)} />
      <div data-testid="hovered">{hovered ? `line-${hovered.line}` : 'none'}</div>
    </div>
  );
}

describe('useHoveredCodeLine hook Spec', () => {
  it('tracks the hovered row and clears it again on mouse leave', () => {
    render(<HoverHarness />);

    fireEvent.mouseEnter(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('line-1');

    fireEvent.mouseLeave(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('none');
  });

  it('always replaces the hovered line rather than stacking, even without an intervening leave', () => {
    render(<HoverHarness />);

    fireEvent.mouseEnter(screen.getByTestId('row-1'));
    fireEvent.mouseEnter(screen.getByTestId('row-2'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('line-2');

    // A stale leave for the row that's no longer hovered must not clobber
    // the newer hover.
    fireEvent.mouseLeave(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('line-2');
  });

  it('ignores hover while disabled, and clears any open hover the instant it becomes disabled', () => {
    render(<HoverHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    fireEvent.mouseEnter(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    fireEvent.mouseEnter(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('line-1');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('hovered')).toHaveTextContent('none');
  });

  it('tears the hover down on scroll instead of repositioning it', () => {
    render(<HoverHarness />);

    fireEvent.mouseEnter(screen.getByTestId('row-1'));
    expect(screen.getByTestId('hovered')).toHaveTextContent('line-1');

    fireEvent.scroll(window);
    expect(screen.getByTestId('hovered')).toHaveTextContent('none');
  });
});
