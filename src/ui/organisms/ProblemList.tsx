import React from "react";
import { CategoryType } from "../../types/dsa";
import { useProblemListState } from "../../components/problem-list/hooks/useProblemListState";
import { ProblemListFilterToolbar } from "./ProblemListFilterToolbar";
import { ProblemTable } from "./ProblemTable";

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
      className="w-[90%] max-w-[1600px] py-8 mx-auto flex flex-col gap-8 box-border flex-1 overflow-y-auto"
    >
      <div className="flex flex-col gap-2 mt-6 md:mt-8 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Algorithm Directory
        </h1>
        <p className="text-base text-neutral-400 max-w-2xl">
          Explore algorithms, data structures, and interactive visualizations
        </p>
      </div>

      <div className="w-full flex flex-col gap-6">
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
