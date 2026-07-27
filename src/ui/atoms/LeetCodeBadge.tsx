import React from "react";
import type { LeetCodeMeta } from "../../types/dsa";
import type { BadgeSize } from "./Badge";
import { Badge } from "./Badge";
import { cx } from "../cx";

export interface LeetCodeBadgeProps {
  leetcode?: LeetCodeMeta | { id: number; url: string };
  size?: BadgeSize;
  className?: string;
}

export const LeetCodeBadge: React.FC<LeetCodeBadgeProps> = ({
  leetcode,
  size = "sm",
  className,
}) => {
  if (!leetcode || !leetcode.id || !leetcode.url) {
    return null;
  }

  return (
    <Badge
      variant="warning"
      size={size}
      className={cx(
        "inline-flex items-center gap-1 font-mono hover:opacity-90 transition-opacity cursor-pointer text-amber-400 border-amber-500/30 bg-amber-500/10",
        className,
      )}
      asChild
    >
      <a
        href={leetcode.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`LeetCode #${leetcode.id}`}
        aria-label={`LeetCode #${leetcode.id}`}
      >
        <span>LC #{leetcode.id}</span>
      </a>
    </Badge>
  );
};

export default LeetCodeBadge;
