import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_floating_point_kahan_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Floating-Point Summation: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Sequential Summation (Precision Loss Demonstration)",
          code: `import numpy as np

def naive_fp16_accumulation(values: list[float]) -> float:
    # Emulate pure FP16 accumulation
    acc = np.float16(0.0)
    for x in values:
        acc = np.float16(acc + np.float16(x))
    return float(acc)

# Catastrophic swallowing demo:
# Summing 1.0 followed by 10,000 instances of 0.0001 (theoretical sum = 2.0)
vals = [1.0] + [0.0001] * 10000
result = naive_fp16_accumulation(vals)
# result == 1.0! (All 10,000 additions were swallowed to zero)`,
          explanation:
            "Demonstrates catastrophic swallowing: in FP16, $1.0 + 0.0001 = 1.0$ because $0.0001 < 1.0 \\times 2^{-11} \\approx 0.000488$.",
          timeComplexity: "O(n)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 2: Pairwise Tree Summation (Divide-and-Conquer)",
          code: `import numpy as np

def pairwise_tree_sum(arr: np.ndarray) -> np.float16:
    """
    Recursively sums pairs of numbers to balance significand exponents,
    reducing accumulation error growth from O(n) to O(log n).
    """
    n = len(arr)
    if n == 0:
        return np.float16(0.0)
    if n == 1:
        return np.float16(arr[0])
    if n == 2:
        return np.float16(np.float16(arr[0]) + np.float16(arr[1]))
    
    mid = n // 2
    left_sum = pairwise_tree_sum(arr[:mid])
    right_sum = pairwise_tree_sum(arr[mid:])
    return np.float16(left_sum + right_sum)`,
          explanation:
            "Pairwise summation keeps operand magnitudes closely matched throughout the recursion tree, bounding roundoff error growth to $O(\\epsilon \\log n)$.",
          timeComplexity: "O(n)",
          spaceComplexity: "O(log n) call stack",
        },
        {
          label: "Stage 3: Kahan-Neumaier Compensated Accumulator Engine",
          code: `import struct
import numpy as np

class KahanNeumaierAccumulator:
    """
    Neumaier's modification of Kahan summation.
    Handles the case where the incoming term |x| is larger than the running sum |s|,
    providing exact compensation across arbitrary mixed-scale sequences.
    """
    def __init__(self):
        self.sum = 0.0
        self.c = 0.0  # Compensated low-order error
        
    def add(self, x: float):
        t = self.sum + x
        if abs(self.sum) >= abs(x):
            # Normal Kahan case: sum is larger
            self.c += (self.sum - t) + x
        else:
            # Neumaier case: incoming term x is larger
            self.c += (x - t) + self.sum
        self.sum = t
        
    def total(self) -> float:
        return self.sum + self.c

def unpack_ieee754_fp32(val: float) -> dict:
    """Bitwise inspection of IEEE 754 Single Precision float."""
    packed = struct.pack('>f', val)
    bits = struct.unpack('>I', packed)[0]
    sign = (bits >> 31) & 1
    exponent = (bits >> 23) & 0xFF
    mantissa = bits & 0x7FFFFF
    return {
        "sign": sign,
        "raw_exponent": exponent,
        "unbiased_exponent": exponent - 127 if exponent != 0 else -126,
        "mantissa_bits": f"{mantissa:023b}",
        "is_subnormal": exponent == 0 and mantissa != 0,
    }`,
          explanation:
            "Neumaier's algorithm properly handles inputs of mixed and fluctuating magnitudes, while struct-level unpacking exposes exact IEEE 754 bit-field layout.",
          timeComplexity: "O(n)",
          spaceComplexity: "O(1)",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: Subnormals & Flush-To-Zero (FTZ) Hardware Modes",
      content:
        "When floating-point values fall below the minimum normal number ($2^{-126} \\approx 1.175 \\times 10^{-38}$ in FP32, $2^{-14} \\approx 6.10 \\times 10^{-5}$ in FP16), they enter the **subnormal** (denormal) range, where the implicit leading 1-bit becomes 0. Processing subnormals on modern GPUs requires microcode emulation traps that stall execution pipelines by up to 100x clock cycles. To maintain peak Tensor Core throughput, NVIDIA architectures operate by default in **Flush-To-Zero (FTZ)** and **Denormals-Are-Zero (DAZ)** modes, snapping subnormals instantly to $\\pm 0.0$. In FP16, any gradient magnitude below $6.10 \\times 10^{-5}$ is abruptly flushed to zero, necessitating loss scaling (e.g. static scale factor $2^{15} = 32768$) to shift small gradients into the safe normalized dynamic range.",
    },
  ],
};
