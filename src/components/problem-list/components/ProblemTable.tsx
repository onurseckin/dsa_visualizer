import React from "react";
import { ArrowUpDown, Code2, Play } from "lucide-react";
import { AlgorithmDefinition, CategoryType } from "../../../types/dsa";
import { Badge, Button, Card, difficultyBadgeVariant } from "../../../ui";
import {
  CATEGORY_LABELS,
  PANEL_BORDER,
  ProblemListSortField,
  cellPadding,
} from "../problemListUtils";

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
    <th style={{ padding: cellPadding, background: "var(--bg-elevated)" }}>
      <Button
        size="sm"
        selected={sortBy === field}
        icon={<ArrowUpDown />}
        onClick={() => onToggleSort(field)}
        aria-label={`Sort by ${label.toLowerCase()}`}
        style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}
      >
        {label}
      </Button>
    </th>
  );

  return (
    <Card padding="none" style={PANEL_BORDER}>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            tableLayout: "auto",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "var(--text-md)",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border-default)",
                color: "var(--text-muted)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
              }}
            >
              <th
                style={{
                  padding: cellPadding,
                  width: "50px",
                  fontWeight: 600,
                  background: "var(--bg-elevated)",
                }}
              >
                #
              </th>
              {sortableHeader("Problem title", "title")}
              {sortableHeader("Topic / category", "category")}
              {sortableHeader("Difficulty", "difficulty")}
              <th
                style={{ padding: cellPadding, fontWeight: 600, background: "var(--bg-elevated)" }}
              >
                Time complexity
              </th>
              <th
                style={{ padding: cellPadding, fontWeight: 600, background: "var(--bg-elevated)" }}
              >
                Space complexity
              </th>
              <th
                style={{
                  padding: cellPadding,
                  textAlign: "center",
                  fontWeight: 600,
                  background: "var(--bg-elevated)",
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlgorithms.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "var(--space-8)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
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
                    style={{
                      borderBottom: "1px solid var(--border-default)",
                      transition: "background var(--transition-fast)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                      e.currentTarget.style.outline = "2px solid var(--border-accent)";
                      e.currentTarget.style.outlineOffset = "-2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.outline = "none";
                    }}
                  >
                    <td
                      style={{
                        padding: cellPadding,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-code)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: cellPadding,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                        }}
                      >
                        <Code2
                          aria-hidden="true"
                          size={16}
                          style={{ color: "var(--text-secondary)", flexShrink: 0 }}
                        />
                        <span>{alg.title}</span>
                      </span>
                    </td>
                    <td style={{ padding: cellPadding }}>
                      <Badge variant="neutral" style={PANEL_BORDER}>
                        {catLabel}
                      </Badge>
                    </td>
                    <td style={{ padding: cellPadding }}>
                      {alg.difficulty && (
                        <Badge variant={difficultyBadgeVariant(alg.difficulty)}>
                          {alg.difficulty}
                        </Badge>
                      )}
                    </td>
                    <td
                      style={{
                        padding: cellPadding,
                        fontFamily: "var(--font-code)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {alg.timeComplexity?.average || "O(N)"}
                    </td>
                    <td
                      style={{
                        padding: cellPadding,
                        fontFamily: "var(--font-code)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {alg.spaceComplexity || "O(1)"}
                    </td>
                    <td style={{ padding: cellPadding, textAlign: "center" }}>
                      <Button
                        size="sm"
                        icon={<Play />}
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
