import type { HTMLAttributes, ReactNode } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import { ChevronRight } from "lucide-react";
import { cx } from "../cx";

export interface CollapsibleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "defaultChecked"
> {
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
}

export function CollapsibleHeader({
  title,
  meta,
  isOpen,
  contentId,
  children,
  className,
  ...props
}: {
  title?: ReactNode;
  meta?: ReactNode;
  isOpen?: boolean;
  contentId?: string;
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}): React.ReactElement {
  if (isOpen !== undefined || contentId !== undefined) {
    return (
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cx("ui-collapsible__header", className)}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className="ui-collapsible__chevron" aria-hidden="true">
          <ChevronRight />
        </span>
        {title !== undefined ? <span className="ui-collapsible__title">{title}</span> : null}
        {meta !== undefined ? <span className="ui-collapsible__meta">{meta}</span> : null}
        {children}
      </button>
    );
  }

  return (
    <BaseCollapsible.Trigger className={cx("ui-collapsible__header", className)} {...props}>
      <span className="ui-collapsible__chevron" aria-hidden="true">
        <ChevronRight />
      </span>
      {title !== undefined ? <span className="ui-collapsible__title">{title}</span> : null}
      {meta !== undefined ? <span className="ui-collapsible__meta">{meta}</span> : null}
      {children}
    </BaseCollapsible.Trigger>
  );
}

export function CollapsibleTitle({ children }: { children: ReactNode }): React.ReactElement {
  return <span className="ui-collapsible__title">{children}</span>;
}

export function CollapsibleContent({
  className,
  children,
  id,
  ...props
}: {
  className?: string;
  children: ReactNode;
  id?: string;
  [key: string]: unknown;
}): React.ReactElement {
  if (id !== undefined) {
    return (
      <div
        id={id}
        className={cx("ui-collapsible__content p-4 md:p-6", className)}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }

  return (
    <BaseCollapsible.Panel
      className={cx("ui-collapsible__content p-4 md:p-6", className)}
      {...props}
    >
      {children}
    </BaseCollapsible.Panel>
  );
}

export function Collapsible({
  title,
  meta,
  defaultOpen,
  open,
  onOpenChange,
  className,
  contentClassName,
  children,
  ...rest
}: CollapsibleProps): React.ReactElement {
  return (
    <BaseCollapsible.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange ? (isOpen: boolean) => onOpenChange(isOpen) : undefined}
      className={(state) =>
        cx("ui-collapsible", (open ?? state.open) && "ui-collapsible--open", className)
      }
      {...rest}
    >
      <CollapsibleHeader title={title} meta={meta} />
      <CollapsibleContent className={contentClassName}>{children}</CollapsibleContent>
    </BaseCollapsible.Root>
  );
}

Collapsible.Header = CollapsibleHeader;
Collapsible.Title = CollapsibleTitle;
Collapsible.Content = CollapsibleContent;
