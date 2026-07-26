import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  KnowledgeGraph,
  TOPIC_FAMILIES,
  TOPIC_ROADMAP_NODES,
  topicFamilyColor,
  topicFamilyLabel,
} from '../KnowledgeGraph';
import { VIZ_SLOT_COUNT } from '../primitives/vizPalette';

describe('KnowledgeGraph Component Spec', () => {
  it('renders SVG region, roadmap heading, and hover hint chrome', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    expect(screen.getByText('Topic prerequisite roadmap')).toBeInTheDocument();
    expect(screen.getByText('All Categorized Topic Modules')).toBeInTheDocument();
    expect(screen.getByText(/Hover to trace prerequisites/i)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i })
    ).toBeInTheDocument();
  });

  it('renders grid topic cards as ui Cards with difficulty badges', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const gridCard = screen.getAllByRole('button', { name: /1\. Arrays & Hashing:/i })[0];
    expect(gridCard).toHaveClass('ui-card');

    // Grid card shows an Easy difficulty badge and a neutral topic-count badge
    const easyBadges = screen.getAllByText('Easy');
    expect(easyBadges.some((el) => el.classList.contains('ui-badge--success'))).toBe(true);
    const countBadges = screen.getAllByText('4 Topics');
    expect(countBadges.some((el) => el.classList.contains('ui-badge--neutral'))).toBe(true);
  });

  it('triggers category selection when SVG node or grid card is clicked', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const buttons = screen.getAllByRole('button', { name: /1\. Arrays & Hashing/i });
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Click SVG node button
    fireEvent.click(buttons[0]);
    expect(onSelectMock).toHaveBeenCalledWith('arrays_and_hashing');

    // Click Grid card button
    fireEvent.click(buttons[1]);
    expect(onSelectMock).toHaveBeenCalledWith('arrays_and_hashing');
  });

  it('supports keyboard navigation via Enter and Space keypresses', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const twoPointersButtons = screen.getAllByRole('button', { name: /2\. Two Pointers/i });

    // Press Enter on SVG node
    fireEvent.keyDown(twoPointersButtons[0], { key: 'Enter' });
    expect(onSelectMock).toHaveBeenCalledWith('two_pointers');

    // Press Space on grid card
    fireEvent.keyDown(twoPointersButtons[1], { key: ' ' });
    expect(onSelectMock).toHaveBeenCalledWith('two_pointers');
  });

  it('borders every topic card by default and strengthens the edge on hover', () => {
    render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const card = screen.getAllByRole('button', { name: /1\. Arrays & Hashing:/i })[0];
    expect(card.style.borderColor).toBe('var(--border-default)');

    fireEvent.mouseEnter(card);
    expect(card.style.borderColor).toBe('var(--border-strong)');
    expect(card.style.background).toBe('var(--bg-hover)');

    fireEvent.mouseLeave(card);
    expect(card.style.borderColor).toBe('var(--border-default)');
  });

  it('handles mouse enter, mouse leave, focus, and blur events on interactive elements', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const button = screen.getAllByRole('button', { name: /1\. Arrays & Hashing/i })[0];

    // Hover mouse enter & leave
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    // Focus & blur
    fireEvent.focus(button);
    fireEvent.blur(button);
  });

  it('contains all 21 topic roadmap nodes with valid properties and prerequisite structure', () => {
    expect(TOPIC_ROADMAP_NODES.length).toBe(21);
    const familyIds = TOPIC_FAMILIES.map((family) => family.id);
    TOPIC_ROADMAP_NODES.forEach((node) => {
      expect(node.id).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.categoryFolder).toBeDefined();
      expect(node.description).toBeDefined();
      expect(Array.isArray(node.prerequisites)).toBe(true);
      expect(node.algorithmCount).toBeGreaterThan(0);
      expect(['Easy', 'Medium', 'Hard']).toContain(node.difficulty);
      expect(familyIds).toContain(node.family);
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    });
  });

  it('assigns every topic family a distinct viz slot in fixed order', () => {
    expect(TOPIC_FAMILIES.map((family) => family.slot)).toEqual(
      Array.from({ length: VIZ_SLOT_COUNT }, (_, index) => index)
    );

    const colors = TOPIC_FAMILIES.map((family) => topicFamilyColor(family.id));
    expect(colors).toEqual([
      'var(--viz-1)',
      'var(--viz-2)',
      'var(--viz-3)',
      'var(--viz-4)',
      'var(--viz-5)',
      'var(--viz-6)',
      'var(--viz-7)',
      'var(--viz-8)',
    ]);
    expect(new Set(colors).size).toBe(TOPIC_FAMILIES.length);
    expect(topicFamilyLabel('graphs')).toBe('Graphs');
  });

  it('every family is actually used by at least one topic', () => {
    const usedFamilies = new Set(TOPIC_ROADMAP_NODES.map((node) => node.family));
    TOPIC_FAMILIES.forEach((family) => {
      expect(usedFamilies.has(family.id)).toBe(true);
    });
  });

  it('renders a family color legend and tints roadmap nodes by family', () => {
    render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const legend = screen.getByRole('list', { name: /Topic family colors/i });
    expect(legend).toBeInTheDocument();
    TOPIC_FAMILIES.forEach((family) => {
      expect(screen.getAllByText(family.label).length).toBeGreaterThan(0);
    });

    const graphsNode = screen.getAllByRole('button', { name: /11\. Graph Traversal/i })[0];
    const familyBar = graphsNode.querySelectorAll('rect')[1];
    expect(familyBar).toHaveAttribute('fill', topicFamilyColor('graphs'));
  });

  it('keeps the roadmap chrome neutral while family swatches stay the data key', () => {
    const { container } = render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    // Card header icon inherits the neutral card tone instead of an accent tint.
    const headerIcon = container.querySelector('.ui-card__icon svg');
    expect(headerIcon).not.toBeNull();
    expect(headerIcon?.getAttribute('style')).toBeNull();

    const swatches = screen
      .getByRole('list', { name: /Topic family colors/i })
      .querySelectorAll<HTMLElement>('span[aria-hidden="true"]');
    expect(Array.from(swatches).map((swatch) => swatch.style.background)).toEqual(
      TOPIC_FAMILIES.map((family) => topicFamilyColor(family.id))
    );
  });

  it('tints prerequisite edges with the unlocked topic family color', () => {
    const { container } = render(<KnowledgeGraph onSelectCategoryFolder={vi.fn()} />);

    const strokes = Array.from(container.querySelectorAll('path[stroke]')).map((p) =>
      p.getAttribute('stroke')
    );
    expect(strokes).toContain(topicFamilyColor('graphs'));
    expect(strokes).toContain(topicFamilyColor('dynamic-programming'));
  });
});
