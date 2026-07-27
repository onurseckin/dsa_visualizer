import { useState } from "react";
import type { ReactElement } from "react";
import { Search } from "lucide-react";
import { Kbd } from "..";
import { Button } from "@base-ui-components/react/button";

export interface SearchTriggerProps {
  onOpenDrawer: () => void;
}

export function SearchTrigger({ onOpenDrawer }: SearchTriggerProps): ReactElement {
  const [hovered, setHovered] = useState(false);

  return (
    <Button
      onClick={onOpenDrawer}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Search algorithms"
      style={{
        fontSize: "var(--text-sm)",
        background: "var(--bg-inset)",
        color: hovered ? "var(--text-primary)" : "var(--text-muted)",
        borderColor: hovered ? "var(--border-strong)" : "var(--border-default)",
      }}
      className="flex items-center gap-3 w-72 px-4 py-2.5 border rounded-[var(--radius-md)] font-[var(--font-ui)] cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left font-normal">Search algorithms…</span>
      <Kbd className="shrink-0">/</Kbd>
    </Button>
  );
}
