import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TreeVisualizer from '../../../components/primitives/TreeVisualizer';
import {
  generateHuffmanCodingSteps,
  DEFAULT_HUFFMAN_CODING_INPUT,
} from '../huffmanCoding';

describe('huffmanCoding React component spec', () => {
  it('renders TreeVisualizer with generated huffman tree snapshot', () => {
    const steps = generateHuffmanCodingSteps(DEFAULT_HUFFMAN_CODING_INPUT);
    const lastStep = steps[steps.length - 1];
    const snapshot = lastStep.primarySnapshot;

    expect(snapshot.kind).toBe('tree');
    if (snapshot.kind === 'tree') {
      render(
        <TreeVisualizer
          nodes={snapshot.nodes}
          rootId={snapshot.rootId}
          title="Huffman Coding Tree"
        />
      );

      expect(screen.getByText('Huffman Coding Tree')).toBeInTheDocument();
    }
  });
});
