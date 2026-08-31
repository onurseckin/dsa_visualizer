import { describe, expect, it } from "bun:test";
import React from "react";
import {
  TokenizerAutomataStudio,
  TOKENIZER_PRESETS,
  TIKTOKEN_PATTERNS,
  buildInitialVocab,
  countPairFrequencies,
  trainBPE,
  tokenizeBPE,
  getBPEMergeTrace,
  classifyPreTokenChunk,
  splitTiktokenRegex,
  encodeUTF8Bytes,
  decodeUTF8Bytes,
  bytesToHex,
  bytesToBinary,
  gpt2BytesToUnicodeMapping,
  getByteFallbackTokens,
  buildAhoCorasickTrie,
  buildAhoCorasickAutomata,
  searchAhoCorasick,
  layoutAhoCorasickGraph,
  type TokenizerPresetId,
  type TokenizerStudioMode,
  type PreTokenCategory,
} from "../../components/primitives/TokenizerAutomataStudio";

describe("TokenizerAutomataStudio & Subword Automata Suite Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate TokenizerAutomataStudio with default props", () => {
      const element = React.createElement(TokenizerAutomataStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(TokenizerAutomataStudio);
    });

    it("should instantiate TokenizerAutomataStudio with custom modes and presets", () => {
      const onPresetChangeMock = (_id: TokenizerPresetId) => {};
      const onModeChangeMock = (_mode: TokenizerStudioMode) => {};

      const element = React.createElement(TokenizerAutomataStudio, {
        initialPreset: "tiktoken_cl100k",
        initialMode: "tiktoken",
        standalone: true,
        title: "Advanced Subword & Automata Workbench",
        onPresetChange: onPresetChangeMock,
        onModeChange: onModeChangeMock,
      });

      expect(element.props.initialPreset).toBe("tiktoken_cl100k");
      expect(element.props.initialMode).toBe("tiktoken");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Advanced Subword & Automata Workbench");
      expect(element.props.onPresetChange).toBe(onPresetChangeMock);
      expect(element.props.onModeChange).toBe(onModeChangeMock);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const presetIds: TokenizerPresetId[] = [
      "gpt2_bpe_demo",
      "tiktoken_cl100k",
      "byte_fallback_utf8",
      "aho_corasick_dna",
      "aho_corasick_security",
      "code_keyword_lexer",
    ];

    it("should provide valid preset structures across all defined presets", () => {
      for (const id of presetIds) {
        const preset = TOKENIZER_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name).toBeDefined();
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.mode).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.theoryNotes).toBeDefined();
        expect(preset.theoryNotes.length).toBeGreaterThan(0);

        if (preset.mode === "bpe") {
          expect(preset.bpeCorpus).toBeDefined();
          expect(preset.bpeCorpus!.length).toBeGreaterThan(0);
          expect(preset.bpeTestText).toBeDefined();
          expect(preset.bpeMaxMerges).toBeGreaterThan(0);
        }

        if (preset.mode === "tiktoken") {
          expect(preset.tiktokenText).toBeDefined();
          expect(preset.tiktokenText!.length).toBeGreaterThan(0);
          expect(preset.tiktokenPatternName).toBeDefined();
        }

        if (preset.mode === "byte_fallback") {
          expect(preset.byteText).toBeDefined();
          expect(preset.byteText!.length).toBeGreaterThan(0);
        }

        if (preset.mode === "aho_corasick") {
          expect(preset.ahoKeywords).toBeDefined();
          expect(preset.ahoKeywords!.length).toBeGreaterThanOrEqual(3);
          expect(preset.ahoSearchText).toBeDefined();
          expect(preset.ahoSearchText!.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ==========================================================================
  // 3. BYTE-PAIR ENCODING (BPE) ALGORITHMS & MERGE PIPELINE
  // ==========================================================================
  describe("3. Byte-Pair Encoding (BPE) Algorithms & Pipeline", () => {
    const corpus = "low lower newest widest lowest newer wide";

    it("should build initial vocabulary and word splits from corpus", () => {
      const { vocab, splits, wordFreqs } = buildInitialVocab(corpus);

      expect(vocab.size).toBeGreaterThan(0);
      expect(splits.length).toBeGreaterThan(0);
      expect(wordFreqs.length).toBe(splits.length);

      // Verify character coverage
      for (const char of "lownewstidr") {
        expect(vocab.has(char)).toBe(true);
        expect(vocab.get(char)).toBeGreaterThanOrEqual(0);
      }

      // Verify all initial splits contain single characters
      for (const split of splits) {
        for (const tok of split) {
          expect(tok.length).toBe(1);
          expect(vocab.has(tok)).toBe(true);
        }
      }
    });

    it("should count adjacent pair frequencies accurately across weighted splits", () => {
      const { splits, wordFreqs } = buildInitialVocab(corpus);
      const pairCounts = countPairFrequencies(splits, wordFreqs);

      expect(pairCounts.size).toBeGreaterThan(0);
      for (const [key, { pair, freq }] of pairCounts.entries()) {
        expect(key).toBe(`${pair[0]}\0${pair[1]}`);
        expect(freq).toBeGreaterThan(0);
      }

      // 'l' + 'o' should appear in 'low', 'lower', 'lowest'
      const loKey = "l\0o";
      expect(pairCounts.has(loKey)).toBe(true);
      expect(pairCounts.get(loKey)!.freq).toBeGreaterThanOrEqual(3);
    });

    it("should train BPE merge rules and reduce token sequence lengths", () => {
      const { vocab, merges, finalSplits } = trainBPE(corpus, 6);

      expect(merges.length).toBeLessThanOrEqual(6);
      expect(merges.length).toBeGreaterThan(0);
      expect(vocab.size).toBeGreaterThan(10);

      // Verify monotonic ascending rule ranks
      for (let i = 0; i < merges.length; i++) {
        expect(merges[i].rank).toBe(i + 1);
        expect(merges[i].frequency).toBeGreaterThan(0);
        expect(vocab.has(merges[i].merged)).toBe(true);
      }

      // Verify final splits are shorter on average than initial character splits
      const initialTotalTokens = corpus.split(/\s+/).reduce((sum, w) => sum + w.length, 0);
      const finalTotalTokens = finalSplits.reduce((sum, s) => sum + s.length, 0);
      expect(finalTotalTokens).toBeLessThan(initialTotalTokens);
    });

    it("should tokenize new text using learned merge rules in priority order", () => {
      const { merges, vocab } = trainBPE(corpus, 8);
      const testText = "lowest newer";
      const tokens = tokenizeBPE(testText, merges, vocab);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.length).toBeLessThan(testText.replace(/\s+/g, "").length);

      // Should not produce unknown tokens for characters present in vocabulary
      for (const tok of tokens) {
        expect(tok.startsWith("<unk:")).toBe(false);
      }
    });

    it("should trace step-by-step BPE merges for visualizer scrubbing", () => {
      const { merges } = trainBPE(corpus, 6);
      const trace = getBPEMergeTrace("lowest", merges);

      expect(trace.length).toBeGreaterThanOrEqual(1);
      expect(trace[0].stepIndex).toBe(0);
      expect(trace[0].tokens).toEqual(["l", "o", "w", "e", "s", "t"]);

      for (let i = 1; i < trace.length; i++) {
        expect(trace[i].stepIndex).toBe(i);
        expect(trace[i].ruleApplied).toBeDefined();
        expect(trace[i].tokens.length).toBeLessThan(trace[i - 1].tokens.length);
        expect(trace[i].description).toContain("Applied merge rule");
      }
    });

    it("should handle empty strings and single characters gracefully", () => {
      const { merges, vocab } = trainBPE("", 5);
      expect(merges.length).toBe(0);

      const emptyTokens = tokenizeBPE("", merges, vocab);
      expect(emptyTokens).toEqual([]);

      const singleCharTokens = tokenizeBPE("a", merges);
      expect(singleCharTokens).toEqual(["a"]);

      const emptyTrace = getBPEMergeTrace("", merges);
      expect(emptyTrace.length).toBe(1);
      expect(emptyTrace[0].tokens).toEqual([]);
    });
  });

  // ==========================================================================
  // 4. TIKTOKEN REGEX PRE-TOKENIZATION & CHUNK CLASSIFICATION
  // ==========================================================================
  describe("4. Tiktoken Regex Pre-Tokenization & Chunk Classification", () => {
    it("should classify semantic chunks accurately", () => {
      const categories: [string, PreTokenCategory][] = [
        ["'s", "contraction"],
        ["'re", "contraction"],
        ["'ve", "contraction"],
        ["'m", "contraction"],
        ["'ll", "contraction"],
        ["'d", "contraction"],
        ["   ", "whitespace"],
        ["\n\t", "whitespace"],
        ["123", "number"],
        ["42", "number"],
        ["Hello", "word"],
        ["transform", "word"],
        [",", "punctuation"],
        ["...", "punctuation"],
        ["!", "punctuation"],
        ["🚀", "symbol"],
      ];

      for (const [text, expected] of categories) {
        expect(classifyPreTokenChunk(text)).toBe(expected);
      }
    });

    it("should split text using GPT-2 and CL100K regex patterns preserving input text", () => {
      const testInput =
        "Don't worry! GPT-4's tokenization handles 12345 items & emojis 🚀✨ cleanly.";

      const chunksCL100K = splitTiktokenRegex(testInput, "cl100k");
      expect(chunksCL100K.length).toBeGreaterThan(0);

      // Reconstructed text must exactly match input
      const reconstructedCL100K = chunksCL100K.map((c) => c.text).join("");
      expect(reconstructedCL100K).toBe(testInput);

      // Verify chunk metadata
      for (const chunk of chunksCL100K) {
        expect(chunk.index).toBeGreaterThanOrEqual(0);
        expect(chunk.byteLength).toBeGreaterThan(0);
        expect(chunk.charRange[1] - chunk.charRange[0]).toBe(chunk.text.length);
        expect(testInput.slice(chunk.charRange[0], chunk.charRange[1])).toBe(chunk.text);
      }

      // Verify CL100K limits digit sequence chunks to at most 3 digits (\p{N}{1,3})
      const numChunks = chunksCL100K.filter((c) => c.category === "number");
      for (const numChunk of numChunks) {
        expect(numChunk.text.trim().length).toBeLessThanOrEqual(3);
      }
    });

    it("should provide valid default TIKTOKEN_PATTERNS", () => {
      expect(TIKTOKEN_PATTERNS.cl100k).toBeDefined();
      expect(TIKTOKEN_PATTERNS.gpt2).toBeDefined();
      expect(TIKTOKEN_PATTERNS.simple).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. BYTE-LEVEL FALLBACK & UTF-8 ENCODING SUITE
  // ==========================================================================
  describe("5. Byte-Level Fallback & UTF-8 Encoding Suite", () => {
    const testCases = [
      "Hello World",
      "Café naïve",
      "世界",
      "🚀✨🧑‍💻",
      "Subword BPE with 100% OOV Safety!",
    ];

    it("should maintain UTF-8 encoding and decoding invertibility", () => {
      for (const text of testCases) {
        const bytes = encodeUTF8Bytes(text);
        expect(bytes.length).toBeGreaterThanOrEqual(text.length);
        const decoded = decodeUTF8Bytes(bytes);
        expect(decoded).toBe(text);
      }
    });

    it("should convert bytes to hexadecimal and binary string representations", () => {
      const sampleBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const hex = bytesToHex(sampleBytes);
      const bin = bytesToBinary(sampleBytes);

      expect(hex).toEqual(["0x48", "0x65", "0x6C", "0x6C", "0x6F"]);
      expect(bin).toEqual(["01001000", "01100101", "01101100", "01101100", "01101111"]);
    });

    it("should generate bijective GPT-2 byte-to-unicode character mappings", () => {
      const { byteToChar, charToByte } = gpt2BytesToUnicodeMapping();

      expect(byteToChar.size).toBe(256);
      expect(charToByte.size).toBe(256);

      // Verify bijection: charToByte(byteToChar(b)) === b for all 256 bytes
      for (let b = 0; b < 256; b++) {
        const char = byteToChar.get(b);
        expect(char).toBeDefined();
        expect(charToByte.get(char!)).toBe(b);
      }
    });

    it("should generate byte fallback tokens guaranteeing 0% OOV token loss", () => {
      const text = "Hi 🚀";
      const fallbackTokens = getByteFallbackTokens(text);

      expect(fallbackTokens.length).toBeGreaterThanOrEqual(4);

      // ASCII 'H' and 'i' should be clean tokens
      expect(fallbackTokens[0].fallbackToken).toBe("H");
      expect(fallbackTokens[0].isAscii).toBe(true);
      expect(fallbackTokens[1].fallbackToken).toBe("i");

      // Emoji 🚀 is 4 bytes in UTF-8: 0xF0 0x9F 0x9A 0x80
      const rocketFallback = fallbackTokens.find((t) => t.char === "🚀");
      expect(rocketFallback).toBeDefined();
      expect(rocketFallback!.utf8Bytes.length).toBe(4);
      expect(rocketFallback!.hexBytes).toEqual(["0xF0", "0x9F", "0x9A", "0x80"]);
      expect(rocketFallback!.fallbackToken).toBe("<0xF0><0x9F><0x9A><0x80>");
      expect(rocketFallback!.isAscii).toBe(false);
    });
  });

  // ==========================================================================
  // 6. AHO-CORASICK AUTOMATA & MULTI-PATTERN EXACT SEARCH
  // ==========================================================================
  describe("6. Aho-Corasick Automata Construction & Exact Search", () => {
    const patterns = ["ACGT", "CGTA", "GTAC", "TACG"];
    const text = "ACGTACGTACGT";

    it("should build keyword Trie with root and correct depth transitions", () => {
      const automata = buildAhoCorasickTrie(patterns);

      expect(automata.rootId).toBe(0);
      expect(automata.nodes.length).toBeGreaterThan(patterns.length);
      expect(automata.nodes[0].char).toBe("^");
      expect(automata.nodes[0].depth).toBe(0);

      // Verify all patterns are registered as terminal nodes
      for (const pat of patterns) {
        const matchingNode = automata.nodes.find((n) => n.isTerminal && n.output.includes(pat));
        expect(matchingNode).toBeDefined();
        expect(matchingNode!.depth).toBe(pat.length);
      }
    });

    it("should compute BFS failure transitions and dictionary links", () => {
      const automata = buildAhoCorasickAutomata(patterns);
      const { nodes } = automata;

      // Children of root must have failId = 0
      const rootChildren = Object.values(nodes[0].children);
      for (const childId of rootChildren) {
        expect(nodes[childId].failId).toBe(0);
      }

      // Nodes at depth > 1 must have valid failIds pointing within the trie
      for (let i = 1; i < nodes.length; i++) {
        expect(nodes[i].failId).toBeGreaterThanOrEqual(0);
        expect(nodes[i].failId).toBeLessThan(nodes.length);
      }
    });

    it("should execute streaming multi-pattern search and detect all exact occurrences", () => {
      const automata = buildAhoCorasickAutomata(patterns);
      const { matches, steps } = searchAhoCorasick(automata, text);

      expect(matches.length).toBeGreaterThanOrEqual(4);
      expect(steps.length).toBe(text.length);

      // Verify every detected match matches substring in text
      for (const m of matches) {
        expect(patterns).toContain(m.pattern);
        expect(text.slice(m.startIndex, m.endIndex)).toBe(m.pattern);
        expect(m.endIndex - m.startIndex).toBe(m.pattern.length);
      }

      // Verify trace step transition types
      for (const step of steps) {
        expect(step.stepIndex).toBeGreaterThan(0);
        expect(["trie_edge", "failure_link", "root_fallback"]).toContain(step.transitionType);
        expect(step.toStateId).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle overlapping suffix matches (dictionary link propagation)", () => {
      const subPatterns = ["he", "she", "his", "hers"];
      const subAutomata = buildAhoCorasickAutomata(subPatterns);
      const searchText = "ushers";

      const { matches } = searchAhoCorasick(subAutomata, searchText);
      const matchedNames = matches.map((m) => m.pattern);

      // "ushers" contains "she", "he", "hers"
      expect(matchedNames).toContain("she");
      expect(matchedNames).toContain("he");
      expect(matchedNames).toContain("hers");
    });

    it("should compute 2D hierarchical graph layout within canvas bounds", () => {
      const automata = buildAhoCorasickAutomata(patterns);
      const layout = layoutAhoCorasickGraph(automata, {
        width: 800,
        height: 450,
      });

      expect(layout.nodes.length).toBe(automata.nodes.length);
      expect(layout.edges.length).toBeGreaterThan(0);

      // All node coordinates must lie inside bounds
      for (const node of layout.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(800);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(450);
      }

      // Failure links must connect valid nodes
      for (const fEdge of layout.failureEdges) {
        expect(fEdge.isFailureLink).toBe(true);
        expect(fEdge.from).toBeGreaterThan(0);
        expect(fEdge.to).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==========================================================================
  // 7. EDGE CASES & ALGORITHMIC ROBUSTNESS
  // ==========================================================================
  describe("7. Edge Cases & Algorithmic Robustness", () => {
    it("should handle empty keyword pattern lists in Aho-Corasick", () => {
      const emptyAutomata = buildAhoCorasickAutomata([]);
      expect(emptyAutomata.nodes.length).toBe(1);
      const { matches, steps } = searchAhoCorasick(emptyAutomata, "ACGT");
      expect(matches.length).toBe(0);
      expect(steps.length).toBe(4);
    });

    it("should handle text with no matching patterns", () => {
      const automata = buildAhoCorasickAutomata(["XYZ", "WWW"]);
      const { matches } = searchAhoCorasick(automata, "ABCDEF");
      expect(matches.length).toBe(0);
    });

    it("should handle single character keyword patterns", () => {
      const automata = buildAhoCorasickAutomata(["A", "B"]);
      const { matches } = searchAhoCorasick(automata, "ABBA");
      expect(matches.length).toBe(4);
      expect(matches.map((m) => m.pattern)).toEqual(["A", "B", "B", "A"]);
    });

    it("should handle empty input strings across all utilities", () => {
      expect(encodeUTF8Bytes("").length).toBe(0);
      expect(decodeUTF8Bytes(new Uint8Array())).toBe("");
      expect(bytesToHex([]).length).toBe(0);
      expect(bytesToBinary([]).length).toBe(0);
      expect(getByteFallbackTokens("").length).toBe(0);
      expect(splitTiktokenRegex("").length).toBe(0);
    });
  });
});
