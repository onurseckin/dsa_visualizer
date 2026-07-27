import React from "react";
import { ArrowUpDown, Code2, Play } from "lucide-react";
import { AlgorithmDefinition, CategoryType } from "../../types/dsa";
import { Badge, Button, Card, difficultyBadgeVariant } from "../index";
import {
  CATEGORY_LABELS,
  ProblemListSortField,
} from "../../components/problem-list/problemListUtils";

interface ProblemTableProps {
  filteredAlgorithms: AlgorithmDefinition[];
  sortBy: ProblemListSortField;
  onToggleSort: (field: ProblemListSortField) => void;
  onSelectAlgorithm: (algorithmId: string, categoryFolder?: CategoryType) => void;
}

export const ProblemTable: React.FC<ProblemTableProps> = ({
  filteredAlgorithms,
  sortBy,
  onToggleSort,
  onSelectAlgorithm,
}) => {
  const sortableHeader = (label: string, field: ProblemListSortField) => (
    <th className="px-6 py-5 bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-default)]">
      <Button
        size="sm"
        selected={sortBy === field}
        icon={<ArrowUpDown />}
        onClick={() => onToggleSort(field)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
      >
        {label}
      </Button>
    </th>
  );

  return (
    <Card
      className="border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div style={{ overflowX: "auto" }}>
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
            <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
              <th className="px-6 py-5 bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-default)] w-[60px]">
                #
              </th>
              {sortableHeader("Problem title", "title")}
              {sortableHeader("Topic / category", "category")}
              {sortableHeader("Difficulty", "difficulty")}
              <th className="px-6 py-5 bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-default)]">
                Time complexity
              </th>
              <th className="px-6 py-5 bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-default)]">
                Space complexity
              </th>
              <th className="px-6 py-5 bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-default)] text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlgorithms.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)] text-center text-[var(--text-muted)]"
                >
                  No matching problems found. Try adjusting your search query or filters.
                </td>
              </tr>
            ) : (
              filteredAlgorithms.map((alg, index) => {
                const catLabel = CATEGORY_LABELS[alg.category] || alg.category;

                return (
                  <tr
                    key={alg.id}
                    role="row"
                    tabIndex={0}
                    aria-label={`Open visualization for ${alg.title}`}
                    onClick={() => onSelectAlgorithm(alg.id, alg.category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectAlgorithm(alg.id, alg.category);
                      }
                    }}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer outline-none focus:bg-[var(--bg-hover)] focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--border-accent)]"
                  >
                    <td className="px-6 py-4 w-[60px] font-mono text-sm text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                      <span className="inline-flex items-center gap-2.5">
                        <Code2
                          aria-hidden="true"
                          size={16}
                          className="text-[var(--text-secondary)] shrink-0"
                        />
                        <span>{alg.title}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                      <Badge
                        variant={
                          alg.difficulty ? difficultyBadgeVariant(alg.difficulty) : "neutral"
                        }
                        className="px-3 py-1 text-xs rounded-full border border-[var(--border-subtle)]"
                      >
                        {catLabel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                      {alg.difficulty && (
                        <span
                          className={`px-3 py-1 text-xs rounded-full border font-medium ${
                            alg.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : alg.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {alg.difficulty}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)] font-mono text-[var(--text-secondary)]">
                      {alg.timeComplexity?.average || "O(N)"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)] font-mono text-[var(--text-secondary)]">
                      {alg.spaceComplexity || "O(1)"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-primary)] border-b border-[var(--border-subtle)] text-center">
                      <Button
                        size="sm"
                        icon={<Play />}
                        className="min-h-[36px] px-3.5 py-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlgorithm(alg.id, alg.category);
                        }}
                      >
                        Visualize
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
