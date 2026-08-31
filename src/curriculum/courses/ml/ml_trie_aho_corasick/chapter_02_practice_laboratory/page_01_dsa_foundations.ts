import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_trie_aho_corasick_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Throughput Aho-Corasick Multi-Pattern Matcher",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_trie_aho_corasick",
      title: "Implement Aho-Corasick Multi-Pattern DFA Matching Engine",
      difficulty: "Hard",
      rationale:
        "Implement the complete Aho-Corasick automaton with BFS failure transitions, dictionary output link propagation, and linear stream search to locate all keyword matches.",
      starterCode: `from typing import Dict, List, Any, Tuple
from collections import deque

class Solution:
    """
    Aho-Corasick Multi-Pattern String Matching Engine.
    Builds prefix Trie, computes failure links via BFS, propagates dictionary output matches,
    and scans input text in O(N + Z) linear time.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "text": str (input text stream)
                - "patterns": List[str] (dictionary keywords to search)
        Returns:
            Dictionary containing:
                - "matches": List of dicts, each with:
                    - "start_index": int
                    - "pattern": str
                - "total_matches_found": int
                - "total_states_constructed": int
        """
        text = inputs["text"]
        patterns = inputs["patterns"]

        # 1. Build Trie
        # Each state is a dict: {"children": {}, "fail": 0, "output": []}
        trie = [{"children": {}, "fail": 0, "output": []}]

        for p in patterns:
            state = 0
            for ch in p:
                if ch not in trie[state]["children"]:
                    new_state = len(trie)
                    trie[state]["children"][ch] = new_state
                    trie.append({"children": {}, "fail": 0, "output": []})
                state = trie[state]["children"][ch]
            trie[state]["output"].append(p)

        # 2. Build Failure Links via BFS
        queue = deque()
        for ch, child in trie[0]["children"].items():
            trie[child]["fail"] = 0
            queue.append(child)

        while queue:
            curr = queue.popleft()
            f_curr = trie[curr]["fail"]
            trie[curr]["output"].extend(trie[f_curr]["output"])

            for ch, child in trie[curr]["children"].items():
                f = f_curr
                while f > 0 and ch not in trie[f]["children"]:
                    f = trie[f]["fail"]
                if ch in trie[f]["children"] and trie[f]["children"][ch] != child:
                    trie[child]["fail"] = trie[f]["children"][ch]
                else:
                    trie[child]["fail"] = 0
                queue.append(child)

        # 3. Search Text Stream
        matches = []
        state = 0
        for i, ch in enumerate(text):
            while state > 0 and ch not in trie[state]["children"]:
                state = trie[state]["fail"]
            state = trie[state]["children"].get(ch, 0)
            if trie[state]["output"]:
                for p in trie[state]["output"]:
                    matches.append({
                        "start_index": i - len(p) + 1,
                        "pattern": p,
                    })

        matches = sorted(matches, key=lambda m: (m["start_index"], len(m["pattern"])))

        return {
            "matches": matches,
            "total_matches_found": len(matches),
            "total_states_constructed": len(trie),
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
