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

    return heap[0] if heap else None

def huffman_codes(text):
    root = build_huffman_tree(text)
    if root is None:
        return {}

    codes = {}

    def collect(node, prefix):
        if node.char is not None:
            codes[node.char] = prefix or "0"
            return
        collect(node.left, prefix + "0")
        collect(node.right, prefix + "1")

    collect(root, "")
    return codes`;

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
