import React, { useMemo, useState } from "react";
import { Layers, Search } from "lucide-react";
import type { CategoryType, DifficultyLevel } from "../../types/dsa";
import { CATEGORIES } from "../../app/categories";
import { getAllAlgorithms } from "../../algorithms/registry";
import { Badge, Button, ButtonGroup, Card, Input, Select } from "../../ui";
import { DeckGroup, DeckGroupCollapsible } from "./components/DeckGroupCollapsible";

export interface TriviaDeckBuilderProps {
  deck: string[];
  onChange: (deck: string[]) => void;
}

interface DeckEntry {
  id: string;
  title: string;
  difficulty?: DifficultyLevel;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label.replace(/^\d+\.\s*/, "")]),
);

export const TriviaDeckBuilder: React.FC<TriviaDeckBuilderProps> = ({ deck, onChange }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const selected = useMemo(() => new Set(deck), [deck]);

  const groups = useMemo<DeckGroup[]>(() => {
    const query = search.trim().toLowerCase();
    const byCategory = new Map<CategoryType, DeckEntry[]>();

    algorithms.forEach((algorithm) => {
      if (categoryFilter !== "ALL" && algorithm.category !== categoryFilter) return;
      if (difficultyFilter !== "ALL" && algorithm.difficulty !== difficultyFilter) return;

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
    [groups],
  );

  const addMany = (ids: string[]) => {
    const newIds = ids.filter((id) => !selected.has(id));
    if (newIds.length > 0) onChange([...deck, ...newIds]);
  };

  const toggleOne = (id: string) => {
    onChange(selected.has(id) ? deck.filter((entry) => entry !== id) : [...deck, id]);
  };

  const addEverything = () => addMany(algorithms.map((algorithm) => algorithm.id));

  const clearDeck = () => {
    if (deck.length > 0) onChange([]);
  };

  return (
    <Card
      title="Build your deck"
      icon={<Layers aria-hidden="true" />}
      className="p-6 md:p-8 border-[var(--border-default)]"
      actions={
        <ButtonGroup gap="sm" className="flex-wrap">
          <Button size="sm" onClick={addEverything}>
            Add every algorithm
          </Button>
          <Button size="sm" variant="danger" onClick={clearDeck} disabled={deck.length === 0}>
            Clear deck
          </Button>
        </ButtonGroup>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-[1_1_200px] min-w-0">
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              onClear={() => setSearch("")}
              leadingIcon={<Search aria-hidden="true" />}
              placeholder="Filter algorithms by title or topic"
              aria-label="Filter algorithms"
            />
          </div>
          <div className="w-[180px]">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label.replace(/^\d+\.\s*/, "")}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[160px]">
            <Select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 md:p-5 bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex-wrap gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">
              {deck.length} in deck
            </Badge>
            <span className="text-xs text-[var(--text-muted)]">
              {deck.length} of {algorithms.length} algorithms selected
              {search.trim().length > 0 || categoryFilter !== "ALL" || difficultyFilter !== "ALL"
                ? ` · ${visibleIds.length} shown`
                : ""}
            </span>
          </div>
          {(search || categoryFilter !== "ALL" || difficultyFilter !== "ALL") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearch("");
                setCategoryFilter("ALL");
                setDifficultyFilter("ALL");
              }}
            >
              Reset filters
            </Button>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No algorithm matches that filter.</p>
        ) : null}

        {groups.map((group) => (
          <DeckGroupCollapsible
            key={group.id}
            group={group}
            selected={selected}
            onAddMany={addMany}
            onToggleOne={toggleOne}
          />
        ))}
      </div>
    </Card>
  );
};
