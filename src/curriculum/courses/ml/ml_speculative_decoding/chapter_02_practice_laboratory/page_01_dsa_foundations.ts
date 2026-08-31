import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_speculative_decoding_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Speculative Decoding & Rejection Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_speculative_decoding",
      title: "Implement Speculative Decoding & Modified Rejection Sampling Engine",
      difficulty: "Hard",
      rationale:
        "Implement the complete speculative decoding algorithm, executing draft generation, target probability evaluation, modified rejection sampling with residual distribution resampling, and KV cache length adjustment.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    Speculative Decoding Engine.
    Executes Draft-Target verification rounds using Modified Rejection Sampling,
    preserving exact Target model probability distribution invariants.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "draft_tokens": np.ndarray of shape [gamma] (proposed token IDs)
                - "draft_probs": np.ndarray of shape [gamma, vocab_size] (draft model probabilities)
                - "target_probs": np.ndarray of shape [gamma + 1, vocab_size] (target model probabilities)
                - "random_seeds": np.ndarray of shape [gamma + 1] (uniform floats in [0, 1) for acceptance test)
        Returns:
            Dictionary containing:
                - "accepted_tokens": List of int, final sequence of emitted tokens for this round
                - "num_accepted": int, count of accepted draft tokens (excluding bonus/resampled token)
                - "rejection_occurred": bool, whether any draft token was rejected
                - "emitted_count": int, total tokens emitted (accepted + 1 bonus/resampled token)
        """
        draft_tokens = inputs["draft_tokens"]
        draft_probs = inputs["draft_probs"]
        target_probs = inputs["target_probs"]
        random_seeds = inputs["random_seeds"]

        gamma = len(draft_tokens)
        vocab_size = draft_probs.shape[1]

        accepted_tokens = []
        rejection_occurred = False
        num_accepted = 0

        for i in range(gamma):
            tok = int(draft_tokens[i])
            q_val = float(draft_probs[i, tok])
            p_val = float(target_probs[i, tok])

            # Acceptance criterion: min(1, p(x) / q(x))
            alpha = min(1.0, p_val / (q_val + 1e-12))
            u = float(random_seeds[i])

            if u < alpha:
                # Token is accepted
                accepted_tokens.append(tok)
                num_accepted += 1
            else:
                # Rejection occurred! Resample from residual distribution p'(x) = max(0, p - q)
                rejection_occurred = True
                p_res = np.maximum(0.0, target_probs[i] - draft_probs[i])
                res_sum = np.sum(p_res)
                if res_sum > 1e-12:
                    p_res = p_res / res_sum
                else:
                    p_res = target_probs[i] / np.sum(target_probs[i])

                # Deterministic sampling from residual distribution using random_seeds[i+1]
                cdf = np.cumsum(p_res)
                resampled_u = float(random_seeds[i + 1]) if (i + 1 < len(random_seeds)) else 0.5
                resampled_tok = int(np.searchsorted(cdf, resampled_u * cdf[-1]))
                resampled_tok = min(resampled_tok, vocab_size - 1)
                accepted_tokens.append(resampled_tok)
                break

        if not rejection_occurred:
            # All gamma tokens were accepted! Sample bonus token from target_probs[gamma]
            bonus_u = float(random_seeds[-1])
            bonus_cdf = np.cumsum(target_probs[gamma])
            bonus_tok = int(np.searchsorted(bonus_cdf, bonus_u * bonus_cdf[-1]))
            bonus_tok = min(bonus_tok, vocab_size - 1)
            accepted_tokens.append(bonus_tok)

        return {
            "accepted_tokens": accepted_tokens,
            "num_accepted": num_accepted,
            "rejection_occurred": rejection_occurred,
            "emitted_count": len(accepted_tokens),
        }`,
    },
  ],
};

export const page = page1;
