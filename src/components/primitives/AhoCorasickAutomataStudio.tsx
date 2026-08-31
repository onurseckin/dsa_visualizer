import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Search,
  Network,
  Activity,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  BookOpen,
  Sliders,
  Plus,
  Trash2,
  Terminal,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type AhoCorasickModality =
  | "trie_multi_pattern_build"
  | "bfs_failure_link_construction"
  | "dictionary_suffix_output_links"
  | "streaming_text_search_dfa";

export type ACPresetId =
  | "classic_ushers"
  | "dna_motifs"
  | "malware_signatures"
  | "code_keywords"
  | "overlapping_prefixes";

export interface ACTrieNode {
  id: number;
  depth: number;
  char: string;
  parent: number | null;
  children: Record<string, number>;
  fail: number;
  dictLink: number | null;
  output: string[];
  isTerminal: boolean;
  patternIndices: number[];
}

export interface ACTrie {
  root: number;
  nodes: ACTrieNode[];
  patterns: string[];
  alphabet: string[];
}

export interface ACMatchOccurrence {
  pattern: string;
  patternIndex: number;
  startIndex: number;
  endIndex: number;
  matchedAtState: number;
}

export type ACTransitionMatrix = Record<number, Record<string, number>>;

// Modality 1: Multi-Pattern Trie Build Step Trace
export type ACTrieBuildAction =
  | "init"
  | "start_pattern"
  | "traverse_existing"
  | "allocate_node"
  | "mark_terminal"
  | "build_complete";

export interface ACTrieBuildStep {
  stepIndex: number;
  patternIndex: number;
  pattern: string;
  charIndex: number;
  char: string;
  fromNodeId: number;
  toNodeId: number;
  action: ACTrieBuildAction;
  description: string;
  trieSnapshot: ACTrie;
  activeNodeId: number;
  highlightEdge?: { from: number; to: number; char: string };
}

// Modality 2: BFS Failure Link Step Trace
export type ACFailLinkPhase =
  | "init"
  | "depth1_root"
  | "inspect_child"
  | "fallback_step"
  | "assign_fail"
  | "complete";

export interface ACFailLinkBuildStep {
  stepIndex: number;
  phase: ACFailLinkPhase;
  currentNodeId: number | null;
  childNodeId: number | null;
  char: string | null;
  fallbackNodeId: number | null;
  assignedFailId: number | null;
  examinedFallbacks: number[];
  queue: number[];
  description: string;
  trieSnapshot: ACTrie;
}

// Modality 3: Dictionary Suffix Link Step Trace
export type ACDictLinkPhase =
  | "init"
  | "inspect_node"
  | "traverse_chain"
  | "assign_dict"
  | "complete";

export interface ACDictLinkBuildStep {
  stepIndex: number;
  phase: ACDictLinkPhase;
  nodeId: number;
  failTargetId: number;
  inspectedStates: number[];
  assignedDictLinkId: number | null;
  accumulatedOutputs: string[];
  description: string;
  trieSnapshot: ACTrie;
}

// Modality 4: Streaming Search DFA Step Trace
export type ACSearchTransitionType =
  | "start"
  | "direct_trie"
  | "fail_fallback_match"
  | "fail_fallback_root";

export interface ACSearchStep {
  stepIndex: number;
  charIndex: number;
  char: string;
  fromStateId: number;
  toStateId: number;
  transitionType: ACSearchTransitionType;
  fallbackPath: number[];
  activeMatches: ACMatchOccurrence[];
  cumulativeMatches: ACMatchOccurrence[];
  description: string;
  activeDictChain: number[];
  activeStateId: number;
}

export interface ACLayoutNode {
  id: number;
  depth: number;
  char: string;
  x: number;
  y: number;
  fail: number;
  dictLink: number | null;
  output: string[];
  isTerminal: boolean;
  patternIndices: number[];
  pathString: string;
}

export interface ACLayoutEdge {
  from: number;
  to: number;
  char: string;
}

export interface ACLayoutResult {
  nodes: ACLayoutNode[];
  edges: ACLayoutEdge[];
  width: number;
  height: number;
  maxDepth: number;
}

export interface ACPreset {
  readonly id: ACPresetId;
  readonly name: string;
  readonly description: string;
  readonly patterns: readonly string[];
  readonly defaultText: string;
  readonly theoryNotes: string;
  readonly tags: readonly string[];
}

export interface AhoCorasickAutomataStudioProps {
  initialModality?: AhoCorasickModality;
  initialPreset?: ACPresetId;
  initialPatterns?: string[];
  initialText?: string;
  standalone?: boolean;
  title?: string;
  onModalityChange?: (modality: AhoCorasickModality) => void;
  onPresetChange?: (presetId: ACPresetId) => void;
}

// ============================================================================
// 2. PRESETS & CONSTANTS
// ============================================================================

export const AHO_CORASICK_PRESETS: Record<ACPresetId, ACPreset> = {
  classic_ushers: {
    id: "classic_ushers",
    name: "Classic Ushers (Aho & Corasick 1975)",
    description:
      "The seminal benchmark pattern set from the original 1975 paper featuring overlapping suffixes ('he', 'she', 'his', 'hers').",
    patterns: ["he", "she", "his", "hers"],
    defaultText: "ushers",
    theoryNotes:
      "Notice how 'she' ends with 'he', causing a failure link from state 'e' in 'she' to state 'e' in 'he'. When 'ushers' is processed, state 'she' emits both 'she' and 'he' via dictionary suffix links.",
    tags: ["Seminal Paper", "Suffix Overlap", "Linear Search"],
  },
  dna_motifs: {
    id: "dna_motifs",
    name: "DNA Motifs & K-mers",
    description:
      "Genomic nucleotide scanning over a 4-letter alphabet {A, C, G, T} with cyclic prefixes and tandem repeats.",
    patterns: ["ACGT", "CGTA", "TACG", "GTA"],
    defaultText: "ACGTACGTAGCTA",
    theoryNotes:
      "Bioinformatics algorithms utilize Aho-Corasick to locate thousands of transcription factor binding sites simultaneously in chromosome FASTA streams.",
    tags: ["Bioinformatics", "Genomics", "4-Letter Alphabet"],
  },
  malware_signatures: {
    id: "malware_signatures",
    name: "Malware Signatures (IDS/IPS)",
    description:
      "Intrusion detection system payload scanning matching multiple threat byte signatures across live network packets.",
    patterns: ["trojan", "worm", "botnet", "virus"],
    defaultText: "infected_trojan_worm_botnet_host",
    theoryNotes:
      "Network packet inspectors (e.g. Snort, Suricata) compile thousands of CVE intrusion rules into an Aho-Corasick automaton for wire-speed multi-pattern packet filtering.",
    tags: ["Cybersecurity", "Packet Filtering", "DFA Matrix"],
  },
  code_keywords: {
    id: "code_keywords",
    name: "Compiler Lexer Keywords",
    description:
      "Programming language tokenization extracting reserved keywords in linear time regardless of dictionary size.",
    patterns: ["function", "const", "return", "throw", "for"],
    defaultText: "function find() { const x = 1; return x; }",
    theoryNotes:
      "Compiler lexical analyzers leverage finite automata to classify source tokens in O(N) stream time without back-tracking.",
    tags: ["Compilers", "Lexing", "Language Parsing"],
  },
  overlapping_prefixes: {
    id: "overlapping_prefixes",
    name: "Overlapping Prefixes & Substrings",
    description:
      "Multi-match triggers where multiple dictionary patterns of varying lengths overlap and match simultaneously.",
    patterns: ["apple", "app", "plea", "lead"],
    defaultText: "applead",
    theoryNotes:
      "Illustrates deep failure transitions and simultaneous emission of shorter sub-patterns ('app' inside 'apple') through dictionary suffix links.",
    tags: ["Deep Failures", "Substrings", "Multi-Emission"],
  },
};

export const MODALITY_CONFIGS: Record<
  AhoCorasickModality,
  {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    badgeColor: string;
    theory: string;
  }
