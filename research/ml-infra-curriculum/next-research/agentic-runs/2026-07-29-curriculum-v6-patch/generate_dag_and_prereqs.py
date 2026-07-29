import json

# Edge Registry: (from_topic, to_topic, reason)
EDGES = [
    ("T01", "T02", "Layout to strides/views"),
    ("T01", "T03", "Matrix shape to GEMM"),
    ("T02", "T03", "Strides to tiled GEMM"),
    ("T04", "T05", "FP precision to fixed-point quantization"),
    ("T03", "T05", "GEMM to quantized GEMM"),
    
    ("T06", "T07", "Topological sort to DAG DP & liveness"),
    ("T06", "T08", "DAG to AST expression trees"),
    ("T01", "T09", "Tensor shape to autograd VJP"),
    ("T02", "T09", "Strides to autograd backward"),
    ("T06", "T09", "Computation DAG to autograd backward"),
    ("T08", "T09", "AST IR to autograd engine"),
    ("T04", "T10", "FP precision to loss function math"),
    ("T04", "T11", "FP precision to stable LogSumExp/Softmax"),
    ("T04", "T12", "FP precision to prefix sums"),
    ("T10", "T12", "Loss probabilities to categorical sampling"),
    ("T11", "T12", "Softmax probabilities to nucleus sampling"),
    ("T09", "T13", "Autograd VJPs to optimizer updates"),
    ("T10", "T13", "Loss function to training state"),
    ("T11", "T13", "Softmax normalizer to training loop"),
    
    ("T14", "T15", "Vector metrics to spatial trees"),
    ("T14", "T16", "Vector metrics to HNSW graph search"),
    ("T14", "T17a", "Vector metrics to IVF/PQ/ADC"),
    ("T14", "T17b", "Vector metrics to LSH hash tables"),
    
    ("T18", "T19", "Trie lookup to subword BPE tokenization"),
    ("T01", "T20", "Matrix indexing to Im2Col spatial window"),
    ("T03", "T20", "GEMM to convolution matrix multiply"),
    ("T04", "T20", "FP precision to convolution accumulation"),
    
    ("T03", "T21", "MatMul to decision trees"),
    ("T04", "T21", "FP precision to XGBoost gain math"),
    ("T10", "T21", "Loss function to gradient boosting objectives"),
    ("T03", "T22", "GEMM to Scaled Dot-Product Attention"),
    ("T04", "T22", "FP precision to attention scaling"),
    ("T11", "T22", "Softmax to attention normalizer"),
    ("T03", "T23", "GEMM to FlashAttention SRAM tiling"),
    ("T11", "T23", "Online softmax to FlashAttention tile loop"),
    ("T22", "T23", "SDPA to FlashAttention memory optimization"),
    
    ("T22", "T24", "Attention KV cache to serving batch scheduler"),
    ("T22", "T25", "Attention KV cache to PagedAttention block table"),
    
    ("T26", "T27", "Interconnect topology to ring collective trace"),
    ("T13", "T28", "Optimizer state to ZeRO sharding"),
    ("T27", "T28", "Ring collectives to ZeRO state AllGather/ReduceScatter"),
    ("T02", "T29a", "Strides/layout to graph compiler memory planning"),
    ("T06", "T29a", "DAG to compiler pass IR ordering"),
    ("T07", "T29a", "Tensor liveness to compiler memory arena allocation"),
    ("T08", "T29a", "AST IR to operator fusion passes"),
    ("T03", "T29b", "GEMM to 3D tensor parallelism"),
    ("T22", "T29b", "Attention to Megatron 3D parallel model chunking"),
    ("T26", "T29b", "Interconnect topology to 3D parallel communication"),
    ("T27", "T29b", "Ring collectives to 3D parallel AllReduce"),
    ("T28", "T29b", "ZeRO sharding to 3D parallel hybrid execution"),
    ("T29a", "T29b", "Compiler passes to 3D parallel pipeline stage execution")
]

TOPICS_MAP = {
    "T01": "Topic 01 (Matrix Layout)",
    "T02": "Topic 02 (Strides & Views)",
    "T03": "Topic 03 (Dense MatMul & Tiling)",
    "T04": "Topic 04 (FP Precision & Reductions)",
    "T05": "Topic 05 (Quantization)",
    "T06": "Topic 06 (Topological Ordering)",
    "T07": "Topic 07 (DAG DP & Liveness)",
    "T08": "Topic 08 (AST & Operator IR)",
    "T09": "Topic 09 (Autograd Engine)",
    "T10": "Topic 10 (Loss Functions & Probability)",
    "T11": "Topic 11 (LogSumExp & Softmax)",
    "T12": "Topic 12 (Prefix Sums & Sampling)",
    "T13": "Topic 13 (Optimizers & State)",
    "T14": "Topic 14 (Exact Vector Search)",
    "T15": "Topic 15 (Spatial Trees)",
    "T16": "Topic 16 (HNSW Graph ANN)",
    "T17a": "Topic 17a (IVF-PQ-ADC)",
    "T17b": "Topic 17b (LSH)",
    "T18": "Topic 18 (String Matching & Tries)",
    "T19": "Topic 19 (Subword & Byte BPE)",
    "T20": "Topic 20 (Convolutions & Im2Col)",
    "T21": "Topic 21 (Decision Trees & XGBoost)",
    "T22": "Topic 22 (SDPA & KV Cache)",
    "T23": "Topic 23 (FlashAttention)",
    "T24": "Topic 24 (Continuous Batching)",
    "T25": "Topic 25 (PagedAttention)",
    "T26": "Topic 26 (Interconnect Topology)",
    "T27": "Topic 27 (Ring Collectives)",
    "T28": "Topic 28 (Distributed State & ZeRO)",
    "T29a": "Topic 29a (Compiler Passes & Fusion)",
    "T29b": "Topic 29b (3D Parallelism & MoE)"
}

def generate_prereqs_text():
    prereqs = {t: [] for t in TOPICS_MAP}
    for src, dst, _ in EDGES:
        prereqs[dst].append(TOPICS_MAP[src])
    
    text_map = {}
    for t, plist in prereqs.items():
        if not plist:
            text_map[t] = "None (Foundational Module)."
        else:
            text_map[t] = ", ".join(plist) + "."
    return text_map

if __name__ == "__main__":
    t_map = generate_prereqs_text()
    print("Edge Registry Verified. Total edges:", len(EDGES))
    for t in sorted(t_map):
        print(f"{t}: {t_map[t]}")
