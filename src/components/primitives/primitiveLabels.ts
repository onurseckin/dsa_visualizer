import type { PrimaryVisualKind } from "../../types/dsa";

export type PrimitiveLabelStyle = "assignment" | "caption";

export const PRIMITIVE_LABEL_POLICY = {
  array: "assignment",
  matrix: "caption",
  quantization: "caption",
  heap: "caption",
  hashtable: "caption",
  callstack: "caption",
  bitmask: "caption",
  attentionmap: "caption",
  graph: "caption",
  tree: "caption",
  grid: "caption",
  vector: "caption",
  interval: "caption",
  dsu: "caption",
  statespace: "caption",
  trie: "caption",
} as const satisfies Record<Exclude<PrimaryVisualKind, "composite">, PrimitiveLabelStyle>;

export function resolvePrimitiveLabel(
  kind: Exclude<PrimaryVisualKind, "composite">,
  name?: string,
): string | undefined {
  const bareName = name
    ?.trim()
    .replace(/\s*=\s*$/, "")
    .trim();
  if (!bareName) return undefined;
  return PRIMITIVE_LABEL_POLICY[kind] === "assignment" ? `${bareName} =` : bareName;
}