> = {
  trie_multi_pattern_build: {
    title: "1. Multi-Pattern Trie Build",
    subtitle: "Dictionary prefix tree construction",
    icon: GitCommit,
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    theory:
      "Inserts dictionary patterns character by character into a shared rooted trie. Overlapping prefixes share common ancestor paths. Time: O(Σ |P_i|).",
  },
  bfs_failure_link_construction: {
    title: "2. BFS Failure Links",
    subtitle: "Longest proper suffix transitions",
    icon: Network,
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    theory:
      "Breadth-first search calculates fail(v), pointing to the deepest state whose path is the longest proper suffix of path(v). Depth 1 nodes fail to root.",
  },
  dictionary_suffix_output_links: {
    title: "3. Dictionary Suffix Links",
    subtitle: "Compressed output match chaining",
    icon: Sparkles,
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    theory:
      "Dict links compress failure chains: dict(v) jumps directly to the nearest terminal state in the fail path, bypassing intermediate non-terminal states in O(1).",
  },
  streaming_text_search_dfa: {
    title: "4. Live Streaming Search / DFA",
    subtitle: "Single-pass linear text scanning",
    icon: Search,
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    theory:
      "Streams text character-by-character. On match, advances along trie edge; on mismatch, follows fail links. Emits all matches in O(N + occurrences) total time.",
  },
};

// ============================================================================
// 3. PURE ALGORITHMIC ENGINE & STEP TRACE GENERATORS
// ============================================================================

/**
 * Deep clone an ACTrie structure.
 */
export function cloneACTrie(trie: ACTrie): ACTrie {
  return {
    root: trie.root,
    patterns: [...trie.patterns],
    alphabet: [...trie.alphabet],
    nodes: trie.nodes.map((node) => ({
      id: node.id,
      depth: node.depth,
      char: node.char,
      parent: node.parent,
      children: { ...node.children },
      fail: node.fail,
      dictLink: node.dictLink,
      output: [...node.output],
      isTerminal: node.isTerminal,
      patternIndices: [...node.patternIndices],
    })),
  };
}

/**
 * Creates an empty ACTrie containing only the root state 0.
 */
export function createEmptyACTrie(): ACTrie {
  const rootNode: ACTrieNode = {
    id: 0,
    depth: 0,
    char: "",
    parent: null,
    children: {},
    fail: 0,
    dictLink: null,
    output: [],
    isTerminal: false,
    patternIndices: [],
  };
  return {
    root: 0,
    nodes: [rootNode],
    patterns: [],
    alphabet: [],
  };
}

/**
 * Validates and cleans user pattern input list.
 */
export function validatePatterns(patterns: string[]): {
  valid: boolean;
  error?: string;
  cleaned: string[];
} {
  const cleaned = patterns.map((p) => p.trim()).filter((p) => p.length > 0);

  if (cleaned.length === 0) {
    return { valid: false, error: "At least one non-empty pattern is required.", cleaned: [] };
  }

  const unique = Array.from(new Set(cleaned));
  return { valid: true, cleaned: unique };
}

/**
 * Reconstructs the prefix string from root to node.
 */
export function getNodePrefixPath(trie: ACTrie, nodeId: number): string {
  if (nodeId < 0 || nodeId >= trie.nodes.length) return "";
  const chars: string[] = [];
  let curr = nodeId;
  while (curr !== 0 && trie.nodes[curr]) {
    chars.push(trie.nodes[curr].char);
    curr = trie.nodes[curr].parent ?? 0;
  }
  return chars.reverse().join("");
}

/**
 * Pure function: Builds dictionary prefix trie from patterns.
 */
export function buildACTrie(patterns: string[]): ACTrie {
  const { cleaned } = validatePatterns(patterns);
  const trie = createEmptyACTrie();
  trie.patterns = cleaned;

  const alphabetSet = new Set<string>();

  cleaned.forEach((pat, patIdx) => {
    let curr = 0;
    for (let i = 0; i < pat.length; i++) {
      const c = pat[i];
      alphabetSet.add(c);
      if (trie.nodes[curr].children[c] !== undefined) {
        curr = trie.nodes[curr].children[c];
      } else {
        const newNodeId = trie.nodes.length;
        const newNode: ACTrieNode = {
          id: newNodeId,
          depth: trie.nodes[curr].depth + 1,
          char: c,
          parent: curr,
          children: {},
          fail: 0,
          dictLink: null,
          output: [],
          isTerminal: false,
          patternIndices: [],
        };
        trie.nodes.push(newNode);
        trie.nodes[curr].children[c] = newNodeId;
        curr = newNodeId;
      }
    }
    trie.nodes[curr].isTerminal = true;
    if (!trie.nodes[curr].output.includes(pat)) {
      trie.nodes[curr].output.push(pat);
      trie.nodes[curr].patternIndices.push(patIdx);
    }
  });

  trie.alphabet = Array.from(alphabetSet).sort();
  return trie;
}

/**
 * Generates step-by-step trace for Modality 1: Trie Multi-Pattern Build.
 */
export function generateTrieBuildTrace(patterns: string[]): ACTrieBuildStep[] {
  const { cleaned } = validatePatterns(patterns);
  const steps: ACTrieBuildStep[] = [];
  const runningTrie = createEmptyACTrie();
  runningTrie.patterns = cleaned;

  const alphabetSet = new Set<string>();

  steps.push({
    stepIndex: 0,
    patternIndex: -1,
    pattern: "",
    charIndex: -1,
    char: "",
    fromNodeId: 0,
    toNodeId: 0,
    action: "init",
    description: "Initialized empty Trie with Root (State 0).",
    trieSnapshot: cloneACTrie(runningTrie),
    activeNodeId: 0,
  });

  cleaned.forEach((pat, patIdx) => {
    let curr = 0;

    steps.push({
      stepIndex: steps.length,
      patternIndex: patIdx,
      pattern: pat,
      charIndex: -1,
      char: "",
      fromNodeId: 0,
      toNodeId: 0,
      action: "start_pattern",
      description: `Starting insertion of pattern #${patIdx + 1}: "${pat}" from Root.`,
      trieSnapshot: cloneACTrie(runningTrie),
      activeNodeId: 0,
    });

    for (let i = 0; i < pat.length; i++) {
      const c = pat[i];
      alphabetSet.add(c);

      if (runningTrie.nodes[curr].children[c] !== undefined) {
        const nextId = runningTrie.nodes[curr].children[c];
        steps.push({
          stepIndex: steps.length,
          patternIndex: patIdx,
          pattern: pat,
          charIndex: i,
          char: c,
          fromNodeId: curr,
          toNodeId: nextId,
          action: "traverse_existing",
          description: `Character '${c}' already exists. Traversing edge State ${curr} -> State ${nextId}.`,
          trieSnapshot: cloneACTrie(runningTrie),
          activeNodeId: nextId,
          highlightEdge: { from: curr, to: nextId, char: c },
        });
        curr = nextId;
      } else {
        const newNodeId = runningTrie.nodes.length;
        const newNode: ACTrieNode = {
          id: newNodeId,
          depth: runningTrie.nodes[curr].depth + 1,
          char: c,
          parent: curr,
          children: {},
          fail: 0,
          dictLink: null,
          output: [],
          isTerminal: false,
          patternIndices: [],
        };
        runningTrie.nodes.push(newNode);
        runningTrie.nodes[curr].children[c] = newNodeId;

        steps.push({
          stepIndex: steps.length,
          patternIndex: patIdx,
          pattern: pat,
          charIndex: i,
          char: c,
          fromNodeId: curr,
          toNodeId: newNodeId,
          action: "allocate_node",
          description: `Allocated new State ${newNodeId} (depth ${newNode.depth}) for char '${c}' from parent State ${curr}.`,
          trieSnapshot: cloneACTrie(runningTrie),
          activeNodeId: newNodeId,
          highlightEdge: { from: curr, to: newNodeId, char: c },
        });
        curr = newNodeId;
      }
    }

    runningTrie.nodes[curr].isTerminal = true;
    if (!runningTrie.nodes[curr].output.includes(pat)) {
      runningTrie.nodes[curr].output.push(pat);
      runningTrie.nodes[curr].patternIndices.push(patIdx);
    }

    steps.push({
      stepIndex: steps.length,
      patternIndex: patIdx,
      pattern: pat,
      charIndex: pat.length - 1,
      char: pat[pat.length - 1] ?? "",
      fromNodeId: curr,
      toNodeId: curr,
      action: "mark_terminal",
      description: `Marked State ${curr} as terminal for pattern "${pat}". Outputs: [${runningTrie.nodes[curr].output.map((p) => `"${p}"`).join(", ")}].`,
      trieSnapshot: cloneACTrie(runningTrie),
      activeNodeId: curr,
    });
  });

  runningTrie.alphabet = Array.from(alphabetSet).sort();

  steps.push({
    stepIndex: steps.length,
    patternIndex: -1,
    pattern: "",
    charIndex: -1,
    char: "",
    fromNodeId: 0,
    toNodeId: 0,
    action: "build_complete",
    description: `Trie build complete! Constructed ${runningTrie.nodes.length} states across ${cleaned.length} patterns.`,
    trieSnapshot: cloneACTrie(runningTrie),
    activeNodeId: 0,
  });

  return steps;
}

