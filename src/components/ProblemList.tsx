import React from "react";
import { CategoryType } from "../types/dsa";
import { useProblemListState } from "./problem-list/hooks/useProblemListState";
import { ProblemListFilterToolbar } from "./problem-list/components/ProblemListFilterToolbar";
import { ProblemTable } from "./problem-list/components/ProblemTable";

interface ProblemListProps {
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
  category?: CategoryType | "All";
  onCategoryChange?: (category: CategoryType | "All") => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  onSelectAlgorithm,
  category,
  onCategoryChange,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    handleCategorySelect,
    selectedDifficulty,
    setSelectedDifficulty,
    sortBy,
    toggleSort,
    stats,
    filteredAlgorithms,
  } = useProblemListState({ category, onCategoryChange });

  return (
    <main
      aria-label="Problem directory"
      className="flex flex-col items-center justify-start p-6 md:p-10 w-full max-w-full mx-auto box-border flex-1 gap-8 overflow-y-auto"
    >
      <div className="flex flex-col items-center justify-center text-center mx-auto w-full max-w-3xl gap-4 p-6 md:p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Algorithm Directory</h1>
        <p className="text-base text-[var(--text-secondary)]">
          Explore algorithms, data structures, and interactive visualizations
        </p>
      </div>

      <div className="w-full flex flex-col gap-6 mb-6">
        <ProblemListFilterToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          selectedDifficulty={selectedDifficulty}
          onDifficultySelect={setSelectedDifficulty}
          filteredCount={filteredAlgorithms.length}
          stats={stats}
        />
      </div>

      <div className="w-full">
        <ProblemTable
          filteredAlgorithms={filteredAlgorithms}
          sortBy={sortBy}
          onToggleSort={toggleSort}
          onSelectAlgorithm={onSelectAlgorithm}
        />
      </div>
    </main>
  );
};
