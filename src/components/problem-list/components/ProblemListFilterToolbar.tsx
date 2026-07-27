import React from "react";
import { Search } from "lucide-react";
import { CategoryType } from "../../../types/dsa";
import { Badge, Card, Input } from "../../../ui";
import { CATEGORY_ENTRIES, PANEL_BORDER, ProblemListDifficulty } from "../problemListUtils";

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
    <Card padding="sm" style={PANEL_BORDER} className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
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

        <div className="flex items-center gap-2">
          <label
            style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}
          >
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategorySelect(e.target.value as CategoryType | "All")}
            aria-label="Filter by Category"
            style={{
              height: "var(--control-h-md)",
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "0 var(--space-2)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-ui)",
            }}
          >
            <option value="All">All Categories ({stats.total})</option>
            {CATEGORY_ENTRIES.map(([catKey, label]) => (
              <option key={catKey} value={catKey}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)" }}
          >
            Difficulty:
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultySelect(e.target.value as ProblemListDifficulty)}
            aria-label="Filter by Difficulty"
            style={{
              height: "var(--control-h-md)",
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
              borderRadius: "var(--radius-sm)",
              padding: "0 var(--space-2)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-ui)",
            }}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy ({stats.easy})</option>
            <option value="Medium">Medium ({stats.medium})</option>
            <option value="Hard">Hard ({stats.hard})</option>
          </select>
        </div>

        <Badge variant="neutral" size="md">
          {filteredCount} / {stats.total} Problems
        </Badge>
      </div>
    </Card>
  );
};
