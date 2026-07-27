import React, { HTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export type CardVariant = "default" | "inset";
export type CardPadding = "none" | "sm" | "md" | "lg";

/* `title` is redeclared as ReactNode, so the native string tooltip attr is omitted. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  inset?: boolean;
  variant?: CardVariant;
  padding?: CardPadding;
  asChild?: boolean;
}

export function CardHeader({
  icon,
  title,
  actions,
  children,
  className,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}): React.ReactElement | null {
  const hasContent =
    title !== undefined || icon !== undefined || actions !== undefined || children !== undefined;
  if (!hasContent) return null;

  return (
    <div
      className={cx(
        "ui-card__header flex items-center justify-between px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-default)]",
        className,
      )}
    >
      {icon !== undefined && icon !== null ? (
        <span className="ui-card__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {title !== undefined ? (
        <div className="ui-card__title flex-1 min-w-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </div>
      ) : null}
      {actions !== undefined ? (
        <div className="ui-card__actions flex items-center gap-2.5 ml-auto">{actions}</div>
      ) : null}
      {children}
    </div>
  );
}
CardHeader.displayName = "CardHeader";

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cx(
        "ui-card__title flex-1 min-w-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
CardTitle.displayName = "CardTitle";

export function CardActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cx("ui-card__actions flex items-center gap-2.5 ml-auto", className)}>
      {children}
    </div>
  );
}
CardActions.displayName = "CardActions";

export function CardBody({
  padding = "md",
  children,
  className,
  id,
  "data-testid": dataTestId,
}: {
  padding?: CardPadding;
  children: ReactNode;
  className?: string;
  id?: string;
  "data-testid"?: string;
}): React.ReactElement {
  const paddingClass =
    padding === "none"
      ? "p-0"
      : padding === "sm"
        ? "p-4 md:p-6"
        : padding === "lg"
          ? "p-8 md:p-10"
          : "p-6 md:p-8";

  return (
    <div
      id={id}
      data-testid={dataTestId}
      className={cx(
        "ui-card__body flex-1 min-h-0",
        padding === "none" ? "ui-card__body--none" : `ui-card__body--${padding}`,
        !className?.includes("p-") && paddingClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
CardBody.displayName = "CardBody";

export function Card({
  title,
  icon,
  actions,
  inset = false,
  variant,
  padding = "md",
  className,
  children,
  asChild = false,
  ...rest
}: CardProps): React.ReactElement {
  const resolvedVariant = variant ?? (inset ? "inset" : "default");
  const isInset = resolvedVariant === "inset";

  const hasPropHeader = title !== undefined || icon !== undefined || actions !== undefined;

  const childrenArray = React.Children.toArray(children);
  const hasCompoundChild = childrenArray.some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === CardHeader ||
        child.type === CardBody ||
        (child.type as { displayName?: string })?.displayName?.startsWith("Card")),
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cx(
        "ui-card flex flex-col min-w-0 border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden",
        isInset ? "ui-card--inset bg-[var(--bg-inset)] shadow-none" : "bg-[var(--bg-surface)]",
        className,
      )}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {hasPropHeader && <CardHeader icon={icon} title={title} actions={actions} />}
          {hasCompoundChild ? children : <CardBody padding={padding}>{children}</CardBody>}
        </>
      )}
    </Comp>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Actions = CardActions;
Card.Body = CardBody;
