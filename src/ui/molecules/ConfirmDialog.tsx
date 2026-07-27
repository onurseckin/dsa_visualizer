import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { cx } from "../cx";
import { Button } from "..";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /* Explain what the user is about to lose, not just "are you sure?". */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps): React.ReactElement | null {
  const titleId = useId();
  const messageId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-dialog-backdrop" />
        <Dialog.Popup
          aria-labelledby={titleId}
          aria-describedby={messageId}
          className={cx("ui-dialog", className)}
        >
          <Dialog.Title id={titleId} className="ui-dialog__title">
            {title}
          </Dialog.Title>
          <Dialog.Description id={messageId} className="ui-dialog__body">
            {message}
          </Dialog.Description>
          <div className="ui-dialog__actions">
            <Dialog.Close render={<Button variant="ghost" />}>{cancelLabel}</Dialog.Close>
            <Button
              ref={confirmRef}
              variant={destructive ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
