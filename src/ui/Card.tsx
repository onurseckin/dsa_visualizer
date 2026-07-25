import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

/* `title` is redeclared as ReactNode, so the native string tooltip attr is omitted. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  inset?: boolean;
}

export function Card({
  title,
  icon,
  actions,
  padding = 'md',
  inset = false,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = title !== undefined || icon !== undefined || actions !== undefined;
  return (
    <div className={cx('ui-card', inset && 'ui-card--inset', className)} {...rest}>
      {hasHeader ? (
        <div className="ui-card__header">
          {icon !== undefined && icon !== null ? (
            <span className="ui-card__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {title !== undefined ? <div className="ui-card__title">{title}</div> : null}
          {actions !== undefined ? <div className="ui-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={`ui-card__body ui-card__body--${padding}`}>{children}</div>
    </div>
  );
}
