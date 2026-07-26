import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { cx } from "./cx";

export interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PanelHeader({
  title,
  icon,
  subtitle,
  actions,
  className,
  ...rest
}: PanelHeaderProps): ReactElement {
  return (
    <div className={cx("ui-panel-header", className)} {...rest}>
      {icon !== undefined && icon !== null ? (
        <span className="ui-panel-header__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="ui-panel-header__title">
        {title}
        {subtitle !== undefined && subtitle !== null ? (
          <span className="ui-panel-header__subtitle"> {subtitle}</span>
        ) : null}
      </div>
      {actions !== undefined && actions !== null ? (
        <div className="ui-panel-header__actions">{actions}</div>
      ) : null}
    </div>
  );
}
