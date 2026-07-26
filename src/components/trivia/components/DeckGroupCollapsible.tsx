import React from "react";
import type { CategoryType, DifficultyLevel } from "../../../types/dsa";
import { Badge, Button, Collapsible, difficultyBadgeVariant } from "../../../ui";

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
    <Collapsible
      className="w-full min-w-0 border-[var(--border-default)]"
      title={group.label}
      meta={
        <div className="flex items-center gap-2">
          <Badge
            variant={count > 0 ? (complete ? "success" : "info") : "neutral"}
            size="sm"
            className="border-[var(--border-default)]"
          >
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
      }
    >
      <div className="flex flex-col gap-2">
        {group.entries.map((entry) => {
          const isSelected = selected.has(entry.id);
          return (
            <Button
              key={entry.id}
              fullWidth
              selected={isSelected}
              className="flex items-center justify-between gap-3 w-full text-left"
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
      </div>
    </Collapsible>
  );
};
