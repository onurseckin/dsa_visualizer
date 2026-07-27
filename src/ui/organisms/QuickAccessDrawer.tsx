import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { CategoryType, SourceKind, LeetCodeSource, BookSource, StandardSource } from "../../types/dsa";
import { getAlgorithmSources, getSourceKind } from "../../types/dsa";
import { getAllAlgorithms } from "../../algorithms/registry";
import { Badge, Button, Collapsible, Input, difficultyBadgeVariant, IconButton, SourceBadgeList } from "../index";
import { Dialog } from "@base-ui-components/react/dialog";

export const ALL_CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: "arrays_and_hashing", label: "1. Arrays & Hashing" },
  { id: "two_pointers", label: "2. Two Pointers" },
  { id: "stack_and_queue", label: "3. Stack & Queue" },
  { id: "binary_search", label: "4. Binary Search" },
  { id: "sliding_window", label: "5. Sliding Window" },
  { id: "linked_list", label: "6. Linked List" },
  { id: "tree_fundamentals", label: "7. Tree Fundamentals" },
  { id: "tree_queries_and_diameter", label: "8. Tree Queries & Diameter" },
  { id: "tries_and_strings", label: "9. Tries & Strings" },
  { id: "heap_and_priority_queue", label: "10. Heap / Priority Queue" },
  { id: "backtracking", label: "11. Backtracking" },
  { id: "graph_traversal", label: "12. Graph Traversal" },
  { id: "graph_shortest_paths", label: "13. Graph Shortest Paths" },
  { id: "graph_spanning_trees", label: "14. Graph Spanning Trees" },
  { id: "graph_directed_and_scc", label: "15. Graph Directed & SCC" },
  { id: "graph_flows_and_cuts", label: "16. Graph Flows & Cuts" },
  { id: "dp_1d", label: "17. 1-D Dynamic Programming" },
  { id: "dp_2d", label: "18. 2-D Dynamic Programming" },
  { id: "intervals", label: "19. Intervals" },
  { id: "greedy_algorithms", label: "20. Greedy Algorithms" },
  { id: "bit_manipulation", label: "21. Bit Manipulation" },
  { id: "math_and_number_theory", label: "22. Math & Number Theory" },
  { id: "game_theory", label: "23. Game Theory" },
  { id: "advanced_range_queries", label: "24. Advanced Range Queries" },
  { id: "geometry_and_sweep_line", label: "25. Geometry & Sweep Line" },
];

export interface QuickAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
  activeAlgorithmId?: string;
  categories?: { id: CategoryType; label: string }[];
}

