import React, { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type CardVariant = "default" | "inset";

/* `title` is redeclared as ReactNode, so the native string tooltip attr is omitted. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  padding?: "none" | "sm" | "md";
  inset?: boolean;
  variant?: CardVariant;
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
    <div className={cx("ui-card__header", className)}>
      {icon !== undefined && icon !== null ? (
        <span className="ui-card__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {title !== undefined ? <div className="ui-card__title">{title}</div> : null}
      {actions !== undefined ? <div className="ui-card__actions">{actions}</div> : null}
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
  return <div className={cx("ui-card__title", className)}>{children}</div>;
}
CardTitle.displayName = "CardTitle";

export function CardActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return <div className={cx("ui-card__actions", className)}>{children}</div>;
}
CardActions.displayName = "CardActions";

export function CardBody({
  padding = "md",
  children,
  className,
}: {
  padding?: "none" | "sm" | "md";
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cx("ui-card__body", `ui-card__body--${padding}`, className)}>{children}</div>
  );
}
CardBody.displayName = "CardBody";

export function Card({
  title,
  icon,
  actions,
  padding = "md",
  inset = false,
  variant,
  className,
  children,
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

  return (
    <div className={cx("ui-card", isInset && "ui-card--inset", className)} {...rest}>
      {hasPropHeader && <CardHeader icon={icon} title={title} actions={actions} />}
      {hasCompoundChild ? (
        children
      ) : hasPropHeader ? (
        <CardBody padding={padding}>{children}</CardBody>
      ) : (
        <CardBody padding={padding}>{children}</CardBody>
      )}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Actions = CardActions;
Card.Body = CardBody;
