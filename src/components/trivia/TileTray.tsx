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
  /** Click or drag-start: both mean "this is the tile I am holding". */
  onSelect: (tileId: string) => void;
  /** Locked once the round is graded. */
  disabled?: boolean;
}

/**
 * The shuffled candidate lines. Dragging is the flourish, not the mechanism:
 * a drag-start selects the tile and the drop reuses the click placement path, so
 * the tray is fully usable by keyboard and mouse alone.
 */
export function TileTray({
  tiles,
  usedTileIds = [],
  selectedTileId = null,
  onSelect,
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
    // Selecting on drag-start is what lets the drop and the click share one path;
    // the guard keeps a drag from toggling a tile that is already held off again.
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
        Click a tile, then click a blank. Dragging works too.
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
              onClick={() => onSelect(tile.id)}
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
