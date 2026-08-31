import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_trie_aho_corasick_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: Suffix Link Traversal & Failure Chain Boundedness",
  sections: [
    {
      type: "math_proof",
      title: "Failure Link Suffix Invariant Theorem",
      theorem:
        "For any state $u$ representing string $S(u)$ in an Aho-Corasick automaton, the failure state $f(u)$ represents the longest proper suffix of $S(u)$ that exists as a node in the trie: $S(f(u)) = \\arg\\max \\{ w \\in \\text{Nodes}(\\mathcal{T}) : w \\text{ is a proper suffix of } S(u) \\}$.",
      proof:
        "1. Base Case (Depth 1):\\nFor any direct child $v$ of the root with character $c$, $S(v) = c$. The only proper suffix of a single-character string is the empty string $\\epsilon$, represented by the root node. Thus $f(v) = \\text{root}$, satisfying the invariant.\\n\\n2. Inductive Step:\\nAssume the invariant holds for all nodes at depth $< d$. Let $v = \\text{child}(u, c)$ be a node at depth $d$, so $S(v) = S(u) + c$.\\nAny proper suffix of $S(v)$ has the form $w + c$ where $w$ is a proper suffix of $S(u)$.\\nTo find the longest such $w + c$ that is present in the trie, we examine candidates $w$ in descending order of length.\\nBy induction, the longest proper suffix of $S(u)$ in the trie is $S(f(u))$. If $\\text{child}(f(u), c)$ exists, then $S(f(u)) + c$ is the longest proper suffix of $S(v)$ in the trie, so $f(v) = \\text{child}(f(u), c)$.\\nIf not, we iteratively test $f(f(u)), f(f(f(u))), \\dots$ until a valid child on character $c$ is found, or we reach the root.\\n\\n3. Conclusion:\\nBy structural induction across the BFS tree, $f(u)$ strictly satisfies the maximal proper suffix property for every state in the automaton.",
    },
    {
      type: "math_proof",
      title: "Dictionary Output Chain Subsumption Proof",
      theorem:
        "Let state $u$ match dictionary keywords $O(u)$. When traversing text $T$, state $u$ matches all keywords in $O(u) \\cup O(f(u)) \\cup O(f(f(u))) \\dots$. Flattening output links via BFS propagation reduces keyword reporting per matched state to $O(1)$ amortized overhead.",
      proof:
        "1. Any keyword $P \\in \\mathcal{D}$ that is a suffix of $S(u)$ must also be a suffix of $S(f(u))$.\\n2. By transitivity, the set of all matching keywords ending at the current text position is precisely the union along the failure chain: $\\mathcal{M}(u) = \\bigcup_{k=0}^\\infty O(f^k(u))$.\\n3. By computing $O(u) \\leftarrow O(u) \\cup O(f(u))$ during BFS construction, each node stores the complete aggregated list of matching keywords directly.\\n4. During text scanning, emitting all matches at state $u$ requires simply iterating over $O(u)$, requiring exactly $|O(u)|$ operations with zero chain traversals.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
