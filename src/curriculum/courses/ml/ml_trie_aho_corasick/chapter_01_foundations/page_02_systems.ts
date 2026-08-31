import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_trie_aho_corasick_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Multi-Pattern Search: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Multi-Pattern Repeated Substring Search",
          code: `from typing import List, Tuple

def naive_multi_pattern_search(text: str, patterns: List[str]) -> List[Tuple[int, str]]:
    """
    Executes K separate string searches.
    Time complexity: O(K * N * M), re-scanning text from DRAM K times.
    """
    matches = []
    for pattern in patterns:
        start = 0
        while True:
            pos = text.find(pattern, start)
            if pos == -1:
                break
            matches.append((pos, pattern))
            start = pos + 1
    return sorted(matches)`,
          explanation:
            "Scans the entire text independently for every pattern in the dictionary, creating severe memory bandwidth thrashing on large dictionaries.",
          timeComplexity: "O(K * N * M)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: Standard Node-Based Trie & Aho-Corasick Automaton",
          code: `from collections import deque
from typing import Dict, List, Tuple

class AhoCorasickNode:
    def __init__(self):
        self.children: Dict[str, AhoCorasickNode] = {}
        self.fail: 'AhoCorasickNode' = None
        self.output: List[str] = []

class AhoCorasickAutomaton:
    def __init__(self, patterns: List[str]):
        self.root = AhoCorasickNode()
        self._build_trie(patterns)
        self._build_failure_links()
        
    def _build_trie(self, patterns: List[str]):
        for p in patterns:
            curr = self.root
            for ch in p:
                if ch not in curr.children:
                    curr.children[ch] = AhoCorasickNode()
                curr = curr.children[ch]
            curr.output.append(p)
            
    def _build_failure_links(self):
        queue = deque()
        # Direct children of root fail to root
        for ch, child in self.root.children.items():
            child.fail = self.root
            queue.append(child)
            
        while queue:
            curr = queue.popleft()
            for ch, child in curr.children.items():
                f = curr.fail
                while f is not None and ch not in f.children:
                    f = f.fail
                child.fail = f.children[ch] if f is not None else self.root
                # Inherit dictionary output matches
                child.output.extend(child.fail.output)
                queue.append(child)
                
    def search(self, text: str) -> List[Tuple[int, str]]:
        matches = []
        curr = self.root
        for i, ch in enumerate(text):
            while curr is not None and ch not in curr.children:
                curr = curr.fail
            curr = curr.children[ch] if curr is not None else self.root
            for p in curr.output:
                matches.append((i - len(p) + 1, p))
        return matches`,
          explanation:
            "Builds failure and output links via BFS. Traverses input text stream in $O(N + Z)$ time using failure link fallbacks.",
          timeComplexity: "O(N + Z) search, O(M * |Sigma|) build",
          spaceComplexity: "O(M * |Sigma|) node references",
        },
        {
          label: "Stage 3: Flat-Array SIMD-Aligned DFA Automaton Engine",
          code: `import numpy as np
from typing import List, Tuple

class FlatArrayAhoCorasickDFA:
    """
    High-Performance Flat-Array Aho-Corasick DFA:
    1. Pre-computes full DFA state transition table: next_state = transition_table[state * 256 + byte].
       Eliminates runtime failure-link traversal loops completely!
    2. Stores transitions in contiguous 1D numpy array for L1/L2 cache locality.
    """
    def __init__(self, patterns: List[str]):
        # Build intermediate tree first
        self.patterns = patterns
        self.trans_table, self.state_outputs = self._build_flat_dfa(patterns)
        
    def _build_flat_dfa(self, patterns: List[str]):
        # Encode patterns as bytes
        byte_patterns = [p.encode('utf-8') for p in patterns]
        # Intermediate state tree representation
        trie = [{}]
        output = [[]]
        
        for p_idx, p in enumerate(byte_patterns):
            state = 0
            for b in p:
                if b not in trie[state]:
                    new_state = len(trie)
                    trie[state][b] = new_state
                    trie.append({})
                    output.append([])
                state = trie[state][b]
            output[state].append(patterns[p_idx])
            
        num_states = len(trie)
        # Full DFA transition matrix: [num_states, 256] in uint32
        dfa = np.zeros((num_states, 256), dtype=np.uint32)
        fail = [0] * num_states
        
        # BFS failure links and complete DFA transition table
        queue = []
        for b in range(256):
            if b in trie[0]:
                child = trie[0][b]
                dfa[0, b] = child
                fail[child] = 0
                queue.append(child)
            else:
                dfa[0, b] = 0
                
        head = 0
        while head < len(queue):
            curr = queue[head]
            head += 1
            f_state = fail[curr]
            output[curr].extend(output[f_state])
            
            for b in range(256):
                if b in trie[curr]:
                    child = trie[curr][b]
                    dfa[curr, b] = child
                    fail[child] = dfa[f_state, b]
                    queue.append(child)
                else:
                    # Flatten failure link into immediate DFA next_state!
                    dfa[curr, b] = dfa[f_state, b]
                    
        return dfa.flatten(), output
        
    def search(self, text: str) -> List[Tuple[int, str]]:
        text_bytes = text.encode('utf-8')
        matches = []
        state = 0
        table = self.trans_table
        outputs = self.state_outputs
        
        # Bare-metal loop: 1 array indexing per byte!
        for i, b in enumerate(text_bytes):
            state = table[state * 256 + b]
            if outputs[state]:
                for p in outputs[state]:
                    matches.append((i - len(p.encode('utf-8')) + 1, p))
                    
        return matches`,
          explanation:
            "Full DFA state flattening. Merges failure links directly into the state transition table ($t = \\text{DFA}[s, c]$), reducing per-byte stream processing to a single direct array lookup with zero branch mispredictions.",
          timeComplexity: "Strictly 1 memory lookup per input byte",
          spaceComplexity: "O(States * 256 * 4) bytes contiguous array",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Cache Line Thrashing & Memory Hierarchy Traps",
      content:
        "In naive pointer-based tries, every node dereference is an 8-byte pointer jump to a random virtual memory address. Because modern CPU cache lines are 64 bytes, reading a single 8-byte pointer pulls 56 bytes of un-needed memory into L1 cache, causing **DRAM bus saturation**. Flat-array DFAs and Double-Array Tries align state transition rows to contiguous memory segments, allowing hardware CPU prefetchers to stream 64 bytes of state transitions in a single cache fill.",
    },
  ],
};

export const page_02_systems = page2;
