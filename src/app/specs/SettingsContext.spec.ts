import { createElement, type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useSettings } from '../SettingsContext';

const SPEED_STORAGE_KEY = 'dsa_visualizer_playback_speed';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(SettingsProvider, null, children);

const renderSettings = () => renderHook(() => useSettings(), { wrapper });

afterEach(() => {
  window.localStorage.clear();
});

/* Playback speed (R6.5-style preference, but app-wide rather than page-scoped):
   a user sets it once from the workspace's Speed slider and expects every
   future algorithm/reload to keep it, same as a media player. Persisted
   through SettingsContext's own readStored/writeStored discipline — reads
   validate and fall back, writes are best-effort. */
describe('SettingsContext playback speed persistence', () => {
  it('defaults to 300ms when nothing is stored', () => {
    const { result } = renderSettings();
    expect(result.current.speed).toBe(300);
  });

  it('restores a previously written speed across a fresh mount (reload)', () => {
    const first = renderSettings();
    act(() => {
      first.result.current.setSpeed(700);
    });
    expect(first.result.current.speed).toBe(700);
    expect(window.localStorage.getItem(SPEED_STORAGE_KEY)).toBe('700');

    // A reload is just another provider mount reading the same key.
    const second = renderSettings();
    expect(second.result.current.speed).toBe(700);
  });

  it('round-trips repeated speed changes, always persisting the latest value', () => {
    const { result } = renderSettings();

    act(() => result.current.setSpeed(50));
    expect(window.localStorage.getItem(SPEED_STORAGE_KEY)).toBe('50');

    act(() => result.current.setSpeed(1000));
    expect(result.current.speed).toBe(1000);
    expect(window.localStorage.getItem(SPEED_STORAGE_KEY)).toBe('1000');
  });

  it('falls back to the default for malformed JSON', () => {
    window.localStorage.setItem(SPEED_STORAGE_KEY, '{not json');
    const { result } = renderSettings();
    expect(result.current.speed).toBe(300);
  });

  it('falls back to the default for a stored value of the wrong type', () => {
    window.localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify('fast'));
    const { result } = renderSettings();
    expect(result.current.speed).toBe(300);
  });

  it.each([
    ['below the slider floor', 49],
    ['above the slider ceiling', 1001],
    ['non-finite', Number.POSITIVE_INFINITY],
    ['NaN', Number.NaN],
  ])('falls back to the default for a stored speed that is %s', (_label, badSpeed) => {
    window.localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify(badSpeed));
    const { result } = renderSettings();
    expect(result.current.speed).toBe(300);
  });

  it('accepts the slider bounds themselves', () => {
    window.localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify(50));
    expect(renderSettings().result.current.speed).toBe(50);

    window.localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify(1000));
    expect(renderSettings().result.current.speed).toBe(1000);
  });
});
