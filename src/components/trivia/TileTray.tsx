import { useState } from "react";
import type { DragEvent } from "react";
import { Button, Card } from "../../ui";
import type { TriviaTile } from "../../types/trivia";
import { TILE_MIME } from "./CodePuzzle";

export interface TileTrayProps {
  tiles: readonly TriviaTile[];
  usedTileIds?: readonly string[];
  selectedTileId?: string | null;
  onSelect: (tileId: string) => void;
  onActivate: (tileId: string) => void;
  disabled?: boolean;
}

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

  const handleDragStart =
    (tileId: string) =>
    (event: DragEvent<HTMLButtonElement>): void => {
      const transfer = event.dataTransfer;
      if (transfer) {
        transfer.setData(TILE_MIME, tileId);
        transfer.effectAllowed = "move";
      }
      setDraggingTileId(tileId);
      if (tileId !== selectedTileId) onSelect(tileId);
    };

  const handleDragEnd = (): void => setDraggingTileId(null);

  return (
    <Card
      title="Tiles"
      padding="sm"
      actions={<span className="text-xs text-[var(--text-muted)]">{remaining} left</span>}
      className="border-[var(--border-default)] min-w-0"
    >
      <p className="mb-2 text-xs leading-relaxed text-[var(--text-muted)]">
        Click a tile to fill the next empty line — or drag it to a specific one.
      </p>
      <div className="flex flex-col gap-2">
        {tiles.map((tile) => {
          const isUsed = used.has(tile.id);
          const isSelected = tile.id === selectedTileId && !isUsed;
          const isDragging = tile.id === draggingTileId;
          return (
            <Button
              key={tile.id}
              size="sm"
              data-state={isUsed ? "used" : isSelected ? "selected" : "available"}
              selected={isSelected}
              aria-pressed={isSelected}
              aria-label={`Tile ${tile.text}${isUsed ? " (placed)" : ""}`}
              disabled={isUsed || disabled}
              draggable={!isUsed && !disabled}
              onClick={() => onActivate(tile.id)}
              onDragStart={handleDragStart(tile.id)}
              onDragEnd={handleDragEnd}
              className={`justify-start font-mono text-sm font-normal overflow-hidden text-ellipsis transition-all ${
                isUsed
                  ? "cursor-not-allowed line-through opacity-40 bg-[var(--bg-subtle)]"
                  : "cursor-grab active:cursor-grabbing hover:bg-[var(--bg-hover)]"
              } ${isDragging ? "opacity-50 scale-[0.98] border-dashed border-[var(--accent)]" : ""}`}
              style={{
                fontFamily: "var(--font-code)",
                fontSize: "var(--text-sm)",
                padding: "var(--space-2) var(--space-3)",
                textDecoration: isUsed ? "line-through" : "none",
                cursor: isUsed ? "not-allowed" : isDragging ? "grabbing" : "grab",
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
