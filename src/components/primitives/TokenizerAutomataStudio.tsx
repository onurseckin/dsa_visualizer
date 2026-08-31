import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Cpu,
  Hash,
  BookOpen,
  Sliders,
} from "lucide-react";
import { useCanvasBox, type Size } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type TokenizerStudioMode = "bpe" | "tiktoken" | "byte_fallback" | "aho_corasick";

export type TokenizerPresetId =
  | "gpt2_bpe_demo"
  | "tiktoken_cl100k"
  | "byte_fallback_utf8"
  | "aho_corasick_dna"
  | "aho_corasick_security"
  | "code_keyword_lexer";

// BPE Types
export interface BPEMergeRule {
  readonly rank: number;
  readonly pair: readonly [string, string];
  readonly merged: string;
  readonly frequency: number;
}

export interface BPEVocabItem {
  readonly id: number;
  readonly token: string;
  readonly isInitial: boolean;
  readonly mergeRank?: number;
}

export interface BPEMergeTraceStep {
  readonly stepIndex: number;
  readonly ruleApplied?: BPEMergeRule;
  readonly tokens: readonly string[];
  readonly description: string;
}

// Tiktoken Types
export type PreTokenCategory =
  | "contraction"
  | "word"
  | "number"
  | "punctuation"
  | "whitespace"
  | "symbol";

export interface PreTokenChunk {
  readonly index: number;
  readonly text: string;
  readonly category: PreTokenCategory;
  readonly byteLength: number;
  readonly charRange: readonly [number, number];
}

// Byte Fallback Types
export interface ByteTokenInfo {
  readonly char: string;
  readonly codePoint: number;
  readonly hexCodepoint: string;
  readonly utf8Bytes: readonly number[];
  readonly hexBytes: readonly string[];
  readonly binaryBytes: readonly string[];
  readonly fallbackToken: string;
  readonly isAscii: boolean;
}

// Aho-Corasick Types
export interface AhoCorasickNode {
  readonly id: number;
  readonly char: string;
  readonly depth: number;
  readonly parentId: number | null;
  readonly children: Readonly<Record<string, number>>;
  readonly failId: number;
  readonly output: readonly string[];
  readonly dictLink: number | null;
  readonly isTerminal: boolean;
}

export interface AhoCorasickAutomata {
  readonly rootId: number;
  readonly nodes: readonly AhoCorasickNode[];
  readonly patterns: readonly string[];
}

export interface AhoCorasickMatch {
  readonly pattern: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly stateId: number;
}

export interface AhoCorasickStepTrace {
  readonly stepIndex: number;
  readonly charIndex: number;
  readonly char: string;
  readonly fromStateId: number;
  readonly toStateId: number;
  readonly transitionType: "trie_edge" | "failure_link" | "root_fallback";
  readonly activeOutput: readonly string[];
  readonly cumulativeMatches: readonly AhoCorasickMatch[];
  readonly description: string;
}

export interface LayoutGraphNode {
  readonly id: number;
  readonly char: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly failId: number;
  readonly output: readonly string[];
  readonly isTerminal: boolean;
}

export interface LayoutGraphEdge {
  readonly from: number;
  readonly to: number;
  readonly char: string;
  readonly isFailureLink: boolean;
}

export interface TokenizerPreset {
  readonly id: TokenizerPresetId;
  readonly name: string;
  readonly mode: TokenizerStudioMode;
  readonly description: string;
  readonly theoryNotes: string;
  readonly bpeCorpus?: string;
  readonly bpeTestText?: string;
  readonly bpeMaxMerges?: number;
  readonly tiktokenText?: string;
  readonly tiktokenPatternName?: "cl100k" | "gpt2" | "simple";
  readonly byteText?: string;
  readonly ahoKeywords?: readonly string[];
  readonly ahoSearchText?: string;
}

export interface TokenizerAutomataStudioProps {
  readonly initialMode?: TokenizerStudioMode;
  readonly initialPreset?: TokenizerPresetId;
  readonly className?: string;
  readonly title?: string;
  readonly standalone?: boolean;
  readonly onModeChange?: (mode: TokenizerStudioMode) => void;
  readonly onPresetChange?: (presetId: TokenizerPresetId) => void;
}

// ============================================================================
// 2. CORE PURE ALGORITHMIC FUNCTIONS
// ============================================================================

/**
 * Splits text or array of words into space-separated characters representing initial BPE vocab.
 */
export function buildInitialVocab(corpus: string | readonly string[]): {
  vocab: Map<string, number>;
  splits: string[][];
  wordFreqs: number[];
} {
  const words =
    typeof corpus === "string" ? corpus.trim().split(/\s+/).filter(Boolean) : [...corpus];

  const freqMap = new Map<string, number>();
  for (const w of words) {
    freqMap.set(w, (freqMap.get(w) ?? 0) + 1);
  }

  const splits: string[][] = [];
  const wordFreqs: number[] = [];
  const vocab = new Map<string, number>();
  let nextId = 0;

  for (const [w, freq] of freqMap.entries()) {
    const chars = Array.from(w);
    splits.push(chars);
    wordFreqs.push(freq);
    for (const c of chars) {
      if (!vocab.has(c)) {
        vocab.set(c, nextId++);
      }
    }
  }

  return { vocab, splits, wordFreqs };
}

/**
 * Counts frequencies of adjacent token pairs across all current word splits.
 */
export function countPairFrequencies(
  splits: readonly (readonly string[])[],
  wordFreqs: readonly number[],
): Map<string, { pair: [string, string]; freq: number }> {
  const pairMap = new Map<string, { pair: [string, string]; freq: number }>();

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    const freq = wordFreqs[i] ?? 1;

    for (let j = 0; j < split.length - 1; j++) {
      const p0 = split[j];
      const p1 = split[j + 1];
      const key = `${p0}\0${p1}`;
      const existing = pairMap.get(key);
      if (existing) {
        existing.freq += freq;
      } else {
        pairMap.set(key, { pair: [p0, p1], freq });
      }
    }
  }

  return pairMap;
}

