import React from "react";
import { TopicId, DifficultyLevel, LeetCodeMeta, ProblemSource } from "../../types/dsa";
import { getTopicLabel } from "../../app/topics";
import { Badge, difficultyBadgeVariant, SourceBadgeList } from "../../ui";

export interface ProblemHeaderProps {
  title: string;
  topicIds: readonly TopicId[];
  difficulty?: DifficultyLevel;
  leetcode?: LeetCodeMeta | { id: number; url: string };
  sources?: ProblemSource[];
  className?: string;
  style?: React.CSSProperties;
}

export const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  title,
  topicIds,
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
        <Badge variant={difficultyBadgeVariant(difficulty)} size="md">
          {difficulty}
        </Badge>
        <SourceBadgeList sources={sources} leetcode={leetcode} size="md" />
        {topicIds.map((topicId) => (
          <Badge key={topicId} variant="neutral" size="md">
            {getTopicLabel(topicId)}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ProblemHeader;
