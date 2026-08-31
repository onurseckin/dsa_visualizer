import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_trie_aho_corasick_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Double-Array Trie (DAT) & DFA State Transition Flattening",
  sections: [
    {
      type: "prose",
      title: "The Pointer-Chasing Memory Crisis in Standard Pointer Tries",
      content:
        "A standard pointer-based Trie allocates individual heap nodes with an array of 256 child pointers (`Node* children[256]`). For a vocabulary of 128k tokens with an average string length of 8 characters, a full pointer trie requires over $10^6$ distinct node structures. Storing 256 pointers (8 bytes each = 2048 bytes) per node creates a colossal **2.0 GB memory footprint**, of which 99.8% consists of `nullptr` entries! Furthermore, during inference and tokenization, navigating child pointers causes **CPU L1/L2 cache misses on nearly every character traversal** because heap nodes are non-contiguously distributed across virtual memory.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Double-Array Trie (DAT) base and check Invariant",
      visualIntuition:
        "Standard Pointer Trie:  [ Node @ 0x7fff00 ] -> Child @ 0x7fff80 -> Child @ 0x7fffc0 (Scattered heap allocations!)\\nDouble-Array Trie (DAT): Two contiguous 32-bit integer arrays: base[N] and check[N]\\nTransition from State s on Character c:\\n  next_state = base[s] + c\\n  Valid if: check[next_state] == s (100% cache-coalesced array lookup, 0 pointer chasing!)",
      invariant:
        "DAT Transition Invariant: For any source state s and input character c, the target state t is valid if and only if check[t] == s where t = base[s] + c.",
      stateTransitions:
        "Character c -> Compute index t = base[s] + c -> Validate check[t] == s -> If valid, transition s = t; else follow failure state.",
      naiveBottleneck:
        "Pointer-based trie nodes scatter 2KB structures across heap memory, stalling modern CPU vector units.",
      optimalInsight:
        "Double-Array Tries pack million-node vocabularies into two compact, flat integer arrays that fit directly into L3 CPU cache.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Double-Array Trie Collision-Free State Packing",
      theorem:
        "For any deterministic finite automaton with $S$ states and alphabet $\\Sigma$, there exists a base array assignment $\\text{base}: S \\to \\mathbb{Z}$ such that the state transition function $\\delta(s, c) = t$ is represented by $t = \\text{base}[s] + c$ with $\\text{check}[t] = s$, guaranteeing zero state collisions across all valid outgoing transitions.",
      proof:
        "1. Let state $s$ have non-empty outgoing character transitions $\\Sigma_s = \\{ c \\in \\Sigma : \\delta(s, c) \\ne \\emptyset \\}$.\\n\\n2. Collision Condition:\\nTwo distinct transitions $\\delta(s_1, c_1)$ and $\\delta(s_2, c_2)$ collide if and only if:\\n$$\\text{base}[s_1] + c_1 = \\text{base}[s_2] + c_2$$\\n\\n3. Row-Displacement Allocation Algorithm:\\nWhen inserting state $s$ into the Double-Array Trie, we search for the smallest integer $b > 0$ such that for all $c \\in \\Sigma_s$, the array cell $b + c$ is currently unallocated (i.e. $\\text{check}[b + c] = 0$).\\nSetting $\\text{base}[s] = b$ and marking $\\text{check}[b + c] = s$ for all $c \\in \\Sigma_s$ ensures that no two active states can claim the same physical array slot for differing transitions.\\n\\n4. Lookup Complexity:\\nDuring runtime lookup on character $c$ from state $s$:\\n- Compute candidate target $t = \\text{base}[s] + c$.\\n- If $\\text{check}[t] = s$, the transition is valid and $t$ is the exact unique child state.\\n- If $\\text{check}[t] \\ne s$, the transition does not exist in the trie, terminating in exactly 1 clock cycle with $O(1)$ memory access.",
    },
  ],
};
