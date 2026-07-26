import type { HTMLAttributes, ReactNode } from "react";
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
}: {
  icon?: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}): React.ReactElement | null {
  const hasContent =
    title !== undefined || icon !== undefined || actions !== undefined || children !== undefined;
  if (!hasContent) return null;

  return (
    <div className="ui-card__header">
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

export function CardTitle({ children }: { children: ReactNode }): React.ReactElement {
  return <div className="ui-card__title">{children}</div>;
}

export function CardActions({ children }: { children: ReactNode }): React.ReactElement {
  return <div className="ui-card__actions">{children}</div>;
}

export function CardBody({
  padding = "md",
  children,
}: {
  padding?: "none" | "sm" | "md";
  children: ReactNode;
}): React.ReactElement {
  return <div className={`ui-card__body ui-card__body--${padding}`}>{children}</div>;
}

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

  return (
    <div className={cx("ui-card", isInset && "ui-card--inset", className)} {...rest}>
      <CardHeader icon={icon} title={title} actions={actions} />
      <CardBody padding={padding}>{children}</CardBody>
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Actions = CardActions;
Card.Body = CardBody;
