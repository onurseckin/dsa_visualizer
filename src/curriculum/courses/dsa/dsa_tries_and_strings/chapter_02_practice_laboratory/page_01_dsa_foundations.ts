import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tries_and_strings_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: String Processing & Automata Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "multi-pattern-aho-corasick-matcher",
      title: "High-Performance Aho-Corasick Dictionary Matcher",
      difficulty: "Hard",
      rationale:
        "Implement a complete Aho-Corasick multi-pattern automaton supporting dictionary insertions, BFS failure link compilation, output match aggregation, and linear text scanning. The solver must return all match counts and occurrence positions across a text in $O(|T| + \\sum |P_i|)$ time without backtracking.",
      starterCode: `/**
 * Aho-Corasick Multi-Pattern Search Engine
 */

export interface PatternMatch {
  patternId: number;
  endPosition: number;
}

export class AhoCorasickEngine {
  private alphabetSize: number;
  private maxNodes: number;
  private next: Int32Array;
  private fail: Int32Array;
  private outList: number[][];
  private nodeCount: number;

  constructor(maxTotalChars: number = 200000, alphabetSize: number = 26) {
    this.alphabetSize = alphabetSize;
    this.maxNodes = maxTotalChars + 10;
    this.next = new Int32Array(this.maxNodes * alphabetSize).fill(-1);
    this.fail = new Int32Array(this.maxNodes);
    this.outList = Array.from({ length: this.maxNodes }, () => []);
    this.nodeCount = 1; // Root is 0
  }

  // Insert a pattern with unique identifier ID
  public insert(pattern: string, patternId: number): void {
    let u = 0;
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern.charCodeAt(i) - 97;
      const cell = u * this.alphabetSize + c;
      if (this.next[cell] === -1) {
        this.next[cell] = this.nodeCount++;
      }
      u = this.next[cell];
    }
    this.outList[u].push(patternId);
  }

  // Compile Failure links and output references via BFS
  public build(): void {
    const queue = new Int32Array(this.nodeCount);
    let qHead = 0;
    let qTail = 0;

    for (let c = 0; c < this.alphabetSize; c++) {
      const cell = 0 * this.alphabetSize + c;
      const v = this.next[cell];
      if (v !== -1) {
        this.fail[v] = 0;
        queue[qTail++] = v;
      } else {
        this.next[cell] = 0;
      }
    }

    while (qHead < qTail) {
      const u = queue[qHead++];
      const uFail = this.fail[u];

      // Merge output list from failure target
      for (const patId of this.outList[uFail]) {
        this.outList[u].push(patId);
      }

      for (let c = 0; c < this.alphabetSize; c++) {
        const uCell = u * this.alphabetSize + c;
        const v = this.next[uCell];
        const failTarget = this.next[uFail * this.alphabetSize + c];

        if (v !== -1) {
          this.fail[v] = failTarget;
          queue[qTail++] = v;
        } else {
          this.next[uCell] = failTarget;
        }
      }
    }
  }

  // Search text and return all pattern matches
  public search(text: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    let u = 0;

    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i) - 97;
      if (c >= 0 && c < this.alphabetSize) {
        u = this.next[u * this.alphabetSize + c];
      } else {
        u = 0;
      }

      if (this.outList[u].length > 0) {
        for (const patId of this.outList[u]) {
          matches.push({ patternId: patId, endPosition: i });
        }
      }
    }

    return matches;
  }
}`,
    },
  ],
};
