import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_trie_aho_corasick_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Tokenizer Guardrail Engines & High-Throughput Scanners",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Zero-Latency Prompt Safety Guardrails",
      content:
        "In LLM serving systems (e.g. OpenAI moderation, vLLM safety guardrails), every incoming prompt must be scanned against a dynamic blocklist of 50,000+ forbidden terms and regex patterns before tokenization. Executing separate regular expression engines adds 15ms of TTFT (Time to First Token). By compiling the 50,000 safety patterns into a single Double-Array Aho-Corasick automaton resident in CPU L3 cache, prompt screening executes in under 200 microseconds over a 4KB prompt, achieving over 20 GB/s scanning throughput.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_trie_aho_corasick_guardrail",
      title: "Streaming Tokenizer Stop-Sequence Evaluator",
      difficulty: "Hard",
      rationale:
        "Implement a streaming stop-sequence detector that inspects generated token byte buffers token-by-token without decoding full UTF-8 strings.",
      starterCode: `from typing import List, Optional

class StreamingStopSequenceDetector:
    """
    Evaluates whether an autoregressive token stream has hit any stop sequence.
    Maintains internal automaton state across decoding iterations.
    """
    def __init__(self, stop_sequences: List[str]):
        self.stop_sequences = stop_sequences
        # Initialize internal Aho-Corasick DFA state
        self.current_state = 0
        
    def step(self, next_token_bytes: bytes) -> Optional[str]:
        """
        Feeds next generated token bytes into automaton.
        Returns matching stop sequence if detected, else None.
        """
        # Step through byte sequence
        return None`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