/**
 * Trains BPE on a corpus and generates merge priority rules.
 */
export function trainBPE(
  corpus: string | readonly string[],
  maxMerges = 10,
): {
  vocab: Map<string, number>;
  merges: BPEMergeRule[];
  finalSplits: string[][];
} {
  const { vocab, splits, wordFreqs } = buildInitialVocab(corpus);
  const currentSplits = splits.map((s) => [...s]);
  const merges: BPEMergeRule[] = [];
  let nextTokenId = vocab.size;

  for (let rank = 1; rank <= maxMerges; rank++) {
    const pairCounts = countPairFrequencies(currentSplits, wordFreqs);
    if (pairCounts.size === 0) break;

    // Find highest frequency pair (deterministic tie-breaking by alphabetical key)
    let bestEntry: { pair: [string, string]; freq: number } | null = null;
    let bestKey = "";

    for (const [key, entry] of pairCounts.entries()) {
      if (!bestEntry || entry.freq > bestEntry.freq) {
        bestEntry = entry;
        bestKey = key;
      } else if (entry.freq === bestEntry.freq && key < bestKey) {
        bestEntry = entry;
        bestKey = key;
      }
    }

    if (!bestEntry || bestEntry.freq <= 0) break;

    const [first, second] = bestEntry.pair;
    const merged = first + second;
    const rule: BPEMergeRule = {
      rank,
      pair: [first, second],
      merged,
      frequency: bestEntry.freq,
    };
    merges.push(rule);

    if (!vocab.has(merged)) {
      vocab.set(merged, nextTokenId++);
    }

    // Apply merge across all current splits
    for (let i = 0; i < currentSplits.length; i++) {
      const split = currentSplits[i];
      const newSplit: string[] = [];
      let j = 0;
      while (j < split.length) {
        if (j < split.length - 1 && split[j] === first && split[j + 1] === second) {
          newSplit.push(merged);
          j += 2;
        } else {
          newSplit.push(split[j]);
          j += 1;
        }
      }
      currentSplits[i] = newSplit;
    }
  }

  return { vocab, merges, finalSplits: currentSplits };
}

/**
 * Tokenizes a single text string using learned BPE merge rules.
 */
export function tokenizeBPE(
  text: string,
  merges: readonly BPEMergeRule[],
  vocab?: ReadonlyMap<string, number>,
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];

  for (const word of words) {
    let tokens: string[] = Array.from(word);

    // Apply merge rules in ascending rank order
    for (const rule of merges) {
      const [f, s] = rule.pair;
      const newTokens: string[] = [];
      let j = 0;
      while (j < tokens.length) {
        if (j < tokens.length - 1 && tokens[j] === f && tokens[j + 1] === s) {
          newTokens.push(rule.merged);
          j += 2;
        } else {
          newTokens.push(tokens[j]);
          j += 1;
        }
      }
      tokens = newTokens;
    }

    // Check vocabulary coverage if vocab is supplied
    if (vocab) {
      for (const tok of tokens) {
        result.push(vocab.has(tok) ? tok : `<unk:${tok}>`);
      }
    } else {
      result.push(...tokens);
    }
  }

  return result;
}

/**
 * Traces the step-by-step merge process of BPE on an input word.
 */
export function getBPEMergeTrace(
  text: string,
  merges: readonly BPEMergeRule[],
): BPEMergeTraceStep[] {
  if (!text) {
    return [{ stepIndex: 0, tokens: [], description: "Initial empty input" }];
  }

  let currentTokens = Array.from(text.trim());
  const steps: BPEMergeTraceStep[] = [
    {
      stepIndex: 0,
      tokens: [...currentTokens],
      description: `Initial character split (${currentTokens.length} tokens)`,
    },
  ];

  let stepCount = 1;
  for (const rule of merges) {
    const [f, s] = rule.pair;
    let didMerge = false;
    const nextTokens: string[] = [];
    let j = 0;
    while (j < currentTokens.length) {
      if (j < currentTokens.length - 1 && currentTokens[j] === f && currentTokens[j + 1] === s) {
        nextTokens.push(rule.merged);
        j += 2;
        didMerge = true;
      } else {
        nextTokens.push(currentTokens[j]);
        j += 1;
      }
    }

    if (didMerge) {
      currentTokens = nextTokens;
      steps.push({
        stepIndex: stepCount++,
        ruleApplied: rule,
        tokens: [...currentTokens],
        description: `Applied merge rule #${rule.rank}: ('${f}', '${s}') -> '${rule.merged}'`,
      });
    }
  }

  return steps;
}

// ============================================================================
// 3. TIKTOKEN REGEX PRE-TOKENIZATION
// ============================================================================

export const TIKTOKEN_PATTERNS = {
  cl100k:
    /'s|'t|'re|'ve|'m|'ll|'d|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu,
  gpt2: /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu,
  simple: /[A-Za-z]+|\d+|[^\s\w]+|\s+/g,
};

/**
 * Classifies a pre-token chunk into semantic category.
 */
