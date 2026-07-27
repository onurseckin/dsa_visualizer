import React from "react";
import { Search } from "lucide-react";
import { CategoryType } from "../../types/dsa";
import { Badge, Input, Select } from "../index";
import {
  CATEGORY_ENTRIES,
  ProblemListDifficulty,
} from "../../components/problem-list/problemListUtils";

interface ProblemListFilterToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCategory: CategoryType | "All";
  onCategorySelect: (category: CategoryType | "All") => void;
  selectedDifficulty: ProblemListDifficulty;
  onDifficultySelect: (difficulty: ProblemListDifficulty) => void;
  filteredCount: number;
  stats: { total: number; easy: number; medium: number; hard: number };
}

export const ProblemListFilterToolbar: React.FC<ProblemListFilterToolbarProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedCategory,
  onCategorySelect,
  selectedDifficulty,
  onDifficultySelect,
  filteredCount,
  stats,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-sm mb-6">
      <div className="flex-1 min-w-[240px]">
        <Input
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onClear={() => onSearchTermChange("")}
          leadingIcon={<Search />}
          placeholder="Search problems by title, category, description..."
          aria-label="Filter problems"
        />
      </div>

      <div className="w-48 flex items-center gap-2">
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}>
          Category:
        </label>
        <Select
          value={selectedCategory}
          onChange={(e) => onCategorySelect(e.target.value as CategoryType | "All")}
          aria-label="Filter by Category"
        >
          <option value="All">All Categories ({stats.total})</option>
          {CATEGORY_ENTRIES.map(([catKey, label]) => (
            <option key={catKey} value={catKey}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-48 flex items-center gap-2">
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

      <div className="flex items-center gap-3 shrink-0">
        <Badge variant="neutral" size="md">
          {filteredCount} / {stats.total} Problems
        </Badge>
      </div>
    </div>
  );
};
