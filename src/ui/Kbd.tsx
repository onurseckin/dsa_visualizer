import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type KbdProps = HTMLAttributes<HTMLElement>;

export function Kbd({ className, children, ...rest }: KbdProps): React.ReactElement {
  return (
    <kbd className={cx('ui-kbd', className)} {...rest}>
      {children}
    </kbd>
  );
}
