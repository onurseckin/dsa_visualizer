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
      style={{
        padding: "var(--space-6)",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
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

      <ProblemTable
        filteredAlgorithms={filteredAlgorithms}
        sortBy={sortBy}
        onToggleSort={toggleSort}
        onSelectAlgorithm={onSelectAlgorithm}
      />
    </main>
  );
};
