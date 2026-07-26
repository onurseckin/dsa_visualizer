import React, { useMemo, useState } from 'react';
import { Layers, ListPlus, Search, Trash2, Filter } from 'lucide-react';
import type { CategoryType, DifficultyLevel } from '../../types/dsa';
import { CATEGORIES } from '../../app/categories';
import { getAllAlgorithms } from '../../algorithms/registry';
import { Badge, Button, Card, Collapsible, Input, difficultyBadgeVariant } from '../../ui';

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
  CATEGORIES.map((category) => [category.id, category.label.replace(/^\d+\.\s*/, '')])
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

const titleStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

const selectStyle: React.CSSProperties = {
  height: 'var(--control-h-md)',
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-inset)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-ui)',
  cursor: 'pointer',
  outline: 'none',
};

export const TriviaDeckBuilder: React.FC<TriviaDeckBuilderProps> = ({ deck, onChange }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const selected = useMemo(() => new Set(deck), [deck]);

  const groups = useMemo<DeckGroup[]>(() => {
    const query = search.trim().toLowerCase();
    const byCategory = new Map<CategoryType, DeckEntry[]>();

    algorithms.forEach((algorithm) => {
      if (categoryFilter !== 'ALL' && algorithm.category !== categoryFilter) return;
      if (difficultyFilter !== 'ALL' && algorithm.difficulty !== difficultyFilter) return;

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

    return CATEGORIES.filter((category) => byCategory.has(category.id)).map((category) => ({
      id: category.id,
      label: CATEGORY_LABELS[category.id] ?? category.id,
      entries: byCategory.get(category.id) ?? [],
    }));
  }, [algorithms, search, categoryFilter, difficultyFilter]);

  const visibleIds = useMemo(
    () => groups.flatMap((group) => group.entries.map((entry) => entry.id)),
    [groups]
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="neutral" size="md" style={PANEL_BORDER}>
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
        {/* Search & Category/Difficulty Filter Toolbar */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onClear={() => setSearch('')}
              leadingIcon={<Search aria-hidden="true" />}
              placeholder="Filter algorithms by title or topic"
              aria-label="Filter algorithms"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label.replace(/^\d+\.\s*/, '')}
              </option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filter by difficulty"
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={hintStyle}>
            {deck.length} of {algorithms.length} algorithms selected
            {search.trim().length > 0 || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL'
              ? ` · ${visibleIds.length} shown`
              : ''}
          </span>
          {(search || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL') && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Filter aria-hidden="true" />}
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setDifficultyFilter('ALL');
              }}
            >
              Reset filters
            </Button>
          )}
        </div>

        {groups.length === 0 ? (
          <p style={hintStyle}>No algorithm matches that filter.</p>
        ) : null}

        {groups.map((group) => {
          const count = selectedInGroup(group);
          const complete = count === group.entries.length;
          return (
            <Collapsible
              key={group.id}
              style={{ width: '100%', minWidth: 0, ...PANEL_BORDER }}
              title={group.label}
              meta={
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Badge variant={count > 0 ? (complete ? 'success' : 'info') : 'neutral'} size="sm" style={PANEL_BORDER}>
                    {count}/{group.entries.length}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addMany(group.entries.map((entry) => entry.id));
                    }}
                    disabled={complete}
                    aria-label={`Add all ${group.label}`}
                  >
                    Add all
                  </Button>
                </div>
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
        })}
      </div>
    </Card>
  );
};
