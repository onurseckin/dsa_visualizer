import { useId, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cx } from './cx';

/* `title` is redeclared as ReactNode, so the native string tooltip attr is omitted. */
export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  meta?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const contentId = useId();

  const toggle = () => {
    if (!isControlled) setUncontrolledOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div
      className={cx('ui-collapsible', isOpen && 'ui-collapsible--open', className)}
      {...rest}
    >
      <button
        type="button"
        className="ui-collapsible__header"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
      >
        <span className="ui-collapsible__chevron" aria-hidden="true">
          <ChevronRight />
        </span>
        <span className="ui-collapsible__title">{title}</span>
        {meta !== undefined ? <span className="ui-collapsible__meta">{meta}</span> : null}
      </button>
      {isOpen ? (
        <div id={contentId} className="ui-collapsible__content">
          {children}
        </div>
      ) : null}
    </div>
  );
}
