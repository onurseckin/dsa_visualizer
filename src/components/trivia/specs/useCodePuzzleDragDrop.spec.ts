import { describe, expect, it, vi } from "vitest";
import type { DragEvent, RefObject } from "react";
import { useCodePuzzleDragDrop } from "../hooks/useCodePuzzleDragDrop";
import { TILE_MIME } from "../codePuzzleTypes";

const createMockDragEvent = (
  dataMime = "",
  dataValue = "",
  clientY = 100,
): DragEvent<HTMLDivElement> => {
  const preventDefault = vi.fn();
  const stopPropagation = vi.fn();
  const getData = vi.fn((mime: string) => (mime === dataMime ? dataValue : ""));
  return {
    preventDefault,
    stopPropagation,
    dataTransfer: { getData } as unknown as DataTransfer,
    clientY,
  } as unknown as DragEvent<HTMLDivElement>;
};

describe("useCodePuzzleDragDrop hook logic", () => {
  it("allowRowDrop prevents default when not graded", () => {
    const { allowRowDrop } = useCodePuzzleDragDrop({
      graded: false,
      blankRowRefs: { current: new Map() },
      onTileDrop: vi.fn(),
      onSlotActivate: vi.fn(),
    });

    const event = createMockDragEvent();
    allowRowDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();

    const gradedEvent = createMockDragEvent();
    const { allowRowDrop: allowGraded } = useCodePuzzleDragDrop({
      graded: true,
      blankRowRefs: { current: new Map() },
      onTileDrop: vi.fn(),
      onSlotActivate: vi.fn(),
    });
    allowGraded(gradedEvent);
    expect(gradedEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("handleRowDrop drops tile or activates slot", () => {
    const onTileDrop = vi.fn();
    const onSlotActivate = vi.fn();
    const { handleRowDrop } = useCodePuzzleDragDrop({
      graded: false,
      blankRowRefs: { current: new Map() },
      onTileDrop,
      onSlotActivate,
    });

    // Tile drop
    const tileEvent = createMockDragEvent(TILE_MIME, "tile-1");
    handleRowDrop(2)(tileEvent);
    expect(onTileDrop).toHaveBeenCalledWith(2, "tile-1");

    // Slot activate (no tile data)
    const slotEvent = createMockDragEvent("", "");
    handleRowDrop(3)(slotEvent);
    expect(onSlotActivate).toHaveBeenCalledWith(3);
  });

  it("handleWellDrop finds nearest blank line and drops tile or activates slot", () => {
    const onTileDrop = vi.fn();
    const onSlotActivate = vi.fn();

    const element1 = document.createElement("div");
    vi.spyOn(element1, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const element2 = document.createElement("div");
    vi.spyOn(element2, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 150,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 100,
      toJSON: () => {},
    });

    const map = new Map<number, HTMLDivElement>();
    map.set(1, element1);
    map.set(5, element2);

    const blankRowRefs: RefObject<Map<number, HTMLDivElement>> = { current: map };

    const { handleWellDrop } = useCodePuzzleDragDrop({
      graded: false,
      blankRowRefs,
      onTileDrop,
      onSlotActivate,
    });

    // Well drop closer to line 5 (clientY = 120, inside element2)
    const wellEvent = createMockDragEvent(TILE_MIME, "tile-abc", 120);
    handleWellDrop(wellEvent);
    expect(onTileDrop).toHaveBeenCalledWith(5, "tile-abc");

    // Well drop with empty map (nearest is null)
    const { handleWellDrop: emptyWellDrop } = useCodePuzzleDragDrop({
      graded: false,
      blankRowRefs: { current: new Map() },
      onTileDrop,
      onSlotActivate,
    });
    const nullWellEvent = createMockDragEvent(TILE_MIME, "tile-abc", 120);
    emptyWellDrop(nullWellEvent); // returns early

    // Well drop with no tile data -> calls onSlotActivate(nearestLine)
    const noTileWellEvent = createMockDragEvent("", "", 120);
    handleWellDrop(noTileWellEvent);
    expect(onSlotActivate).toHaveBeenCalledWith(5);

    // Well drop when graded: true -> returns early
    const { handleWellDrop: gradedWellDrop } = useCodePuzzleDragDrop({
      graded: true,
      blankRowRefs,
      onTileDrop: vi.fn(),
      onSlotActivate: vi.fn(),
    });
    const gradedWellEvent = createMockDragEvent(TILE_MIME, "tile-abc", 120);
    gradedWellDrop(gradedWellEvent);

    // Row drop when graded: true
    const { handleRowDrop: gradedRowDrop } = useCodePuzzleDragDrop({
      graded: true,
      blankRowRefs,
      onTileDrop: vi.fn(),
      onSlotActivate: vi.fn(),
    });
    const gradedRowEvent = createMockDragEvent(TILE_MIME, "tile-abc", 120);
    gradedRowDrop(1)(gradedRowEvent);
  });

  it("handles null dataTransfer and clientY below element bottom", () => {
    const onTileDrop = vi.fn();
    const onSlotActivate = vi.fn();

    const element1 = document.createElement("div");
    vi.spyOn(element1, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 50,
      left: 0,
      right: 100,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    const map = new Map<number, HTMLDivElement>();
    map.set(1, element1);

    const { handleRowDrop, handleWellDrop } = useCodePuzzleDragDrop({
      graded: false,
      blankRowRefs: { current: map },
      onTileDrop,
      onSlotActivate,
    });

    // Row drop with null dataTransfer
    const nullRowEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: null,
    } as unknown as DragEvent<HTMLDivElement>;
    handleRowDrop(1)(nullRowEvent);
    expect(onSlotActivate).toHaveBeenCalledWith(1);

    // Well drop with clientY below element bottom (clientY = 100, bottom = 50) and null dataTransfer
    const nullWellEvent = {
      preventDefault: vi.fn(),
      dataTransfer: null,
      clientY: 100,
    } as unknown as DragEvent<HTMLDivElement>;
    handleWellDrop(nullWellEvent);
    expect(onSlotActivate).toHaveBeenCalledWith(1);
  });
});
