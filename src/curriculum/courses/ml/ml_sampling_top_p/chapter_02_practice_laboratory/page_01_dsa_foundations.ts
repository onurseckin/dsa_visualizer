import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_sampling_top_p_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Top-P Nucleus & Gumbel-Max Engines",
  subtitle: "Interactive Implementation of Autoregressive Samplers and Gumbel Perturbations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_top_p_nucleus_sampler_engine",
      title: "Top-P (Nucleus) Probability Masking Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of sorting, cumulative softmax summation, right-shifted threshold masking, and categorical sampling.",
      starterCode: `import numpy as np

def top_p_sample(
    logits: np.ndarray,
    top_p: float = 0.9,
    temperature: float = 0.8
) -> int:
    """
    Samples next token using Top-P (Nucleus) filtering.
    
    Args:
        logits: 1D array of unnormalized logits of shape (V,)
        top_p: Nucleus mass threshold in (0, 1]
        temperature: Temperature scaling factor > 0
        
    Returns:
        sampled_token_idx: Integer index of sampled token in [0, V-1]
    """
    # 1. Scale logits by temperature
    scaled = logits / max(temperature, 1e-5)
    
    # 2. Subtract max for stable softmax
    shifted = scaled - np.max(scaled)
    probs = np.exp(shifted) / np.sum(np.exp(shifted))
    
    # 3. Sort probabilities descending
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    
    # 4. Compute cumulative sum
    cum_probs = np.cumsum(sorted_probs)
    
    # 5. Mask tokens exceeding top_p (preserving at least 1 token)
    mask = cum_probs > top_p
    # Shift mask right by 1 so the boundary token is included
    mask[1:] = mask[:-1]
    mask[0] = False
    
    # Zero out masked probabilities and renormalize
    sorted_probs[mask] = 0.0
    sorted_probs /= np.sum(sorted_probs)
    
    # 6. Sample from filtered distribution
    chosen_idx = np.random.choice(len(sorted_probs), p=sorted_probs)
    return int(sorted_indices[chosen_idx])

if __name__ == "__main__":
    np.random.seed(42)
    test_logits = np.array([10.0, 9.0, 5.0, 1.0, 0.0, -5.0])
    samples = [top_p_sample(test_logits, top_p=0.8, temperature=1.0) for _ in range(1000)]
    # With 10.0 and 9.0, top 2 tokens dominate ~90% mass. Low probability tokens (indices 3, 4, 5) should NEVER be sampled.
    assert 3 not in samples and 4 not in samples and 5 not in samples, "Top-P failed to filter tail tokens!"
    print("Top-P nucleus sampling verification passed!")
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_gumbel_max_sampler_engine",
      title: "Gumbel-Max Direct Categorical Sampler",
      difficulty: "Hard",
      rationale:
        "Implements exact categorical sampling via Gumbel noise perturbation and parallel argmax reduction without sorting.",
      starterCode: `import numpy as np

def gumbel_max_categorical_sample(
    logits: np.ndarray,
    temperature: float = 1.0
) -> int:
    """
    Samples a categorical index using the Gumbel-Max trick: argmax_i (z_i / T - ln(-ln(u_i))).
    
    Args:
        logits: 1D array of unnormalized logits (V,)
        temperature: Temperature scalar > 0
        
    Returns:
        sampled_index: Integer index in [0, V-1]
    """
    V = len(logits)
    # 1. Draw uniform random noise in (0, 1)
    u = np.random.uniform(1e-10, 1.0 - 1e-10, size=V)
    
    # 2. Compute Gumbel noise g = -ln(-ln(u))
    g = -np.log(-np.log(u))
    
    # 3. Perturb scaled logits and return argmax
    perturbed = (logits / temperature) + g
    return int(np.argmax(perturbed))
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
