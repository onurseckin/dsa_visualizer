import { describe, expect, it } from "bun:test";
import React from "react";
import {
  SuffixAutomataStudio,
  buildSuffixAutomaton,
  buildSuffixAutomatonStepByStep,
  buildSuffixArray,
  computeKasaiLCP,
  queryLCPInterval,
  countDistinctSubstringsSAM,
  computeDAGSubstringsDP,
  findKthSubstring,
  searchPatternSAM,
  computeEndposOccurrences,
  layoutSAMGraph,
  SAM_STUDIO_PRESETS,
  type SAMPresetId,
  type SAMStudioModality,
} from "../../components/primitives";

describe("SuffixAutomataStudio & Suffix Automaton / Kasai LCP Suite Tests", () => {
  // Helper: Brute force distinct substrings generator
  const getBruteForceSubstrings = (text: string): string[] => {
    const set = new Set<string>();
    for (let i = 0; i < text.length; i++) {
      for (let j = i + 1; j <= text.length; j++) {
        set.add(text.slice(i, j));
      }
    }
    return Array.from(set).sort();
  };

  // Helper: Brute force LCP of two strings
  const getBruteForceLCP = (s1: string, s2: string): number => {
    let len = 0;
    while (len < s1.length && len < s2.length && s1[len] === s2[len]) {
      len++;
    }
    return len;
  };

  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate SuffixAutomataStudio with default props", () => {
      const element = React.createElement(SuffixAutomataStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(SuffixAutomataStudio);
    });

    it("should instantiate SuffixAutomataStudio with custom modes and presets", () => {
      const onPresetChangeMock = (_id: SAMPresetId) => {};
      const onModalityChangeMock = (_mod: SAMStudioModality) => {};

      const element = React.createElement(SuffixAutomataStudio, {
        initialPreset: "abracadabra",
        initialModality: "suffix_array_kasai_lcp",
        initialText: "abracadabra",
        standalone: true,
        title: "Custom SAM Lab",
        onPresetChange: onPresetChangeMock,
        onModalityChange: onModalityChangeMock,
      });

      expect(element.props.initialPreset).toBe("abracadabra");
      expect(element.props.initialModality).toBe("suffix_array_kasai_lcp");
      expect(element.props.initialText).toBe("abracadabra");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom SAM Lab");
      expect(element.props.onPresetChange).toBe(onPresetChangeMock);
      expect(element.props.onModalityChange).toBe(onModalityChangeMock);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const presetIds: SAMPresetId[] = [
      "banana",
      "abracadabra",
      "aabaab",
      "mississippi",
      "cocoa",
      "bababab",
    ];

    it("should provide valid preset structures across all defined presets", () => {
      for (const id of presetIds) {
        const preset = SAM_STUDIO_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.text.length).toBeGreaterThan(0);
        expect(preset.defaultPattern.length).toBeGreaterThan(0);
        expect(preset.defaultK).toBeGreaterThan(0);
        expect(preset.defaultSuffixQuery.length).toBe(2);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.theoryNotes.length).toBeGreaterThan(0);
        expect(preset.properties.states).toBeGreaterThan(0);
        expect(preset.properties.transitions).toBeGreaterThan(0);
        expect(preset.properties.distinctSubstrings).toBeGreaterThan(0);
      }
    });

    it("should verify preset property numbers match exact algorithmic outputs", () => {
      for (const id of presetIds) {
        const preset = SAM_STUDIO_PRESETS[id];
        const sam = buildSuffixAutomaton(preset.text);
        const kasai = computeKasaiLCP(preset.text, buildSuffixArray(preset.text).sa);
        const distinct = countDistinctSubstringsSAM(sam);

        expect(sam.states.length).toBe(preset.properties.states);
        expect(sam.totalTransitions).toBe(preset.properties.transitions);
        expect(distinct).toBe(preset.properties.distinctSubstrings);
        expect(kasai.maxLCP).toBe(preset.properties.maxLCP);
      }
    });
  });

  // ==========================================================================
  // 3. PURE SAM CONSTRUCTION & STRUCTURAL INVARIANTS
  // ==========================================================================
  describe("3. Pure Suffix Automaton (SAM) Construction & Invariants", () => {
    const testCases = [
      "banana",
      "abracadabra",
      "aabaab",
      "mississippi",
      "cocoa",
      "bababab",
      "aaaaa",
      "abcdefg",
      "a",
      "",
    ];

    it("should satisfy state count bound: states <= 2N - 1 for N >= 2 (and <= 2 for N=1)", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        if (str.length === 0) {
          expect(sam.states.length).toBe(1);
        } else if (str.length === 1) {
          expect(sam.states.length).toBeLessThanOrEqual(2);
        } else {
          expect(sam.states.length).toBeLessThanOrEqual(2 * str.length - 1);
        }
      }
    });

    it("should satisfy transition count bound: transitions <= 3N - 4 for N >= 3", () => {
      for (const str of testCases) {
        if (str.length >= 3) {
          const sam = buildSuffixAutomaton(str);
          expect(sam.totalTransitions).toBeLessThanOrEqual(3 * str.length - 4);
        }
      }
    });

    it("should ensure root state has len=0 and link=-1", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        const root = sam.states[0];
        expect(root.len).toBe(0);
        expect(root.link).toBe(-1);
        expect(root.isClone).toBe(false);
      }
    });

    it("should ensure state lengths increase monotonically along all transitions", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        for (const st of sam.states) {
          for (const c of Object.keys(st.next)) {
            const nextId = st.next[c];
            const targetSt = sam.states[nextId];
            expect(targetSt.len).toBeGreaterThanOrEqual(st.len + 1);
          }
        }
      }
    });

    it("should ensure suffix links point to states with strictly smaller len", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        for (let u = 1; u < sam.states.length; u++) {
          const st = sam.states[u];
          expect(st.link).toBeGreaterThanOrEqual(0);
          expect(st.link).toBeLessThan(sam.states.length);
          const linkSt = sam.states[st.link];
          expect(linkSt.len).toBeLessThan(st.len);
        }
      }
    });

    it("should ensure suffix links form an acyclic tree rooted at 0", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        for (let u = 1; u < sam.states.length; u++) {
          let curr = u;
          const visited = new Set<number>();
          while (curr !== 0 && curr !== -1) {
            expect(visited.has(curr)).toBe(false);
            visited.add(curr);
            curr = sam.states[curr].link;
          }
          expect(curr).toBe(0);
        }
      }
    });
  });

  // ==========================================================================
  // 4. SUFFIX ARRAY & KASAI LCP ALGORITHMS
  // ==========================================================================
  describe("4. Suffix Array & Kasai LCP Algorithms", () => {
    const testStrings = [
      "banana",
      "abracadabra",
      "aabaab",
      "mississippi",
      "cocoa",
      "bababab",
      "aaaaa",
      "xyzabc",
    ];

    it("should construct strictly lexicographically sorted Suffix Array", () => {
      for (const str of testStrings) {
        const saResult = buildSuffixArray(str);
        expect(saResult.sa.length).toBe(str.length);
        expect(saResult.rank.length).toBe(str.length);

        // Verify permutation
        const sortedIndices = [...saResult.sa].sort((a, b) => a - b);
        for (let i = 0; i < str.length; i++) {
          expect(sortedIndices[i]).toBe(i);
        }

        // Verify lexicographical order of suffixes
        for (let i = 0; i < str.length - 1; i++) {
          const s1 = str.slice(saResult.sa[i]);
          const s2 = str.slice(saResult.sa[i + 1]);
          expect(s1.localeCompare(s2)).toBeLessThan(0);
        }
      }
    });

    it("should satisfy Kasai invariant h[i+1] >= h[i] - 1 across all positions", () => {
      for (const str of testStrings) {
        const saResult = buildSuffixArray(str);
        const kasai = computeKasaiLCP(str, saResult.sa);

        expect(kasai.lcp.length).toBe(Math.max(0, str.length - 1));
        expect(kasai.hValues.length).toBe(str.length);

        for (let i = 0; i < str.length - 1; i++) {
          const rankI = saResult.rank[i];
          if (rankI > 0) {
            const hCurr = kasai.hValues[i];
            const hNext = kasai.hValues[i + 1];
            // Invariant: next h is at least curr h - 1
            expect(hNext).toBeGreaterThanOrEqual(hCurr - 1);
          }
        }
      }
    });

    it("should compute exact LCP values matching brute force pairwise comparison", () => {
      for (const str of testStrings) {
        const saResult = buildSuffixArray(str);
        const kasai = computeKasaiLCP(str, saResult.sa);

        for (let k = 0; k < str.length - 1; k++) {
          const s1 = str.slice(saResult.sa[k]);
          const s2 = str.slice(saResult.sa[k + 1]);
          const expectedLCP = getBruteForceLCP(s1, s2);
          expect(kasai.lcp[k]).toBe(expectedLCP);
        }
      }
    });

    it("should verify RMQ interval LCP queries match brute force between all pairs", () => {
      for (const str of testStrings) {
        const saResult = buildSuffixArray(str);
        const kasai = computeKasaiLCP(str, saResult.sa);

        for (let i = 0; i < str.length; i++) {
          for (let j = 0; j < str.length; j++) {
            const r1 = saResult.rank[i];
            const r2 = saResult.rank[j];
            const queryRes = queryLCPInterval(kasai.lcp, r1, r2);

            const s1 = str.slice(i);
            const s2 = str.slice(j);
            const expectedLCP = r1 === r2 ? 0 : getBruteForceLCP(s1, s2);

            expect(queryRes.lcpValue).toBe(expectedLCP);
          }
        }
      }
    });
  });

  // ==========================================================================
  // 5. DISTINCT SUBSTRINGS & DAG DP TRACE
  // ==========================================================================
  describe("5. Distinct Substrings & DAG DP Equivalence", () => {
    const testCases = [
      "banana",
      "abracadabra",
      "aabaab",
      "mississippi",
      "cocoa",
      "bababab",
      "aaaaa",
      "xyzabc",
    ];

    it("should match SAM formula, DAG DP, and Brute Force substring counts", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        const formulaCount = countDistinctSubstringsSAM(sam);
        const dagDPResult = computeDAGSubstringsDP(sam);
        const bruteForceSubstrings = getBruteForceSubstrings(str);

        expect(formulaCount).toBe(bruteForceSubstrings.length);
        expect(dagDPResult.totalDistinct).toBe(bruteForceSubstrings.length);
        expect(dagDPResult.sumFormulaTotal).toBe(bruteForceSubstrings.length);

        // Also check against Suffix Array LCP formula: N(N+1)/2 - sum(LCP)
        const sa = buildSuffixArray(str);
        const kasai = computeKasaiLCP(str, sa.sa);
        const lcpSum = kasai.lcp.reduce((acc, v) => acc + v, 0);
        const saCount = (str.length * (str.length + 1)) / 2 - lcpSum;
        expect(saCount).toBe(bruteForceSubstrings.length);
      }
    });

    it("should correctly find the k-th lexicographical substring for all 1 <= k <= total", () => {
      for (const str of testCases) {
        const sam = buildSuffixAutomaton(str);
        const bruteForceSorted = getBruteForceSubstrings(str);
        const total = bruteForceSorted.length;

        for (let k = 1; k <= total; k++) {
          const res = findKthSubstring(sam, k);
          expect(res.found).toBe(true);
          expect(res.k).toBe(k);
          expect(res.substring).toBe(bruteForceSorted[k - 1]);
          expect(res.path.length).toBe(res.substring.length);
        }

        // Out of bounds
        expect(findKthSubstring(sam, 0).found).toBe(false);
        expect(findKthSubstring(sam, total + 1).found).toBe(false);
        expect(findKthSubstring(sam, -5).found).toBe(false);
      }
    });
  });

  // ==========================================================================
  // 6. PATTERN SEARCH & ENDPOS OCCURRENCE COUNTING
  // ==========================================================================
  describe("6. Pattern Search & Endpos Occurrence Propagation", () => {
    it("should accurately locate single and multi-occurrence patterns in 'banana'", () => {
      const sam = buildSuffixAutomaton("banana");

      // Pattern "an"
      const resAn = searchPatternSAM(sam, "an");
      expect(resAn.found).toBe(true);
      expect(resAn.occurrenceCount).toBe(2);
      expect(resAn.occurrences).toEqual([1, 3]);

      // Pattern "a"
      const resA = searchPatternSAM(sam, "a");
      expect(resA.found).toBe(true);
      expect(resA.occurrenceCount).toBe(3);
      expect(resA.occurrences).toEqual([1, 3, 5]);

      // Pattern "banana"
      const resFull = searchPatternSAM(sam, "banana");
      expect(resFull.found).toBe(true);
      expect(resFull.occurrenceCount).toBe(1);
      expect(resFull.occurrences).toEqual([0]);

      // Non-existent pattern "bananas"
      const resMissing = searchPatternSAM(sam, "bananas");
      expect(resMissing.found).toBe(false);
      expect(resMissing.occurrenceCount).toBe(0);
      expect(resMissing.occurrences).toEqual([]);
      expect(resMissing.mismatchIndex).toBe(6);
    });

    it("should accurately locate occurrences in 'abracadabra'", () => {
      const sam = buildSuffixAutomaton("abracadabra");

      const resAbra = searchPatternSAM(sam, "abra");
      expect(resAbra.found).toBe(true);
      expect(resAbra.occurrenceCount).toBe(2);
      expect(resAbra.occurrences).toEqual([0, 7]);

      const resCadabra = searchPatternSAM(sam, "cadabra");
      expect(resCadabra.found).toBe(true);
      expect(resCadabra.occurrenceCount).toBe(1);
      expect(resCadabra.occurrences).toEqual([4]);

      const resZ = searchPatternSAM(sam, "z");
      expect(resZ.found).toBe(false);
      expect(resZ.occurrenceCount).toBe(0);
    });

    it("should accurately locate occurrences in 'mississippi'", () => {
      const sam = buildSuffixAutomaton("mississippi");

      const resS = searchPatternSAM(sam, "s");
      expect(resS.found).toBe(true);
      expect(resS.occurrenceCount).toBe(4);
      expect(resS.occurrences).toEqual([2, 3, 5, 6]);

      const resIssi = searchPatternSAM(sam, "issi");
      expect(resIssi.found).toBe(true);
      expect(resIssi.occurrenceCount).toBe(2);
      expect(resIssi.occurrences).toEqual([1, 4]);

      const resPpi = searchPatternSAM(sam, "ppi");
      expect(resPpi.found).toBe(true);
      expect(resPpi.occurrenceCount).toBe(1);
      expect(resPpi.occurrences).toEqual([8]);
    });

    it("should compute endpos sets correctly across link tree", () => {
      const sam = buildSuffixAutomaton("banana");
      const endposRes = computeEndposOccurrences(sam, 6);

      expect(Object.keys(endposRes.endposMap).length).toBe(sam.states.length);
      expect(Object.keys(endposRes.occurrenceCounts).length).toBe(sam.states.length);

      // Root state 0 contains all endpos [0, 1, 2, 3, 4, 5]
      expect(endposRes.endposMap[0]).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  // ==========================================================================
  // 7. STEP-BY-STEP CONSTRUCTION TRACE & GRAPH LAYOUT
  // ==========================================================================
  describe("7. Step-by-Step Construction Trace & 2D Graph Layout", () => {
    it("should generate non-empty trace steps matching final SAM state on completion", () => {
      const text = "banana";
      const trace = buildSuffixAutomatonStepByStep(text);
      expect(trace.length).toBeGreaterThan(text.length);

      const firstStep = trace[0];
      expect(firstStep.phase).toBe("init");
      expect(firstStep.samSnapshot.states.length).toBe(1);

      const lastStep = trace[trace.length - 1];
      expect(lastStep.phase).toBe("built");
      const fullSAM = buildSuffixAutomaton(text);
      expect(lastStep.samSnapshot.states.length).toBe(fullSAM.states.length);
      expect(lastStep.samSnapshot.totalTransitions).toBe(fullSAM.totalTransitions);
    });

    it("should generate valid DAG graph layout within canvas bounds", () => {
      const sam = buildSuffixAutomaton("banana");
      const box = { width: 800, height: 500 };
      const layout = layoutSAMGraph(sam, box, "dag");

      expect(layout.nodes.length).toBe(sam.states.length);
      expect(layout.edges.length).toBeGreaterThan(0);
      expect(layout.width).toBe(800);
      expect(layout.height).toBe(500);

      for (const node of layout.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(800);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(500);
      }
    });

    it("should generate valid Link Tree graph layout within canvas bounds", () => {
      const sam = buildSuffixAutomaton("banana");
      const box = { width: 800, height: 500 };
      const layout = layoutSAMGraph(sam, box, "link_tree");

      expect(layout.nodes.length).toBe(sam.states.length);
      expect(layout.edges.length).toBe(sam.states.length - 1); // Tree has V-1 edges

      for (const node of layout.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(800);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(500);
      }
    });
  });

  // ==========================================================================
  // 8. EDGE CASES & ROBUSTNESS
  // ==========================================================================
  describe("8. Edge Cases & Robustness", () => {
    it("should handle empty string safely across all utilities", () => {
      const sam = buildSuffixAutomaton("");
      expect(sam.states.length).toBe(1);
      expect(sam.totalTransitions).toBe(0);
      expect(countDistinctSubstringsSAM(sam)).toBe(0);

      const sa = buildSuffixArray("");
      expect(sa.sa.length).toBe(0);
      expect(sa.rank.length).toBe(0);

      const kasai = computeKasaiLCP("", []);
      expect(kasai.lcp.length).toBe(0);
      expect(kasai.maxLCP).toBe(0);

      const dp = computeDAGSubstringsDP(sam);
      expect(dp.totalDistinct).toBe(0);

      const kth = findKthSubstring(sam, 1);
      expect(kth.found).toBe(false);

      const search = searchPatternSAM(sam, "a");
      expect(search.found).toBe(false);
    });

    it("should handle single character string safely", () => {
      const sam = buildSuffixAutomaton("a");
      expect(sam.states.length).toBe(2);
      expect(sam.totalTransitions).toBe(1);
      expect(countDistinctSubstringsSAM(sam)).toBe(1);

      const sa = buildSuffixArray("a");
      expect(sa.sa).toEqual([0]);

      const kasai = computeKasaiLCP("a", sa.sa);
      expect(kasai.lcp).toEqual([]);

      const kth = findKthSubstring(sam, 1);
      expect(kth.found).toBe(true);
      expect(kth.substring).toBe("a");

      const search = searchPatternSAM(sam, "a");
      expect(search.found).toBe(true);
      expect(search.occurrenceCount).toBe(1);
      expect(search.occurrences).toEqual([0]);
    });

    it("should handle repetitive single-character string 'aaaaa'", () => {
      const sam = buildSuffixAutomaton("aaaaa");
      // "aaaaa" has 5 distinct substrings: "a", "aa", "aaa", "aaaa", "aaaaa"
      expect(countDistinctSubstringsSAM(sam)).toBe(5);

      const sa = buildSuffixArray("aaaaa");
      const kasai = computeKasaiLCP("aaaaa", sa.sa);
      expect(kasai.lcp).toEqual([1, 2, 3, 4]);
      expect(kasai.maxLCP).toBe(4);
    });
  });
});
