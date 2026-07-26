import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileTray } from '../TileTray';
import { TILE_MIME } from '../CodePuzzle';
import type { TriviaTile } from '../../../types/trivia';

const TILES: TriviaTile[] = [
  { id: 'answer-2', text: 'seen = {}', correctFor: 2 },
  { id: 'decoy-0', text: 'seen[n] = i', correctFor: null },
  { id: 'answer-5', text: 'return [seen[target - n], i]', correctFor: 5 },
];

const tile = (text: string): HTMLElement => screen.getByRole('button', { name: `Tile ${text}` });

const stubTransfer = () => ({ setData: vi.fn(), getData: vi.fn(() => ''), effectAllowed: 'none' });

describe('TileTray Component Spec', () => {
  it('renders every candidate as a monospace draggable tile and counts what is left', () => {
    render(<TileTray tiles={TILES} onSelect={vi.fn()} onActivate={vi.fn()} />);

    TILES.forEach((candidate) => {
      const button = tile(candidate.text);
      expect(button).toHaveTextContent(candidate.text);
      expect(button.style.fontFamily).toBe('var(--font-code)');
      expect(button).toHaveAttribute('draggable', 'true');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    expect(screen.getByText('3 left')).toBeInTheDocument();
    // The click route has to be discoverable, not just possible.
    expect(screen.getByText(/Click a tile to fill the next empty line/i)).toBeInTheDocument();
  });

  it('commits a tile to the caller on a plain click, via onActivate (not onSelect)', () => {
    const onActivate = vi.fn();
    const onSelect = vi.fn();
    render(<TileTray tiles={TILES} onSelect={onSelect} onActivate={onActivate} />);

    fireEvent.click(tile('seen = {}'));
    expect(onActivate).toHaveBeenCalledWith('answer-2');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('gives the held tile the standard selected treatment', () => {
    render(<TileTray tiles={TILES} selectedTileId="decoy-0" onSelect={vi.fn()} onActivate={vi.fn()} />);

    const held = tile('seen[n] = i');
    expect(held).toHaveClass('ui-btn--selected');
    expect(held).toHaveAttribute('aria-pressed', 'true');
    expect(held).toHaveAttribute('data-state', 'selected');
    expect(tile('seen = {}')).toHaveAttribute('data-state', 'available');
  });

  it('shows a placed tile as consumed instead of dropping it from the tray', () => {
    render(<TileTray tiles={TILES} usedTileIds={['answer-5']} onSelect={vi.fn()} onActivate={vi.fn()} />);

    const spent = screen.getByRole('button', {
      name: 'Tile return [seen[target - n], i] (placed)',
    });
    expect(spent).toBeDisabled();
    expect(spent).toHaveAttribute('data-state', 'used');
    expect(spent).toHaveAttribute('draggable', 'false');
    expect(spent.style.textDecoration).toBe('line-through');

    expect(screen.getByText('2 left')).toBeInTheDocument();
  });

  it('publishes the tile id on drag start and calls onSelect (not onActivate), so a drop elsewhere can still resolve it', () => {
    const onSelect = vi.fn();
    const onActivate = vi.fn();
    render(<TileTray tiles={TILES} onSelect={onSelect} onActivate={onActivate} />);

    const dataTransfer = stubTransfer();
    fireEvent.dragStart(tile('seen = {}'), { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith(TILE_MIME, 'answer-2');
    expect(onSelect).toHaveBeenCalledWith('answer-2');
    expect(onActivate).not.toHaveBeenCalled();

    fireEvent.dragEnd(tile('seen = {}'));
    expect(tile('seen = {}')).toBeInTheDocument();
  });

  it('does not toggle the held tile off when the same tile starts a drag', () => {
    const onSelect = vi.fn();
    render(<TileTray tiles={TILES} selectedTileId="answer-2" onSelect={onSelect} onActivate={vi.fn()} />);

    const dataTransfer = stubTransfer();
    fireEvent.dragStart(tile('seen = {}'), { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith(TILE_MIME, 'answer-2');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('locks the whole tray once the round is graded', () => {
    render(<TileTray tiles={TILES} disabled onSelect={vi.fn()} onActivate={vi.fn()} />);

    TILES.forEach((candidate) => {
      expect(tile(candidate.text)).toBeDisabled();
      expect(tile(candidate.text)).toHaveAttribute('draggable', 'false');
    });
  });
});
