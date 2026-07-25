import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KnowledgeGraph, NEETCODE_NODES } from '../KnowledgeGraph';

describe('KnowledgeGraph Component Spec', () => {
  it('renders title, SVG region, and roadmap node cards', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    expect(screen.getByText('Topologically Ordered Prerequisite Knowledge Graph')).toBeInTheDocument();
    expect(screen.getByText('All Categorized Topic Modules')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /Interactive Data Structures and Algorithms Prerequisite Roadmap/i })
    ).toBeInTheDocument();
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

  it('contains all 21 NeetCode nodes with valid properties and prerequisite structure', () => {
    expect(NEETCODE_NODES.length).toBe(21);
    NEETCODE_NODES.forEach((node) => {
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

