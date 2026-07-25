import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KnowledgeGraph, TOPIC_ROADMAP_NODES } from '../KnowledgeGraph';

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
    TOPIC_ROADMAP_NODES.forEach((node) => {
      expect(node.id).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.categoryFolder).toBeDefined();
      expect(node.description).toBeDefined();
      expect(Array.isArray(node.prerequisites)).toBe(true);
      expect(node.algorithmCount).toBeGreaterThan(0);
      expect(['Easy', 'Medium', 'Hard']).toContain(node.difficulty);
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    });
  });
});
