import React from "react";
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  badges,
  className = "",
}: PageHeaderProps): React.ReactElement {
  const isCentered = className.includes("text-center");

  return (
    <div className={cx("w-full pt-6 pb-4 px-4 md:px-8 mb-6 flex flex-col gap-4", className)}>
      <div
        className={cx(
          "flex flex-col md:flex-row md:items-center gap-4 w-full",
          actions
            ? "justify-between"
            : isCentered
              ? "justify-center items-center text-center"
              : "justify-start",
        )}
      >
        <div
          className={cx(
            "flex flex-col gap-2 max-w-3xl",
            isCentered && "items-center text-center mx-auto",
          )}
        >
          {badges ? <div className="flex items-center gap-2 flex-wrap mb-2">{badges}</div> : null}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            {title}
          </h1>
          {description ? (
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