export function QuickAccessDrawer({
  isOpen,
  onClose,
  onSelectAlgorithm,
  activeAlgorithmId,
  categories = ALL_CATEGORIES,
}: QuickAccessDrawerProps): React.ReactElement {
  const allAlgorithms = useMemo(() => getAllAlgorithms(), []);
  const algMap = useMemo(() => new Map(allAlgorithms.map((alg) => [alg.id, alg])), [allAlgorithms]);

  const activeCategoryId = useMemo(
    () => (activeAlgorithmId !== undefined ? algMap.get(activeAlgorithmId)?.category : undefined),
    [algMap, activeAlgorithmId],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceKind>("all");
  const [openMap, setOpenMap] = useState<Partial<Record<CategoryType, boolean>>>(() =>
    activeCategoryId !== undefined ? { [activeCategoryId]: true } : {},
  );

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setSourceFilter("all");
    setOpenMap(activeCategoryId !== undefined ? { [activeCategoryId]: true } : {});
  }, [isOpen, activeCategoryId]);

  const query = searchQuery.trim().toLowerCase();
  const isFiltering = query.length > 0 || sourceFilter !== "all";

  const categoryIdSet = useMemo(() => new Set(categories.map((cat) => cat.id)), [categories]);
  const totalAlgorithms = useMemo(
    () => allAlgorithms.filter((alg) => categoryIdSet.has(alg.category)).length,
    [allAlgorithms, categoryIdSet],
  );

  const groups = useMemo(() => {
    return categories
      .map((cat) => {
        const catAlgorithms = allAlgorithms.filter((alg) => alg.category === cat.id);
        const matches = catAlgorithms.filter((alg) => {
          if (sourceFilter !== "all") {
            const sources = getAlgorithmSources(alg);
            if (!sources.some((s) => getSourceKind(s) === sourceFilter)) {
              return false;
            }
          }

          if (query.length === 0) return true;

          if (
            alg.title.toLowerCase().includes(query) ||
            alg.description.toLowerCase().includes(query) ||
            cat.label.toLowerCase().includes(query) ||
            (alg.difficulty?.toLowerCase().includes(query) ?? false)
          ) {
            return true;
          }

          const sources = getAlgorithmSources(alg);
          return sources.some((s) => {
            const kind = getSourceKind(s);
            if (kind === "leetcode") {
              const lc = s as LeetCodeSource;
              const id = (lc.id ?? lc.leetcodeId)?.toString() || "";
              return id.includes(query) || "leetcode".includes(query) || `lc #${id}`.includes(query);
            }
            if (kind === "book") {
              const bk = s as BookSource;
              const bookTitle = (bk.bookTitle || "").toLowerCase();
              const ch = (bk.chapter ?? "").toString().toLowerCase();
              const label = (bk.label || "").toLowerCase();
              return (
                bookTitle.includes(query) ||
                ch.includes(query) ||
                label.includes(query) ||
                "cph".includes(query) ||
                `chapter ${ch}`.includes(query)
              );
            }
            if (kind === "standard") {
              const std = s as StandardSource;
              return (std.label || "standard").toLowerCase().includes(query);
            }
            return false;
          });
        });
        return { category: cat, algorithms: matches, totalCount: catAlgorithms.length };
      })
      .filter((group) => !isFiltering || group.algorithms.length > 0);
  }, [categories, allAlgorithms, isFiltering, query, sourceFilter]);

  const handleSelect = (algorithmId: string, categoryFolder: CategoryType) => {
    onSelectAlgorithm(algorithmId, categoryFolder);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-drawer-backdrop" />
        <Dialog.Popup className="ui-drawer ui-drawer--right" style={{ width: 420 }}>
          <div className="ui-drawer__header">
            <Dialog.Title className="ui-drawer__title">Algorithms</Dialog.Title>
            <Dialog.Close
              render={<IconButton icon={<X />} aria-label="Close" variant="ghost" size="sm" />}
            />
          </div>
          <div className="ui-drawer__body p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm text-[var(--text-muted)]">
                {totalAlgorithms} algorithms across {categories.length} categories
              </p>

              <Input
                autoFocus
                leadingIcon={<Search />}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery("")}
                placeholder="Search algorithms…"
                aria-label="Search algorithms"
              />

              <div className="flex items-center gap-1.5 flex-wrap my-1">
                <Button
                  size="sm"
                  variant={sourceFilter === "all" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("all")}
                >
                  All Sources
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "leetcode" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("leetcode")}
                >
                  LeetCode
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "book" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("book")}
                >
                  Book
                </Button>
                <Button
                  size="sm"
                  variant={sourceFilter === "standard" ? "primary" : "ghost"}
                  onClick={() => setSourceFilter("standard")}
                >
                  Standard
                </Button>
              </div>

              {groups.length === 0 ? (
                <p className="m-0 py-6 px-2 text-center text-sm text-[var(--text-muted)]">
                  No algorithms match {searchQuery.trim() ? `“${searchQuery.trim()}”` : "the selected source filter"}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {groups.map((group) => (
                    <Collapsible
                      key={group.category.id}
                      className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden shadow-sm"
                      title={group.category.label}
                      meta={
                        <Badge size="sm" variant="neutral">
                          {isFiltering ? group.algorithms.length : group.totalCount}
                        </Badge>
                      }
                      open={isFiltering ? true : openMap[group.category.id] === true}
                      onOpenChange={(open) => {
                        if (isFiltering) return;
                        setOpenMap((prev) => ({ ...prev, [group.category.id]: open }));
                      }}
                      contentClassName="!p-0"
                    >
                      <div className="flex flex-col p-1.5 gap-1 bg-[var(--bg-inset)]">
                        {group.algorithms.map((alg) => {
                          const isActive = alg.id === activeAlgorithmId;
                          return (
                            <Button
                              key={alg.id}
                              selected={isActive}
                              variant={isActive ? "primary" : "ghost"}
                              size="sm"
                              fullWidth
                              icon={
                                isActive ? <Check className="w-3.5 h-3.5 shrink-0" /> : undefined
                              }
                              onClick={() => handleSelect(alg.id, alg.category)}
                              className="justify-start text-left font-normal"
                            >
                              <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                                {alg.title}
                              </span>
                              <SourceBadgeList sources={getAlgorithmSources(alg)} size="sm" />
                              {alg.difficulty !== undefined ? (
                                <Badge size="sm" variant={difficultyBadgeVariant(alg.difficulty)}>
                                  {alg.difficulty}
                                </Badge>
                              ) : null}
                            </Button>
                          );
                        })}
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default QuickAccessDrawer;
