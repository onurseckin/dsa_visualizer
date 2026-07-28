import { useMemo, useState } from "react";
import { TopicId, getAlgorithmSources, getSourceKind } from "../../../types/dsa";
import { getAllAlgorithms } from "../../../algorithms/registry";
import {
  getAlgorithmTopicLabels,
  getAlgorithmTopics,
  isMlInfraAlgorithm,
} from "../../../app/topics";
import {
  ProblemListDifficulty,
  ProblemListSource,
  ProblemListSortField,
  ProblemListSortOrder,
  isProblemListDifficulty,
  isProblemListSource,
  isProblemListSortField,
  isProblemListSortOrder,
  readStoredProblemListValue,
  writeStoredProblemListValue,
} from "../problemListUtils";

interface UseProblemListStateProps {
  topic?: TopicId | "All";
  onTopicChange?: (topic: TopicId | "All") => void;
}

export function useProblemListState({
  topic = "All",
  onTopicChange,
}: UseProblemListStateProps = {}) {
  const [selectedDifficulty, setSelectedDifficultyState] = useState<ProblemListDifficulty>(() =>
    readStoredProblemListValue("difficulty", "All", isProblemListDifficulty),
  );
  const [selectedSource, setSelectedSourceState] = useState<ProblemListSource>(() =>
    readStoredProblemListValue("source", "All", isProblemListSource),
  );

  const setSelectedDifficulty = (next: ProblemListDifficulty) => {
    setSelectedDifficultyState(next);
    writeStoredProblemListValue("difficulty", next);
  };

  const setSelectedSource = (next: ProblemListSource) => {
    setSelectedSourceState(next);
    writeStoredProblemListValue("source", next);
  };

  const [internalTopic, setInternalTopic] = useState<TopicId | "All">(topic ?? "All");
  const selectedTopic = onTopicChange ? (topic ?? "All") : internalTopic;
  const setSelectedTopic = (next: TopicId | "All") => {
    setInternalTopic(next);
    if (onTopicChange) {
      onTopicChange(next);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortByState] = useState<ProblemListSortField>(() =>
    readStoredProblemListValue("sort_by", "title", isProblemListSortField),
  );
  const [sortOrder, setSortOrderState] = useState<ProblemListSortOrder>(() =>
    readStoredProblemListValue("sort_order", "asc", isProblemListSortOrder),
  );

  const setSortBy = (next: ProblemListSortField) => {
    setSortByState(next);
    writeStoredProblemListValue("sort_by", next);
  };

  const setSortOrder = (next: ProblemListSortOrder) => {
    setSortOrderState(next);
    writeStoredProblemListValue("sort_order", next);
  };

  const algorithms = useMemo(() => getAllAlgorithms(), []);

  const stats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    algorithms.forEach((a) => {
      if (a.difficulty === "Easy") easy++;
      else if (a.difficulty === "Medium") medium++;
      else if (a.difficulty === "Hard") hard++;
    });
    return { total: algorithms.length, easy, medium, hard };
  }, [algorithms]);

  const filteredAlgorithms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    // First filter by topic.
    const topicFiltered = algorithms.filter((alg) => {
      const topics = getAlgorithmTopics(alg);
      if (selectedTopic !== "All") {
        if (!topics.includes(selectedTopic)) return false;
      }
      return true;
    });

    // When a specific topic is requested (e.g., navigating from a Knowledge Tree node),
    // default effective source & difficulty filters to "All" so the problem list view
    // matches the full topic problem count promised by the Knowledge Tree node badge.
    const isTopicScoped = selectedTopic !== "All";
    const effectiveSource = isTopicScoped ? "All" : selectedSource;
    const effectiveDifficulty = isTopicScoped ? "All" : selectedDifficulty;

    const filtered = topicFiltered.filter((alg) => {
      if (effectiveDifficulty !== "All" && alg.difficulty !== effectiveDifficulty) return false;

      const isMlAlg = isMlInfraAlgorithm(alg);

      if (effectiveSource !== "All") {
        const sources = getAlgorithmSources(alg);
        const matchesSource = sources.some((s) => getSourceKind(s) === effectiveSource);
        const matchesMlSource = effectiveSource === "ml_infra" && isMlAlg;

        if (!matchesSource && !matchesMlSource) return false;
      }

      if (!q) return true;
      if (alg.title.toLowerCase().includes(q)) return true;
      if (getAlgorithmTopicLabels(alg).some((label) => label.toLowerCase().includes(q)))
        return true;
      return alg.description.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "title") {
        comp = a.title.localeCompare(b.title);
      } else if (sortBy === "topic") {
        comp = getAlgorithmTopicLabels(a)
          .join("\u0000")
          .localeCompare(getAlgorithmTopicLabels(b).join("\u0000"));
      } else if (sortBy === "difficulty") {
        const order: Record<string, number | undefined> = { Easy: 1, Medium: 2, Hard: 3 };
        comp = (order[a.difficulty ?? ""] ?? 1) - (order[b.difficulty ?? ""] ?? 1);
      }
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [
    algorithms,
    searchTerm,
    selectedDifficulty,
    selectedTopic,
    selectedSource,
    sortBy,
    sortOrder,
  ]);

  const [currentPage, setCurrentPageState] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const setCurrentPage = (page: number) => {
    setCurrentPageState(Math.max(1, page));
  };

  const handleSearchTermChange = (next: string) => {
    setSearchTerm(next);
    setCurrentPageState(1);
  };

  const handleDifficultyChange = (next: ProblemListDifficulty) => {
    setSelectedDifficulty(next);
    setCurrentPageState(1);
  };

  const handleSourceChange = (next: ProblemListSource) => {
    setSelectedSource(next);
    setCurrentPageState(1);
  };

  const handleTopicSelectWithReset = (next: TopicId | "All") => {
    setSelectedTopic(next);
    setCurrentPageState(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredAlgorithms.length / ITEMS_PER_PAGE));

  const paginatedAlgorithms = useMemo(() => {
    const validPage = Math.min(currentPage, totalPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredAlgorithms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAlgorithms, currentPage, totalPages]);

  const toggleSort = (field: ProblemListSortField) => {
    setCurrentPageState(1);
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return {
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    selectedTopic,
    setSelectedTopic: handleTopicSelectWithReset,
    handleTopicSelect: handleTopicSelectWithReset,
    selectedDifficulty,
    setSelectedDifficulty: handleDifficultyChange,
    selectedSource,
    setSelectedSource: handleSourceChange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort,
    stats,
    filteredAlgorithms,
    paginatedAlgorithms,
    currentPage: Math.min(currentPage, totalPages),
    setCurrentPage,
    totalPages,
    ITEMS_PER_PAGE,
  };
}
