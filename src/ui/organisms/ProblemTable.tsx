import React from "react";
import { ArrowUpDown, Code2, Play } from "lucide-react";
import { AlgorithmDefinition, CategoryType } from "../../types/dsa";

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
    <th className="bg-[#1a1a22] text-xs font-bold uppercase tracking-widest text-neutral-400 py-4.5 px-6 border-b border-white/10">
      <button
        onClick={() => onToggleSort(field)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 cursor-pointer hover:text-white bg-transparent border-none p-0 w-full text-left font-[inherit]"
      >
        {label}
        {sortBy === field && <ArrowUpDown size={14} className="ml-1" />}
      </button>
    </th>
  );

  return (
    <div className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
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
                  className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 text-center"
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
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer outline-none focus:bg-white/5 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                  >
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 font-mono w-[60px]">
                      {index + 1}
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 font-semibold">
                      <span className="inline-flex items-center gap-2.5">
                        <Code2
                          aria-hidden="true"
                          size={16}
                          className="text-neutral-400 shrink-0"
                        />
                        <span>{alg.title}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200">
                      <span className="px-3 py-1 text-xs rounded-full border border-white/10 bg-white/5 text-neutral-300">
                        {catLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200">
                      {alg.difficulty && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alg.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : alg.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {alg.difficulty}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 font-mono text-neutral-400">
                      {alg.timeComplexity?.average || "O(N)"}
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 font-mono text-neutral-400">
                      {alg.spaceComplexity || "O(1)"}
                    </td>
                    <td className="py-4 px-6 border-b border-white/5 text-sm text-neutral-200 text-center">
                      <button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 mx-auto cursor-pointer border-none"
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
