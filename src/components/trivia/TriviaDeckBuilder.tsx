import React, { useMemo, useState } from 'react';
import { Layers, ListPlus, Search, Trash2 } from 'lucide-react';
import type { CategoryType, DifficultyLevel } from '../../types/dsa';
import { CATEGORIES } from '../../app/categories';
import { getAllAlgorithms } from '../../algorithms/registry';
import { Badge, Button, Card, Collapsible, Input, difficultyBadgeVariant } from '../../ui';

/* Deck builder (DESIGN.md R8.4).

   Quick multi-add is the headline capability, not a convenience: a useful drill
   deck is "everything in graphs" or "all 40", and clicking forty rows to get
   there is the reason people never build a deck at all. So every level of the
   hierarchy carries a one-click add — whole registry, whole category, single row
   — and every level reports its own count so the deck is legible without
   opening anything.

   The per-category add button is a sibling of the Collapsible rather than part of
   its header: the header is itself a <button>, and a button inside a button is
   invalid HTML that browsers silently reparent. */

export interface TriviaDeckBuilderProps {
  /** Algorithm ids currently in the deck. */
  deck: string[];
  onChange: (deck: string[]) => void;
}

interface DeckEntry {
  id: string;
  title: string;
  difficulty?: DifficultyLevel;
}

interface DeckGroup {
  id: CategoryType;
  label: string;
  entries: DeckEntry[];
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  // The numeric prefix in CATEGORIES is roadmap ordering, not part of the name.
  CATEGORIES.map((category) => [category.id, category.label.replace(/^\d+\.\s*/, '')]),
);

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  width: '100%',
  textAlign: 'left',
};

/* Titles are identifiers: a wrapped one changes the row height and makes a long
   list impossible to scan, so it truncates instead. */
const titleStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

export const TriviaDeckBuilder: React.FC<TriviaDeckBuilderProps> = ({ deck, onChange }) => {
  const [search, setSearch] = useState('');

  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const selected = useMemo(() => new Set(deck), [deck]);

  const groups = useMemo<DeckGroup[]>(() => {
    const query = search.trim().toLowerCase();
    const byCategory = new Map<CategoryType, DeckEntry[]>();

    algorithms.forEach((algorithm) => {
      const label = CATEGORY_LABELS[algorithm.category] ?? algorithm.category;
      const matches =
        query.length === 0 ||
        algorithm.title.toLowerCase().includes(query) ||
        label.toLowerCase().includes(query);
      if (!matches) return;

      const entries = byCategory.get(algorithm.category) ?? [];
      entries.push({ id: algorithm.id, title: algorithm.title, difficulty: algorithm.difficulty });
      byCategory.set(algorithm.category, entries);
    });

    // Roadmap order, not registry order: the categories read as a curriculum.
    return CATEGORIES.filter((category) => byCategory.has(category.id)).map((category) => ({
      id: category.id,
      label: CATEGORY_LABELS[category.id] ?? category.id,
      entries: byCategory.get(category.id) ?? [],
    }));
  }, [algorithms, search]);

  const visibleIds = useMemo(
    () => groups.flatMap((group) => group.entries.map((entry) => entry.id)),
    [groups],
  );

  const addMany = (ids: string[]) => {
    const next = [...deck];
    ids.forEach((id) => {
      if (!next.includes(id)) next.push(id);
    });
    if (next.length !== deck.length) onChange(next);
  };

  const toggleOne = (id: string) => {
    onChange(selected.has(id) ? deck.filter((entry) => entry !== id) : [...deck, id]);
  };

  const addEverything = () => addMany(algorithms.map((algorithm) => algorithm.id));

  const clearDeck = () => {
    if (deck.length > 0) onChange([]);
  };

  const selectedInGroup = (group: DeckGroup): number =>
    group.entries.reduce((count, entry) => count + (selected.has(entry.id) ? 1 : 0), 0);

  return (
    <Card
      title="Build your deck"
      icon={<Layers aria-hidden="true" />}
      style={PANEL_BORDER}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant="neutral" style={PANEL_BORDER}>
            {deck.length} in deck
          </Badge>
          <Button size="sm" icon={<ListPlus aria-hidden="true" />} onClick={addEverything}>
            Add every algorithm
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 aria-hidden="true" />}
            onClick={clearDeck}
            disabled={deck.length === 0}
          >
            Clear deck
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <Input
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            onClear={() => setSearch('')}
            leadingIcon={<Search aria-hidden="true" />}
            placeholder="Filter algorithms by title or topic"
            aria-label="Filter algorithms"
          />
          <span style={hintStyle}>
            {deck.length} of {algorithms.length} algorithms selected
            {search.trim().length > 0 ? ` · ${visibleIds.length} shown` : ''}
          </span>
        </div>

        {groups.length === 0 ? (
          <p style={hintStyle}>No algorithm matches that filter.</p>
        ) : null}

        {groups.map((group) => {
          const count = selectedInGroup(group);
          const complete = count === group.entries.length;
          return (
            <div
              key={group.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}
            >
              <Collapsible
                style={{ flex: 1, minWidth: 0, ...PANEL_BORDER }}
                title={group.label}
                meta={
                  <Badge variant={count > 0 ? 'info' : 'neutral'} style={PANEL_BORDER}>
                    {count}/{group.entries.length}
                  </Badge>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {group.entries.map((entry) => {
                    const isSelected = selected.has(entry.id);
                    return (
                      <Button
                        key={entry.id}
                        fullWidth
                        selected={isSelected}
                        style={rowStyle}
                        onClick={() => toggleOne(entry.id)}
                      >
                        <span style={titleStyle}>{entry.title}</span>
                        {entry.difficulty !== undefined ? (
                          <Badge variant={difficultyBadgeVariant(entry.difficulty)}>
                            {entry.difficulty}
                          </Badge>
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
              </Collapsible>
              <Button
                size="sm"
                onClick={() => addMany(group.entries.map((entry) => entry.id))}
                disabled={complete}
                aria-label={`Add all ${group.label}`}
              >
                Add all
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
