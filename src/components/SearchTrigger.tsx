import { useState } from "react";
import type { ReactElement } from "react";
import { Kbd } from "../ui";

export interface SearchTriggerProps {
  onOpenDrawer: () => void;
}

export function SearchTrigger({ onOpenDrawer }: SearchTriggerProps): ReactElement {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpenDrawer}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Search algorithms"
      style={{
        height: "var(--control-h-sm)",
        fontSize: "var(--text-xs)",
        background: "var(--bg-inset)",
        color: hovered ? "var(--text-primary)" : "var(--text-muted)",
        borderColor: hovered ? "var(--border-strong)" : "var(--border-default)",
      }}
      className="flex items-center gap-2 w-60 px-2 border rounded-[var(--radius-sm)] font-[var(--font-ui)] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
    >
      <span className="flex-1 text-left overflow-hidden text-ellipsis">Search algorithms…</span>
      <Kbd>/</Kbd>
    </button>
  );
}
