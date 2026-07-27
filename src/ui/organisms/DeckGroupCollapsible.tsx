import React from "react";
import type { CategoryType, DifficultyLevel } from "../../types/dsa";
import { Badge, Button, difficultyBadgeVariant } from "../index";
import { Collapsible } from "@base-ui-components/react/collapsible";
import { ChevronRight } from "lucide-react";

export interface DeckEntry {
  id: string;
  title: string;
  difficulty?: DifficultyLevel;
}

export interface DeckGroup {
  id: CategoryType;
  label: string;
  entries: DeckEntry[];
}

export interface DeckGroupCollapsibleProps {
  group: DeckGroup;
  selected: Set<string>;
  onAddMany: (ids: string[]) => void;
  onToggleOne: (id: string) => void;
}

export const DeckGroupCollapsible: React.FC<DeckGroupCollapsibleProps> = ({
  group,
  selected,
  onAddMany,
  onToggleOne,
}) => {
  const count = group.entries.reduce((c, entry) => c + (selected.has(entry.id) ? 1 : 0), 0);
  const complete = count === group.entries.length;

  return (
    <Collapsible.Root className="ui-collapsible w-full min-w-0 mb-4 border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
      <div className="ui-collapsible__header">
        <Collapsible.Trigger className="ui-collapsible__trigger group">
          <span className="ui-collapsible__chevron group-data-[open]:rotate-90 group-data-[state=open]:rotate-90 group-data-[panel-open]:rotate-90">
            <ChevronRight />
          </span>
          <span className="ui-collapsible__title">{group.label}</span>
        </Collapsible.Trigger>
        <span className="ui-collapsible__meta">
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? (complete ? "success" : "info") : "neutral"} size="sm">
              {count}/{group.entries.length}
            </Badge>
            <span
              role="button"
              tabIndex={0}
              aria-disabled={complete}
              aria-label={`Add all ${group.label}`}
              className={`ui-btn ui-btn--secondary ui-btn--sm ${complete ? "ui-btn--disabled" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!complete) onAddMany(group.entries.map((entry) => entry.id));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  if (!complete) onAddMany(group.entries.map((entry) => entry.id));
                }
              }}
            >
              Add all
            </span>
          </div>
        </span>
      </div>
      <Collapsible.Panel className="ui-collapsible__content flex flex-col gap-2 p-6 md:p-8 bg-[var(--bg-elevated)] border-t-2 border-[var(--border-default)]">
        {group.entries.map((entry) => {
          const isSelected = selected.has(entry.id);
          return (
            <Button
              key={entry.id}
              fullWidth
              selected={isSelected}
              variant={isSelected ? "primary" : "ghost"}
              size="sm"
              className="flex items-center justify-between gap-3 w-full text-left border-none font-normal"
              onClick={() => onToggleOne(entry.id)}
            >
              <span className="min-w-0 overflow-hidden whitespace-nowrap text-ellipsis">
                {entry.title}
              </span>
              {entry.difficulty !== undefined ? (
                <Badge variant={difficultyBadgeVariant(entry.difficulty)} size="sm">
                  {entry.difficulty}
                </Badge>
              ) : null}
            </Button>
          );
        })}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
};
