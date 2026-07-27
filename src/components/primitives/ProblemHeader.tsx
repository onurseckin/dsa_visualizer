import React from "react";
import { CategoryType, DifficultyLevel, LeetCodeMeta, ProblemSource } from "../../types/dsa";
import { Badge, difficultyBadgeVariant, SourceBadgeList } from "../../ui";

export interface ProblemHeaderProps {
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  leetcode?: LeetCodeMeta | { id: number; url: string };
  sources?: ProblemSource[];
  className?: string;
  style?: React.CSSProperties;
}

export const humanizeCategory = (category: string): string => {
  const spaced = category.replace(/[-_]/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  title,
  category,
  difficulty = "Easy",
  leetcode,
  sources,
  className = "",
  style,
}) => {
  return (
    <div
      data-testid="problem-header"
      className={`flex items-center justify-between flex-wrap gap-3 ${className}`}
      style={style}
    >
      <div className="flex items-center flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--text-primary)] m-0">
          {title}
        </h1>
        <Badge variant={difficultyBadgeVariant(difficulty)} size="sm">
          {difficulty}
        </Badge>
        <Badge variant="neutral" size="sm">
          {humanizeCategory(category)}
        </Badge>
        <SourceBadgeList sources={sources} leetcode={leetcode} size="md" />
      </div>
    </div>
  );
};

export default ProblemHeader;
