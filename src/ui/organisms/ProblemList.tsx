import React from "react";
import { TopicId } from "../../types/dsa";
import { useProblemListState } from "../../components/problem-list/hooks/useProblemListState";
import { ProblemListFilterToolbar } from "./ProblemListFilterToolbar";
import { ProblemTable } from "./ProblemTable";

interface ProblemListProps {
  onSelectAlgorithm: (algorithmId: string) => void;
  topic?: TopicId | "All";
  onTopicChange?: (topic: TopicId | "All") => void;
  tag?: string | "All";
  onTagChange?: (tag: string | "All") => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  onSelectAlgorithm,
  topic,
  onTopicChange,
  tag,
  onTagChange,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedTopic,
    handleTopicSelect,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedSource,
    setSelectedSource,
    selectedTag,
    setSelectedTag,
    availableTags,
    sortBy,
    toggleSort,
    stats,
    filteredAlgorithms,
    paginatedAlgorithms,
    currentPage,
    setCurrentPage,
    totalPages,
    ITEMS_PER_PAGE,
  } = useProblemListState({ topic: topic ?? "All", onTopicChange, tag: tag ?? "All", onTagChange });

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
        selectedTopic={selectedTopic}
        onTopicSelect={handleTopicSelect}
        selectedDifficulty={selectedDifficulty}
        onDifficultySelect={setSelectedDifficulty}
        selectedSource={selectedSource}
        onSourceSelect={setSelectedSource}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        availableTags={availableTags}
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
          onSelectTag={setSelectedTag}
        />
      </div>
    </main>
  );
};
