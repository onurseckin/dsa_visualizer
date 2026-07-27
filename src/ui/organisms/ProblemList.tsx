import React from "react";
import { CategoryType } from "../../types/dsa";
import { useProblemListState } from "../../components/problem-list/hooks/useProblemListState";
import { ProblemListFilterToolbar } from "./ProblemListFilterToolbar";
import { ProblemTable } from "./ProblemTable";
import { PageHeader } from "../templates/PageHeader";

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
      className="flex flex-col items-center justify-start px-4 md:px-8 py-6 w-full max-w-7xl mx-auto box-border flex-1 gap-8 overflow-y-auto"
    >
      <PageHeader
        title="Algorithm Directory"
        description="Explore algorithms, data structures, and interactive visualizations"
      />

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
