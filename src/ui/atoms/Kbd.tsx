import type { HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cx } from "../cx";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export function Kbd({
  className,
  children,
  asChild = false,
  ...rest
}: KbdProps): React.ReactElement {
  const Comp = asChild ? Slot : "kbd";
  return (
    <Comp
      className={cx(
        "ui-kbd inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xs",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}
