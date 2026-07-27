import type { ReactElement } from "react";
import { Search } from "lucide-react";
import { Kbd } from "../atoms/Kbd";
import { Button } from "@base-ui-components/react/button";

export interface SearchTriggerProps {
  onOpenDrawer: () => void;
}

export function SearchTrigger({ onOpenDrawer }: SearchTriggerProps): ReactElement {
  return (
    <Button
      onClick={onOpenDrawer}
      aria-label="Search algorithms"
      className="w-72 px-4 py-2 bg-[#141418] border border-white/10 rounded-xl text-sm text-neutral-300 hover:border-indigo-500/50 transition-all flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div className="flex items-center gap-3">
        <Search className="w-4 h-4 text-neutral-300 shrink-0" aria-hidden="true" />
        <span className="text-left font-normal">Search algorithms…</span>
      </div>
      <Kbd className="shrink-0">/</Kbd>
    </Button>
  );
}
