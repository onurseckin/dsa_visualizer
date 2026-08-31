import { describe, expect, it } from "bun:test";
import React from "react";
import {
  AhoCorasickAutomataStudio,
  AHO_CORASICK_PRESETS,
  AHO_CORASICK_MODALITY_CONFIGS,
  cloneACTrie,
  createEmptyACTrie,
  validateACPatterns,
  getNodePrefixPath,
  buildACTrie,
  generateTrieBuildTrace,
  computeFailureLinks,
  generateFailureLinksTrace,
  collectChainOutputs,
  generateDictSuffixLinksTrace,
  buildFullAhoCorasick,
  computeDFATransitionMatrix,
  searchAhoCorasickStudio as searchAhoCorasick,
  naiveMultiPatternSearch,
  generateStreamingSearchTrace,
  layoutACTrie,
  type ACPresetId,
  type AhoCorasickModality,
  type ACMatchOccurrence,
} from "../../components/primitives";

describe("AhoCorasickAutomataStudio & Aho-Corasick Multi-Pattern Search Suite Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate AhoCorasickAutomataStudio with default props", () => {
      const element = React.createElement(AhoCorasickAutomataStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(AhoCorasickAutomataStudio);
    });

    it("should instantiate AhoCorasickAutomataStudio with custom modes and presets", () => {
      const onPresetChangeMock = (_id: ACPresetId) => {};
      const onModalityChangeMock = (_mod: AhoCorasickModality) => {};

      const element = React.createElement(AhoCorasickAutomataStudio, {
        initialPreset: "dna_motifs",
        initialModality: "bfs_failure_link_construction",
        initialPatterns: ["ACGT", "TACG"],
        initialText: "ACGTACG",
        standalone: true,
        title: "Custom DNA AC Studio",
        onPresetChange: onPresetChangeMock,
        onModalityChange: onModalityChangeMock,
      });

      expect(element.props.initialPreset).toBe("dna_motifs");
      expect(element.props.initialModality).toBe("bfs_failure_link_construction");
      expect(element.props.initialPatterns).toEqual(["ACGT", "TACG"]);
      expect(element.props.initialText).toBe("ACGTACG");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom DNA AC Studio");
      expect(element.props.onPresetChange).toBe(onPresetChangeMock);
      expect(element.props.onModalityChange).toBe(onModalityChangeMock);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const presetIds: ACPresetId[] = [
      "classic_ushers",
      "dna_motifs",
      "malware_signatures",
      "code_keywords",
      "overlapping_prefixes",
    ];

    it("should contain all 5 required presets with valid metadata", () => {
      for (const id of presetIds) {
        const preset = AHO_CORASICK_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.patterns.length).toBeGreaterThan(0);
        expect(preset.defaultText.length).toBeGreaterThan(0);
        expect(preset.theoryNotes.length).toBeGreaterThan(0);
        expect(preset.tags.length).toBeGreaterThan(0);
      }
    });

    it("should provide valid configuration for all 4 modalities", () => {
      const modalities: AhoCorasickModality[] = [
        "trie_multi_pattern_build",
        "bfs_failure_link_construction",
        "dictionary_suffix_output_links",
        "streaming_text_search_dfa",
      ];

      for (const mod of modalities) {
        const config = AHO_CORASICK_MODALITY_CONFIGS[mod];
        expect(config).toBeDefined();
        expect(config.title.length).toBeGreaterThan(0);
        expect(config.subtitle.length).toBeGreaterThan(0);
        expect(config.theory.length).toBeGreaterThan(0);
        expect(config.badgeColor.length).toBeGreaterThan(0);
        expect(config.icon).toBeDefined();
      }
    });

    it("should execute multi-pattern search on all presets producing valid match counts", () => {
      for (const id of presetIds) {
        const preset = AHO_CORASICK_PRESETS[id];
        const trie = buildFullAhoCorasick([...preset.patterns]);
        const acMatches = searchAhoCorasick(trie, preset.defaultText);
        const naiveMatches = naiveMultiPatternSearch([...preset.patterns], preset.defaultText);

        expect(acMatches.length).toBe(naiveMatches.length);
        expect(acMatches.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 3. PURE ALGORITHMIC ENGINE: TRIE CONSTRUCTION
  // ==========================================================================
  describe("3. Pure Algorithmic Engine: Trie Construction", () => {
    it("should create empty trie with correct initial state", () => {
      const empty = createEmptyACTrie();
      expect(empty.root).toBe(0);
      expect(empty.nodes.length).toBe(1);
      expect(empty.nodes[0].id).toBe(0);
      expect(empty.nodes[0].depth).toBe(0);
      expect(empty.nodes[0].char).toBe("");
      expect(empty.nodes[0].parent).toBeNull();
      expect(empty.nodes[0].fail).toBe(0);
      expect(empty.nodes[0].dictLink).toBeNull();
      expect(empty.nodes[0].output).toEqual([]);
      expect(empty.nodes[0].isTerminal).toBe(false);
      expect(empty.patterns).toEqual([]);
      expect(empty.alphabet).toEqual([]);
    });

    it("should validate and clean input pattern arrays", () => {
      const result1 = validateACPatterns(["  he  ", "she", "he", "", "   ", "his"]);
      expect(result1.valid).toBe(true);
      expect(result1.cleaned).toEqual(["he", "she", "his"]);

      const result2 = validateACPatterns(["", "   "]);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBeDefined();
    });

    it("should build correct trie structure for classic 'he/she/his/hers'", () => {
      const patterns = ["he", "she", "his", "hers"];
      const trie = buildACTrie(patterns);

      expect(trie.patterns).toEqual(patterns);
      expect(trie.alphabet).toEqual(["e", "h", "i", "r", "s"]);

      // Root should have children 'h' and 's'
      const rootChildren = Object.keys(trie.nodes[0].children);
      expect(rootChildren.sort()).toEqual(["h", "s"]);

      // Total nodes check
      // "he" -> 2 nodes ('h', 'e')
      // "she" -> 3 nodes ('s', 'h', 'e')
      // "his" -> shares 'h', adds 'i', 's' (2 nodes)
      // "hers" -> shares "he", adds 'r', 's' (2 nodes)
      // Total = 1 root + 2 + 3 + 2 + 2 = 10 nodes
      expect(trie.nodes.length).toBe(10);

      // Verify terminal states
      const terminalNodes = trie.nodes.filter((n) => n.isTerminal);
      expect(terminalNodes.length).toBe(4);

      // Verify path reconstruction for each terminal node
      const reconstructedPatterns = terminalNodes.map((n) => getNodePrefixPath(trie, n.id));
      expect(reconstructedPatterns.sort()).toEqual([...patterns].sort());
    });

    it("should correctly clone an ACTrie without mutating original", () => {
      const trie = buildACTrie(["abc", "abd"]);
      const cloned = cloneACTrie(trie);

      expect(cloned).toEqual(trie);
      expect(cloned).not.toBe(trie);
      expect(cloned.nodes).not.toBe(trie.nodes);
      expect(cloned.nodes[0]).not.toBe(trie.nodes[0]);

      cloned.nodes[0].fail = 99;
      expect(trie.nodes[0].fail).toBe(0);
    });
  });

  // ==========================================================================
  // 4. PURE ALGORITHMIC ENGINE: BFS FAILURE LINKS
  // ==========================================================================
  describe("4. Pure Algorithmic Engine: BFS Failure Links", () => {
    it("should set fail link to 0 for all depth 1 nodes", () => {
      const trie = buildACTrie(["apple", "banana", "cat"]);
      const withFail = computeFailureLinks(trie);

      for (const char of Object.keys(withFail.nodes[0].children)) {
        const childId = withFail.nodes[0].children[char];
        expect(withFail.nodes[childId].fail).toBe(0);
      }
    });

    it("should resolve correct failure links in classic 'he', 'she', 'his', 'hers'", () => {
      const patterns = ["he", "she", "his", "hers"];
      const trie = buildACTrie(patterns);
      const withFail = computeFailureLinks(trie);

      // Find node for "she"
      const sNode = withFail.nodes[0].children["s"];
      const shNode = withFail.nodes[sNode].children["h"];
      const sheNode = withFail.nodes[shNode].children["e"];

      // Find node for "he"
      const hNode = withFail.nodes[0].children["h"];
      const heNode = withFail.nodes[hNode].children["e"];

      // "s" -> fail link 0
      expect(withFail.nodes[sNode].fail).toBe(0);

      // "sh" -> fail link is "h" node!
      expect(withFail.nodes[shNode].fail).toBe(hNode);

      // "she" -> fail link is "he" node!
      expect(withFail.nodes[sheNode].fail).toBe(heNode);
    });

    it("should compute nested failure links for repeated patterns ['a', 'aa', 'aaa']", () => {
      const patterns = ["a", "aa", "aaa"];
      const trie = buildACTrie(patterns);
      const withFail = computeFailureLinks(trie);

      const n1 = withFail.nodes[0].children["a"]; // "a"
      const n2 = withFail.nodes[n1].children["a"]; // "aa"
      const n3 = withFail.nodes[n2].children["a"]; // "aaa"

      expect(withFail.nodes[n1].fail).toBe(0);
      expect(withFail.nodes[n2].fail).toBe(n1);
      expect(withFail.nodes[n3].fail).toBe(n2);
    });

    it("should compute failure links for DNA cyclical motifs", () => {
      const patterns = ["ACGT", "CGTA", "TACG", "GTA"];
      const trie = buildACTrie(patterns);
      const withFail = computeFailureLinks(trie);

      expect(withFail.nodes.length).toBeGreaterThan(0);
      // All failure links must point to valid node indices
      for (const node of withFail.nodes) {
        expect(node.fail).toBeGreaterThanOrEqual(0);
        expect(node.fail).toBeLessThan(withFail.nodes.length);
        if (node.id !== 0) {
          expect(node.fail).not.toBe(node.id); // No self loops except root
        }
      }
    });
  });

  // ==========================================================================
  // 5. PURE ALGORITHMIC ENGINE: DICTIONARY SUFFIX OUTPUT LINKS
  // ==========================================================================
  describe("5. Pure Algorithmic Engine: Dictionary Suffix Output Links", () => {
    it("should link terminal nodes directly through dictLink", () => {
      const patterns = ["he", "she", "his", "hers"];
      const trie = buildFullAhoCorasick(patterns);

      // "she" node
      const sNode = trie.nodes[0].children["s"];
      const shNode = trie.nodes[sNode].children["h"];
      const sheNode = trie.nodes[shNode].children["e"];

      // "he" node
      const hNode = trie.nodes[0].children["h"];
      const heNode = trie.nodes[hNode].children["e"];

      // "she" is terminal and fail(she) = he (which is terminal), so dictLink(she) = heNode
      expect(trie.nodes[sheNode].dictLink).toBe(heNode);

      // "he" fails to root, so dictLink(he) is null
      expect(trie.nodes[heNode].dictLink).toBeNull();
    });

    it("should compress chains bypassing non-terminal intermediate states", () => {
      // "bc" is terminal. "abcd" is terminal. "abc" is NON-terminal.
      // String "a b c d" -> state "abc" fails to "bc" (terminal).
      // State "abcd" fails to "bcd" (non-existent -> root).
      const patterns = ["bc", "abcd"];
      const trie = buildFullAhoCorasick(patterns);

      const a = trie.nodes[0].children["a"];
      const ab = trie.nodes[a].children["b"];
      const abc = trie.nodes[ab].children["c"];

      const b = trie.nodes[0].children["b"];
      const bc = trie.nodes[b].children["c"];

      // "abc" is not terminal, but its fail link points to "bc" (terminal)
      expect(trie.nodes[abc].isTerminal).toBe(false);
      expect(trie.nodes[abc].fail).toBe(bc);
      expect(trie.nodes[abc].dictLink).toBe(bc);

      const chainOutputs = collectChainOutputs(trie, abc);
      expect(chainOutputs).toEqual(["bc"]);
    });

    it("should collect all chained outputs across multiple levels of dictLink", () => {
      const patterns = ["a", "aa", "aaa", "aaaa"];
      const trie = buildFullAhoCorasick(patterns);

      const n1 = trie.nodes[0].children["a"];
      const n2 = trie.nodes[n1].children["a"];
      const n3 = trie.nodes[n2].children["a"];
      const n4 = trie.nodes[n3].children["a"];

      expect(trie.nodes[n4].dictLink).toBe(n3);
      expect(trie.nodes[n3].dictLink).toBe(n2);
      expect(trie.nodes[n2].dictLink).toBe(n1);
      expect(trie.nodes[n1].dictLink).toBeNull();

      const outputs4 = collectChainOutputs(trie, n4);
      expect(outputs4.sort()).toEqual(["a", "aa", "aaa", "aaaa"].sort());
    });
  });

  // ==========================================================================
  // 6. PURE ALGORITHMIC ENGINE: DFA TRANSITION MATRIX
  // ==========================================================================
  describe("6. Pure Algorithmic Engine: DFA Transition Matrix", () => {
    it("should compute valid transition matrix for all states and alphabet characters", () => {
      const patterns = ["he", "she", "his", "hers"];
      const trie = buildFullAhoCorasick(patterns);
      const matrix = computeDFATransitionMatrix(trie);

      expect(Object.keys(matrix).length).toBe(trie.nodes.length);

      for (let u = 0; u < trie.nodes.length; u++) {
        expect(matrix[u]).toBeDefined();
        for (const c of trie.alphabet) {
          const nextState = matrix[u][c];
          expect(nextState).toBeDefined();
          expect(nextState).toBeGreaterThanOrEqual(0);
          expect(nextState).toBeLessThan(trie.nodes.length);
        }
      }
    });

    it("should match direct child transitions when child exists", () => {
      const patterns = ["cat", "car"];
      const trie = buildFullAhoCorasick(patterns);
      const matrix = computeDFATransitionMatrix(trie);

      const cNode = trie.nodes[0].children["c"];
      const caNode = trie.nodes[cNode].children["a"];
      const catNode = trie.nodes[caNode].children["t"];
      const carNode = trie.nodes[caNode].children["r"];

      expect(matrix[0]["c"]).toBe(cNode);
      expect(matrix[cNode]["a"]).toBe(caNode);
      expect(matrix[caNode]["t"]).toBe(catNode);
      expect(matrix[caNode]["r"]).toBe(carNode);
    });

    it("should transition via fail link fallback when child does not exist", () => {
      const patterns = ["he", "she"];
      const trie = buildFullAhoCorasick(patterns);
      const matrix = computeDFATransitionMatrix(trie);

      // At "she", reading 'e' should fail to "he" then check 'e' -> which doesn't exist, fails to root
      const sNode = trie.nodes[0].children["s"];
      const shNode = trie.nodes[sNode].children["h"];
      const sheNode = trie.nodes[shNode].children["e"];

      // From "she", reading 'h' -> fail to "he", from "he" 'h' fails to root where 'h' -> hNode
      const hNode = trie.nodes[0].children["h"];
      expect(matrix[sheNode]["h"]).toBe(hNode);
    });
  });

  // ==========================================================================
  // 7. PURE ALGORITHMIC ENGINE: MULTI-PATTERN SEARCH & NAIVE VERIFICATION
  // ==========================================================================
  describe("7. Multi-Pattern Search & Exact Equivalence to Naive Search", () => {
    const testCases: { name: string; patterns: string[]; text: string }[] = [
      {
        name: "Classic Ushers",
        patterns: ["he", "she", "his", "hers"],
        text: "ushers",
      },
      {
        name: "DNA Motifs Repeat",
        patterns: ["ACGT", "CGTA", "TACG", "GTA"],
        text: "ACGTACGTAGCTA",
      },
      {
        name: "Nested Substrings Overlap",
        patterns: ["a", "aa", "aaa", "aaaa"],
        text: "aaaaaa",
      },
      {
        name: "Overlapping Prefixes",
        patterns: ["apple", "app", "plea", "lead"],
        text: "applead",
      },
      {
        name: "Malware Payloads",
        patterns: ["trojan", "worm", "botnet", "virus"],
        text: "infected_trojan_worm_botnet_host",
      },
      {
        name: "Compiler Lexer Keywords",
        patterns: ["function", "const", "return", "throw", "for"],
        text: "function find() { const x = 1; return x; }",
      },
      {
        name: "No matches in text",
        patterns: ["xyz", "uvw"],
        text: "abcdefghijklmnop",
      },
      {
        name: "Single character patterns",
        patterns: ["a", "b", "c"],
        text: "cbaabc",
      },
      {
        name: "Empty text",
        patterns: ["a", "b"],
        text: "",
      },
      {
        name: "Pattern longer than text",
        patterns: ["supercalifragilistic"],
        text: "super",
      },
    ];

    for (const tc of testCases) {
      it(`should 100% match naive search results for case: ${tc.name}`, () => {
        const trie = buildFullAhoCorasick(tc.patterns);
        const acMatches = searchAhoCorasick(trie, tc.text);
        const naiveMatches = naiveMultiPatternSearch(tc.patterns, tc.text);

        // Sort both by (startIndex, endIndex, pattern)
        const sortFn = (a: ACMatchOccurrence, b: ACMatchOccurrence) => {
          if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
          if (a.endIndex !== b.endIndex) return a.endIndex - b.endIndex;
          return a.pattern.localeCompare(b.pattern);
        };

        const sortedAC = [...acMatches].sort(sortFn);
        const sortedNaive = [...naiveMatches].sort(sortFn);

        expect(sortedAC.length).toBe(sortedNaive.length);

        for (let i = 0; i < sortedAC.length; i++) {
          expect(sortedAC[i].pattern).toBe(sortedNaive[i].pattern);
          expect(sortedAC[i].startIndex).toBe(sortedNaive[i].startIndex);
          expect(sortedAC[i].endIndex).toBe(sortedNaive[i].endIndex);
          // Verify slice of text equals pattern
          expect(tc.text.slice(sortedAC[i].startIndex, sortedAC[i].endIndex + 1)).toBe(
            sortedAC[i].pattern,
          );
        }
      });
    }

    it("should correctly find multiple matches ending at the same index", () => {
      // In "ushers", at index 3 ('e'), both "she" [1..3] and "he" [2..3] end!
      const patterns = ["he", "she", "his", "hers"];
      const trie = buildFullAhoCorasick(patterns);
      const matches = searchAhoCorasick(trie, "ushers");

      const matchesAt3 = matches.filter((m) => m.endIndex === 3);
      expect(matchesAt3.length).toBe(2);
      const patternsAt3 = matchesAt3.map((m) => m.pattern).sort();
      expect(patternsAt3).toEqual(["he", "she"]);

      // At index 5 ('s'), "hers" [2..5] ends
      const matchesAt5 = matches.filter((m) => m.endIndex === 5);
      expect(matchesAt5.length).toBe(1);
      expect(matchesAt5[0].pattern).toBe("hers");
    });
  });

  // ==========================================================================
  // 8. STEP TRACE GENERATORS FOR ALL 4 MODALITIES
  // ==========================================================================
  describe("8. Step Trace Generators for All 4 Modalities", () => {
    const patterns = ["he", "she", "his", "hers"];
    const text = "ushers";

    it("should generate valid Trie Multi-Pattern Build steps", () => {
      const steps = generateTrieBuildTrace(patterns);
      expect(steps.length).toBeGreaterThan(0);

      expect(steps[0].action).toBe("init");
      expect(steps[steps.length - 1].action).toBe("build_complete");

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        expect(step.stepIndex).toBe(i);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.trieSnapshot).toBeDefined();
        expect(step.trieSnapshot.nodes.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should generate valid BFS Failure Link Construction steps", () => {
      const trie = buildACTrie(patterns);
      const steps = generateFailureLinksTrace(trie);
      expect(steps.length).toBeGreaterThan(0);

      expect(steps[0].phase).toBe("init");
      expect(steps[steps.length - 1].phase).toBe("complete");

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        expect(step.stepIndex).toBe(i);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.trieSnapshot).toBeDefined();
        expect(step.queue).toBeDefined();
      }
    });

    it("should generate valid Dictionary Suffix Links steps", () => {
      const trie = buildACTrie(patterns);
      const withFail = computeFailureLinks(trie);
      const steps = generateDictSuffixLinksTrace(withFail);
      expect(steps.length).toBeGreaterThan(0);

      expect(steps[0].phase).toBe("init");
      expect(steps[steps.length - 1].phase).toBe("complete");

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        expect(step.stepIndex).toBe(i);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.trieSnapshot).toBeDefined();
      }
    });

    it("should generate valid Streaming Search DFA steps", () => {
      const fullTrie = buildFullAhoCorasick(patterns);
      const steps = generateStreamingSearchTrace(fullTrie, text);

      // Initial step + 1 step per character in text
      expect(steps.length).toBe(text.length + 1);

      expect(steps[0].transitionType).toBe("start");
      expect(steps[0].charIndex).toBe(-1);

      for (let i = 1; i <= text.length; i++) {
        const step = steps[i];
        expect(step.stepIndex).toBe(i);
        expect(step.charIndex).toBe(i - 1);
        expect(step.char).toBe(text[i - 1]);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.cumulativeMatches).toBeDefined();
      }

      // Final step cumulative matches should equal total search results
      const finalStep = steps[steps.length - 1];
      const directSearch = searchAhoCorasick(fullTrie, text);
      expect(finalStep.cumulativeMatches.length).toBe(directSearch.length);
    });
  });

  // ==========================================================================
  // 9. HIERARCHICAL SVG TREE LAYOUT CALCULATION
  // ==========================================================================
  describe("9. Hierarchical SVG Tree Layout Calculation", () => {
    it("should layout trie nodes with valid coordinates and no NaN values", () => {
      const trie = buildFullAhoCorasick(["he", "she", "his", "hers"]);
      const layout = layoutACTrie(trie, 800, 400, 40);

      expect(layout.nodes.length).toBe(trie.nodes.length);
      expect(layout.edges.length).toBeGreaterThan(0);
      expect(layout.width).toBe(800);
      expect(layout.height).toBe(400);
      expect(layout.maxDepth).toBeGreaterThan(0);

      for (const node of layout.nodes) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
        expect(node.x).toBeGreaterThanOrEqual(30);
        expect(node.x).toBeLessThanOrEqual(770);
        expect(node.y).toBeGreaterThanOrEqual(30);
        expect(node.y).toBeLessThanOrEqual(370);
      }
    });

    it("should layout root node at top center", () => {
      const trie = buildFullAhoCorasick(["abc"]);
      const layout = layoutACTrie(trie, 800, 400, 40);

      const root = layout.nodes.find((n) => n.id === 0);
      expect(root).toBeDefined();
      expect(root!.y).toBe(40); // Top padding
      expect(root!.depth).toBe(0);
    });

    it("should handle single node empty trie layout gracefully", () => {
      const empty = createEmptyACTrie();
      const layout = layoutACTrie(empty, 600, 300, 20);

      expect(layout.nodes.length).toBe(1);
      expect(layout.edges.length).toBe(0);
      expect(layout.nodes[0].x).toBe(300); // Centered
      expect(layout.nodes[0].y).toBe(150);
    });
  });
});
