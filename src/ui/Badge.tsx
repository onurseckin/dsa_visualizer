import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import type { DifficultyLevel } from '../types/dsa';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function difficultyBadgeVariant(difficulty: DifficultyLevel): BadgeVariant {
  switch (difficulty) {
    case 'Easy':
      return 'success';
    case 'Medium':
      return 'warning';
    case 'Hard':
      return 'danger';
  }
}

export function Badge({ variant = 'neutral', size = 'sm', className, children, ...rest }: BadgeProps): React.ReactElement {
  return (
    <span
      className={cx('ui-badge', `ui-badge--${variant}`, `ui-badge--${size}`, className)}
      {...rest}
    >
      {children}
    </span>
  );
}
