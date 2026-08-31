import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_gradient_descent_adamw_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage AdamW Progression",
  subtitle: "16-Byte Optimizer Memory Footprint, Mixed Precision Master Weights, and Fused Kernels",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: 16-Byte Memory Footprint & Master Weights",
      content:
        "In mixed-precision (FP16 / BF16) LLM training, AdamW consumes **16 bytes of memory per model parameter**:\n1. **Model Weights ($p$)**: 2 bytes (FP16/BF16) for fast Tensor Core forward/backward execution.\n2. **Gradients ($g$)**: 2 bytes (FP16/BF16) computed during backward pass.\n3. **FP32 Master Weights ($p_{\\text{master}}$)**: 4 bytes (FP32) to prevent catastrophic underflow when small gradient updates $\\eta g_t < 10^{-7}$ fall below the 10-bit mantissa precision of FP16.\n4. **First Moment ($m_t$)**: 4 bytes (FP32) tracking gradient EMA.\n5. **Second Moment ($v_t$)**: 4 bytes (FP32) tracking squared gradient EMA.\n\nTotal: $2 + 2 + 4 + 4 + 4 = 16\\text{ bytes per parameter}$. For a 70B parameter model, optimizer state alone requires $70\\times 10^9 \\times 16\\text{ bytes} = 1.12\\text{ Terabytes}$ of VRAM, necessitating ZeRO-1/ZeRO-2 parameter sharding.",
    },
    {
      type: "code_progression",
      title: "From Vanilla SGD to Fused Mixed-Precision AdamW Optimizer",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python SGD with Momentum",
          code: `class SGDMomentum:
    """
    Pure Python SGD with Polyak Heavy-Ball Momentum.
    """
    def __init__(self, params: list[list[float]], lr: float = 0.01, momentum: float = 0.9):
        self.params = params
        self.lr = lr
        self.momentum = momentum
        self.velocities = [[0.0] * len(p) for p in params]

    def step(self, grads: list[list[float]]):
        for i, (p, g, v) in enumerate(zip(self.params, grads, self.velocities)):
            for j in range(len(p)):
                # v_t = beta * v_{t-1} + g_t
                v[j] = self.momentum * v[j] + g[j]
                # theta_t = theta_{t-1} - lr * v_t
                p[j] -= self.lr * v[j]`,
          explanation:
            "Basic SGD with momentum maintains velocity state per parameter, accumulating directional velocity to smooth out oscillating loss ravines.",
          timeComplexity: "O(N) where N is parameter count",
          spaceComplexity: "O(N) velocity buffer",
        },
        {
          label: "Stage 2: Full Vectorized PyTorch AdamW with Cosine Warmup",
          code: `import math
import torch
from torch.optim import Optimizer

class VectorizedAdamW(Optimizer):
    """
    Vectorized AdamW implementation with Decoupled Weight Decay.
    Matches PyTorch torch.optim.AdamW mathematical specification.
    """
    def __init__(
        self,
        params,
        lr: float = 1e-3,
        betas: tuple[float, float] = (0.9, 0.999),
        eps: float = 1e-8,
        weight_decay: float = 1e-2
    ):
        defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self, closure=None):
        loss = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            beta1, beta2 = group["betas"]
            eps = group["eps"]
            lr = group["lr"]
            wd = group["weight_decay"]

            for p in group["params"]:
                if p.grad is None:
                    continue
                grad = p.grad
                assert not grad.is_sparse, "AdamW does not support sparse gradients"

                state = self.state[p]
                if len(state) == 0:
                    state["step"] = 0
                    state["exp_avg"] = torch.zeros_like(p, memory_format=torch.preserve_format)
                    state["exp_avg_sq"] = torch.zeros_like(p, memory_format=torch.preserve_format)

                exp_avg = state["exp_avg"]
                exp_avg_sq = state["exp_avg_sq"]
                state["step"] += 1
                t = state["step"]

                # 1. Perform decoupled weight decay step: p = p - lr * wd * p
                if wd != 0:
                    p.mul_(1.0 - lr * wd)

                # 2. Update EMA moments
                exp_avg.mul_(beta1).add_(grad, alpha=1.0 - beta1)
                exp_avg_sq.mul_(beta2).addcmul_(grad, grad, value=1.0 - beta2)

                # 3. Compute bias corrections
                bias_correction1 = 1.0 - beta1 ** t
                bias_correction2 = 1.0 - beta2 ** t
                step_size = lr / bias_correction1
                denom = (exp_avg_sq.sqrt() / math.sqrt(bias_correction2)).add_(eps)

                # 4. Apply adaptive gradient step
                p.addcdiv_(exp_avg, denom, value=-step_size)

        return loss

def get_cosine_warmup_lr(step: int, warmup_steps: int, max_steps: int, base_lr: float, min_lr: float = 0.0) -> float:
    """Cosine learning rate schedule with linear warmup."""
    if step < warmup_steps:
        return base_lr * (step / max(1, warmup_steps))
    progress = (step - warmup_steps) / max(1, max_steps - warmup_steps)
    return min_lr + 0.5 * (base_lr - min_lr) * (1.0 + math.cos(math.pi * progress))`,
          explanation:
            "Vectorized AdamW executes in-place tensor operations (`add_`, `addcmul_`, `addcdiv_`) to minimize memory allocation while implementing exact decoupled decay and cosine warmup.",
          timeComplexity: "O(N) arithmetic operations",
          spaceComplexity: "O(N) for m and v states",
        },
        {
          label: "Stage 3: Mixed-Precision Fused Master-Weight AdamW Engine",
          code: `import torch

class FusedMixedPrecisionAdamW:
    """
    Simulates a low-level Fused AdamW CUDA kernel.
    Maintains FP32 master weights for FP16 model parameters to prevent underflow.
    Fuses weight decay, moment updates, and bias correction into a single memory pass.
    """
    def __init__(self, fp16_params: list[torch.Tensor], lr: float = 1e-3, beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8, weight_decay: float = 0.01):
        self.fp16_params = fp16_params
        # Allocate FP32 master weights, m, and v buffers
        self.master_params = [p.detach().clone().float() for p in fp16_params]
        self.exp_avg = [torch.zeros_like(mp) for mp in self.master_params]
        self.exp_avg_sq = [torch.zeros_like(mp) for mp in self.master_params]
        self.step_count = 0
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.weight_decay = weight_decay

    @torch.no_grad()
    def step(self):
        self.step_count += 1
        t = self.step_count
        bc1 = 1.0 - self.beta1 ** t
        bc2 = 1.0 - self.beta2 ** t

        for p_fp16, p_fp32, m, v in zip(self.fp16_params, self.master_params, self.exp_avg, self.exp_avg_sq):
            if p_fp16.grad is None:
                continue
            # Convert FP16 grad to FP32 for accumulation
            g_fp32 = p_fp16.grad.float()

            # Fused Element-Wise Update in FP32 registers
            # 1. Decoupled weight decay on master weights
            p_fp32.mul_(1.0 - self.lr * self.weight_decay)

            # 2. Update first and second moments
            m.mul_(self.beta1).add_(g_fp32, alpha=1.0 - self.beta1)
            v.mul_(self.beta2).addcmul_(g_fp32, g_fp32, value=1.0 - self.beta2)

            # 3. Compute bias-corrected step
            m_hat = m / bc1
            v_hat = v / bc2
            denom = torch.sqrt(v_hat) + self.eps

            # 4. Update master weight
            p_fp32.addcdiv_(m_hat, denom, value=-self.lr)

            # 5. Downcast updated master weight back to FP16 model parameter
            p_fp16.copy_(p_fp32.half())`,
          explanation:
            "Mixed-precision training performs forward/backward in FP16 but updates FP32 master weights. Fusing these updates avoids extra roundtrips to HBM, boosting training throughput.",
          timeComplexity: "O(N) memory-bandwidth optimal",
          spaceComplexity: "16 bytes per parameter (FP16 param + FP32 master + FP32 m + FP32 v)",
        },
      ],
      stepByStep: [
        "1. Cast gradients to FP32 to avoid precision loss in moment accumulators.",
        "2. Apply decoupled weight decay directly to FP32 master weights: $p \\leftarrow p (1 - \\eta \\lambda)$.",
        "3. Update first moment $m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t$ and second moment $v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2$.",
        "4. Compute bias-corrected update $\\Delta p = -\\frac{\\eta}{\\sqrt{v_t / (1-\\beta_2^t)} + \\epsilon} \\frac{m_t}{1-\\beta_1^t}$.",
        "5. Update master weights $p_{\\text{master}} \\mathrel{+}= \\Delta p$ and downcast to FP16 model parameters $p_{\\text{fp16}} \\leftarrow \\text{half}(p_{\\text{master}})$.",
      ],
    },
  ],
};

export const page2 = page_02_systems;
