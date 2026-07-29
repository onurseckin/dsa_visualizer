import React from "react";
import { ArrowRight, ArrowUpDown, ClipboardCheck, Code2, Play } from "lucide-react";
import type { LearningItem } from "../../learning/types";
import { isAlgorithmLearningItem, isRubricLearningItem } from "../../learning/types";

import { getLearningItemTopicLabels } from "../../app/topics";
import { ProblemListSortField } from "../../components/problem-list/problemListUtils";
import { Badge, difficultyBadgeVariant, SourceBadgeList } from "../index";

interface ProblemTableProps {
  filteredAlgorithms: LearningItem[];
  paginatedAlgorithms?: LearningItem[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  sortBy: ProblemListSortField;
  onToggleSort: (field: ProblemListSortField) => void;
  onSelectAlgorithm: (algorithmId: string) => void;
}

export const ProblemTable: React.FC<ProblemTableProps> = ({
  filteredAlgorithms,
  paginatedAlgorithms,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 50,
  sortBy,
  onToggleSort,
  onSelectAlgorithm,
}) => {
  const displayAlgorithms = paginatedAlgorithms || filteredAlgorithms;
  const totalCount = filteredAlgorithms.length;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  const sortableHeader = (label: string, field: ProblemListSortField) => (
    <th className="bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)]">
      <button
        onClick={() => onToggleSort(field)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        aria-pressed={sortBy === field}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] bg-transparent border-none p-0 w-full text-left font-[inherit]"
      >
        {label}
        {sortBy === field && <ArrowUpDown size={14} className="ml-1" />}
      </button>
    </th>
  );

  return (
    <div className="ui-card border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      <div style={{ overflowX: "auto" }}>
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
              <th className="bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)] w-[60px]">
                #
              </th>
              {sortableHeader("Problem title", "title")}
              {sortableHeader("Topic", "topic")}
              {sortableHeader("Difficulty", "difficulty")}
              <th className="bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)]">
                Time complexity
              </th>
              <th className="bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)]">
                Space complexity
              </th>
              <th className="bg-[var(--bg-surface)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)] text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-inset)]">
            {displayAlgorithms.length === 0 ? (
              <tr className="bg-[var(--bg-inset)]">
                <td
                  colSpan={7}
                  className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-muted)] text-center bg-[var(--bg-inset)]"
                >
                  No matching problems found. Try adjusting your search query or filters.
                </td>
              </tr>
            ) : (
              displayAlgorithms.map((alg, index) => {
                const topicLabels = getLearningItemTopicLabels(alg);
                const implementation = isAlgorithmLearningItem(alg) ? alg.algorithm : undefined;
                const timeComplexity = implementation?.timeComplexity.average.trim() || undefined;
                const spaceComplexity = implementation?.spaceComplexity.trim() || undefined;
                const actionLabel = implementation
                  ? "Visualize"
                  : isRubricLearningItem(alg)
                    ? "Assess"
                    : "Open";
                const rowLabel = implementation
                  ? `Open visualization for ${alg.title}`
                  : isRubricLearningItem(alg)
                    ? `Open assessment for ${alg.title}`
                    : `Open learning item for ${alg.title}`;
                const rowNum = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <tr
                    key={alg.id}
                    role="row"
                    tabIndex={0}
                    aria-label={rowLabel}
                    onClick={() => onSelectAlgorithm(alg.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectAlgorithm(alg.id);
                      }
                    }}
                    className="group bg-[var(--bg-inset)] border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer outline-none focus:bg-[var(--bg-surface-hover)] focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--border-accent)]"
                  >
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-muted)] font-mono w-[60px]">
                      {rowNum}
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-semibold">
                      <span className="inline-flex items-center gap-2.5">
                        <Code2
                          aria-hidden="true"
                          size={16}
                          className="text-[var(--text-muted)] shrink-0"
                        />
                        <span>{alg.title}</span>
                        <SourceBadgeList sources={alg.sources} size="sm" />
                      </span>
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)]">
                      <span className="flex flex-wrap gap-1">
                        {topicLabels.map((label) => (
                          <Badge key={label} variant="neutral" size="sm">
                            {label}
                          </Badge>
                        ))}
                      </span>
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)]">
                      {alg.difficulty && (
                        <Badge variant={difficultyBadgeVariant(alg.difficulty)} size="sm">
                          {alg.difficulty}
                        </Badge>
                      )}
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm font-mono text-[var(--text-muted)]">
                      {timeComplexity ?? (
                        <span aria-label="Not applicable" title="Not applicable">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm font-mono text-[var(--text-muted)]">
                      {spaceComplexity ?? (
                        <span aria-label="Not applicable" title="Not applicable">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="bg-[var(--bg-inset)] group-hover:bg-[var(--bg-surface-hover)] group-focus:bg-[var(--bg-surface-hover)] py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-center">
                      <button
                        className="bg-[var(--bg-inset)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 mx-auto cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlgorithm(alg.id);
                        }}
                      >
                        {implementation ? (
                          <Play aria-hidden="true" size={14} fill="currentColor" />
                        ) : isRubricLearningItem(alg) ? (
                          <ClipboardCheck aria-hidden="true" size={14} />
                        ) : (
                          <ArrowRight aria-hidden="true" size={14} />
                        )}
                        {actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Bar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="text-xs font-mono text-[var(--text-muted)]">
            Showing <span className="font-bold text-[var(--text-primary)]">{startIndex}</span>–
            <span className="font-bold text-[var(--text-primary)]">{endIndex}</span> of{" "}
            <span className="font-bold text-[var(--text-primary)]">{totalCount}</span> problems
          </div>

          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-page)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev !== undefined && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-[var(--text-muted)]">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onPageChange(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            p === currentPage
                              ? "bg-[var(--accent)] text-black font-extrabold shadow-md"
                              : "bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-page)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