/**
 * Pure function: Computes failure links using BFS on trie.
 */
export function computeFailureLinks(trieInput: ACTrie): ACTrie {
  const trie = cloneACTrie(trieInput);
  const queue: number[] = [];

  trie.nodes[0].fail = 0;

  for (const c of Object.keys(trie.nodes[0].children)) {
    const childId = trie.nodes[0].children[c];
    trie.nodes[childId].fail = 0;
    queue.push(childId);
  }

  while (queue.length > 0) {
    const u = queue.shift()!;

    for (const c of Object.keys(trie.nodes[u].children)) {
      const v = trie.nodes[u].children[c];

      let fallback = trie.nodes[u].fail;
      while (fallback !== 0 && trie.nodes[fallback].children[c] === undefined) {
        fallback = trie.nodes[fallback].fail;
      }

      if (trie.nodes[fallback].children[c] !== undefined) {
        trie.nodes[v].fail = trie.nodes[fallback].children[c];
      } else {
        trie.nodes[v].fail = 0;
      }

      queue.push(v);
    }
  }

  return trie;
}

/**
 * Generates step-by-step trace for Modality 2: BFS Failure Link Construction.
 */
export function generateFailureLinksTrace(trieInput: ACTrie): ACFailLinkBuildStep[] {
  const trie = cloneACTrie(trieInput);
  trie.nodes.forEach((n) => {
    n.fail = 0;
  });

  const steps: ACFailLinkBuildStep[] = [];
  const queue: number[] = [];

  steps.push({
    stepIndex: 0,
    phase: "init",
    currentNodeId: 0,
    childNodeId: null,
    char: null,
    fallbackNodeId: null,
    assignedFailId: 0,
    examinedFallbacks: [0],
    queue: [],
    description:
      "Initializing BFS queue for failure link construction. Root (State 0) fail link is 0.",
    trieSnapshot: cloneACTrie(trie),
  });

  // Depth 1 nodes
  for (const c of Object.keys(trie.nodes[0].children).sort()) {
    const childId = trie.nodes[0].children[c];
    trie.nodes[childId].fail = 0;
    queue.push(childId);

    steps.push({
      stepIndex: steps.length,
      phase: "depth1_root",
      currentNodeId: 0,
      childNodeId: childId,
      char: c,
      fallbackNodeId: 0,
      assignedFailId: 0,
      examinedFallbacks: [0],
      queue: [...queue],
      description: `Depth 1 State ${childId} (char '${c}') fails directly to Root (State 0). Enqueued State ${childId}.`,
      trieSnapshot: cloneACTrie(trie),
    });
  }

  while (queue.length > 0) {
    const u = queue.shift()!;

    for (const c of Object.keys(trie.nodes[u].children).sort()) {
      const v = trie.nodes[u].children[c];

      steps.push({
        stepIndex: steps.length,
        phase: "inspect_child",
        currentNodeId: u,
        childNodeId: v,
        char: c,
        fallbackNodeId: trie.nodes[u].fail,
        assignedFailId: null,
        examinedFallbacks: [trie.nodes[u].fail],
        queue: [...queue],
        description: `Inspecting child State ${v} of State ${u} on character '${c}'. Starting fallback search at fail(${u}) = State ${trie.nodes[u].fail}.`,
        trieSnapshot: cloneACTrie(trie),
      });

      let fallback = trie.nodes[u].fail;
      const examined: number[] = [fallback];

      while (fallback !== 0 && trie.nodes[fallback].children[c] === undefined) {
        steps.push({
          stepIndex: steps.length,
          phase: "fallback_step",
          currentNodeId: u,
          childNodeId: v,
          char: c,
          fallbackNodeId: fallback,
          assignedFailId: null,
          examinedFallbacks: [...examined],
          queue: [...queue],
          description: `State ${fallback} has no child on '${c}'. Following fail link to State ${trie.nodes[fallback].fail}.`,
          trieSnapshot: cloneACTrie(trie),
        });
        fallback = trie.nodes[fallback].fail;
        examined.push(fallback);
      }

      let failTarget = 0;
      if (trie.nodes[fallback].children[c] !== undefined) {
        failTarget = trie.nodes[fallback].children[c];
        trie.nodes[v].fail = failTarget;
        queue.push(v);

        steps.push({
          stepIndex: steps.length,
          phase: "assign_fail",
          currentNodeId: u,
          childNodeId: v,
          char: c,
          fallbackNodeId: fallback,
          assignedFailId: failTarget,
          examinedFallbacks: examined,
          queue: [...queue],
          description: `Found match at State ${fallback} on char '${c}' -> State ${failTarget}. Set fail(${v}) = ${failTarget}. Enqueued State ${v}.`,
          trieSnapshot: cloneACTrie(trie),
        });
      } else {
        trie.nodes[v].fail = 0;
        queue.push(v);

        steps.push({
          stepIndex: steps.length,
          phase: "assign_fail",
          currentNodeId: u,
          childNodeId: v,
          char: c,
          fallbackNodeId: 0,
          assignedFailId: 0,
          examinedFallbacks: examined,
          queue: [...queue],
          description: `No ancestor state has child on char '${c}'. Set fail(${v}) = 0 (Root). Enqueued State ${v}.`,
          trieSnapshot: cloneACTrie(trie),
        });
      }
    }
  }

  steps.push({
    stepIndex: steps.length,
    phase: "complete",
    currentNodeId: null,
    childNodeId: null,
    char: null,
    fallbackNodeId: null,
    assignedFailId: null,
    examinedFallbacks: [],
    queue: [],
    description: `Failure link construction complete! All ${trie.nodes.length} states have resolved longest proper suffix transitions.`,
    trieSnapshot: cloneACTrie(trie),
  });

  return steps;
}

/**
 * Pure function: Computes dictionary suffix output links.
 */
export function computeDictSuffixLinks(trieInput: ACTrie): ACTrie {
  const trie = cloneACTrie(trieInput);

  for (let v = 1; v < trie.nodes.length; v++) {
    let f = trie.nodes[v].fail;
    while (f !== 0 && !trie.nodes[f].isTerminal) {
      f = trie.nodes[f].fail;
    }
    if (f !== 0 && trie.nodes[f].isTerminal) {
      trie.nodes[v].dictLink = f;
    } else {
      trie.nodes[v].dictLink = null;
    }
  }

  return trie;
}

/**
 * Collects all output patterns emitted along the dictionary suffix link chain.
 */
export function collectChainOutputs(trie: ACTrie, nodeId: number): string[] {
  const outputs: string[] = [...(trie.nodes[nodeId]?.output ?? [])];
  let curr = trie.nodes[nodeId]?.dictLink ?? null;
  while (curr !== null && curr !== 0) {
    if (trie.nodes[curr]) {
      outputs.push(...trie.nodes[curr].output);
      curr = trie.nodes[curr].dictLink;
    } else {
      break;
    }
  }
  return Array.from(new Set(outputs));
}

/**
 * Generates step-by-step trace for Modality 3: Dictionary Suffix Output Links.
 */
