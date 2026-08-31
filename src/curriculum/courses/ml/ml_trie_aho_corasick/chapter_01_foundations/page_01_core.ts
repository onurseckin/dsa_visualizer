import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_trie_aho_corasick_c1_p1",
  pageNumber: 1,
  title: "Trie & Aho-Corasick: Multi-Pattern Automata & Linear Text Streaming",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Vocabulary Matching Crisis: The 128k Tokenizer Search Wall",
      content:
        "Modern frontier LLMs (GPT-4, Llama-3, Qwen-2.5) utilize enormous vocabularies ranging from $V = 100{,}000$ to $256{,}000$ subword tokens and special control strings (e.g. `<|start_header_id|>`, `<|eot_id|>`, `\\n\\n###`). When tokenizing multi-gigabyte training corpora or scanning incoming user prompts for stop-sequences and safety guardrail patterns, naive substring search ($O(K \\cdot N \\cdot M)$ where $K$ is pattern count) collapses processing throughput to megabytes per hour. The **Aho-Corasick Automaton (Aho & Corasick, 1975)** converts an arbitrary dictionary of $K$ patterns into a deterministic finite automaton (**DFA**) with **Failure Links** and **Dictionary Output Links**, scanning continuous input text streams in strictly **$O(N + Z)$ time**—completely independent of the dictionary size $K$!",
    },
    {
      type: "mental_model",
      title: "Mental Model: Trie Prefix Tree to Aho-Corasick DFA with Suffix Links",
      visualIntuition:
        "Trie Nodes: Path from root 'he' -> 'her' -> 'hers'\\nFailure Link f(u): If match fails at 'hers' upon reading 'x', follow f('hers') = 'ers' (or longest matching suffix 's') without rewinding text pointer i!\\nOutput Link out(u): Shortcuts traversing the failure chain to immediately emit all matching dictionary keywords at current index.",
      invariant:
        "Streaming Linear Invariant: The text pointer i advances strictly monotonically by +1 on every step. Traversal of failure links across the entire stream is amortized to at most 2N transitions, guaranteeing O(N + Z) runtime.",
      stateTransitions:
        "State 0 (Root) --'h'--> State 1 ('h') --'e'--> State 2 ('he', match keyword 'he') --'r'--> State 3 ('her', match 'her') --'s'--> State 4 ('hers', match 'hers'). On mismatch at State 4 on char 'i', follow failure link f(State 4) -> State 5 ('s') -> match 'si'...",
      naiveBottleneck:
        "Scanning K patterns independently with strstr/regex causes K separate passes over the input text, reloading characters from L3 cache repeatedly.",
      optimalInsight:
        "Aho-Corasick builds a unified multi-pattern state machine using BFS suffix links, processing all K patterns in a single sequential memory pass.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Aho-Corasick Linear Streaming Complexity",
      theorem:
        "For a dictionary $\\mathcal{D} = \\{P_1, P_2, \\dots, P_K\\}$ with total pattern length $M = \\sum |P_i|$ and input text $T$ of length $N$, the Aho-Corasick algorithm constructs the automaton in $O(M \\cdot |\\Sigma|)$ time and finds all $Z$ pattern occurrences in $O(N + Z)$ time.",
      proof:
        "1. Automaton Construction via BFS:\\n- Step 1: Insert all $K$ patterns into a standard Trie ($O(M)$ time and states).\\n- Step 2: Breadth-First Search (BFS) computes failure function $f(u)$ for every state $u$ at depth $d$ from failure states at depth $d-1$:\\n  For a node $v = \\text{child}(u, c)$, if $\\text{child}(f(u), c)$ exists, $f(v) = \\text{child}(f(u), c)$; otherwise, fall back along the failure chain.\\n- Step 3: Compute dictionary output links $\\text{out}(u)$:\\n  $$\\text{out}(u) = \\begin{cases} f(u) & \\text{if } f(u) \\text{ is a terminal state} \\\\ \\text{out}(f(u)) & \\text{otherwise} \\end{cases}$$\\nTotal construction time is bounded by $O(M \\cdot |\\Sigma|)$.\\n\\n2. Text Streaming Time Bound via Potential Function:\\nDefine potential $\\Phi(i) = \\text{depth}(\\text{current\\_state})$.\\n- Initial state at root: $\\Phi(0) = 0$.\\n- Each step in the text stream either moves to a trie child (depth increases by at most 1, so $\\Delta \\Phi \\le +1$) or traverses a failure link (depth strictly decreases by at least 1, so $\\Delta \\Phi \\le -1$).\\n- Since $\\Phi(i) \\ge 0$ for all $i$ and increases by at most $+1$ per text character, the total number of failure transitions across all $N$ characters cannot exceed the total depth gains: $\\sum \\text{failure steps} \\le N$.\\n\\n3. Total Match Output Cost:\\nTraversing dictionary output links emits a valid match in $O(1)$ per occurrence, contributing exactly $O(Z)$ operations.\\n\\n4. Conclusion:\\nTotal streaming runtime is $T(N) = O(N) + O(N) + O(Z) = O(N + Z)$, establishing optimal linear execution independent of dictionary size $K$.",
    },
  ],
};

export const page_01_core = page1;
