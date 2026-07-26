import { DragEvent, RefObject } from "react";
import { TILE_MIME } from "../codePuzzleTypes";

interface UseCodePuzzleDragDropProps {
  graded: boolean;
  blankRowRefs: RefObject<Map<number, HTMLDivElement>>;
  onTileDrop: (line: number, tileId: string) => void;
  onSlotActivate: (line: number) => void;
}

export function useCodePuzzleDragDrop({
  graded,
  blankRowRefs,
  onTileDrop,
  onSlotActivate,
}: UseCodePuzzleDragDropProps) {
  const allowRowDrop = (event: DragEvent<HTMLDivElement>): void => {
    if (graded) return;
    event.preventDefault();
  };

  const handleRowDrop =
    (line: number) =>
    (event: DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      if (graded) return;
      const transfer = event.dataTransfer;
      const tileId = transfer ? transfer.getData(TILE_MIME) : "";
      if (tileId.length > 0) {
        onTileDrop(line, tileId);
        return;
      }
      onSlotActivate(line);
    };

  const nearestBlankLine = (clientY: number): number | null => {
    let bestLine: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    blankRowRefs.current?.forEach((element, line) => {
      const rect = element.getBoundingClientRect();
      const distance =
        clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestLine = line;
      }
    });
    return bestLine;
  };

  const handleWellDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (graded) return;
    const nearestLine = nearestBlankLine(event.clientY);
    if (nearestLine === null) return;
    const transfer = event.dataTransfer;
    const tileId = transfer ? transfer.getData(TILE_MIME) : "";
    if (tileId.length > 0) {
      onTileDrop(nearestLine, tileId);
      return;
    }
    onSlotActivate(nearestLine);
  };

  return {
    allowRowDrop,
    handleRowDrop,
    handleWellDrop,
  };
}