export function generateDictSuffixLinksTrace(trieInput: ACTrie): ACDictLinkBuildStep[] {
  const trie = cloneACTrie(trieInput);
  trie.nodes.forEach((n) => {
    n.dictLink = null;
  });

  const steps: ACDictLinkBuildStep[] = [];

  steps.push({
    stepIndex: 0,
    phase: "init",
    nodeId: 0,
    failTargetId: 0,
    inspectedStates: [],
    assignedDictLinkId: null,
    accumulatedOutputs: [],
    description:
      "Initializing Dictionary Suffix Link construction. Suffix links bypass non-terminal states to provide O(1) jump to terminal matches.",
    trieSnapshot: cloneACTrie(trie),
  });

  for (let v = 1; v < trie.nodes.length; v++) {
    steps.push({
      stepIndex: steps.length,
      phase: "inspect_node",
      nodeId: v,
      failTargetId: trie.nodes[v].fail,
      inspectedStates: [trie.nodes[v].fail],
      assignedDictLinkId: null,
      accumulatedOutputs: [...trie.nodes[v].output],
      description: `Inspecting State ${v} (fail target: State ${trie.nodes[v].fail}). Searching fail path for nearest terminal state.`,
      trieSnapshot: cloneACTrie(trie),
    });

    let f = trie.nodes[v].fail;
    const inspected: number[] = [];

    while (f !== 0 && !trie.nodes[f].isTerminal) {
      inspected.push(f);
      steps.push({
        stepIndex: steps.length,
        phase: "traverse_chain",
        nodeId: v,
        failTargetId: f,
        inspectedStates: [...inspected],
        assignedDictLinkId: null,
        accumulatedOutputs: [...trie.nodes[v].output],
        description: `State ${f} in fail chain is non-terminal. Advancing to fail(${f}) = State ${trie.nodes[f].fail}.`,
        trieSnapshot: cloneACTrie(trie),
      });
      f = trie.nodes[f].fail;
    }

    if (f !== 0 && trie.nodes[f].isTerminal) {
      trie.nodes[v].dictLink = f;
      const combinedOutputs = collectChainOutputs(trie, v);

      steps.push({
        stepIndex: steps.length,
        phase: "assign_dict",
        nodeId: v,
        failTargetId: trie.nodes[v].fail,
        inspectedStates: inspected,
        assignedDictLinkId: f,
        accumulatedOutputs: combinedOutputs,
        description: `State ${f} is terminal (emits: [${trie.nodes[f].output.map((p) => `"${p}"`).join(", ")}]). Set dictLink(${v}) = ${f}.`,
        trieSnapshot: cloneACTrie(trie),
      });
    } else {
      trie.nodes[v].dictLink = null;
      steps.push({
        stepIndex: steps.length,
        phase: "assign_dict",
        nodeId: v,
        failTargetId: trie.nodes[v].fail,
        inspectedStates: inspected,
        assignedDictLinkId: null,
        accumulatedOutputs: [...trie.nodes[v].output],
        description: `No terminal states in fail chain for State ${v}. Set dictLink(${v}) = null.`,
        trieSnapshot: cloneACTrie(trie),
      });
    }
  }

  steps.push({
    stepIndex: steps.length,
    phase: "complete",
    nodeId: 0,
    failTargetId: 0,
    inspectedStates: [],
    assignedDictLinkId: null,
    accumulatedOutputs: [],
    description:
      "Dictionary suffix link compression complete! All states can now emit all matching suffix patterns in O(occ) time.",
    trieSnapshot: cloneACTrie(trie),
  });

  return steps;
}

/**
 * Builds the complete Aho-Corasick automaton (Trie + Failure Links + Dict Links).
 */
export function buildFullAhoCorasick(patterns: string[]): ACTrie {
  const trie = buildACTrie(patterns);
  const withFail = computeFailureLinks(trie);
  const withDict = computeDictSuffixLinks(withFail);
  return withDict;
}

/**
 * Computes full DFA transition matrix δ(u, c).
 */
export function computeDFATransitionMatrix(trie: ACTrie): ACTransitionMatrix {
  const matrix: ACTransitionMatrix = {};
  const alphabet = trie.alphabet;

  for (let u = 0; u < trie.nodes.length; u++) {
    matrix[u] = {};
    for (const c of alphabet) {
      if (trie.nodes[u].children[c] !== undefined) {
        matrix[u][c] = trie.nodes[u].children[c];
      } else if (u === 0) {
        matrix[u][c] = 0;
      } else {
        let fallback = trie.nodes[u].fail;
        while (fallback !== 0 && trie.nodes[fallback].children[c] === undefined) {
          fallback = trie.nodes[fallback].fail;
        }
        if (trie.nodes[fallback].children[c] !== undefined) {
          matrix[u][c] = trie.nodes[fallback].children[c];
        } else {
          matrix[u][c] = 0;
        }
      }
    }
  }

  return matrix;
}

/**
 * Multi-pattern linear search: returns all match occurrences with start/end indices.
 */
export function searchAhoCorasick(trie: ACTrie, text: string): ACMatchOccurrence[] {
  const matches: ACMatchOccurrence[] = [];
  let currState = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    while (currState !== 0 && trie.nodes[currState].children[c] === undefined) {
      currState = trie.nodes[currState].fail;
    }

    if (trie.nodes[currState].children[c] !== undefined) {
      currState = trie.nodes[currState].children[c];
    } else {
      currState = 0;
    }

    // Direct state outputs
    for (const pat of trie.nodes[currState].output) {
      matches.push({
        pattern: pat,
        patternIndex: trie.patterns.indexOf(pat),
        startIndex: i - pat.length + 1,
        endIndex: i,
        matchedAtState: currState,
      });
    }

    // Dict suffix chain outputs
    let d = trie.nodes[currState].dictLink;
    while (d !== null && d !== 0) {
      for (const pat of trie.nodes[d].output) {
        matches.push({
          pattern: pat,
          patternIndex: trie.patterns.indexOf(pat),
          startIndex: i - pat.length + 1,
          endIndex: i,
          matchedAtState: d,
        });
      }
      d = trie.nodes[d].dictLink;
    }
  }

  return matches;
}

/**
 * Baseline naive multi-pattern search for verification against AC algorithm.
 */
export function naiveMultiPatternSearch(patterns: string[], text: string): ACMatchOccurrence[] {
  const matches: ACMatchOccurrence[] = [];
  const { cleaned } = validatePatterns(patterns);

  cleaned.forEach((pattern, pIdx) => {
    if (!pattern) return;
    let idx = 0;
    while ((idx = text.indexOf(pattern, idx)) !== -1) {
      matches.push({
        pattern,
        patternIndex: pIdx,
        startIndex: idx,
        endIndex: idx + pattern.length - 1,
        matchedAtState: -1,
      });
      idx++;
    }
  });

  return matches.sort((a, b) => {
    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
    if (a.endIndex !== b.endIndex) return a.endIndex - b.endIndex;
    return a.pattern.localeCompare(b.pattern);
  });
}

/**
 * Generates step-by-step trace for Modality 4: Streaming Search DFA.
 */
export function generateStreamingSearchTrace(trie: ACTrie, text: string): ACSearchStep[] {
  const steps: ACSearchStep[] = [];
  let activeState = 0;
  const cumulativeMatches: ACMatchOccurrence[] = [];

  steps.push({
    stepIndex: 0,
    charIndex: -1,
    char: "",
    fromStateId: 0,
    toStateId: 0,
    transitionType: "start",
    fallbackPath: [0],
    activeMatches: [],
    cumulativeMatches: [],
    description: `Ready to search text "${text}". Active state initialized to Root (State 0).`,
    activeDictChain: [],
    activeStateId: 0,
  });

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const fromState = activeState;
    const fallbackPath: number[] = [fromState];
    let toState = 0;
    let transitionType: ACSearchTransitionType = "direct_trie";

    if (trie.nodes[activeState].children[c] !== undefined) {
      toState = trie.nodes[activeState].children[c];
      transitionType = "direct_trie";
    } else {
      let curr = trie.nodes[activeState].fail;
      fallbackPath.push(curr);

      while (curr !== 0 && trie.nodes[curr].children[c] === undefined) {
        curr = trie.nodes[curr].fail;
        fallbackPath.push(curr);
      }

      if (trie.nodes[curr].children[c] !== undefined) {
        toState = trie.nodes[curr].children[c];
        transitionType = "fail_fallback_match";
      } else {
        toState = 0;
        transitionType = "fail_fallback_root";
      }
    }

    activeState = toState;

    // Collect matches at toState
    const activeMatches: ACMatchOccurrence[] = [];
    const dictChain: number[] = [];

    for (const pat of trie.nodes[toState].output) {
      const match: ACMatchOccurrence = {
        pattern: pat,
        patternIndex: trie.patterns.indexOf(pat),
        startIndex: i - pat.length + 1,
        endIndex: i,
        matchedAtState: toState,
      };
      activeMatches.push(match);
      cumulativeMatches.push(match);
    }

    let d = trie.nodes[toState].dictLink;
    while (d !== null && d !== 0) {
      dictChain.push(d);
      for (const pat of trie.nodes[d].output) {
        const match: ACMatchOccurrence = {
          pattern: pat,
          patternIndex: trie.patterns.indexOf(pat),
          startIndex: i - pat.length + 1,
          endIndex: i,
          matchedAtState: d,
        };
        activeMatches.push(match);
        cumulativeMatches.push(match);
      }
      d = trie.nodes[d].dictLink;
    }

    let desc = "";
    if (transitionType === "direct_trie") {
      desc = `Read '${c}' at index ${i}. Direct trie child: State ${fromState} -> State ${toState}.`;
    } else if (transitionType === "fail_fallback_match") {
      desc = `Read '${c}' at index ${i}. Mismatch at State ${fromState}. Fallback fail path: [${fallbackPath.join(" -> ")}] -> State ${toState}.`;
    } else {
      desc = `Read '${c}' at index ${i}. Mismatch across fail links [${fallbackPath.join(" -> ")}]. Reset to Root (State 0).`;
    }

    if (activeMatches.length > 0) {
      desc += ` Emitted ${activeMatches.length} match(es): ${activeMatches.map((m) => `"${m.pattern}" [${m.startIndex}..${m.endIndex}]`).join(", ")}.`;
    }

    steps.push({
      stepIndex: steps.length,
      charIndex: i,
      char: c,
      fromStateId: fromState,
      toStateId: toState,
      transitionType,
      fallbackPath,
      activeMatches,
      cumulativeMatches: [...cumulativeMatches],
      description: desc,
      activeDictChain: dictChain,
      activeStateId: toState,
    });
  }

  return steps;
}

