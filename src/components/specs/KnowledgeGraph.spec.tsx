import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KnowledgeGraph, NEETCODE_NODES } from '../KnowledgeGraph';

describe('KnowledgeGraph Component Spec', () => {
  it('renders title and roadmap node cards', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    expect(screen.getByText('NeetCode Aligned Knowledge Graph')).toBeInTheDocument();
    expect(screen.getByText('All NeetCode 18 Topic Categories')).toBeInTheDocument();
  });

  it('triggers category selection when node or card is clicked', () => {
    const onSelectMock = vi.fn();
    render(<KnowledgeGraph onSelectCategoryFolder={onSelectMock} />);

    const firstCard = screen.getAllByText('1. Arrays & Hashing')[0];
    fireEvent.click(firstCard);

    expect(onSelectMock).toHaveBeenCalledWith('arrays_and_hashing');
  });

  it('contains all 19 NeetCode nodes with valid properties', () => {
    expect(NEETCODE_NODES.length).toBe(19);
    NEETCODE_NODES.forEach((node) => {
      expect(node.id).toBeDefined();
      expect(node.categoryFolder).toBeDefined();
      expect(node.algorithmCount).toBeGreaterThan(0);
    });
  });
});
