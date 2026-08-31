import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_sampling_top_p_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Autoregressive Sampler Progression",
  subtitle: "GPU Sorting Bottlenecks, Warp Prefix Sums, and Gumbel-Max Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Vocabulary Sorting Bottlenecks & Warp Scan Acceleration",
      content:
        "1. **Vocabulary Sorting Bottleneck ($V = 128{,}000$)**: In high-throughput LLM serving (e.g. vLLM, TensorRT-LLM), sorting the full logit vector ($128{,}000$ floats $\\approx 512\\text{ KB}$ per token per sequence) requires multiple DRAM roundtrips for global radix/bitonic sorts, adding up to $15\\%$ decoding latency overhead.\n2. **Warp Prefix Sum (Scan) in SRAM**: Modern sampling kernels first perform a partial top-$K$ selection (e.g., $K=256$) directly inside GPU registers/SRAM using bitonic sorting networks. Cumulative probabilities $\\sum p_j$ are then computed across 32 threads in a warp using zero-latency warp shuffle instructions (`__shfl_up_sync`), avoiding global DRAM memory writes completely.\n3. **RNG Synchronization Across Tensor-Parallel Ranks**: In multi-GPU tensor parallelism (TP=8), all 8 GPUs must sample the exact same token index. Generating independent RNG seeds causes ranks to diverge and corrupts KV caches, requiring synchronized RNG seeds or sampling only on Rank 0 and broadcasting the 4-byte sampled token ID.",
    },
    {
      type: "code_progression",
      title: "Building Autoregressive Samplers: From Naive Loops to Fused Top-P & Gumbel Engines",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Python Sort-and-Accumulate Sampler",
          code: `import math
import random

def naive_top_p_sample(logits: list[float], top_p: float = 0.9, temperature: float = 1.0) -> int:
    """
    Naive pure-Python Top-P sampler.
    WARNING: Full O(V log V) sort on raw lists causes severe CPU latency stalls.
    """
    # 1. Scale logits by temperature and compute softmax
    scaled = [z / temperature for z in logits]
    max_z = max(scaled)
    exps = [math.exp(z - max_z) for z in scaled]
    sum_exps = sum(exps)
    probs = [e / sum_exps for e in exps]
    
    # 2. Pair with indices and sort descending: O(V log V)
    indexed_probs = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)
    
    # 3. Accumulate cumulative mass until top_p is exceeded
    cumulative = 0.0
    nucleus = []
    for idx, p in indexed_probs:
        nucleus.append((idx, p))
        cumulative += p
        if cumulative >= top_p:
            break
            
    # 4. Renormalize and sample
    nucleus_sum = sum(p for _, p in nucleus)
    r = random.random() * nucleus_sum
    running = 0.0
    for idx, p in nucleus:
        running += p
        if running >= r:
            return idx
            
    return nucleus[0][0]`,
          explanation:
            "Pure-Python sorting and scalar iterations suffer from severe interpreter overhead and cannot run in parallel across batch sequences.",
          timeComplexity: "O(V log V)",
          spaceComplexity: "O(V) allocations",
        },
        {
          label: "Stage 2: Vectorized PyTorch Top-P & Top-K Sampler",
          code: `import torch
import torch.nn.functional as F

def sample_top_p_top_k(
    logits: torch.Tensor,
    top_p: float = 0.9,
    top_k: int = 50,
    temperature: float = 1.0
) -> torch.Tensor:
    """
    Vectorized batch sampling with combined Temperature, Top-K, and Top-P filtering.
    
    Args:
        logits: (Batch, VocabSize) tensor
        top_p: Nucleus threshold in (0, 1]
        top_k: Top-K cutoff integer
        temperature: Temperature scalar > 0
        
    Returns:
        next_tokens: (Batch, 1) sampled token indices
    """
    # 1. Apply temperature scaling
    scaled_logits = logits / max(temperature, 1e-5)
    
    # 2. Top-K filtering: mask out all logits below the top-k threshold
    if top_k > 0:
        top_k = min(top_k, scaled_logits.size(-1))
        # Keep only top_k values, mask others with -infinity
        k_val = torch.topk(scaled_logits, top_k, dim=-1).values[..., -1, None]
        scaled_logits = torch.where(scaled_logits < k_val, torch.tensor(float("-inf"), device=scaled_logits.device), scaled_logits)
        
    # 3. Top-P (Nucleus) filtering: sort and compute cumulative softmax
    if top_p < 1.0:
        sorted_logits, sorted_indices = torch.sort(scaled_logits, descending=True, dim=-1)
        sorted_probs = F.softmax(sorted_logits, dim=-1)
        cumulative_probs = torch.cumsum(sorted_probs, dim=-1)
        
        # Shift mask right by 1 so the token that crosses the threshold is included!
        sorted_indices_to_remove = cumulative_probs > top_p
        sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
        sorted_indices_to_remove[..., 0] = 0  # Always keep at least the top-1 token
        
        # Scatter removal mask back to original unsorted logit layout
        indices_to_remove = sorted_indices_to_remove.scatter(dim=-1, index=sorted_indices, src=sorted_indices_to_remove)
        scaled_logits = scaled_logits.masked_fill(indices_to_remove, float("-inf"))
        
    # 4. Softmax and Categorical Multinomial Sampling
    probs = F.softmax(scaled_logits, dim=-1)
    next_tokens = torch.multinomial(probs, num_samples=1)  # (Batch, 1)
    
    return next_tokens`,
          explanation:
            "Vectorized PyTorch implementation combines Top-K thresholding with right-shifted cumulative probability masking, executing in parallel across batch sequences.",
          timeComplexity: "O(Batch * V log V)",
          spaceComplexity: "O(Batch * V)",
        },
        {
          label: "Stage 3: High-Performance Gumbel-Max Fast Categorical Sampler",
          code: `import torch

def gumbel_max_sample(logits: torch.Tensor, temperature: float = 1.0) -> torch.Tensor:
    """
    High-Performance GPU Gumbel-Max Sampler.
    Samples exact categorical tokens in O(V) parallel time without sorting or cumsum.
    
    Args:
        logits: (Batch, VocabSize) unnormalized logits
        temperature: Temperature scaling factor
        
    Returns:
        sampled_tokens: (Batch,) sampled token indices
    """
    # 1. Scale logits
    scaled_logits = logits / max(temperature, 1e-5)
    
    # 2. Draw standard uniform noise U ~ (0, 1)
    u = torch.rand_like(scaled_logits)
    # Clamp to avoid log(0)
    u = torch.clamp(u, min=1e-10, max=1.0 - 1e-10)
    
    # 3. Compute standard Gumbel noise g = -ln(-ln(u))
    g = -torch.log(-torch.log(u))
    
    # 4. Exact categorical sample: argmax(logits + g)
    # Fully vectorized O(V) reduction without sorting!
    sampled_tokens = torch.argmax(scaled_logits + g, dim=-1)
    
    return sampled_tokens`,
          explanation:
            "The Gumbel-Max engine eliminates vocabulary sorting and prefix-sum scans entirely, executing an $O(V)$ parallel reduction that fully saturates GPU streaming multiprocessors.",
          timeComplexity: "O(Batch * VocabSize) parallel reduction",
          spaceComplexity: "O(Batch * VocabSize) for noise buffer",
        },
      ],
      stepByStep: [
        "1. Scale unnormalized logits by temperature: $z_i \\leftarrow z_i / T$.",
        "2. For Top-K, select the $K$-th largest pivot and mask out tokens below threshold.",
        "3. For Top-P, sort descending, compute cumulative softmax sum $\\sum_{j=1}^i p_{(j)}$, and mask tokens where cumulative sum $> P$ (with right-shift preservation).",
        "4. In Gumbel-Max, perturb logits with $- \\ln(-\\ln(U))$ and take the parallel argmax reduction.",
        "5. Synchronize random seeds or broadcast sampled token across tensor-parallel worker ranks.",
      ],
    },
  ],
};

export const page2 = page_02_systems;