/**
 * Hierarchical SVG Tree Layout: computes clean (x, y) coordinates for all trie nodes.
 */
export function layoutACTrie(
  trie: ACTrie,
  canvasWidth = 800,
  canvasHeight = 450,
  padding = 40,
): ACLayoutResult {
  if (trie.nodes.length === 0) {
    return { nodes: [], edges: [], width: canvasWidth, height: canvasHeight, maxDepth: 0 };
  }

  let maxDepth = 0;
  trie.nodes.forEach((n) => {
    if (n.depth > maxDepth) maxDepth = n.depth;
  });

  // Calculate subtree widths for horizontal space allocation
  const subtreeWidths: Record<number, number> = {};
  const computeSubtreeWidth = (nodeId: number): number => {
    const node = trie.nodes[nodeId];
    if (!node) return 1;
    const childrenIds = Object.values(node.children);
    if (childrenIds.length === 0) {
      subtreeWidths[nodeId] = 1;
      return 1;
    }
    let total = 0;
    childrenIds.forEach((childId) => {
      total += computeSubtreeWidth(childId);
    });
    subtreeWidths[nodeId] = Math.max(1, total);
    return subtreeWidths[nodeId];
  };

  computeSubtreeWidth(0);

  const totalTreeWidth = subtreeWidths[0] || 1;
  const unitX: Record<number, number> = {};

  // Assign horizontal unit slots
  const assignPositions = (nodeId: number, leftBound: number) => {
    const node = trie.nodes[nodeId];
    if (!node) return;
    const childrenIds = Object.values(node.children);
    const nodeWidth = subtreeWidths[nodeId] || 1;

    unitX[nodeId] = leftBound + nodeWidth / 2;

    let currentLeft = leftBound;
    childrenIds.forEach((childId) => {
      const childWidth = subtreeWidths[childId] || 1;
      assignPositions(childId, currentLeft);
      currentLeft += childWidth;
    });
  };

  assignPositions(0, 0);

  const usableWidth = Math.max(1, canvasWidth - padding * 2);
  const usableHeight = Math.max(1, canvasHeight - padding * 2);

  const layoutNodes: ACLayoutNode[] = trie.nodes.map((node) => {
    const uX = unitX[node.id] !== undefined ? unitX[node.id] : totalTreeWidth / 2;
    const x = totalTreeWidth > 0 ? padding + (uX / totalTreeWidth) * usableWidth : canvasWidth / 2;

    const y = maxDepth > 0 ? padding + (node.depth / maxDepth) * usableHeight : canvasHeight / 2;

    return {
      id: node.id,
      depth: node.depth,
      char: node.char,
      x,
      y,
      fail: node.fail,
      dictLink: node.dictLink,
      output: [...node.output],
      isTerminal: node.isTerminal,
      patternIndices: [...node.patternIndices],
      pathString: getNodePrefixPath(trie, node.id),
    };
  });

  const layoutEdges: ACLayoutEdge[] = [];
  trie.nodes.forEach((node) => {
    Object.entries(node.children).forEach(([char, childId]) => {
      layoutEdges.push({
        from: node.id,
        to: childId,
        char,
      });
    });
  });

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: canvasWidth,
    height: canvasHeight,
    maxDepth,
  };
}

// ============================================================================
// 4. SVG CANVAS & GRAPH RENDERING SUBCOMPONENTS
// ============================================================================

interface GraphCanvasViewProps {
  layout: ACLayoutResult;
  activeNodeId: number | null;
  fromNodeId?: number | null;
  toNodeId?: number | null;
  failTargetId?: number | null;
  dictTargetId?: number | null;
  highlightEdge?: { from: number; to: number; char?: string };
  showFailLinks: "all" | "active" | "none";
  showDictLinks: "all" | "active" | "none";
  showEdgeLabels: boolean;
  onHoverNode: (node: ACLayoutNode | null) => void;
  hoveredNode: ACLayoutNode | null;
}

