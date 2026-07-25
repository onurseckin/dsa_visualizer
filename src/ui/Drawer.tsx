import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cx } from './cx';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: 'right';
  /* Numbers are px. The panel is always capped at 92vw by .ui-drawer. */
  width?: number | string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  side = 'right',
  width = 440,
  children,
  footer,
  className,
  style,
}: DrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;

  return createPortal(
    <>
      <div className="ui-drawer-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('ui-drawer', `ui-drawer--${side}`, className)}
        style={{ width: resolvedWidth, ...style }}
      >
        <div className="ui-drawer__header">
          <h2 id={titleId} className="ui-drawer__title">
            {title}
          </h2>
          <IconButton icon={<X />} aria-label="Close" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div className="ui-drawer__body">{children}</div>
        {footer !== undefined ? <div className="ui-drawer__footer">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}
