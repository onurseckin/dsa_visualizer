import type { HTMLAttributes, ReactNode, ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  asChild?: boolean;
}

export function PanelHeader({
  title,
  icon,
  subtitle,
  actions,
  className,
  asChild = false,
  children,
  ...rest
}: PanelHeaderProps): ReactElement {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp className={cx("ui-panel-header", className)} {...rest}>
      {asChild ? (
        children
      ) : (
        <>
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
        </>
      )}
    </Comp>
  );
}
