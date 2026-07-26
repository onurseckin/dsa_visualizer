import { useId, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cx } from "./cx";

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CollapsibleHeader({
  isOpen,
  contentId,
  onClick,
  title,
  meta,
  children,
}: {
  isOpen?: boolean;
  contentId?: string;
  onClick?: () => void;
  title?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      className="ui-collapsible__header"
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={onClick}
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

export function CollapsibleTitle({ children }: { children: ReactNode }): React.ReactElement {
  return <span className="ui-collapsible__title">{children}</span>;
}

export function CollapsibleContent({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div id={id} className="ui-collapsible__content">
      {children}
    </div>
  );
}

export function Collapsible({
  title,
  meta,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
  ...rest
}: CollapsibleProps): React.ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const contentId = useId();

  const toggle = () => {
    if (!isControlled) setUncontrolledOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div className={cx("ui-collapsible", isOpen && "ui-collapsible--open", className)} {...rest}>
      <CollapsibleHeader
        isOpen={isOpen}
        contentId={contentId}
        onClick={toggle}
        title={title}
        meta={meta}
      />
      {isOpen ? <CollapsibleContent id={contentId}>{children}</CollapsibleContent> : null}
    </div>
  );
}

Collapsible.Header = CollapsibleHeader;
Collapsible.Title = CollapsibleTitle;
Collapsible.Content = CollapsibleContent;
