import { useState } from 'react';
import type { DragEvent } from 'react';
import { Button, Card } from '../../ui';
import type { TriviaTile } from '../../types/trivia';
import { TILE_MIME } from './CodePuzzle';

export interface TileTrayProps {
  tiles: readonly TriviaTile[];
  /** Ids of tiles already sitting in a slot; they stay visible but spent. */
  usedTileIds?: readonly string[];
  selectedTileId?: string | null;
  /** Drag-start: this tile becomes the held selection, so a drop elsewhere
      (or a later click on a specific slot) still resolves it. */
  onSelect: (tileId: string) => void;
  /** Plain click: commit this tile straight to the lowest-numbered still-
      empty blank — no second click on a slot required. */
  onActivate: (tileId: string) => void;
  /** Locked once the round is graded. */
  disabled?: boolean;
}

/**
 * The shuffled candidate lines. A plain click is a commit, not a hold: it
 * fills the next empty blank immediately. Dragging remains the deliberate,
 * still-fully-supported way to place a tile into a specific (possibly
 * out-of-order) blank — a drag-start selects the tile the same way it
 * always has, so the drop has a held tileId to fall back on.
 */
export function TileTray({
  tiles,
  usedTileIds = [],
  selectedTileId = null,
  onSelect,
  onActivate,
  disabled = false,
}: TileTrayProps) {
  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const used = new Set(usedTileIds);
  const remaining = tiles.filter((tile) => !used.has(tile.id)).length;

  const handleDragStart = (tileId: string) => (event: DragEvent<HTMLButtonElement>): void => {
    const transfer = event.dataTransfer;
    if (transfer) {
      transfer.setData(TILE_MIME, tileId);
      transfer.effectAllowed = 'move';
    }
    setDraggingTileId(tileId);
    // Selecting on drag-start is what lets the drop and a later slot click
    // share one path; the guard keeps a drag from toggling a tile that is
    // already held off again.
    if (tileId !== selectedTileId) onSelect(tileId);
  };

  const handleDragEnd = (): void => setDraggingTileId(null);

  return (
    <Card
      title="Tiles"
      padding="sm"
      actions={
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {remaining} left
        </span>
      }
      style={{ borderColor: 'var(--border-default)', minWidth: 0 }}
    >
      <p
        style={{
          marginBottom: 'var(--space-2)',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.5,
          color: 'var(--text-muted)',
        }}
      >
        Click a tile to fill the next empty line — or drag it to a specific one.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {tiles.map((tile) => {
          const isUsed = used.has(tile.id);
          const isSelected = tile.id === selectedTileId && !isUsed;
          return (
            <Button
              key={tile.id}
              size="sm"
              data-state={isUsed ? 'used' : isSelected ? 'selected' : 'available'}
              selected={isSelected}
              /* Explicit both ways: assistive tech should hear "not pressed" on the
                 tiles that are merely available. */
              aria-pressed={isSelected}
              aria-label={`Tile ${tile.text}${isUsed ? ' (placed)' : ''}`}
              disabled={isUsed || disabled}
              draggable={!isUsed && !disabled}
              onClick={() => onActivate(tile.id)}
              onDragStart={handleDragStart(tile.id)}
              onDragEnd={handleDragEnd}
              style={{
                justifyContent: 'flex-start',
                fontFamily: 'var(--font-code)',
                fontSize: 'var(--text-sm)',
                fontWeight: 400,
                cursor: isUsed ? 'not-allowed' : 'grab',
                /* A spent tile is struck through rather than removed, so the tray
                   keeps its shape and you can see what you have already committed. */
                textDecoration: isUsed ? 'line-through' : 'none',
                opacity: tile.id === draggingTileId ? 0.5 : undefined,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tile.text}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
