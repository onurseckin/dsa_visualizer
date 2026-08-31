import { posix } from "node:path";
import type { ImportReference } from "./tokenizer.ts";

export interface RelativeImportReference extends ImportReference {
  readonly from: string;
}

const EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx"] as const;

export function resolveImport(
  reference: RelativeImportReference,
  paths: readonly string[],
): string | undefined {
  if (!reference.specifier.startsWith(".")) return undefined;
  const resolved = posix.normalize(posix.join(posix.dirname(reference.from), reference.specifier));
  if (resolved === "..") return undefined;
  if (resolved.startsWith("../")) return undefined;
  const known = new Set(paths);
  const candidates = [
    resolved,
    ...EXTENSIONS.map((extension) => `${resolved}${extension}`),
    `${resolved}/index.ts`,
    `${resolved}/index.tsx`,
  ];
  return candidates.find((candidate) => known.has(candidate));
}
