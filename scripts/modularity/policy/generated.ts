import type { Violation } from "../core/index.ts";
import type { IndexedBlob } from "../inventory/index.ts";

export function findGeneratedCatalogViolations(
  _blobs: readonly IndexedBlob[],
): readonly Violation[] {
  return [];
}
