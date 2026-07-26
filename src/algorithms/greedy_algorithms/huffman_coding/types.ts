export interface HuffmanCodingInput {
  text: string;
}

export const PYTHON_HUFFMAN_CODE = `import heapq
from collections import Counter

class HuffmanNode:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.freq < other.freq

def build_huffman_tree(text):
    frequency = Counter(text)
    heap = [HuffmanNode(char, freq) for char, freq in frequency.items()]
    heapq.heapify(heap)

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = HuffmanNode(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        heapq.heappush(heap, merged)

    return heap[0] if heap else None`;

export const DEFAULT_HUFFMAN_CODING_INPUT: HuffmanCodingInput = {
  text: "abracadabra",
};

export interface InternalHuffmanNode {
  id: string;
  char: string | null;
  freq: number;
  leftId?: string;
  rightId?: string;
}
