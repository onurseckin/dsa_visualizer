import React, { useMemo, useState } from "react";
import { Layers, Search } from "lucide-react";
import type { TopicId, DifficultyLevel } from "../../types/dsa";
import { getAlgorithmSources, getSourceKind } from "../../types/dsa";
import { TOPICS, getAlgorithmTopics } from "../../app/topics";
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
  sources?: ReturnType<typeof getAlgorithmSources>;
}

const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  TOPICS.map((topic) => [topic.id, topic.label.replace(/^\d+\.\s*/, "")]),
);

export const TriviaDeckBuilder: React.FC<TriviaDeckBuilderProps> = ({ deck, onChange }) => {
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const algorithms = useMemo(() => getAllAlgorithms(), []);
  const selected = useMemo(() => new Set(deck), [deck]);

  const groups = useMemo<DeckGroup[]>(() => {
    const query = search.trim().toLowerCase();
    const byTopic = new Map<TopicId, DeckEntry[]>();

    algorithms.forEach((algorithm) => {
      const topics = getAlgorithmTopics(algorithm);
      if (topicFilter !== "ALL" && !topics.includes(topicFilter as TopicId)) return;
      if (difficultyFilter !== "ALL" && algorithm.difficulty !== difficultyFilter) return;
      const sources = getAlgorithmSources(algorithm);
      if (sourceFilter !== "ALL") {
        if (!sources.some((s) => getSourceKind(s) === sourceFilter)) return;
      }

      const visibleTopics =
        topicFilter === "ALL"
          ? topics
          : topics.filter((topicId) => topicId === (topicFilter as TopicId));

      visibleTopics.forEach((topicId) => {
        const label = TOPIC_LABELS[topicId] ?? topicId;
        const matches =
          query.length === 0 ||
          algorithm.title.toLowerCase().includes(query) ||
          label.toLowerCase().includes(query);
        if (!matches) return;

        const entries = byTopic.get(topicId) ?? [];
        entries.push({
          id: algorithm.id,
          title: algorithm.title,
          difficulty: algorithm.difficulty,
          sources,
        });
        byTopic.set(topicId, entries);
      });
    });

    return TOPICS.filter((topic) => byTopic.has(topic.id)).map((topic) => ({
      id: topic.id,
      label: TOPIC_LABELS[topic.id] ?? topic.id,
      entries: byTopic.get(topic.id) ?? [],
    }));
  }, [algorithms, search, topicFilter, difficultyFilter, sourceFilter]);

  const visibleIds = useMemo(
    () => [...new Set(groups.flatMap((group) => group.entries.map((entry) => entry.id)))],
    [groups],
  );

  const addMany = (ids: string[]) => {
    const newIds = [...new Set(ids)].filter((id) => !selected.has(id));
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
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              aria-label="Filter by topic"
            >
              <option value="ALL">All topics</option>
              {TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {TOPIC_LABELS[topic.id]}
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
              <option value="ml_infra">ML Infra</option>
            </Select>
            <Badge variant="neutral" size="md">
              {deck.length} in deck
            </Badge>
            <Badge variant="neutral" size="md">
              {deck.length} of {algorithms.length} algorithms selected
            </Badge>
            {search.trim().length > 0 ||
            topicFilter !== "ALL" ||
            difficultyFilter !== "ALL" ||
            sourceFilter !== "ALL" ? (
              <>
                <Badge variant="neutral" size="md">
                  {visibleIds.length} shown
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setTopicFilter("ALL");
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
