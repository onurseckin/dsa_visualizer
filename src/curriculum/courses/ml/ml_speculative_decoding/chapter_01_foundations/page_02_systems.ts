import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_speculative_decoding_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Speculative Decoding: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Standard Autoregressive Baseline on Target Model",
          code: `import torch

def standard_target_autoregressive_decode(
    target_model,
    prompt_tokens: torch.Tensor,
    max_new_tokens: int,
) -> torch.Tensor:
    # prompt_tokens: [1, seq_len]
    generated = prompt_tokens.clone()
    
    # Executes max_new_tokens sequential memory-bound forward passes
    for _ in range(max_new_tokens):
        # Full 70B parameter model weights streamed from HBM for EVERY single token!
        logits = target_model(generated)  # [1, cur_len, vocab_size]
        next_token_logits = logits[:, -1, :]
        next_token = torch.argmax(next_token_logits, dim=-1, keepdim=True)
        generated = torch.cat([generated, next_token], dim=-1)
        
    return generated`,
          explanation:
            "Standard sequential decoding streams all 70B parameters through GPU memory bus for each and every token, locking arithmetic intensity at ~1.0 FLOP/byte.",
          timeComplexity: "O(max_new_tokens * T_target_forward)",
          spaceComplexity: "O(max_seq_len * H * D) linear KV cache growth",
        },
        {
          label: "Stage 2: Speculative Sampling Algorithm (Draft + Target Verification)",
          code: `import torch
import torch.nn.functional as F
from typing import Tuple, List

def speculative_sampling_step(
    draft_model,
    target_model,
    prefix_tokens: torch.Tensor,  # [1, N]
    gamma: int = 4,               # Number of speculative lookahead tokens
) -> torch.Tensor:
    """
    Executes a single speculative decoding round:
    1. Generates gamma candidate tokens from draft model.
    2. Runs 1 parallel forward pass on target model (evaluating gamma + 1 tokens).
    3. Executes modified rejection sampling with distribution correction.
    """
    draft_tokens = []
    draft_probs_list = []
    curr_prefix = prefix_tokens.clone()
    
    # 1. Draft Phase: Rapidly speculate gamma tokens
    for _ in range(gamma):
        draft_logits = draft_model(curr_prefix)[:, -1, :]
        draft_probs = F.softmax(draft_logits, dim=-1)  # [1, Vocab]
        next_draft_tok = torch.multinomial(draft_probs, num_samples=1)  # [1, 1]
        
        draft_tokens.append(next_draft_tok)
        draft_probs_list.append(draft_probs)
        curr_prefix = torch.cat([curr_prefix, next_draft_tok], dim=-1)
        
    candidate_seq = torch.cat(draft_tokens, dim=-1)  # [1, gamma]
    full_verify_seq = torch.cat([prefix_tokens, candidate_seq], dim=-1)  # [1, N + gamma]
    
    # 2. Target Phase: Single parallel forward pass over all candidates
    target_all_logits = target_model(full_verify_seq)  # [1, N + gamma, Vocab]
    
    # Extract target probability distributions for verification positions
    target_probs_list = []
    for i in range(gamma + 1):
        pos = prefix_tokens.shape[1] - 1 + i
        t_probs = F.softmax(target_all_logits[:, pos, :], dim=-1)
        target_probs_list.append(t_probs)
        
    # 3. Modified Rejection Sampling Loop
    accepted_tokens = []
    n_prefix = prefix_tokens.shape[1]
    
    for i in range(gamma):
        tok_id = draft_tokens[i].item()
        q_val = draft_probs_list[i][0, tok_id].item()
        p_val = target_probs_list[i][0, tok_id].item()
        
        accept_prob = min(1.0, p_val / (q_val + 1e-12))
        r = torch.rand(1).item()
        
        if r < accept_prob:
            # Token accepted!
            accepted_tokens.append(draft_tokens[i])
        else:
            # Token rejected! Resample from residual distribution
            p_res = torch.clamp(target_probs_list[i] - draft_probs_list[i], min=0.0)
            p_res = p_res / torch.sum(p_res)
            resampled_tok = torch.multinomial(p_res, num_samples=1)
            accepted_tokens.append(resampled_tok)
            # Stop verification and return prefix + accepted tokens
            return torch.cat([prefix_tokens] + accepted_tokens, dim=-1)
            
    # If all gamma tokens accepted, append bonus (gamma + 1)-th token
    bonus_tok = torch.multinomial(target_probs_list[gamma], num_samples=1)
    accepted_tokens.append(bonus_tok)
    return torch.cat([prefix_tokens] + accepted_tokens, dim=-1)`,
          explanation:
            "Evaluates $\\gamma$ draft tokens with a single parallel target forward pass. Employs rejection sampling and residual distribution recovery ($p'(x) \\propto \\max(0, p - q)$), yielding 1 to $\\gamma + 1$ verified tokens per target pass.",
          timeComplexity: "O(gamma * T_draft + T_target)",
          spaceComplexity: "O((N + gamma) * d) verification activations",
        },
        {
          label: "Stage 3: Systems-Optimized Tree Speculative Decoding (Medusa / EAGLE)",
          code: `import torch

def tree_attention_speculative_verification(
    target_model,
    prefix_kv_cache,
    tree_candidates: torch.Tensor,     # [1, total_tree_nodes, D]
    tree_mask: torch.Tensor,           # [1, 1, total_tree_nodes, total_tree_nodes]
    tree_positions: torch.Tensor,      # [1, total_tree_nodes]
):
    """
    Simulates Medusa / EAGLE / SpecInfer tree-based speculative decoding.
    Verifies multiple parallel speculative branches (e.g. top-k tree of 64 nodes)
    in a SINGLE target forward pass using a customized Causal Tree Mask.
    """
    # 2D Tree Mask enforces that each candidate node attends only to its ancestor path
    # in the speculation tree, enabling simultaneous evaluation of dozens of trajectories.
    pass`,
          explanation:
            "Tree Speculative Decoding (Medusa / EAGLE). Replaces linear draft sequences with a tree of top-$k$ candidates, evaluated in a single forward pass via a 2D tree attention mask. Increases mean accepted tokens from $\\approx 2.5$ to $> 4.2$.",
          timeComplexity: "O(T_target) with tree-batched Tensor Core compute saturation",
          spaceComplexity: "O(tree_nodes * d) tree KV cache pointers",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: The Speculation Speedup Equation & Memory Roofline",
      content:
        "The wall-clock speedup $S$ of speculative decoding is governed by:\\n\\n$$S = \\frac{\\mathbb{E}[M]}{\\gamma \\cdot c + 1} = \\frac{\\frac{1 - \\alpha^{\\gamma+1}}{1 - \\alpha}}{\\gamma \\cdot \\frac{t_{\\text{draft}}}{t_{\\text{target}}} + 1}$$\\n\\nwhere $\\alpha$ is the draft acceptance rate, $\\gamma$ is speculation depth, and $c = \\frac{t_{\\text{draft}}}{t_{\\text{target}}}$ is the relative latency cost of the draft model. If the draft model is too large ($c > 0.3$) or the acceptance rate is too low ($\\alpha < 0.4$), the speculative overhead exceeds the savings ($S < 1.0$). On an H100 GPU pairing a 70B target model with an 8B draft model ($c \\approx 0.08, \\alpha \\approx 0.75, \\gamma = 5$), $\\mathbb{E}[M] \\approx 3.25$ tokens, yielding a net speedup of $S = \\frac{3.25}{5 \\times 0.08 + 1} = \\frac{3.25}{1.40} \\approx 2.32\\times$ real-world latency acceleration.",
    },
  ],
};
