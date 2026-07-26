import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import type { CategoryType } from "../types/dsa";
import { getAllAlgorithms } from "../algorithms/registry";
import { Badge, Button, Collapsible, Drawer, Input, difficultyBadgeVariant } from "../ui";

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
  const [openMap, setOpenMap] = useState<Partial<Record<CategoryType, boolean>>>(() =>
    activeCategoryId !== undefined ? { [activeCategoryId]: true } : {},
  );

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setOpenMap(activeCategoryId !== undefined ? { [activeCategoryId]: true } : {});
  }, [isOpen, activeCategoryId]);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const categoryIdSet = useMemo(() => new Set(categories.map((cat) => cat.id)), [categories]);
  const totalAlgorithms = useMemo(
    () => allAlgorithms.filter((alg) => categoryIdSet.has(alg.category)).length,
    [allAlgorithms, categoryIdSet],
  );

  const groups = useMemo(() => {
    return categories
      .map((cat) => {
        const catAlgorithms = allAlgorithms.filter((alg) => alg.category === cat.id);
        const matches = !isSearching
          ? catAlgorithms
          : catAlgorithms.filter(
              (alg) =>
                alg.title.toLowerCase().includes(query) ||
                alg.description.toLowerCase().includes(query) ||
                cat.label.toLowerCase().includes(query) ||
                (alg.difficulty?.toLowerCase().includes(query) ?? false),
            );
        return { category: cat, algorithms: matches, totalCount: catAlgorithms.length };
      })
      .filter((group) => !isSearching || group.algorithms.length > 0);
  }, [categories, allAlgorithms, isSearching, query]);

  const handleSelect = (algorithmId: string, categoryFolder: CategoryType) => {
    onSelectAlgorithm(algorithmId, categoryFolder);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Algorithms" width={420}>
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

        {groups.length === 0 ? (
          <p className="m-0 py-6 px-2 text-center text-sm text-[var(--text-muted)]">
            No algorithms match “{searchQuery.trim()}”
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <Collapsible
                key={group.category.id}
                title={group.category.label}
                className="border-[var(--border-default)]"
                style={{ borderColor: "var(--border-default)" }}
                meta={
                  <Badge size="sm" variant="neutral" className="border-[var(--border-default)]">
                    {isSearching ? group.algorithms.length : group.totalCount}
                  </Badge>
                }
                open={isSearching ? true : openMap[group.category.id] === true}
                onOpenChange={(open) => {
                  if (isSearching) return;
                  setOpenMap((prev) => ({ ...prev, [group.category.id]: open }));
                }}
              >
                <div className="flex flex-col gap-1">
                  {group.algorithms.map((alg) => {
                    const isActive = alg.id === activeAlgorithmId;
                    return (
                      <Button
                        key={alg.id}
                        fullWidth
                        selected={isActive}
                        icon={isActive ? <Check /> : undefined}
                        onClick={() => handleSelect(alg.id, alg.category)}
                        className="justify-start"
                      >
                        <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                          {alg.title}
                        </span>
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
    </Drawer>
  );
}

export default QuickAccessDrawer;
