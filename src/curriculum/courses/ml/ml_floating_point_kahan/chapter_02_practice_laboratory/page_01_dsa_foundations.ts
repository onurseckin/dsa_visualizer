import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_floating_point_kahan_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Kahan & Neumaier Compensated Accumulator Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_floating_point_kahan",
      title: "Implement High-Precision Compensated Gradient Accumulator",
      difficulty: "Hard",
      rationale:
        "Implement Kahan and Neumaier compensated summation algorithms along with IEEE 754 floating-point format bit unpacking (sign, exponent, mantissa) to verify exact error bounds during low-precision accumulation.",
      starterCode: `import numpy as np
from typing import Dict, List, Any, Tuple

class Solution:
    """
    Compensated Floating-Point Accumulation and IEEE 754 Inspection Engine.
    Implements standard naive summation, pairwise tree summation,
    and Neumaier compensated summation with exact residual tracking.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "values": List of float numbers to sum
                - "dtype": str, one of "fp32" or "fp16"
        Returns:
            Dictionary containing:
                - "naive_sum": float
                - "pairwise_sum": float
                - "kahan_neumaier_sum": float
                - "true_high_precision_sum": float (computed in float64)
                - "naive_absolute_error": float
                - "kahan_absolute_error": float
        """
        values = [float(v) for v in inputs["values"]]
        dtype_str = inputs.get("dtype", "fp32")
        target_dtype = np.float16 if dtype_str == "fp16" else np.float32

        # 1. High precision reference sum (FP64)
        true_sum = float(np.sum(np.array(values, dtype=np.float64)))

        # 2. Naive sequential accumulation in target dtype
        naive_acc = target_dtype(0.0)
        for x in values:
            naive_acc = target_dtype(naive_acc + target_dtype(x))
        naive_sum = float(naive_acc)

        # 3. Pairwise recursive tree summation
        def pairwise_sum_rec(arr: List[float]) -> float:
            if not arr:
                return float(target_dtype(0.0))
            if len(arr) == 1:
                return float(target_dtype(arr[0]))
            if len(arr) == 2:
                return float(target_dtype(target_dtype(arr[0]) + target_dtype(arr[1])))
            mid = len(arr) // 2
            left = pairwise_sum_rec(arr[:mid])
            right = pairwise_sum_rec(arr[mid:])
            return float(target_dtype(target_dtype(left) + target_dtype(right)))

        pairwise_result = pairwise_sum_rec(values)

        # 4. Neumaier compensated summation in target dtype
        sum_val = target_dtype(0.0)
        c = target_dtype(0.0)
        for x in values:
            x_t = target_dtype(x)
            t = target_dtype(sum_val + x_t)
            if abs(float(sum_val)) >= abs(float(x_t)):
                c = target_dtype(c + target_dtype(target_dtype(sum_val - t) + x_t))
            else:
                c = target_dtype(c + target_dtype(target_dtype(x_t - t) + sum_val))
            sum_val = t
        kahan_result = float(target_dtype(sum_val + c))

        return {
            "naive_sum": naive_sum,
            "pairwise_sum": pairwise_result,
            "kahan_neumaier_sum": kahan_result,
            "true_high_precision_sum": true_sum,
            "naive_absolute_error": abs(naive_sum - true_sum),
            "kahan_absolute_error": abs(kahan_result - true_sum),
        }`,
    },
  ],
};

export const page = page1;
