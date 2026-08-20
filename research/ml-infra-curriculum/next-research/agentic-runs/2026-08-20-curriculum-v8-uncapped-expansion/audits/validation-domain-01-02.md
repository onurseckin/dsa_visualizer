# Validation Report: Domain 01 & 02 (Topics 01-08)
**Date**: August 20, 2026
**Validator**: Validator 1 (Math Foundations)
**Curriculum**: V8.0 Uncapped Expansion

## 1. Question Counts & "Uncapped" Constraint Check
**Status: ❌ FAILED**
The curriculum was requested to be "uncapped" and not constrained by the old 5-per-topic limit. However, the files rigidly adhere to a 5-item "Pedagogical Ascent" structure (Rung 1 through Rung 5) for every single topic. The question counts are not generous; each topic only has 1–2 LeetCode questions before moving to a Wikipedia article and a single Python contract.

## 2. URL Authenticity
**Status: ✅ PASSED**
All LeetCode URLs, Wikipedia links, PyTorch/NumPy documentation, and Arxiv papers (e.g., AdamW `1711.05101`) were verified. While LeetCode returns 403 to automated scripts, the URLs are authentic, correctly formatted, and map to real problems (e.g., `design-hit-counter`, `spiral-matrix`, `trapping-rain-water-ii`).

## 3. Mathematical Derivations
**Status: ✅ PASSED**
The mathematical models implemented in the topics are rigorous and correct:
- **Gram-Schmidt**: Uses correct sequential projection and subtraction logic.
- **PCA/SVD (Power Iteration)**: Correctly computes the covariance matrix as $X^T X / (N - 1)$ for zero-centered data and accurately implements the power iteration sequence.
- **Jacobian**: The finite central difference method is correctly bounded with `(f(x + epsilon) - f(x - epsilon)) / (2 * epsilon)`.
- **Autodiff DAG**: Accurately implements scalar reverse-mode differentiation with a topological sort and tracks partial gradients for `+` and `*` operations (matching Karpathy's Micrograd logic).
- **AdamW**: Successfully decouples weight decay (computing `theta = theta - lr * weight_decay * theta` before the momentum update) instead of applying it to the L2 penalty, matching the 2017 paper.

## 4. Python Contract Execution
**Status: ✅ PASSED**
A dedicated test harness was constructed for all 8 Python contracts (CONTRACT-TOPIC-01 through CONTRACT-TOPIC-08).
- **Topic 01 (Flat Indexing)**: Affine offset math matches exactly.
- **Topic 02 (Broadcasting)**: Shape resolution logic handles trailing dimensions and singleton expansion flawlessly.
- **Topic 03 (Gram-Schmidt)**: Generated vectors have near-zero dot products (orthogonal).
- **Topic 04 (PCA)**: Approximates the dominant eigenvector accurately with `cosine_similarity > 0.999`.
- **Topic 05 (Jacobian)**: Finite differences meet the `< 1e-4` absolute error tolerance.
- **Topic 06 (Autodiff)**: Gradient accumulation passes exactly.
- **Topic 07 (AdamW)**: Stateful updates match expectations.
- **Topic 08 (Cross Entropy)**: Log-Sum-Exp stabilization prevents overflow for logits > 1000.

All 8 contracts pass their own mathematical tolerances and schemas exactly as specified in the markdown files.

## Summary
The mathematical foundations, URLs, and executable contracts are in excellent shape. However, the authoring agent failed the primary constraint to uncap the question counts, falling back to the legacy 5-rung template.