export const GraphCanvasView: React.FC<GraphCanvasViewProps> = ({
  layout,
  activeNodeId,
  fromNodeId,
  toNodeId,
  failTargetId,
  dictTargetId,
  highlightEdge,
  showFailLinks,
  showDictLinks,
  showEdgeLabels,
  onHoverNode,
  hoveredNode,
}) => {
  const nodeMap = useMemo(() => {
    const map = new Map<number, ACLayoutNode>();
    layout.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layout.nodes]);

  // Compute curved SVG path for fail links
  const getCurvedPath = (fromNode: ACLayoutNode, toNode: ACLayoutNode, curvatureOffset: number) => {
    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;

    if (fromNode.id === toNode.id) {
      return `M ${x1 - 10} ${y1 - 14} C ${x1 - 30} ${y1 - 40}, ${x1 + 30} ${y1 - 40}, ${x1 + 10} ${y1 - 14}`;
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;

    const nx = -dy / len;
    const ny = dx / len;

    const cx = midX + nx * curvatureOffset;
    const cy = midY + ny * curvatureOffset;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between select-none">
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrow-tree"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
          </marker>
          <marker
            id="arrow-tree-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
          <marker
            id="arrow-fail"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
          <marker
            id="arrow-fail-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
          </marker>
          <marker
            id="arrow-dict"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <marker
            id="arrow-dict-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
          </marker>

          {/* Node Glow Filters */}
          <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Failure Link Edges (Curved Dashed Amber) */}
        {layout.nodes.map((sourceNode) => {
          if (sourceNode.id === 0 && sourceNode.fail === 0) return null;
          const targetNode = nodeMap.get(sourceNode.fail);
          if (!targetNode) return null;

          const isNodeActive = sourceNode.id === activeNodeId || sourceNode.id === fromNodeId;
          const isTargetActive = targetNode.id === failTargetId || targetNode.id === toNodeId;

          const shouldRender =
            showFailLinks === "all" ||
            (showFailLinks === "active" && (isNodeActive || isTargetActive));

          if (!shouldRender) return null;

          const isActiveLink = isNodeActive && (isTargetActive || failTargetId === targetNode.id);
          const pathD = getCurvedPath(sourceNode, targetNode, 24);

          return (
            <path
              key={`fail-${sourceNode.id}-${targetNode.id}`}
              d={pathD}
              fill="none"
              stroke={isActiveLink ? "#fbbf24" : "#f59e0b88"}
              strokeWidth={isActiveLink ? 2.5 : 1.5}
              strokeDasharray={isActiveLink ? "5 3" : "4 4"}
              markerEnd={isActiveLink ? "url(#arrow-fail-active)" : "url(#arrow-fail)"}
              className="transition-all duration-300 pointer-events-none"
            />
          );
        })}

        {/* 2. Dictionary Suffix Output Link Edges (Curved Dotted Emerald) */}
        {layout.nodes.map((sourceNode) => {
          if (sourceNode.dictLink === null) return null;
          const targetNode = nodeMap.get(sourceNode.dictLink);
          if (!targetNode) return null;

          const isNodeActive = sourceNode.id === activeNodeId || sourceNode.id === fromNodeId;
          const isTargetActive = targetNode.id === dictTargetId || targetNode.id === toNodeId;

          const shouldRender =
            showDictLinks === "all" ||
            (showDictLinks === "active" && (isNodeActive || isTargetActive));

          if (!shouldRender) return null;

          const isActiveLink = isNodeActive && (isTargetActive || dictTargetId === targetNode.id);
          const pathD = getCurvedPath(sourceNode, targetNode, -28);

          return (
            <path
              key={`dict-${sourceNode.id}-${targetNode.id}`}
              d={pathD}
              fill="none"
              stroke={isActiveLink ? "#34d399" : "#10b98188"}
              strokeWidth={isActiveLink ? 2.5 : 1.5}
              strokeDasharray={isActiveLink ? "3 3" : "2 3"}
              markerEnd={isActiveLink ? "url(#arrow-dict-active)" : "url(#arrow-dict)"}
              className="transition-all duration-300 pointer-events-none"
            />
          );
        })}

        {/* 3. Solid Trie Edges */}
        {layout.edges.map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const isEdgeHighlighted =
            (highlightEdge && highlightEdge.from === edge.from && highlightEdge.to === edge.to) ||
            (fromNodeId === edge.from && toNodeId === edge.to);

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <g key={`edge-${edge.from}-${edge.to}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isEdgeHighlighted ? "#38bdf8" : "#475569"}
                strokeWidth={isEdgeHighlighted ? 3 : 1.8}
                markerEnd={isEdgeHighlighted ? "url(#arrow-tree-active)" : "url(#arrow-tree)"}
                className="transition-all duration-200"
              />

              {showEdgeLabels && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <circle
                    r="8.5"
                    fill={isEdgeHighlighted ? "#0284c7" : "#1e293b"}
                    stroke={isEdgeHighlighted ? "#38bdf8" : "#475569"}
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#f8fafc"
                    fontSize="9.5"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {edge.char}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 4. Nodes */}
        {layout.nodes.map((node) => {
          const isActive = node.id === activeNodeId;
          const isFrom = node.id === fromNodeId;
          const isTo = node.id === toNodeId;
          const isFailTarget = node.id === failTargetId;
          const isDictTarget = node.id === dictTargetId;

          let nodeFill = "#0f172a";
          let nodeStroke = "#475569";
          let strokeWidth = 2;

          if (node.isTerminal) {
            nodeFill = "#064e3b";
            nodeStroke = "#10b981";
          }

          if (isFailTarget) {
            nodeStroke = "#f59e0b";
            strokeWidth = 2.5;
          }

          if (isDictTarget) {
            nodeStroke = "#34d399";
            strokeWidth = 2.5;
          }

          if (isFrom) {
            nodeStroke = "#818cf8";
            strokeWidth = 2.5;
          }

          if (isActive || isTo) {
            nodeFill = node.isTerminal ? "#047857" : "#1e1b4b";
            nodeStroke = "#38bdf8";
            strokeWidth = 3;
          }

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => onHoverNode(node)}
              onMouseLeave={() => onHoverNode(null)}
            >
              {/* Active Pulse Glow Ring */}
              {(isActive || isTo) && (
                <circle
                  r="21"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-ping"
                />
              )}

              {/* Terminal Double Ring */}
              {node.isTerminal && (
                <circle
                  r="19.5"
                  fill="none"
                  stroke={nodeStroke}
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  opacity="0.8"
                />
              )}

              {/* Main Node Circle */}
              <circle
                r="16"
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={strokeWidth}
                filter={isActive ? "url(#glow-active)" : undefined}
                className="transition-colors duration-200"
              />

              {/* Node ID Label */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "#38bdf8" : "#f1f5f9"}
                fontSize={node.id >= 10 ? "10" : "11.5"}
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                {node.id}
              </text>

              {/* Terminal Pattern Badge Tag */}
              {node.isTerminal && node.output.length > 0 && (
                <g transform="translate(0, 22)">
                  <rect
                    x={-Math.max(24, node.output[0].length * 4.5)}
                    y="-6"
                    width={Math.max(48, node.output[0].length * 9)}
                    height="13"
                    rx="3.5"
                    fill="#065f46"
                    stroke="#10b981"
                    strokeWidth="0.8"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#a7f3d0"
                    fontSize="8.5"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {node.output.length === 1
                      ? `"${node.output[0]}"`
                      : `${node.output.length} pats`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-lg p-2.5 shadow-xl text-xs text-slate-200"
          style={{
            left: Math.min(Math.max(12, hoveredNode.x - 70), layout.width - 170),
            top: Math.min(hoveredNode.y + 24, layout.height - 110),
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1 mb-1 font-semibold text-sky-400">
            <span>State #{hoveredNode.id}</span>
            <span className="text-[10px] text-slate-400">Depth: {hoveredNode.depth}</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>
              <span className="text-slate-400">Path: </span>
              <span className="font-mono text-amber-300">
                {hoveredNode.pathString ? `"${hoveredNode.pathString}"` : "ε (Root)"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Fail Link: </span>
              <span className="font-mono text-amber-400">State {hoveredNode.fail}</span>
            </div>
            <div>
              <span className="text-slate-400">Dict Link: </span>
              <span className="font-mono text-emerald-400">
                {hoveredNode.dictLink !== null ? `State ${hoveredNode.dictLink}` : "null"}
              </span>
            </div>
            {hoveredNode.isTerminal && (
              <div>
                <span className="text-slate-400">Emits: </span>
                <span className="font-mono text-emerald-300 font-bold">
                  {hoveredNode.output.map((p) => `"${p}"`).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-indigo-500 inline-block rounded" />
            <span>Trie Child</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-400 inline-block" />
            <span>Fail Link</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-b-2 border-dotted border-emerald-400 inline-block" />
            <span>Dict Output Link</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-emerald-950 inline-block" />
            <span>Terminal State</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">Hover state circles for deep inspection</div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MAIN COMPONENT IMPLEMENTATION
// ============================================================================

export const AhoCorasickAutomataStudio: React.FC<AhoCorasickAutomataStudioProps> = ({
  initialModality = "streaming_text_search_dfa",
  initialPreset = "classic_ushers",
  initialPatterns,
  initialText,
  standalone = true,
  title = "Aho-Corasick Automata Studio",
  onModalityChange,
  onPresetChange,
}) => {
  // State: Modality & Presets
  const [modality, setModality] = useState<AhoCorasickModality>(initialModality);
  const [presetId, setPresetId] = useState<ACPresetId>(initialPreset);

  // State: Patterns & Text
  const [patterns, setPatterns] = useState<string[]>(() => {
    if (initialPatterns && initialPatterns.length > 0) return initialPatterns;
    return [...AHO_CORASICK_PRESETS[initialPreset].patterns];
  });
  const [newPatternInput, setNewPatternInput] = useState("");
  const [patternInputError, setPatternInputError] = useState<string | null>(null);

  const [targetText, setTargetText] = useState<string>(() => {
    if (initialText !== undefined) return initialText;
    return AHO_CORASICK_PRESETS[initialPreset].defaultText;
  });

  // Display toggles
  const [showFailLinks, setShowFailLinks] = useState<"all" | "active" | "none">("active");
  const [showDictLinks, setShowDictLinks] = useState<"all" | "active" | "none">("active");
  const [showEdgeLabels] = useState(true);
  const [showDFAMatrix, setShowDFAMatrix] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<ACLayoutNode | null>(null);

  // Stepper State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState(600);

  // Ref for timer
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Build fully computed Aho-Corasick automaton from current pattern set
  const fullACTrie = useMemo(() => {
    return buildFullAhoCorasick(patterns);
  }, [patterns]);

  // 2. Compute Transition Matrix
  const dfaMatrix = useMemo(() => {
    return computeDFATransitionMatrix(fullACTrie);
  }, [fullACTrie]);

  // 3. Modality step traces
  const trieBuildSteps = useMemo(() => {
    return generateTrieBuildTrace(patterns);
  }, [patterns]);

  const failLinkSteps = useMemo(() => {
    const baseTrie = buildACTrie(patterns);
    return generateFailureLinksTrace(baseTrie);
  }, [patterns]);

  const dictLinkSteps = useMemo(() => {
    const baseTrie = buildACTrie(patterns);
    const withFail = computeFailureLinks(baseTrie);
    return generateDictSuffixLinksTrace(withFail);
  }, [patterns]);

  const searchSteps = useMemo(() => {
    return generateStreamingSearchTrace(fullACTrie, targetText);
  }, [fullACTrie, targetText]);

  // Active step trace list depending on modality
  const currentStepTrace = useMemo(() => {
    switch (modality) {
      case "trie_multi_pattern_build":
        return trieBuildSteps;
      case "bfs_failure_link_construction":
        return failLinkSteps;
      case "dictionary_suffix_output_links":
        return dictLinkSteps;
      case "streaming_text_search_dfa":
        return searchSteps;
    }
  }, [modality, trieBuildSteps, failLinkSteps, dictLinkSteps, searchSteps]);

  const maxSteps = currentStepTrace.length - 1;

  // Safe clamp step index on modality or input changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [modality, patterns, targetText]);

  // Playback timer effect
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeedMs);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, maxSteps, playbackSpeedMs]);

  // Active step details
  const activeStep = currentStepTrace[Math.min(currentStepIndex, maxSteps)];

  // Snapshot trie for layout rendering
  const activeTrieSnapshot = useMemo(() => {
    if (!activeStep) return fullACTrie;
    if ("trieSnapshot" in activeStep && activeStep.trieSnapshot) {
      return activeStep.trieSnapshot;
    }
    return fullACTrie;
  }, [activeStep, fullACTrie]);

  // Calculate layout for active trie
  const activeLayout = useMemo(() => {
    return layoutACTrie(activeTrieSnapshot, 800, 420, 36);
  }, [activeTrieSnapshot]);

  // Handlers for Preset switching
  const handleSelectPreset = (pId: ACPresetId) => {
    const preset = AHO_CORASICK_PRESETS[pId];
    if (!preset) return;
    setPresetId(pId);
    setPatterns([...preset.patterns]);
    setTargetText(preset.defaultText);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    onPresetChange?.(pId);
  };

  const handleSelectModality = (mod: AhoCorasickModality) => {
    setModality(mod);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    onModalityChange?.(mod);
  };

  const handleAddPattern = () => {
    const trimmed = newPatternInput.trim();
    if (!trimmed) return;
    if (patterns.includes(trimmed)) {
      setPatternInputError("Pattern already exists in dictionary.");
      return;
    }
    setPatterns([...patterns, trimmed]);
    setNewPatternInput("");
    setPatternInputError(null);
  };

  const handleRemovePattern = (patToRemove: string) => {
    if (patterns.length <= 1) {
      setPatternInputError("Must retain at least 1 pattern.");
      return;
    }
    setPatterns(patterns.filter((p) => p !== patToRemove));
    setPatternInputError(null);
  };

  // Extract active highlights for GraphCanvas
  const activeNodeId = useMemo(() => {
    if (!activeStep) return 0;
    if ("activeStateId" in activeStep) return activeStep.activeStateId;
    if ("activeNodeId" in activeStep) return activeStep.activeNodeId;
    if ("childNodeId" in activeStep && activeStep.childNodeId !== null)
      return activeStep.childNodeId;
    if ("nodeId" in activeStep) return activeStep.nodeId;
    return 0;
  }, [activeStep]);

  const fromNodeId =
    activeStep && "fromNodeId" in activeStep
      ? ((activeStep as unknown as Record<string, unknown>).fromNodeId as number | null)
      : activeStep && "fromStateId" in activeStep
        ? ((activeStep as unknown as Record<string, unknown>).fromStateId as number | null)
        : null;

  const toNodeId =
    activeStep && "toNodeId" in activeStep
      ? ((activeStep as unknown as Record<string, unknown>).toNodeId as number | null)
      : activeStep && "toStateId" in activeStep
        ? ((activeStep as unknown as Record<string, unknown>).toStateId as number | null)
        : null;

  const failTargetId =
    activeStep && "assignedFailId" in activeStep
      ? ((activeStep as unknown as Record<string, unknown>).assignedFailId as number | null)
      : activeStep && "failTargetId" in activeStep
        ? ((activeStep as unknown as Record<string, unknown>).failTargetId as number | null)
        : null;

  const dictTargetId =
    activeStep && "assignedDictLinkId" in activeStep
      ? ((activeStep as unknown as Record<string, unknown>).assignedDictLinkId as number | null)
      : null;

  const highlightEdge =
    activeStep && "highlightEdge" in activeStep
      ? ((activeStep as unknown as Record<string, unknown>).highlightEdge as
          | { from: number; to: number; char?: string }
          | undefined)
      : undefined;

  // Active state prefix path and info
  const activePathString = useMemo(() => {
    return getNodePrefixPath(activeTrieSnapshot, activeNodeId);
  }, [activeTrieSnapshot, activeNodeId]);

  const activeNodeObj = activeTrieSnapshot.nodes[activeNodeId] || fullACTrie.nodes[0];

  // Streaming search current cumulative matches
  const currentCumulativeMatches: ACMatchOccurrence[] = useMemo(() => {
    if (
      modality === "streaming_text_search_dfa" &&
      activeStep &&
      "cumulativeMatches" in activeStep
    ) {
      return activeStep.cumulativeMatches;
    }
    return searchAhoCorasick(fullACTrie, targetText);
  }, [modality, activeStep, fullACTrie, targetText]);

  return (
    <div
      className={`w-full text-slate-100 font-sans ${
        standalone ? "p-4 md:p-6 max-w-7xl mx-auto space-y-6" : "space-y-4"
      }`}
    >
      {/* HEADER & PRESET SELECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {title}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    O(N + occ)
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400">
                  Exact Multi-Pattern Dictionary Matching & Automata Theory Engine
                </p>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 font-medium">
              <Sliders className="w-3.5 h-3.5" /> Presets:
            </span>
            {(Object.keys(AHO_CORASICK_PRESETS) as ACPresetId[]).map((pKey) => {
              const p = AHO_CORASICK_PRESETS[pKey];
              const isSelected = presetId === pKey;
              return (
                <button
                  key={pKey}
                  onClick={() => handleSelectPreset(pKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                  }`}
                >
                  {p.name.split(" (")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* MODALITY TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
          {(Object.keys(MODALITY_CONFIGS) as AhoCorasickModality[]).map((mKey) => {
            const config = MODALITY_CONFIGS[mKey];
            const Icon = config.icon;
            const isSelected = modality === mKey;
            return (
              <button
                key={mKey}
                onClick={() => handleSelectModality(mKey)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-500"}`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {config.title}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">{config.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* CURRENT MODALITY THEORY SUMMARY */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">Algorithmic Insight: </span>
            {MODALITY_CONFIGS[modality].theory}
          </div>
        </div>
      </div>

      {/* PATTERN MANAGER & TEXT STREAMER INPUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Pattern Dictionary Manager (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Dictionary Patterns ({patterns.length})
              </h2>
              <span className="text-[11px] text-indigo-400 font-mono">
                Alphabet |Σ| = {fullACTrie.alphabet.length}
              </span>
            </div>

            {/* Pattern Badges */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {patterns.map((pat, idx) => (
                <div
                  key={`${pat}-${idx}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 border border-indigo-700/50 rounded-lg text-xs text-indigo-200 group"
                >
                  <span className="text-[10px] text-indigo-400 font-mono">#{idx + 1}</span>
                  <span className="font-mono font-bold text-white">"{pat}"</span>
                  <button
                    onClick={() => handleRemovePattern(pat)}
                    title="Remove pattern"
                    className="text-slate-400 hover:text-rose-400 transition-colors ml-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Pattern Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add pattern..."
                value={newPatternInput}
                onChange={(e) => setNewPatternInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPattern()}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddPattern}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {patternInputError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {patternInputError}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Patterns: {patterns.map((p) => `"${p}"`).join(", ")}</span>
            <button
              onClick={() => handleSelectPreset(presetId)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Preset
            </button>
          </div>
        </div>

        {/* Target Text Streamer Input (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Target Search Text (Length: {targetText.length})
              </h2>
              <span className="text-[11px] text-cyan-400 font-mono">
                Total Matches: {currentCumulativeMatches.length}
              </span>
            </div>

            {/* Editable Text Input */}
            <input
              type="text"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="Enter search text stream..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            {/* Visual Character Ribbon with Match Highlighting */}
            <div className="overflow-x-auto pb-1">
              <div className="flex items-center gap-1 min-w-max">
                {targetText.split("").map((ch, idx) => {
                  const isCurrentScan =
                    modality === "streaming_text_search_dfa" &&
                    activeStep &&
                    "charIndex" in activeStep &&
                    activeStep.charIndex === idx;

                  const isMatchedHere = currentCumulativeMatches.some(
                    (m) => idx >= m.startIndex && idx <= m.endIndex,
                  );

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center w-7 h-9 rounded-md text-xs font-mono font-bold transition-all ${
                        isCurrentScan
                          ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-300 scale-110 shadow-lg shadow-cyan-500/40 z-10"
                          : isMatchedHere
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/60"
                            : "bg-slate-950 text-slate-300 border border-slate-800"
                      }`}
                    >
                      <span>{ch === " " ? "␣" : ch}</span>
                      <span className="text-[9px] font-normal text-slate-500">{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Matches Emitted:{" "}
              <strong className="text-emerald-400">{currentCumulativeMatches.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDFAMatrix(!showDFAMatrix)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                {showDFAMatrix ? "Hide DFA Matrix" : "View DFA Matrix"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DFA TRANSITION MATRIX COLLAPSIBLE TABLE */}
      {showDFAMatrix && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">
                DFA State Transition Matrix δ(State, Char)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              |V| = {fullACTrie.nodes.length} states × |Σ| = {fullACTrie.alphabet.length} chars
            </span>
          </div>

          <div className="mt-3 overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2 text-left">State</th>
                  <th className="p-2 text-left">Path</th>
                  <th className="p-2 text-center text-amber-400">fail(u)</th>
                  <th className="p-2 text-center text-emerald-400">dict(u)</th>
                  {fullACTrie.alphabet.map((c) => (
                    <th key={c} className="p-2 text-center text-sky-300">
                      '{c}'
                    </th>
                  ))}
                  <th className="p-2 text-left text-emerald-300">Outputs</th>
                </tr>
              </thead>
              <tbody>
                {fullACTrie.nodes.map((node) => {
                  const isActiveRow = node.id === activeNodeId;
                  return (
                    <tr
                      key={node.id}
                      className={`border-b border-slate-800/60 transition-colors ${
                        isActiveRow
                          ? "bg-sky-950/60 text-sky-200 font-bold"
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="p-2">#{node.id}</td>
                      <td className="p-2 text-slate-300">
                        {node.id === 0 ? "ε (Root)" : `"${getNodePrefixPath(fullACTrie, node.id)}"`}
                      </td>
                      <td className="p-2 text-center text-amber-400">#{node.fail}</td>
                      <td className="p-2 text-center text-emerald-400">
                        {node.dictLink !== null ? `#${node.dictLink}` : "-"}
                      </td>
                      {fullACTrie.alphabet.map((c) => {
                        const target = dfaMatrix[node.id]?.[c] ?? 0;
                        const isChild = node.children[c] !== undefined;
                        return (
                          <td
                            key={c}
                            className={`p-2 text-center ${
                              isChild ? "text-indigo-300 font-bold" : "text-slate-500"
                            }`}
                          >
                            #{target}
                          </td>
                        );
                      })}
                      <td className="p-2 text-emerald-400">
                        {node.output.length > 0 ? node.output.map((p) => `"${p}"`).join(", ") : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEPPER PLAYER CONTROLS & RATIONALE HUD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Play/Pause & Step Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIndex(0)}
              disabled={currentStepIndex === 0}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition-colors"
              title="Reset to Step 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition-colors"
              title="Step Backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Auto Play
                </>
              )}
            </button>
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.min(maxSteps, prev + 1))}
              disabled={currentStepIndex >= maxSteps}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition-colors"
              title="Step Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Playback Speed Selector */}
            <div className="flex items-center gap-1 ml-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px]">Speed:</span>
              {[
                { label: "0.5x", ms: 1000 },
                { label: "1x", ms: 600 },
                { label: "2x", ms: 300 },
                { label: "4x", ms: 120 },
              ].map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => setPlaybackSpeedMs(sp.ms)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    playbackSpeedMs === sp.ms
                      ? "bg-cyan-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider Scrubber */}
          <div className="flex-1 w-full md:w-auto flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-400 whitespace-nowrap">
              Step {currentStepIndex} / {maxSteps}
            </span>
            <input
              type="range"
              min={0}
              max={maxSteps}
              value={currentStepIndex}
              onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Display Toggles */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[11px]">Fail Links:</span>
              <select
                value={showFailLinks}
                onChange={(e) => setShowFailLinks(e.target.value as "all" | "active" | "none")}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="none">Off</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[11px]">Dict Suffix:</span>
              <select
                value={showDictLinks}
                onChange={(e) => setShowDictLinks(e.target.value as "all" | "active" | "none")}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="none">Off</option>
              </select>
            </label>
          </div>
        </div>

        {/* STEP DESCRIPTION RATIONALE BANNER */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
          <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Step Rationale
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {activeStep?.description ? activeStep.description.slice(0, 45) + "..." : ""}
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              {activeStep?.description || "Stepping through automaton operations."}
            </p>
          </div>
        </div>
      </div>

      {/* GRAPH CANVAS & TELEMETRY HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hierarchical SVG Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aho-Corasick Hierarchical State Machine Canvas
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                States: <strong className="text-white">{activeTrieSnapshot.nodes.length}</strong>
              </span>
              <span>
                Max Depth: <strong className="text-white">{activeLayout.maxDepth}</strong>
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[380px]">
            <GraphCanvasView
              layout={activeLayout}
              activeNodeId={activeNodeId}
              fromNodeId={fromNodeId}
              toNodeId={toNodeId}
              failTargetId={failTargetId}
              dictTargetId={dictTargetId}
              highlightEdge={highlightEdge}
              showFailLinks={showFailLinks}
              showDictLinks={showDictLinks}
              showEdgeLabels={showEdgeLabels}
              onHoverNode={setHoveredNode}
              hoveredNode={hoveredNode}
            />
          </div>
        </div>

        {/* Telemetry & State Inspector HUD (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active State Deep Inspector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Active State Telemetry
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/50">
                State #{activeNodeId}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Path Prefix:</span>
                <span className="font-mono font-bold text-amber-300">
                  {activePathString ? `"${activePathString}"` : "ε (Root)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Depth in Trie:</span>
                <span className="font-mono text-white">{activeNodeObj?.depth ?? 0}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Failure Target:</span>
                <span className="font-mono text-amber-400 font-bold">
                  State #{activeNodeObj?.fail ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Dict Suffix Link:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {activeNodeObj?.dictLink !== null && activeNodeObj?.dictLink !== undefined
                    ? `State #${activeNodeObj.dictLink}`
                    : "null (none)"}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Emitted Matches:</span>
                <div className="flex flex-wrap gap-1">
                  {activeNodeObj?.output && activeNodeObj.output.length > 0 ? (
                    activeNodeObj.output.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-mono font-bold text-[11px]"
                      >
                        "{p}"
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No terminal output</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Theoretical Complexity HUD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Computational Invariants
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Dictionary Build:</span>
                <span className="font-mono text-indigo-400 font-semibold">O(Σ |P_i|)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>BFS Fail Construction:</span>
                <span className="font-mono text-amber-400 font-semibold">O(|V| · |Σ|)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Streaming Search:</span>
                <span className="font-mono text-cyan-400 font-semibold">O(N + occ)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Space Complexity:</span>
                <span className="font-mono text-emerald-400 font-semibold">O(|V| · |Σ|)</span>
              </div>
            </div>
          </div>

          {/* Matches Occurrence Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Emitted Matches ({currentCumulativeMatches.length})
              </h3>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs">
              {currentCumulativeMatches.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4">
                  No patterns matched yet.
                </div>
              ) : (
                currentCumulativeMatches.map((m, idx) => (
                  <div
                    key={`${m.pattern}-${m.startIndex}-${idx}`}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-300">"{m.pattern}"</span>
                      <span className="text-slate-500">
                        at [{m.startIndex}..{m.endIndex}]
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      State #{m.matchedAtState}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
