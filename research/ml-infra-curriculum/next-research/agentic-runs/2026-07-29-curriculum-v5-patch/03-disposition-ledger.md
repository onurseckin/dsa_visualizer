# Disposition Ledger: Curriculum V5 Patch Run

| Finding ID | Response / Action Taken | New Evidence / Diff Reference | Status |
|---|---|---|---|
| **F-01** | Accepted. Authored explicit 5th Stress/Tradeoff rungs for Topics 09, 11, 12, and 13. | `domain-02-autograd-and-training-math-v5.md` | Closed |
| **F-02** | Accepted. Authored Topic 07 curriculum, ladders, and `CONTRACT-TOPIC-07-LIVENESS`. | `domain-02-autograd-and-training-math-v5.md` | Closed |
| **F-03** | Accepted. Replaced Pow(x,n) with Topic 04/10 prerequisites followed by direct stable LogSumExp. | `domain-02-autograd-and-training-math-v5.md` | Closed |
| **F-04** | Accepted. Replaced Circular Array Loop with LC 622 (Circular Queue) and Subset Sum with LC 725 (Split List). | `domain-06-07-distributed-and-serving-v5.md` | Closed |
| **F-05** | Accepted. Made Cookies optional and added capacity-constrained MoE routing mechanism contract. | `domain-06-07-distributed-and-serving-v5.md` | Closed |
| **F-06** | Accepted. Fixed Kahan worked example to match Python float execution (`1.0000000000000002`). | `test_contracts.py` test_kahan() | Closed |
| **F-07** | Accepted. Fixed quantization zero-point worked example to match `round()` logic ($Z = 128$). | `test_contracts.py` test_quantization() | Closed |
| **F-08** | Accepted. Corrected FlashAttention normalization recurrence formula to match Dao et al. 2022. | `test_contracts.py` test_flash_attention_tiling() | Closed |
| **F-09** | Accepted. Fixed Orca token admission math and decode step token expansion across active sequences. | `domain-06-07-distributed-and-serving-v5.md` | Closed |
| **F-10** | Accepted. Renamed ZeRO-3 contract to **Simplified Contiguous Parameter Sharding** (`CONTRACT-TOPIC-28-ZERO3-CONTIGUOUS`). | `domain-06-07-distributed-and-serving-v5.md` | Closed |
| **F-11** | Accepted. Aligned 1F1B bubble ratio formula to total schedule fraction $F = \frac{P-1}{M+P-1}$ ($3/11 \approx 0.2727$). | `test_contracts.py` test_1f1b_bubble() | Closed |
| **F-12** | Accepted. Published 31-module registry table & canonical problem bank table with direct URLs. | `ORCHESTRATED-MASTER-CURRICULUM-V5.md` | Closed |
| **F-13** | Accepted. Assigned explicit Contract IDs (`CONTRACT-TOPIC-XX-YY`) to ALL custom contracts. | `ORCHESTRATED-MASTER-CURRICULUM-V5.md` | Closed |