export function classifyPreTokenChunk(chunk: string): PreTokenCategory {
  if (!chunk) return "symbol";
  if (/^'(?:s|t|re|ve|m|ll|d)$/i.test(chunk)) return "contraction";
  if (/^\s+$/.test(chunk)) return "whitespace";
  if (/^\p{N}+$/u.test(chunk.trim())) return "number";
  if (/^\p{L}+$/u.test(chunk.trim())) return "word";
  if (/^\p{P}+$/u.test(chunk.trim())) return "punctuation";
  if (/^\p{S}+$/u.test(chunk.trim())) return "symbol";
  if (/^[^\s\p{L}\p{N}]+$/u.test(chunk)) return "punctuation";
  return "symbol";
}

/**
 * Splits text using regex pre-tokenization.
 */
export function splitTiktokenRegex(
  text: string,
  patternOrName: "cl100k" | "gpt2" | "simple" | RegExp = "gpt2",
): PreTokenChunk[] {
  if (!text) return [];

  let regex: RegExp;
  if (typeof patternOrName === "string") {
    if (patternOrName === "cl100k") {
      regex =
        /'s|'t|'re|'ve|'m|'ll|'d|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
    } else if (patternOrName === "gpt2") {
      regex = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
    } else {
      regex = /[A-Za-z]+|\d+|[^\s\w]+|\s+/g;
    }
  } else {
    regex = new RegExp(patternOrName.source, patternOrName.flags);
  }

  const chunks: PreTokenChunk[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
  while ((match = re.exec(text)) !== null) {
    const chunkText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + chunkText.length;
    const encoder = new TextEncoder();
    const byteLength = encoder.encode(chunkText).length;

    chunks.push({
      index: index++,
      text: chunkText,
      category: classifyPreTokenChunk(chunkText),
      byteLength,
      charRange: [startIndex, endIndex],
    });
  }

  return chunks;
}

// ============================================================================
// 4. BYTE-LEVEL FALLBACK & UTF-8 ENCODING
// ============================================================================

/**
 * Encodes string to UTF-8 bytes Uint8Array.
 */
export function encodeUTF8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Decodes UTF-8 bytes to string.
 */
export function decodeUTF8Bytes(bytes: Uint8Array | readonly number[]): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new TextDecoder().decode(u8);
}

/**
 * Formats bytes to hexadecimal array.
 */
export function bytesToHex(bytes: Uint8Array | readonly number[]): readonly string[] {
  const arr = Array.from(bytes);
  return arr.map((b) => `0x${b.toString(16).toUpperCase().padStart(2, "0")}`);
}

/**
 * Formats bytes to binary array.
 */
export function bytesToBinary(bytes: Uint8Array | readonly number[]): readonly string[] {
  const arr = Array.from(bytes);
  return arr.map((b) => b.toString(2).padStart(8, "0"));
}

/**
 * GPT-2 style byte-to-unicode character mapping lookup.
 */
export function gpt2BytesToUnicodeMapping(): {
  byteToChar: Map<number, string>;
  charToByte: Map<string, number>;
} {
  const byteToChar = new Map<number, string>();
  const charToByte = new Map<string, number>();

  const bs: number[] = [];
  for (let b = 33; b <= 126; b++) bs.push(b);
  for (let b = 161; b <= 172; b++) bs.push(b);
  for (let b = 174; b <= 255; b++) bs.push(b);

  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n++;
    }
  }

  for (let i = 0; i < bs.length; i++) {
    const char = String.fromCharCode(cs[i]);
    byteToChar.set(bs[i], char);
    charToByte.set(char, bs[i]);
  }

  return { byteToChar, charToByte };
}

/**
 * Extracts comprehensive byte fallback tokens for input characters.
 */
