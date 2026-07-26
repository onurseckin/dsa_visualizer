import { describe, expect, it } from 'vitest';
import { cx } from '../cx';

describe('cx classname utility', () => {
  it('combines truthy class names and filters falsy values', () => {
    expect(cx('ui-btn', false, 'ui-btn--primary', null, undefined, 'custom-class')).toBe(
      'ui-btn ui-btn--primary custom-class'
    );
  });

  it('returns empty string when no valid classes provided', () => {
    expect(cx(false, null, undefined)).toBe('');
  });
});
