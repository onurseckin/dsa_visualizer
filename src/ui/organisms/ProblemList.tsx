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
    selectedSource,
    setSelectedSource,
    sortBy,
    toggleSort,
    stats,
    filteredAlgorithms,
    paginatedAlgorithms,
    currentPage,
    setCurrentPage,
    totalPages,
    ITEMS_PER_PAGE,
  } = useProblemListState({ category: category ?? "All", onCategoryChange });

  return (
    <main
      aria-label="Problem directory"
      className="w-[90%] py-8 mx-auto flex flex-col gap-8 box-border flex-1"
    >
      <div className="flex flex-col gap-2 mt-6 md:mt-8 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Algorithm Directory</h1>
        <p className="text-base text-neutral-400 max-w-2xl">
          Explore algorithms, data structures, and interactive visualizations
        </p>
      </div>

      <ProblemListFilterToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        selectedDifficulty={selectedDifficulty}
        onDifficultySelect={setSelectedDifficulty}
        selectedSource={selectedSource}
        onSourceSelect={setSelectedSource}
        filteredCount={filteredAlgorithms.length}
        stats={stats}
      />

      <div className="w-full">
        <ProblemTable
          filteredAlgorithms={filteredAlgorithms}
          paginatedAlgorithms={paginatedAlgorithms}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          sortBy={sortBy}
          onToggleSort={toggleSort}
          onSelectAlgorithm={onSelectAlgorithm}
        />
      </div>
    </main>
  );
};
