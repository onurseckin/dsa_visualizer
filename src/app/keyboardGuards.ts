/* Shared guards for the app's global keyboard shortcuts (DESIGN.md R6.6).

   Two independent owners bind window-level keys — the navbar's "/" search and the
   workspace's playback keys — and they have to agree on when to stay out of the
   way. Both guards live here so that agreement is one definition instead of two
   copies that can drift into a state where "/" types into a field but ArrowRight
   does not, or vice versa. */

/* `isContentEditable` is the signal that matters in a browser — it is true inside a
   contenteditable ancestor, not just on the host element — but jsdom leaves it
   `undefined`, which would make this predicate return `undefined` instead of the
   boolean it promises. The attribute lookup is the fallback that keeps both the
   contract and the guard's coverage honest. */
const isEditableTarget = (element: HTMLElement): boolean =>
  element.isContentEditable === true ||
  element.closest('[contenteditable=""], [contenteditable="true"]') !== null;

/**
 * Whether the event target is somewhere the user is typing, so a shortcut must
 * yield. `select` and `input[type=range]` count: arrow keys already adjust the
 * focused slider or option list, which is what the playback keys would steal.
 */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditableTarget(target);
};

/**
 * Whether a modal surface currently owns the keyboard. The search drawer and every
 * ConfirmDialog render `role="dialog"`, so one query covers both — a shortcut that
 * fired underneath an open dialog would act on a workspace the user cannot see.
 */
export const isDialogOpen = (): boolean =>
  typeof document !== "undefined" && document.querySelector('[role="dialog"]') !== null;
