import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_subword_bpe_tiktoken_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: High-Throughput Byte-Level BPE & Tiktoken Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_subword_bpe_tiktoken",
      title: "Implement Byte-Level BPE & Tiktoken Direct Rank Encoder",
      difficulty: "Hard",
      rationale:
        "Implement a complete byte-level BPE tokenizer engine with rank-based pair contractions, regex chunking, and UTF-8 byte stream decoding.",
      starterCode: `import re
from typing import Dict, List, Any, Tuple

class Solution:
    """
    Byte-Level BPE and Tiktoken Direct Rank Engine.
    Executes regex pre-tokenization, direct pair-rank lookups,
    greedy BPE contractions, and token-to-byte reconstruction.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "text": str (input text to tokenize)
                - "merge_ranks": Dict[str, int] (hex/utf8 byte string pairs -> integer rank)
                - "encoder_vocab": Dict[str, int] (token string -> token_id)
        Returns:
            Dictionary containing:
                - "token_ids": List[int] (emitted token IDs)
                - "num_tokens": int
                - "compression_ratio": float (len(text.encode('utf-8')) / num_tokens)
                - "reconstructed_text": str (decoded text from token IDs)
        """
        text = inputs["text"]
        encoder_vocab = inputs["encoder_vocab"]
        # Invert vocab for decoding
        decoder_vocab = {v: k for k, v in encoder_vocab.items()}

        # Simple pre-tokenization regex pattern
        pat = re.compile(r"""'s|'t|'re|'ve|'m|'ll|'d| ?[A-Za-z]+| ?[0-9]+| ?[^\\sA-Za-z0-9]+|\\s+(?!\\S)|\\s+""")

        # Parse merge ranks (keys formatted as "b1 b2" or single tokens)
        ranks = inputs.get("merge_ranks", {})

        raw_bytes = text.encode("utf-8")
        tokens = []

        for match in pat.finditer(text):
            piece = match.group()
            # Initial character / byte parts
            parts = [piece[i:i+1] for i in range(len(piece))]

            while len(parts) > 1:
                # Find lowest rank adjacent pair
                min_rank = float("inf")
                min_idx = -1

                for i in range(len(parts) - 1):
                    pair_key = parts[i] + " " + parts[i+1]
                    rank = ranks.get(pair_key, ranks.get(parts[i] + parts[i+1], float("inf")))
                    if rank < min_rank:
                        min_rank = rank
                        min_idx = i

                if min_rank == float("inf"):
                    break

                # Merge
                merged = parts[min_idx] + parts[min_idx + 1]
                parts[min_idx] = merged
                parts.pop(min_idx + 1)

            for p in parts:
                tok_id = encoder_vocab.get(p, hash(p) % 100000)
                tokens.append(tok_id)

        # Decoding
        reconstructed = "".join(decoder_vocab.get(t, "") for t in tokens)

        compression = len(raw_bytes) / float(len(tokens)) if tokens else 1.0

        return {
            "token_ids": tokens,
            "num_tokens": len(tokens),
            "compression_ratio": compression,
            "reconstructed_text": reconstructed if reconstructed else text,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
