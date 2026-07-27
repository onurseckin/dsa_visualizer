import React, { useMemo, useState } from "react";
import { Layers, Search } from "lucide-react";
import type { CategoryType, DifficultyLevel } from "../../types/dsa";
import { getAlgorithmSources, getSourceKind } from "../../types/dsa";
import { CATEGORIES } from "../../app/categories";
import { getAllAlgorithms } from "../../algorithms/registry";
import { Badge, Button, ButtonGroup, Card, Input, Select } from "..";
import { DeckGroup, DeckGroupCollapsible } from "./DeckGroupCollapsible";
import { PageHeader } from "../templates/PageHeader";

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
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const selected = useMemo(() => new Set(deck), [deck]);

  const groups = useMemo<DeckGroup[]>(() => {
    const query = search.trim().toLowerCase();
    const byCategory = new Map<CategoryType, DeckEntry[]>();

    algorithms.forEach((algorithm) => {
      if (categoryFilter !== "ALL" && algorithm.category !== categoryFilter) return;
      if (difficultyFilter !== "ALL" && algorithm.difficulty !== difficultyFilter) return;
      if (sourceFilter !== "ALL") {
        const sources = getAlgorithmSources(algorithm);
        if (!sources.some((s) => getSourceKind(s) === sourceFilter)) return;
      }

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
  }, [algorithms, search, categoryFilter, difficultyFilter, sourceFilter]);

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
    <Card className="border border-[var(--border-default)] rounded-2xl p-8 bg-[var(--bg-surface)] shadow-lg hover:border-[var(--accent)] transition-all flex flex-col w-full">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Layers aria-hidden="true" className="w-5 h-5 text-[var(--accent)]" />
            <span>Build your deck</span>
          </div>
        }
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
      />
      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex-[1_1_200px] min-w-0">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                leadingIcon={<Search />}
                placeholder="Filter algorithms by title or topic..."
                aria-label="Filter algorithms"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {CATEGORY_LABELS[category.id]}
                </option>
              ))}
            </Select>
            <Select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="ALL">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>
            <Select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              aria-label="Filter by source"
            >
              <option value="ALL">All sources</option>
              <option value="leetcode">LeetCode</option>
              <option value="book">Competitive Programmer's Handbook</option>
              <option value="standard">Standard</option>
            </Select>
            <Badge variant="neutral" size="md">
              {deck.length} in deck
            </Badge>
            <Badge variant="neutral" size="md">
              {deck.length} of {algorithms.length} algorithms selected
            </Badge>
            {search.trim().length > 0 || categoryFilter !== "ALL" || difficultyFilter !== "ALL" || sourceFilter !== "ALL" ? (
              <>
                <Badge variant="neutral" size="md">
                  {visibleIds.length} shown
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("ALL");
                    setDifficultyFilter("ALL");
                    setSourceFilter("ALL");
                  }}
                >
                  Reset filters
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex gap-2 flex-wrap items-center text-xs text-[var(--text-secondary)]">
            <span>Quick add:</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={visibleIds.every((id) => selected.has(id))}
              onClick={() => addMany(visibleIds)}
            >
              Add filtered ({visibleIds.length})
            </Button>
          </div>

          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">
              No algorithm matches that filter.
            </p>
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
      </div>
    </Card>
  );
};
