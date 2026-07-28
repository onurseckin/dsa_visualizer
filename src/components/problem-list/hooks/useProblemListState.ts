import { useMemo, useState } from "react";
import { CategoryType, getAlgorithmSources, getSourceKind } from "../../../types/dsa";
import { getAllAlgorithms } from "../../../algorithms/registry";
import {
  CATEGORY_LABELS,
  getAlgorithmCategories,
  getAlgorithmPrimaryCategory,
} from "../../../app/categories";
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
  category?: CategoryType | "All";
  onCategoryChange?: (category: CategoryType | "All") => void;
}

export function useProblemListState({
  category = "All",
  onCategoryChange,
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

  const [internalCategory, setInternalCategory] = useState<CategoryType | "All">(category ?? "All");
  const selectedCategory = onCategoryChange ? (category ?? "All") : internalCategory;
  const setSelectedCategory = (next: CategoryType | "All") => {
    setInternalCategory(next);
    if (onCategoryChange) {
      onCategoryChange(next);
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

    // First filter by category
    const categoryFiltered = algorithms.filter((alg) => {
      const cats = getAlgorithmCategories(alg);
      const isMlAlg = Boolean(alg.isMlInfra) || cats.some((c) => c.startsWith("ml_"));

      if (selectedCategory !== "All") {
        const isMlGroupCategory =
          selectedCategory === "ml_infra" || selectedCategory === "ml_infrastructure";
        if (isMlGroupCategory) {
          if (!isMlAlg) return false;
        } else {
          if (!cats.includes(selectedCategory)) return false;
        }
      }
      return true;
    });

    // Check if selectedSource or selectedDifficulty would wipe out all problems in a non-All category
    let effectiveSource = selectedSource;
    if (selectedCategory !== "All" && selectedSource !== "All" && categoryFiltered.length > 0) {
      const sourceMatchCount = categoryFiltered.filter((alg) => {
        const cats = getAlgorithmCategories(alg);
        const isMlAlg = Boolean(alg.isMlInfra) || cats.some((c) => c.startsWith("ml_"));
        const sources = getAlgorithmSources(alg);
        const matchesSource = sources.some((s) => getSourceKind(s) === selectedSource);
        const matchesMlSource = selectedSource === "ml_infra" && isMlAlg;
        return matchesSource || matchesMlSource;
      }).length;
      if (sourceMatchCount === 0) {
        effectiveSource = "All";
      }
    }

    let effectiveDifficulty = selectedDifficulty;
    if (selectedCategory !== "All" && selectedDifficulty !== "All" && categoryFiltered.length > 0) {
      const diffMatchCount = categoryFiltered.filter(
        (alg) => alg.difficulty === selectedDifficulty,
      ).length;
      if (diffMatchCount === 0) {
        effectiveDifficulty = "All";
      }
    }

    const filtered = categoryFiltered.filter((alg) => {
      if (effectiveDifficulty !== "All" && alg.difficulty !== effectiveDifficulty) return false;

      const cats = getAlgorithmCategories(alg);
      const primaryCat = getAlgorithmPrimaryCategory(alg);
      const isMlAlg = Boolean(alg.isMlInfra) || cats.some((c) => c.startsWith("ml_"));

      if (effectiveSource !== "All") {
        const sources = getAlgorithmSources(alg);
        const matchesSource = sources.some((s) => getSourceKind(s) === effectiveSource);
        const matchesMlSource = effectiveSource === "ml_infra" && isMlAlg;

        if (!matchesSource && !matchesMlSource) return false;
      }

      if (!q) return true;
      if (alg.title.toLowerCase().includes(q)) return true;
      const catLabel = (CATEGORY_LABELS[primaryCat] || primaryCat).toLowerCase();
      if (catLabel.includes(q)) return true;
      return alg.description.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "title") {
        comp = a.title.localeCompare(b.title);
      } else if (sortBy === "category") {
        const aCat = getAlgorithmPrimaryCategory(a);
        const bCat = getAlgorithmPrimaryCategory(b);
        comp = (CATEGORY_LABELS[aCat] || aCat).localeCompare(CATEGORY_LABELS[bCat] || bCat);
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
    selectedCategory,
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

  const handleCategorySelectWithReset = (next: CategoryType | "All") => {
    setSelectedCategory(next);
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
    selectedCategory,
    setSelectedCategory: handleCategorySelectWithReset,
    handleCategorySelect: handleCategorySelectWithReset,
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
