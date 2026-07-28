import React from "react";
import { Search } from "lucide-react";
import { TopicId } from "../../types/dsa";
import { Button, Input, Select } from "../index";
import {
  TOPIC_ENTRIES,
  ProblemListDifficulty,
  ProblemListSource,
} from "../../components/problem-list/problemListUtils";

interface ProblemListFilterToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedTopic: TopicId | "All";
  onTopicSelect: (topic: TopicId | "All") => void;
  selectedDifficulty: ProblemListDifficulty;
  onDifficultySelect: (difficulty: ProblemListDifficulty) => void;
  selectedSource?: ProblemListSource;
  onSourceSelect?: (source: ProblemListSource) => void;
  filteredCount: number;
  stats: { total: number; easy: number; medium: number; hard: number };
}

export const ProblemListFilterToolbar: React.FC<ProblemListFilterToolbarProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedTopic,
  onTopicSelect,
  selectedDifficulty,
  onDifficultySelect,
  selectedSource = "All",
  onSourceSelect,
  filteredCount,
  stats,
}) => {
  const isMlInfraActive = selectedSource === "ml_infra";

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex-1 min-w-[240px]">
        <Input
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onClear={() => onSearchTermChange("")}
          leadingIcon={<Search className="text-[var(--text-muted)]" size={18} />}
          placeholder="Search problems by title, topic, description..."
          aria-label="Filter problems"
        />
      </div>

      <div className="min-w-[180px] flex items-center gap-2">
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>
          Topic:
        </label>
        <Select
          value={selectedTopic}
          onChange={(e) => onTopicSelect(e.target.value as TopicId | "All")}
          aria-label="Filter by topic"
        >
          <option value="All">All Topics ({stats.total})</option>
          {TOPIC_ENTRIES.map(([topicId, label]) => (
            <option key={topicId} value={topicId}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[160px] flex items-center gap-2">
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>
          Difficulty:
        </label>
        <Select
          value={selectedDifficulty}
          onChange={(e) => onDifficultySelect(e.target.value as ProblemListDifficulty)}
          aria-label="Filter by Difficulty"
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy ({stats.easy})</option>
          <option value="Medium">Medium ({stats.medium})</option>
          <option value="Hard">Hard ({stats.hard})</option>
        </Select>
      </div>

      <div className="min-w-[180px] flex items-center gap-2">
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>
          Source:
        </label>
        <Select
          value={selectedSource}
          onChange={(e) => onSourceSelect && onSourceSelect(e.target.value as ProblemListSource)}
          aria-label="Filter by Source"
        >
          <option value="All">All Sources</option>
          <option value="leetcode">LeetCode</option>
          <option value="book">Competitive Programmer's Handbook</option>
          <option value="standard">Standard</option>
          <option value="ml_infra">ML Infra</option>
        </Select>

        <Button
          size="sm"
          variant={isMlInfraActive ? "primary" : "ghost"}
          onClick={() => onSourceSelect && onSourceSelect(isMlInfraActive ? "All" : "ml_infra")}
          aria-label="Filter by ML Infra"
          aria-pressed={isMlInfraActive}
          className="shrink-0"
        >
          ML Infra
        </Button>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
          {filteredCount} / {stats.total} Problems
        </span>
      </div>
    </div>
  );
};
