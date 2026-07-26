/* Tiny class-name joiner so components can merge incoming className overrides. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