export function getByteFallbackTokens(text: string): ByteTokenInfo[] {
  const result: ByteTokenInfo[] = [];
  const encoder = new TextEncoder();

  for (const char of Array.from(text)) {
    const codePoint = char.codePointAt(0) ?? 0;
    const hexCodepoint = `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
    const rawBytes = Array.from(encoder.encode(char));
    const hexBytes = bytesToHex(rawBytes);
    const binaryBytes = bytesToBinary(rawBytes);
    const fallbackToken =
      rawBytes.length === 1 && codePoint >= 32 && codePoint <= 126
        ? char
        : rawBytes.map((b) => `<0x${b.toString(16).toUpperCase().padStart(2, "0")}>`).join("");

    result.push({
      char,
      codePoint,
      hexCodepoint,
      utf8Bytes: rawBytes,
      hexBytes,
      binaryBytes,
      fallbackToken,
      isAscii: codePoint <= 127,
    });
  }

  return result;
}

// ============================================================================
// 5. AHO-CORASICK AUTOMATA & TRIE
// ============================================================================

/**
 * Builds initial keyword trie for Aho-Corasick.
 */
export function buildAhoCorasickTrie(patterns: readonly string[]): AhoCorasickAutomata {
  const nodes: AhoCorasickNode[] = [
    {
      id: 0,
      char: "^",
      depth: 0,
      parentId: null,
      children: {},
      failId: 0,
      output: [],
      dictLink: null,
      isTerminal: false,
    },
  ];

  for (const pattern of patterns) {
    if (!pattern) continue;
    let currId = 0;

    for (const char of Array.from(pattern)) {
      const currNode = nodes[currId];
      if (currNode.children[char] !== undefined) {
        currId = currNode.children[char];
      } else {
        const newId = nodes.length;
        (currNode.children as Record<string, number>)[char] = newId;
        nodes.push({
          id: newId,
          char,
          depth: currNode.depth + 1,
          parentId: currId,
          children: {},
          failId: 0,
          output: [],
          dictLink: null,
          isTerminal: false,
        });
        currId = newId;
      }
    }

    const terminalNode = nodes[currId];
    (terminalNode.output as string[]).push(pattern);
    (terminalNode as { isTerminal: boolean }).isTerminal = true;
  }

  return { rootId: 0, nodes, patterns };
}

/**
 * Computes BFS Failure Links (delta) and Dictionary Output Links for Aho-Corasick.
 */
export function buildAhoCorasickAutomata(patterns: readonly string[]): AhoCorasickAutomata {
  const automata = buildAhoCorasickTrie(patterns);
  const { nodes } = automata;
  const queue: number[] = [];

  const rootNode = nodes[0];
  for (const char of Object.keys(rootNode.children)) {
    const childId = rootNode.children[char];
    (nodes[childId] as { failId: number }).failId = 0;
    queue.push(childId);
  }

  while (queue.length > 0) {
    const uId = queue.shift()!;
    const uNode = nodes[uId];

    for (const [char, vId] of Object.entries(uNode.children)) {
      queue.push(vId);

      let failCandidate = uNode.failId;
      while (failCandidate !== 0 && nodes[failCandidate].children[char] === undefined) {
        failCandidate = nodes[failCandidate].failId;
      }

      const matchingFailId = nodes[failCandidate].children[char];
      const targetFailId =
        matchingFailId !== undefined && matchingFailId !== vId ? matchingFailId : 0;

      (nodes[vId] as { failId: number }).failId = targetFailId;

      const failNode = nodes[targetFailId];
      if (failNode.output.length > 0) {
        const combinedOutputs = Array.from(new Set([...nodes[vId].output, ...failNode.output]));
        (nodes[vId] as { output: readonly string[] }).output = combinedOutputs;
        (nodes[vId] as { dictLink: number | null }).dictLink = targetFailId;
      } else if (failNode.dictLink !== null) {
        (nodes[vId] as { dictLink: number | null }).dictLink = failNode.dictLink;
      }
    }
  }

  return automata;
}

/**
 * Runs Aho-Corasick exact multi-pattern search over text, collecting matches and step traces.
 */
export function searchAhoCorasick(
  automata: AhoCorasickAutomata,
  text: string,
): {
  matches: AhoCorasickMatch[];
  steps: AhoCorasickStepTrace[];
} {
  const { nodes } = automata;
  const matches: AhoCorasickMatch[] = [];
  const steps: AhoCorasickStepTrace[] = [];

  let currState = 0;
  const textChars = Array.from(text);

  for (let i = 0; i < textChars.length; i++) {
    const char = textChars[i];
    const fromState = currState;
    let transitionType: "trie_edge" | "failure_link" | "root_fallback" = "trie_edge";

    while (currState !== 0 && nodes[currState].children[char] === undefined) {
      currState = nodes[currState].failId;
      transitionType = "failure_link";
    }

    if (nodes[currState].children[char] !== undefined) {
      currState = nodes[currState].children[char];
      if (transitionType !== "failure_link") {
        transitionType = "trie_edge";
      }
    } else {
      currState = 0;
      transitionType = "root_fallback";
    }

    const activeNode = nodes[currState];
    const newMatches: AhoCorasickMatch[] = [];

    if (activeNode.output.length > 0) {
      for (const pat of activeNode.output) {
        const startIndex = i - pat.length + 1;
        const matchItem: AhoCorasickMatch = {
          pattern: pat,
          startIndex,
          endIndex: i + 1,
          stateId: currState,
        };
        matches.push(matchItem);
        newMatches.push(matchItem);
      }
    }

    steps.push({
      stepIndex: i + 1,
      charIndex: i,
      char,
      fromStateId: fromState,
      toStateId: currState,
      transitionType,
      activeOutput: activeNode.output,
      cumulativeMatches: [...matches],
      description:
        newMatches.length > 0
          ? `Read '${char}' -> State ${currState}: Matched [${newMatches.map((m) => `'${m.pattern}'`).join(", ")}]`
          : `Read '${char}' -> State ${currState} (${transitionType.replace("_", " ")})`,
    });
  }

  return { matches, steps };
}

/**
 * 2D Graph Layout generator for Aho-Corasick automata SVG visualization.
 */
export function layoutAhoCorasickGraph(
  automata: AhoCorasickAutomata,
  box: Size = { width: 800, height: 450 },
): {
  nodes: LayoutGraphNode[];
  edges: LayoutGraphEdge[];
  failureEdges: LayoutGraphEdge[];
} {
  const { nodes } = automata;
  if (nodes.length === 0) {
    return { nodes: [], edges: [], failureEdges: [] };
  }

  const depthMap = new Map<number, number[]>();
  let maxDepth = 0;

  for (const node of nodes) {
    const d = node.depth;
    maxDepth = Math.max(maxDepth, d);
    const list = depthMap.get(d) ?? [];
    list.push(node.id);
    depthMap.set(d, list);
  }

  const padX = 60;
  const padY = 50;
  const usableW = Math.max(box.width - padX * 2, 200);
  const usableH = Math.max(box.height - padY * 2, 150);
  const depthStep = maxDepth > 0 ? usableH / maxDepth : usableH / 2;

  const layoutNodes: LayoutGraphNode[] = [];
  const nodePosMap = new Map<number, { x: number; y: number }>();

  for (let d = 0; d <= maxDepth; d++) {
    const row = depthMap.get(d) ?? [];
    const count = row.length;
    const y = padY + d * depthStep;

    row.forEach((id, idx) => {
      const x = count === 1 ? box.width / 2 : padX + (idx / (count - 1)) * usableW;
      const node = nodes[id];
      nodePosMap.set(id, { x, y });
      layoutNodes.push({
        id: node.id,
        char: node.char,
        depth: node.depth,
        x,
        y,
        failId: node.failId,
        output: node.output,
        isTerminal: node.isTerminal,
      });
    });
  }

  const edges: LayoutGraphEdge[] = [];
  const failureEdges: LayoutGraphEdge[] = [];

  for (const node of nodes) {
    for (const [char, childId] of Object.entries(node.children)) {
      edges.push({
        from: node.id,
        to: childId,
        char,
        isFailureLink: false,
      });
    }

    if (node.failId !== node.id && node.depth > 1) {
      failureEdges.push({
        from: node.id,
        to: node.failId,
        char: "δ",
        isFailureLink: true,
      });
    }
  }

  return { nodes: layoutNodes, edges, failureEdges };
}

// ============================================================================
// 6. PRESETS DEFINITIONS
// ============================================================================

export const TOKENIZER_PRESETS: Record<TokenizerPresetId, TokenizerPreset> = {
  gpt2_bpe_demo: {
    id: "gpt2_bpe_demo",
    name: "GPT-2 Byte-Pair Encoding (BPE)",
    mode: "bpe",
    description:
      "Demonstrates subword BPE token merge priority queue on frequency-ranked corpus tokens.",
    theoryNotes:
      "BPE greedily merges the most frequent adjacent token pair (u, v) -> uv across the corpus until max merges is reached or no frequent pairs remain. Time complexity: O(N log V).",
    bpeCorpus: "low lower newest widest lowest newer wide",
    bpeTestText: "lowest newer",
    bpeMaxMerges: 8,
  },
  tiktoken_cl100k: {
    id: "tiktoken_cl100k",
    name: "Tiktoken CL100K Regex Pre-tokenization",
    mode: "tiktoken",
    description:
      "Visualizes regex pre-tokenization boundary splitting before byte encoding into subwords.",
    theoryNotes:
      "Pre-tokenization isolates punctuation, words, numbers, and contractions so merges never cross natural language lexical boundaries. GPT-4 uses cl100k_base regex.",
    tiktokenText: "Don't worry! GPT-4's tokenization handles 1234.56 items & emojis 🚀✨ cleanly.",
    tiktokenPatternName: "cl100k",
  },
  byte_fallback_utf8: {
    id: "byte_fallback_utf8",
    name: "Byte-Level Fallback & UTF-8 Encoding",
    mode: "byte_fallback",
    description:
      "Breaks Unicode text into UTF-8 bytes to guarantee 0% OOV unknown token loss for multi-lingual and emoji inputs.",
    theoryNotes:
      "Standard tokenizers fail with <unk> for rare characters. Byte-level BPE maps all 256 raw bytes into individual base tokens, handling any Unicode stream gracefully.",
    byteText: "Hello 🌍 世界! Café naïve 🧑‍💻",
  },
  aho_corasick_dna: {
    id: "aho_corasick_dna",
    name: "Aho-Corasick DNA Motif Search",
    mode: "aho_corasick",
    description:
      "Multi-pattern exact genomic sequence matching with linear time complexity O(N + M + Z).",
    theoryNotes:
      "Aho-Corasick builds a trie with BFS failure links (delta). Searching a genome sequence of length N against M total pattern characters runs in O(N + M + Z) where Z is total matches.",
    ahoKeywords: ["ACGT", "CGTA", "GTAC", "TACG"],
    ahoSearchText: "ACGTACGTACGT",
  },
  aho_corasick_security: {
    id: "aho_corasick_security",
    name: "IDS & Security Signature Scanner",
    mode: "aho_corasick",
    description: "Intrusion Detection System keyword scan over source code or network payloads.",
    theoryNotes:
      "Network IDS systems (Snort/Suricata) use Aho-Corasick automata to scan packet streams at multi-gigabit line rate against thousands of malicious signatures simultaneously.",
    ahoKeywords: ["eval", "exec", "system", "shell", "script", "malware"],
    ahoSearchText: "const payload = eval(malware_script); exec(system);",
  },
  code_keyword_lexer: {
    id: "code_keyword_lexer",
    name: "Code Keyword Lexer Automata",
    mode: "aho_corasick",
    description:
      "Deterministic keyword token recognition for language lexers and compiler frontends.",
    theoryNotes:
      "Compiler lexers match language keywords deterministically via finite-state automata without needing multiple passes or regex backtracking.",
    ahoKeywords: ["function", "return", "const", "let", "var", "import", "from"],
    ahoSearchText: "function solve() { const val = 42; return val; }",
  },
};

// ============================================================================
// 7. REACT COMPONENT: TOKENIZER AUTOMATA STUDIO
// ============================================================================

export const TokenizerAutomataStudio: React.FC<TokenizerAutomataStudioProps> = ({
  initialMode = "bpe",
  initialPreset = "gpt2_bpe_demo",
  className = "",
  title = "Tokenizer & Automata Studio",
  standalone = true,
  onModeChange,
  onPresetChange,
}) => {
  const [mode, setMode] = useState<TokenizerStudioMode>(initialMode);
  const [presetId, setPresetId] = useState<TokenizerPresetId>(initialPreset);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showTheory, setShowTheory] = useState<boolean>(false);
  const [showFailureLinks, setShowFailureLinks] = useState<boolean>(true);

  // BPE State
  const [bpeCorpus, setBpeCorpus] = useState<string>(
    TOKENIZER_PRESETS[initialPreset]?.bpeCorpus ?? "low lower newest widest lowest newer wide",
  );
  const [bpeTestText, setBpeTestText] = useState<string>(
    TOKENIZER_PRESETS[initialPreset]?.bpeTestText ?? "lowest newer",
  );
  const [bpeMaxMerges, setBpeMaxMerges] = useState<number>(8);

  // Tiktoken State
  const [tiktokenText, setTiktokenText] = useState<string>(
    TOKENIZER_PRESETS[initialPreset]?.tiktokenText ??
      "Don't worry! GPT-4's tokenization handles 1234.56 items & emojis 🚀✨ cleanly.",
  );
  const [tiktokenPattern, setTiktokenPattern] = useState<"cl100k" | "gpt2" | "simple">("cl100k");

  // Byte Fallback State
  const [byteText, setByteText] = useState<string>(
    TOKENIZER_PRESETS[initialPreset]?.byteText ?? "Hello 🌍 世界! Café naïve 🧑‍💻",
  );

  // Aho-Corasick State
  const [ahoKeywordsStr, setAhoKeywordsStr] = useState<string>(
    (TOKENIZER_PRESETS[initialPreset]?.ahoKeywords ?? ["ACGT", "CGTA", "GTAC", "TACG"]).join(", "),
  );
  const [ahoSearchText, setAhoSearchText] = useState<string>(
    TOKENIZER_PRESETS[initialPreset]?.ahoSearchText ?? "ACGTACGTACGT",
  );

  const { ref: svgContainerRef, box: svgBox } = useCanvasBox({
    width: 800,
    height: 420,
  });

  // Handle Preset Switching
  const handleSelectPreset = (id: TokenizerPresetId) => {
    const preset = TOKENIZER_PRESETS[id];
    if (!preset) return;
    setPresetId(id);
    setMode(preset.mode);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    if (preset.bpeCorpus) setBpeCorpus(preset.bpeCorpus);
    if (preset.bpeTestText) setBpeTestText(preset.bpeTestText);
    if (preset.bpeMaxMerges) setBpeMaxMerges(preset.bpeMaxMerges);
    if (preset.tiktokenText) setTiktokenText(preset.tiktokenText);
    if (preset.tiktokenPatternName) setTiktokenPattern(preset.tiktokenPatternName);
    if (preset.byteText) setByteText(preset.byteText);
    if (preset.ahoKeywords) setAhoKeywordsStr(preset.ahoKeywords.join(", "));
    if (preset.ahoSearchText) setAhoSearchText(preset.ahoSearchText);

    onPresetChange?.(id);
    onModeChange?.(preset.mode);
  };

  const handleModeChange = (newMode: TokenizerStudioMode) => {
    setMode(newMode);
    setIsPlaying(false);
    setCurrentStepIndex(0);
    onModeChange?.(newMode);
  };

  // Memoized BPE Computations
  const bpeTrained = useMemo(() => {
    return trainBPE(bpeCorpus, bpeMaxMerges);
  }, [bpeCorpus, bpeMaxMerges]);

  const bpeTraceSteps = useMemo(() => {
    return getBPEMergeTrace(bpeTestText, bpeTrained.merges);
  }, [bpeTestText, bpeTrained.merges]);

  const bpeTokenizedResult = useMemo(() => {
    return tokenizeBPE(bpeTestText, bpeTrained.merges, bpeTrained.vocab);
  }, [bpeTestText, bpeTrained.merges, bpeTrained.vocab]);

  // Memoized Tiktoken Computations
  const tiktokenChunks = useMemo(() => {
    return splitTiktokenRegex(tiktokenText, tiktokenPattern);
  }, [tiktokenText, tiktokenPattern]);

  // Memoized Byte Fallback Computations
  const byteFallbackTokens = useMemo(() => {
    return getByteFallbackTokens(byteText);
  }, [byteText]);

  // Memoized Aho-Corasick Computations
  const ahoKeywords = useMemo(() => {
    return ahoKeywordsStr
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }, [ahoKeywordsStr]);

  const ahoAutomata = useMemo(() => {
    return buildAhoCorasickAutomata(ahoKeywords);
  }, [ahoKeywords]);

  const ahoSearchResult = useMemo(() => {
    return searchAhoCorasick(ahoAutomata, ahoSearchText);
  }, [ahoAutomata, ahoSearchText]);

  const ahoGraphLayout = useMemo(() => {
    return layoutAhoCorasickGraph(ahoAutomata, svgBox);
  }, [ahoAutomata, svgBox]);

  // Step limits based on active mode
  const totalSteps = useMemo(() => {
    if (mode === "bpe") return Math.max(bpeTraceSteps.length - 1, 0);
    if (mode === "aho_corasick") return Math.max(ahoSearchResult.steps.length, 0);
    if (mode === "tiktoken") return Math.max(tiktokenChunks.length, 0);
    return Math.max(byteFallbackTokens.length, 0);
  }, [mode, bpeTraceSteps, ahoSearchResult.steps, tiktokenChunks, byteFallbackTokens]);

  const safeStepIndex = Math.min(currentStepIndex, totalSteps);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(200, 1000 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Active Aho Corasick state
  const activeAhoStep = ahoSearchResult.steps[safeStepIndex - 1] ?? null;
  const activeAhoStateId = activeAhoStep ? activeAhoStep.toStateId : 0;

  return (
    <div
      className={`flex flex-col w-full bg-slate-900 ${standalone ? "min-h-screen" : ""} border border-slate-800 rounded-xl text-slate-100 shadow-2xl overflow-hidden font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
            <p className="text-xs text-slate-400">
              Subword BPE • Tiktoken Pre-Tokenization • Byte Fallback • Aho-Corasick Automata
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
          <button
            type="button"
            onClick={() => handleModeChange("bpe")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === "bpe"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Subword BPE
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("tiktoken")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === "tiktoken"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tiktoken Regex
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("byte_fallback")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === "byte_fallback"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Byte Fallback
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("aho_corasick")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === "aho_corasick"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Aho-Corasick Trie
          </button>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Preset:</span>
          <select
            value={presetId}
            onChange={(e) => handleSelectPreset(e.target.value as TokenizerPresetId)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.values(TOKENIZER_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left/Main Visualization Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg p-3 gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={safeStepIndex <= 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-md transition-colors"
                title="Previous Step"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.min(totalSteps, prev + 1));
                }}
                disabled={safeStepIndex >= totalSteps}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-md transition-colors"
                title="Next Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Step Scrubber */}
            <div className="flex items-center space-x-3 flex-1 max-w-xs">
              <span className="text-xs text-slate-400 font-mono">
                Step {safeStepIndex}/{totalSteps}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(totalSteps, 1)}
                value={safeStepIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(Number(e.target.value));
                }}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Speed Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Speed:</span>
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 text-xs rounded font-mono ${
                    playbackSpeed === spd
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {mode === "aho_corasick" && (
              <button
                type="button"
                onClick={() => setShowFailureLinks(!showFailureLinks)}
                className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                  showFailureLinks
                    ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                Failure Links (δ)
              </button>
            )}
          </div>

          {/* Interactive Visualization Surface */}
          <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl p-4 min-h-[380px] flex flex-col justify-between">
            {/* Mode 1: Subword BPE Display */}
            {mode === "bpe" && (
              <div className="flex flex-col h-full space-y-6">
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-400 mb-2">
                    BPE Tokenization Merge Animation (Step {safeStepIndex})
                  </div>
                  <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-900/90 border border-slate-800 rounded-lg min-h-[70px]">
                    {(bpeTraceSteps[safeStepIndex]?.tokens ?? []).map((tok, idx) => (
                      <span
                        key={`${idx}-${tok}`}
                        className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-mono text-sm rounded-md shadow-sm"
                      >
                        {tok}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-indigo-300 mt-2 font-mono">
                    {bpeTraceSteps[safeStepIndex]?.description ?? ""}
                  </p>
                </div>

                {/* Priority Queue Merge Table */}
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-400 mb-2">
                    Learned BPE Merge Priority Queue ({bpeTrained.merges.length} Rules)
                  </div>
                  <div className="overflow-x-auto max-h-[180px] border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-800">Rank</th>
                          <th className="px-3 py-2 border-b border-slate-800">Pair (u, v)</th>
                          <th className="px-3 py-2 border-b border-slate-800">Merged Token</th>
                          <th className="px-3 py-2 border-b border-slate-800">Corpus Freq</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {bpeTrained.merges.map((rule) => {
                          const isCurrent =
                            bpeTraceSteps[safeStepIndex]?.ruleApplied?.rank === rule.rank;
                          return (
                            <tr
                              key={rule.rank}
                              className={
                                isCurrent
                                  ? "bg-indigo-500/30 text-white font-bold"
                                  : "hover:bg-slate-900/50"
                              }
                            >
                              <td className="px-3 py-1.5 text-indigo-400">#{rule.rank}</td>
                              <td className="px-3 py-1.5">
                                ('{rule.pair[0]}', '{rule.pair[1]}')
                              </td>
                              <td className="px-3 py-1.5 text-emerald-400 font-semibold">
                                '{rule.merged}'
                              </td>
                              <td className="px-3 py-1.5">{rule.frequency}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Tiktoken Regex Display */}
            {mode === "tiktoken" && (
              <div className="flex flex-col h-full space-y-4">
                <div className="text-xs uppercase font-semibold text-slate-400 mb-1">
                  Regex Pre-Tokenization Splits ({tiktokenChunks.length} Chunks)
                </div>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-900 border border-slate-800 rounded-lg min-h-[120px]">
                  {tiktokenChunks.map((chk) => {
                    const isWord = chk.category === "word";
                    const isNum = chk.category === "number";
                    const isContr = chk.category === "contraction";
                    const isPunct = chk.category === "punctuation";
                    const isSpace = chk.category === "whitespace";

                    const badgeColor = isWord
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                      : isNum
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
                        : isContr
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                          : isPunct
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                            : isSpace
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-blue-500/20 border-blue-500/40 text-blue-200";

                    return (
                      <div
                        key={chk.index}
                        className={`flex flex-col items-center px-3 py-1.5 border rounded-md font-mono text-xs shadow ${badgeColor}`}
                      >
                        <span className="font-bold text-sm">{isSpace ? "␣" : chk.text}</span>
                        <span className="text-[10px] opacity-75">{chk.category}</span>
                        <span className="text-[9px] opacity-60">{chk.byteLength}B</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Legend:</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                    Word
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">Number</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                    Contraction
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded">
                    Punctuation
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                    Whitespace
                  </span>
                </div>
              </div>
            )}

            {/* Mode 3: Byte Fallback Display */}
            {mode === "byte_fallback" && (
              <div className="flex flex-col h-full space-y-4">
                <div className="text-xs uppercase font-semibold text-slate-400 mb-1">
                  UTF-8 Byte Encoding & Fallback Tokens ({byteFallbackTokens.length} Codepoints)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto p-2">
                  {byteFallbackTokens.map((info, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {info.char === " " ? "␣" : info.char}
                        </span>
                        <span className="text-indigo-400 font-semibold">{info.hexCodepoint}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Bytes: <span className="text-emerald-400">{info.hexBytes.join(" ")}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 break-all">
                        Binary: {info.binaryBytes.join(" ")}
                      </div>
                      <div className="text-[11px] text-amber-400 pt-1 border-t border-slate-800">
                        Token: {info.fallbackToken}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 4: Aho-Corasick Automata Graph */}
            {mode === "aho_corasick" && (
              <div ref={svgContainerRef} className="relative w-full h-[320px]">
                <svg className="w-full h-full" viewBox={`0 0 ${svgBox.width} ${svgBox.height}`}>
                  <defs>
                    <marker
                      id="arrow-solid"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker
                      id="arrow-fail"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ec4899" />
                    </marker>
                  </defs>

                  {/* Failure links (dashed pink curves) */}
                  {showFailureLinks &&
                    ahoGraphLayout.failureEdges.map((e, idx) => {
                      const fromNode = ahoGraphLayout.nodes.find((n) => n.id === e.from);
                      const toNode = ahoGraphLayout.nodes.find((n) => n.id === e.to);
                      if (!fromNode || !toNode) return null;

                      const dy = toNode.y - fromNode.y;
                      const midX = (fromNode.x + toNode.x) / 2 + (dy > 0 ? 30 : -30);
                      const midY = (fromNode.y + toNode.y) / 2 - 20;

                      return (
                        <path
                          key={`fail-${idx}`}
                          d={`M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`}
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          markerEnd="url(#arrow-fail)"
                          opacity={0.6}
                        />
                      );
                    })}

                  {/* Normal tree transition edges */}
                  {ahoGraphLayout.edges.map((e, idx) => {
                    const fromNode = ahoGraphLayout.nodes.find((n) => n.id === e.from);
                    const toNode = ahoGraphLayout.nodes.find((n) => n.id === e.to);
                    if (!fromNode || !toNode) return null;

                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    return (
                      <g key={`edge-${idx}`}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke="#475569"
                          strokeWidth="2"
                          markerEnd="url(#arrow-solid)"
                        />
                        <rect
                          x={midX - 8}
                          y={midY - 8}
                          width="16"
                          height="16"
                          rx="4"
                          fill="#0f172a"
                          stroke="#334155"
                        />
                        <text
                          x={midX}
                          y={midY + 4}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {e.char}
                        </text>
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {ahoGraphLayout.nodes.map((node) => {
                    const isActive = node.id === activeAhoStateId;
                    const isRoot = node.id === 0;

                    return (
                      <g key={`node-${node.id}`}>
                        {isActive && (
                          <circle cx={node.x} cy={node.y} r="22" fill="#6366f1" opacity="0.3" />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="16"
                          fill={
                            isActive
                              ? "#6366f1"
                              : node.isTerminal
                                ? "#059669"
                                : isRoot
                                  ? "#1e293b"
                                  : "#0f172a"
                          }
                          stroke={isActive ? "#a5b4fc" : node.isTerminal ? "#34d399" : "#475569"}
                          strokeWidth={node.isTerminal ? "3" : "2"}
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="12"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {isRoot ? "0" : node.char}
                        </text>

                        {/* Node ID label */}
                        <text
                          x={node.x}
                          y={node.y - 19}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          S{node.id}
                        </text>

                        {/* Terminal Output Pattern Tag */}
                        {node.output.length > 0 && (
                          <g transform={`translate(${node.x + 16}, ${node.y - 10})`}>
                            <rect
                              x="0"
                              y="0"
                              width={Math.max(node.output.join(",").length * 6 + 12, 30)}
                              height="16"
                              rx="4"
                              fill="#064e3b"
                              stroke="#059669"
                              strokeWidth="1"
                            />
                            <text
                              x="6"
                              y="11"
                              fill="#a7f3d0"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              [{node.output.join(",")}]
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Settings, Inputs & Telemetry (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Custom Input Controls Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Interactive Controls</span>
            </h3>

            {mode === "bpe" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Training Corpus:</label>
                  <textarea
                    value={bpeCorpus}
                    onChange={(e) => setBpeCorpus(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Test Input Text:</label>
                  <input
                    type="text"
                    value={bpeTestText}
                    onChange={(e) => setBpeTestText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-medium">Max Merges:</span>
                    <span className="text-indigo-400 font-mono">{bpeMaxMerges}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={bpeMaxMerges}
                    onChange={(e) => setBpeMaxMerges(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {mode === "tiktoken" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">
                    Regex Pattern Family:
                  </label>
                  <select
                    value={tiktokenPattern}
                    onChange={(e) =>
                      setTiktokenPattern(e.target.value as "cl100k" | "gpt2" | "simple")
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none"
                  >
                    <option value="cl100k">CL100K (GPT-4 / ChatGPT)</option>
                    <option value="gpt2">GPT-2 / GPT-3</option>
                    <option value="simple">Simple Alphanumeric</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Input Text:</label>
                  <textarea
                    value={tiktokenText}
                    onChange={(e) => setTiktokenText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === "byte_fallback" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">
                    Unicode / Multi-lingual Text:
                  </label>
                  <textarea
                    value={byteText}
                    onChange={(e) => setByteText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === "aho_corasick" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">
                    Keywords Dictionary (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={ahoKeywordsStr}
                    onChange={(e) => setAhoKeywordsStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">
                    Search Corpus Text:
                  </label>
                  <textarea
                    value={ahoSearchText}
                    onChange={(e) => setAhoSearchText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Telemetry & Metrics Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1.5">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>Metrics & Telemetry</span>
            </h3>

            {mode === "bpe" && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Vocab Size</div>
                  <div className="text-base font-bold text-indigo-400">{bpeTrained.vocab.size}</div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Merges Applied</div>
                  <div className="text-base font-bold text-emerald-400">
                    {bpeTrained.merges.length}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Output Tokens</div>
                  <div className="text-base font-bold text-amber-400">
                    {bpeTokenizedResult.length}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Compression</div>
                  <div className="text-base font-bold text-purple-400">
                    {bpeTestText.length > 0
                      ? (bpeTestText.length / Math.max(bpeTokenizedResult.length, 1)).toFixed(2)
                      : "1.00"}
                    x
                  </div>
                </div>
              </div>
            )}

            {mode === "tiktoken" && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Total Chunks</div>
                  <div className="text-base font-bold text-indigo-400">{tiktokenChunks.length}</div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Total Bytes</div>
                  <div className="text-base font-bold text-emerald-400">
                    {tiktokenChunks.reduce((acc, c) => acc + c.byteLength, 0)}B
                  </div>
                </div>
              </div>
            )}

            {mode === "byte_fallback" && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Codepoints</div>
                  <div className="text-base font-bold text-indigo-400">
                    {byteFallbackTokens.length}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">UTF-8 Bytes</div>
                  <div className="text-base font-bold text-emerald-400">
                    {byteFallbackTokens.reduce((acc, b) => acc + b.utf8Bytes.length, 0)}B
                  </div>
                </div>
              </div>
            )}

            {mode === "aho_corasick" && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Trie States</div>
                  <div className="text-base font-bold text-indigo-400">
                    {ahoAutomata.nodes.length}
                  </div>
                </div>
                <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-md">
                  <div className="text-[10px] text-slate-400">Matches Found</div>
                  <div className="text-base font-bold text-emerald-400">
                    {ahoSearchResult.matches.length}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches List (for Aho Corasick) */}
          {mode === "aho_corasick" && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Found Pattern Matches ({ahoSearchResult.matches.length})
              </h3>
              <div className="max-h-[140px] overflow-y-auto space-y-1 text-xs font-mono">
                {ahoSearchResult.matches.length === 0 ? (
                  <p className="text-slate-500 italic">No matches detected yet.</p>
                ) : (
                  ahoSearchResult.matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-300"
                    >
                      <span className="font-bold">'{m.pattern}'</span>
                      <span className="text-[10px] text-slate-400">
                        [{m.startIndex}..{m.endIndex}]
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Theory Accordion Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <button
              type="button"
              onClick={() => setShowTheory(!showTheory)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
            >
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Theory & Complexity</span>
              </span>
              <span className="text-slate-400">{showTheory ? "Hide" : "Show"}</span>
            </button>

            {showTheory && (
              <div className="pt-2 text-xs text-slate-300 space-y-2 leading-relaxed border-t border-slate-800">
                <p>{TOKENIZER_PRESETS[presetId]?.theoryNotes}</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-amber-300">
                  {mode === "bpe" && "Time: O(N log V) | Space: O(V + N)"}
                  {mode === "tiktoken" && "Time: O(N) | Space: O(N)"}
                  {mode === "byte_fallback" && "Time: O(N) | 0% OOV Guarantee"}
                  {mode === "aho_corasick" && "Time: O(N + M + Z) | Space: O(M * |Σ|)"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
