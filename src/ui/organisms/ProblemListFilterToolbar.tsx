import React from "react";
import { Search } from "lucide-react";
import { CategoryType } from "../../types/dsa";
import { Input, Select } from "../index";
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
    <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex-1 min-w-[240px]">
        <Input
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onClear={() => onSearchTermChange("")}
          leadingIcon={<Search className="text-neutral-400" size={18} />}
          placeholder="Search problems by title, category, description..."
          aria-label="Filter problems"
          className="bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 min-h-[42px] w-full placeholder-neutral-500"
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
          className="bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 min-h-[42px] w-full"
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
          className="bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 min-h-[42px] w-full"
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy ({stats.easy})</option>
          <option value="Medium">Medium ({stats.medium})</option>
          <option value="Hard">Hard ({stats.hard})</option>
        </Select>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="bg-[#1e1e24] text-neutral-200 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
          {filteredCount} / {stats.total} Problems
        </span>
      </div>
    </div>
  );
};
