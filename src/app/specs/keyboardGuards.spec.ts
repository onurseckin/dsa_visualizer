import { afterEach, describe, expect, it } from 'vitest';
import { isDialogOpen, isTypingTarget } from '../keyboardGuards';

const added: HTMLElement[] = [];

const mount = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  added.push(host);
  return host.firstElementChild as HTMLElement;
};

afterEach(() => {
  added.splice(0).forEach((host) => host.remove());
});

describe('isTypingTarget', () => {
  it('claims every field the user types or arrows through', () => {
    expect(isTypingTarget(mount('<input />'))).toBe(true);
    expect(isTypingTarget(mount('<input type="range" />'))).toBe(true);
    expect(isTypingTarget(mount('<textarea></textarea>'))).toBe(true);
    expect(isTypingTarget(mount('<select><option>a</option></select>'))).toBe(true);
    expect(isTypingTarget(mount('<div contenteditable="true">note</div>'))).toBe(true);
  });

  it('claims a node nested inside a contenteditable region', () => {
    const region = mount('<div contenteditable="true"><span>note</span></div>');
    expect(isTypingTarget(region.querySelector('span'))).toBe(true);
  });

  it('leaves buttons, plain elements and non-element targets to the shortcut', () => {
    expect(isTypingTarget(mount('<button>Play</button>'))).toBe(false);
    expect(isTypingTarget(mount('<div>text</div>'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
  });
});

describe('isDialogOpen', () => {
  it('is false with nothing modal mounted', () => {
    expect(isDialogOpen()).toBe(false);
  });

  it('is true for a drawer or a confirm dialog, and false again once it unmounts', () => {
    const host = mount('<div role="dialog">Reset workspace layout?</div>');
    expect(isDialogOpen()).toBe(true);

    host.remove();
    expect(isDialogOpen()).toBe(false);
  });
});
