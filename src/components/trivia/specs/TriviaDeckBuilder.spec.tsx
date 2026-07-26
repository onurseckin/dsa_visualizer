import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getAllAlgorithms } from '../../../algorithms/registry';
import { TriviaDeckBuilder } from '../TriviaDeckBuilder';

const ALL = getAllAlgorithms();
const TOTAL = ALL.length;

const arraysIds = ALL.filter((algorithm) => algorithm.category === 'arrays_and_hashing').map(
  (algorithm) => algorithm.id,
);

/** The category group is the flex row wrapping the collapsible and its Add all. */
const groupRow = (container: HTMLElement, label: string): HTMLElement => {
  const title = Array.from(container.querySelectorAll<HTMLElement>('.ui-collapsible__title')).find(
    (node) => node.textContent === label,
  );
  const row = title?.closest('.ui-collapsible')?.parentElement;
  if (!row) throw new Error(`no group row for ${label}`);
  return row;
};

const openCategory = (container: HTMLElement, label: string): HTMLElement => {
  const row = groupRow(container, label);
  const header = row.querySelector<HTMLElement>('.ui-collapsible__header');
  if (!header) throw new Error(`no header for ${label}`);
  fireEvent.click(header);
  return row;
};

describe('TriviaDeckBuilder', () => {
  it('groups the whole registry by category in roadmap order', () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const titles = Array.from(container.querySelectorAll('.ui-collapsible__title')).map(
      (node) => node.textContent,
    );
    expect(titles[0]).toBe('Arrays & Hashing');
    expect(titles).toContain('Graph Traversal');
    // Every algorithm's category is represented, none dropped.
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('adds a whole category in one click', () => {
    const onChange = vi.fn();
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    const row = groupRow(container, 'Arrays & Hashing');
    fireEvent.click(within(row).getByRole('button', { name: /add all arrays & hashing/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual(arraysIds);
  });

  it('keeps ids already in the deck when adding a category', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TriviaDeckBuilder deck={['bfs-graph', arraysIds[0]]} onChange={onChange} />,
    );

    const row = groupRow(container, 'Arrays & Hashing');
    fireEvent.click(within(row).getByRole('button', { name: /add all arrays & hashing/i }));

    const next: string[] = onChange.mock.calls[0][0];
    expect(next[0]).toBe('bfs-graph');
    expect(next.filter((id) => id === arraysIds[0])).toHaveLength(1);
    arraysIds.forEach((id) => expect(next).toContain(id));
  });

  it('disables the category add button once that category is complete', () => {
    const { container } = render(<TriviaDeckBuilder deck={arraysIds} onChange={vi.fn()} />);

    const row = groupRow(container, 'Arrays & Hashing');
    expect(within(row).getByRole('button', { name: /add all arrays & hashing/i })).toBeDisabled();
  });

  it('adds every algorithm in one click', () => {
    const onChange = vi.fn();
    render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /add every algorithm/i }));

    expect(onChange.mock.calls[0][0]).toHaveLength(TOTAL);
  });

  it('clears the deck, and offers nothing to clear when it is already empty', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TriviaDeckBuilder deck={['two-sum']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /clear deck/i }));
    expect(onChange).toHaveBeenCalledWith([]);

    rerender(<TriviaDeckBuilder deck={[]} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /clear deck/i })).toBeDisabled();
  });

  it('toggles a single row on and off with the standard selected treatment', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    openCategory(container, 'Arrays & Hashing');
    const row = screen.getByRole('button', { name: /Two Sum/i });
    expect(row).not.toHaveClass('ui-btn--selected');

    fireEvent.click(row);
    expect(onChange).toHaveBeenLastCalledWith(['two-sum']);

    // The group stays open across a deck change — the open state is the user's.
    rerender(<TriviaDeckBuilder deck={['two-sum']} onChange={onChange} />);
    const selectedRow = screen.getByRole('button', { name: /Two Sum/i });
    expect(selectedRow).toHaveClass('ui-btn--selected');
    expect(selectedRow).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(selectedRow);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('reports per-category and overall counts', () => {
    const { container, rerender } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    expect(screen.getByText('0 in deck')).toBeInTheDocument();
    expect(screen.getByText(`0 of ${TOTAL} algorithms selected`)).toBeInTheDocument();

    const emptyRow = groupRow(container, 'Arrays & Hashing');
    expect(within(emptyRow).getByText(`0/${arraysIds.length}`)).toBeInTheDocument();

    rerender(<TriviaDeckBuilder deck={[arraysIds[0], 'bfs-graph']} onChange={vi.fn()} />);
    expect(screen.getByText('2 in deck')).toBeInTheDocument();
    expect(screen.getByText(`2 of ${TOTAL} algorithms selected`)).toBeInTheDocument();

    const filledRow = groupRow(container, 'Arrays & Hashing');
    const badge = within(filledRow).getByText(`1/${arraysIds.length}`);
    expect(badge).toHaveClass('ui-badge--info');
  });

  it('filters categories and rows by the search input', () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/filter algorithms by title or topic/i);
    expect(input).toHaveClass('ui-input__field');

    fireEvent.change(input, { target: { value: 'two sum' } });
    const titles = Array.from(container.querySelectorAll('.ui-collapsible__title')).map(
      (node) => node.textContent,
    );
    expect(titles).toContain('Arrays & Hashing');
    expect(titles).not.toContain('Graph Traversal');
    expect(screen.getByText(/1 shown|2 shown/)).toBeInTheDocument();

    openCategory(container, 'Arrays & Hashing');
    expect(screen.getByRole('button', { name: /Two Sum/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bubble Sort/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
  });

  it('matches a category by name as well as an algorithm title', () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: 'geometry' },
    });

    const titles = Array.from(container.querySelectorAll('.ui-collapsible__title')).map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(['Geometry & Sweep Line']);
  });

  it('tells the user when nothing matches', () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: 'zzzz' },
    });

    expect(screen.getByText(/no algorithm matches that filter/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-collapsible')).toHaveLength(0);
  });

  it('adds only the rows the filter left visible when adding a category', () => {
    const onChange = vi.fn();
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText(/filter algorithms/i), {
      target: { value: 'two sum' },
    });
    const row = groupRow(container, 'Arrays & Hashing');
    fireEvent.click(within(row).getByRole('button', { name: /add all arrays & hashing/i }));

    expect(onChange.mock.calls[0][0]).toEqual(['two-sum']);
  });

  it('gives each row its semantic difficulty badge and refuses to wrap the title', () => {
    const { container } = render(<TriviaDeckBuilder deck={[]} onChange={vi.fn()} />);

    const row = openCategory(container, 'Arrays & Hashing');
    const rowButtons = Array.from(
      row.querySelectorAll<HTMLElement>('.ui-collapsible__content .ui-btn'),
    );
    expect(rowButtons.length).toBe(arraysIds.length);

    const variants = new Set<string>();
    rowButtons.forEach((button) => {
      const title = button.querySelector<HTMLElement>('span');
      expect(title?.style.whiteSpace).toBe('nowrap');
      expect(title?.style.textOverflow).toBe('ellipsis');

      const badge = button.querySelector('.ui-badge');
      expect(badge).not.toBeNull();
      const variant = Array.from(badge?.classList ?? []).find(
        (name) => name.startsWith('ui-badge--') && !name.endsWith('--sm') && !name.endsWith('--md'),
      );
      expect(['ui-badge--success', 'ui-badge--warning', 'ui-badge--danger']).toContain(variant);
      if (variant !== undefined) variants.add(variant);
    });
    expect(variants.size).toBeGreaterThan(1);
  });

  it('paints every panel edge with the visible border token and no raw hex', () => {
    const { container } = render(<TriviaDeckBuilder deck={['two-sum']} onChange={vi.fn()} />);

    const card = container.querySelector<HTMLElement>('.ui-card');
    expect(card?.style.borderColor).toBe('var(--border-default)');
    container.querySelectorAll<HTMLElement>('.ui-collapsible').forEach((group) => {
      expect(group.style.borderColor).toBe('var(--border-default)');
    });
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
