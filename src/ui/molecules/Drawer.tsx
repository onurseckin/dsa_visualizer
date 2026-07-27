import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "@base-ui-components/react/dialog";
import { cx } from "../cx";
import { IconButton } from "..";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: "right";
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
  side = "right",
  width = 440,
  children,
  footer,
  className,
  style,
}: DrawerProps): React.ReactElement | null {
  const resolvedWidth = typeof width === "number" ? `${width}px` : width;

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-drawer-backdrop" />
        <Dialog.Popup
          className={cx("ui-drawer", `ui-drawer--${side}`, className)}
          style={{ width: resolvedWidth, ...style }}
        >
          <div className="ui-drawer__header">
            <Dialog.Title className="ui-drawer__title">{title}</Dialog.Title>
            <Dialog.Close
              render={<IconButton icon={<X />} aria-label="Close" variant="ghost" size="sm" />}
            />
          </div>
          <div className="ui-drawer__body">{children}</div>
          {footer !== undefined ? <div className="ui-drawer__footer">{footer}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
