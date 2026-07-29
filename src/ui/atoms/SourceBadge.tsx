import React from "react";
import { Book } from "lucide-react";
import type {
  ProblemSource,
  BookSource,
  LeetCodeSource,
  StandardSource,
  SourceKind,
  MlInfraSource,
} from "../../types/dsa";
import { getSourceKind } from "../../types/dsa";
import type { BadgeSize } from "./Badge";
import { Badge } from "./Badge";
import { LeetCodeBadge } from "./LeetCodeBadge";
import { cx } from "../cx";
import type { LearningSource } from "../../learning/types";

export type {
  ProblemSource,
  BookSource,
  LeetCodeSource,
  StandardSource,
  SourceKind,
  MlInfraSource,
};

export interface BookBadgeProps {
  book?: BookSource;
  bookTitle?: string;
  chapter?: number | string;
  chapterTitle?: string;
  section?: string | number;
  shortTitle?: string;
  size?: BadgeSize;
  className?: string;
}

export const BookBadge: React.FC<BookBadgeProps> = ({
  book,
  bookTitle: bookTitleProp,
  chapter: chapterProp,
  chapterTitle: chapterTitleProp,
  section: sectionProp,
  shortTitle: shortTitleProp,
  size = "sm",
  className,
}) => {
  if (!book && (chapterProp === undefined || chapterProp === null)) {
    return null;
  }

  const bookTitle = book?.bookTitle ?? bookTitleProp ?? "Competitive Programmer's Handbook";
  const chapter = book?.chapter ?? chapterProp;
  const chapterTitle = book?.chapterTitle ?? chapterTitleProp ?? "";
  const section = book?.section ?? sectionProp ?? "";
  const shortTitle = book?.shortTitle ?? shortTitleProp;

  if (chapter === undefined || chapter === null) {
    return (
      <Badge
        variant="neutral"
        size={size}
        className={cx(
          "inline-flex items-center gap-1.5 font-mono text-cyan-300 border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 transition-colors",
          className,
        )}
        title={bookTitle}
        aria-label={bookTitle}
      >
        <Book className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
        <span>{shortTitle ?? bookTitle}</span>
      </Badge>
    );
  }

  const shortName =
    shortTitle ??
    (bookTitle.toLowerCase().includes("competitive programmer") ? "CP Handbook" : bookTitle);

  let titleText = `${bookTitle} — Chapter ${chapter}`;
  if (chapterTitle && section) {
    titleText += `: ${chapterTitle} (${section})`;
  } else if (chapterTitle) {
    titleText += `: ${chapterTitle}`;
  } else if (section) {
    titleText += ` (${section})`;
  }

  return (
    <Badge
      variant="neutral"
      size={size}
      className={cx(
        "inline-flex items-center gap-1.5 font-mono text-cyan-300 border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 transition-colors",
        className,
      )}
      title={titleText}
      aria-label={titleText}
    >
      <Book className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
      <span>
        {shortName} Ch {chapter}
      </span>
    </Badge>
  );
};

export interface StandardBadgeProps {
  size?: BadgeSize;
  className?: string;
  label?: string;
}

export const StandardBadge: React.FC<StandardBadgeProps> = ({
  size = "sm",
  className,
  label = "Standard",
}) => {
  return (
    <Badge
      variant="neutral"
      size={size}
      className={cx("font-mono text-text-muted border-border-subtle bg-bg-surface", className)}
      title={`${label} CS Algorithm`}
      aria-label={`${label} CS Algorithm`}
    >
      {label}
    </Badge>
  );
};

export interface MlInfraBadgeProps {
  size?: BadgeSize;
  className?: string;
  label?: string;
}

export const MlInfraBadge: React.FC<MlInfraBadgeProps> = ({
  size = "sm",
  className,
  label = "ML Infra",
}) => {
  return (
    <Badge
      variant="neutral"
      size={size}
      className={cx(
        "inline-flex items-center gap-1.5 font-mono text-purple-300 border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 transition-colors",
        className,
      )}
      title={`${label} Problem`}
      aria-label={`${label} Problem`}
    >
      <span>{label}</span>
    </Badge>
  );
};

export interface SourceBadgeProps {
  source?: ProblemSource | LearningSource;
  size?: BadgeSize;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, size = "sm", className }) => {
  if (!source) {
    return null;
  }

  if ("provenance" in source && source.provenance === "unverified") {
    const label = source.label;
    const provenanceLabel = `${label} — source URL unverified`;
    return (
      <Badge
        variant="neutral"
        size={size}
        className={cx("font-mono text-text-muted border-border-subtle bg-bg-surface", className)}
        title={provenanceLabel}
        aria-label={provenanceLabel}
      >
        {label}
      </Badge>
    );
  }

  const kind = "kind" in source && source.kind ? source.kind : getSourceKind(source);

  if (kind === "leetcode") {
    const leetcodeSource = source as LeetCodeSource;
    const id = leetcodeSource.id ?? leetcodeSource.leetcodeId;
    const url = leetcodeSource.url;
    if (id && url) {
      return <LeetCodeBadge leetcode={{ id, url }} size={size} className={className} />;
    }
  }

  if (kind === "book") {
    return <BookBadge book={source as BookSource} size={size} className={className} />;
  }

  if (kind === "standard") {
    const stdSource = source as StandardSource;
    return (
      <StandardBadge size={size} className={className} label={stdSource.label ?? "Standard"} />
    );
  }

  if (kind === "ml_infra") {
    return <MlInfraBadge size={size} className={className} label={source.label ?? "ML Infra"} />;
  }

  return null;
};

export interface SourceBadgeListProps {
  sources?: readonly (ProblemSource | LearningSource)[];
  leetcode?: { id: number; url: string };
  size?: BadgeSize;
  className?: string;
}

export const SourceBadgeList: React.FC<SourceBadgeListProps> = ({
  sources,
  leetcode,
  size = "sm",
  className = "inline-flex items-center gap-1.5 flex-wrap",
}) => {
  const effectiveSources: readonly (ProblemSource | LearningSource)[] =
    sources && sources.length > 0
      ? sources
      : leetcode
        ? [
            {
              kind: "leetcode",
              type: "leetcode",
              id: leetcode.id,
              leetcodeId: leetcode.id,
              url: leetcode.url,
            },
          ]
        : [];

  return (
    <div className={className}>
      {effectiveSources.map((src, i) => (
        <SourceBadge key={i} source={src} size={size} />
      ))}
    </div>
  );
};

export default SourceBadge;
