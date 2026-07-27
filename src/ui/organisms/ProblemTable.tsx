import React from "react";
import { ArrowUpDown, Code2, Play } from "lucide-react";
import { AlgorithmDefinition, CategoryType } from "../../types/dsa";

import {
  CATEGORY_LABELS,
  ProblemListSortField,
} from "../../components/problem-list/problemListUtils";
import { Badge, difficultyBadgeVariant } from "../index";

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
    <th className="bg-[var(--bg-elevated)] text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] py-4.5 px-6 border-b border-[var(--border-default)]">
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
    <div className="ui-card border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-2xl">
      <div style={{ overflowX: "auto" }}>
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#1a1a22] border-b border-white/10">
            <tr className="bg-[#1a1a22] border-b border-white/10">
              <th className="bg-[#1a1a22] text-xs font-bold uppercase tracking-widest text-neutral-400 py-4.5 px-6 border-b border-white/10 w-[60px]">
                #
              </th>
              {sortableHeader("Problem title", "title")}
              {sortableHeader("Topic / category", "category")}
              {sortableHeader("Difficulty", "difficulty")}
              <th className="bg-[#1a1a22] text-xs font-bold uppercase tracking-widest text-neutral-400 py-4.5 px-6 border-b border-white/10">
                Time complexity
              </th>
              <th className="bg-[#1a1a22] text-xs font-bold uppercase tracking-widest text-neutral-400 py-4.5 px-6 border-b border-white/10">
                Space complexity
              </th>
              <th className="bg-[#1a1a22] text-xs font-bold uppercase tracking-widest text-neutral-400 py-4.5 px-6 border-b border-white/10 text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlgorithms.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-muted)] text-center"
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
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-muted)] font-mono w-[60px]">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-semibold">
                      <span className="inline-flex items-center gap-2.5">
                        <Code2
                          aria-hidden="true"
                          size={16}
                          className="text-[var(--text-muted)] shrink-0"
                        />
                        <span>{alg.title}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)]">
                      <Badge variant="neutral" size="sm">
                        {catLabel}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)]">
                      {alg.difficulty && (
                        <Badge variant={difficultyBadgeVariant(alg.difficulty)} size="sm">
                          {alg.difficulty}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm font-mono text-[var(--text-muted)]">
                      {alg.timeComplexity?.average || "O(N)"}
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm font-mono text-[var(--text-muted)]">
                      {alg.spaceComplexity || "O(1)"}
                    </td>
                    <td className="py-4 px-6 border-b border-[var(--border-subtle)] text-sm text-[var(--text-primary)] text-center">
                      <button
                        className="bg-[var(--bg-inset)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 mx-auto cursor-pointer transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlgorithm(alg.id, alg.category);
                        }}
                      >
                        <Play size={14} fill="currentColor" />
                        Visualize
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
