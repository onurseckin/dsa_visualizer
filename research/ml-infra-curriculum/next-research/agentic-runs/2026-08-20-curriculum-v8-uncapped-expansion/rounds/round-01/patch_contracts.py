import re

def process_file(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Topic 29
    content = content.replace("apply_rope(x: list[float], pos: int, base: float = 10000.0)", "apply_rope_2d(x: list[float], pos: int, base: float = 10000.0)")

    # Topic 30
    old_t30 = """def flash_attention_forward(
    Q: list[list[float]], 
    K: list[list[float]], 
    V: list[list[float]], 
    block_size: int = 2
) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    scale = 1.0 / math.sqrt(d)
    
    O = [[0.0] * d for _ in range(N)]
    m = [-float('inf')] * N
    l = [0.0] * N
    
    num_blocks = (N + block_size - 1) // block_size
    
    for b in range(num_blocks):
        k_start = b * block_size
        k_end = min(N, (b + 1) * block_size)
        K_block = K[k_start:k_end]
        V_block = V[k_start:k_end]
        
        for i in range(N):
            # Compute S_block = Q[i] * K_block^T * scale
            s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]
            
            m_block = max(s_block)
            m_new = max(m[i], m_block)
            
            p_block = [math.exp(val - m_new) for val in s_block]
            l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)
            
            # Update output: O_new = (exp(m_old - m_new) * l_old * O_old + P_block * V_block) / l_new
            alpha = math.exp(m[i] - m_new) * l[i]
            for col in range(d):
                v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))
                O[i][col] = (alpha * O[i][col] + v_sum) / l_new
                
            m[i] = m_new
            l[i] = l_new
            
    return O"""
    new_t30 = """def flash_attention_forward_tiled(
    Q: list[list[float]], 
    K: list[list[float]], 
    V: list[list[float]], 
    Br: int = 2,
    Bc: int = 2
) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    scale = 1.0 / math.sqrt(d)
    
    O = [[0.0] * d for _ in range(N)]
    m = [-float('inf')] * N
    l = [0.0] * N
    
    num_kv_blocks = (N + Bc - 1) // Bc
    num_q_blocks = (N + Br - 1) // Br
    
    for b_kv in range(num_kv_blocks):
        k_start = b_kv * Bc
        k_end = min(N, (b_kv + 1) * Bc)
        K_block = K[k_start:k_end]
        V_block = V[k_start:k_end]
        
        for b_q in range(num_q_blocks):
            q_start = b_q * Br
            q_end = min(N, (b_q + 1) * Br)
            
            for i in range(q_start, q_end):
                s_block = [sum(Q[i][k] * K_block[j][k] for k in range(d)) * scale for j in range(len(K_block))]
                
                m_block = max(s_block)
                m_new = max(m[i], m_block)
                
                p_block = [math.exp(val - m_new) for val in s_block]
                l_new = math.exp(m[i] - m_new) * l[i] + sum(p_block)
                
                alpha = math.exp(m[i] - m_new) * l[i]
                for col in range(d):
                    v_sum = sum(p_block[j] * V_block[j][col] for j in range(len(V_block)))
                    O[i][col] = (alpha * O[i][col] + v_sum) / l_new
                    
                m[i] = m_new
                l[i] = l_new
                
    return O"""
    content = content.replace(old_t30, new_t30)

    # Topic 31
    content = content.replace("class OrcaScheduler:", "class OrcaContinuousBatchingScheduler:")

    # Topic 32
    content = content.replace("class PagedAttentionManager:", "class PagedAttentionBlockManager:")

    # Topic 33
    content = content.replace("def speculative_verify_step(", "def speculative_rejection_sampler(")

    # Topic 34
    old_t34 = """def kahan_sum(values: list[float]) -> float:"""
    new_t34 = """def kahan_compensated_sum(floats: list[float]) -> float:
    values = floats"""
    content = content.replace(old_t34, new_t34)

    # Topic 35
    content = content.replace("def affine_quantize(x: list[float], bits: int = 8) -> tuple[float, int, list[int]]:", "def quantize_affine_int8(x: list[float]) -> tuple[float, int, list[int]]:\n    bits = 8")

    # Topic 36
    old_t36 = """def tiled_gemm(
    A: list[list[float]], 
    B: list[list[float]], 
    tile_size: int = 1
) -> tuple[list[list[float]], list[tuple[int, int, int]]]:
    M = len(A)
    K = len(A[0])
    N = len(B[0])
    
    C = [[0.0] * N for _ in range(M)]
    trace = []
    
    for ti in range(0, M, tile_size):
        for tj in range(0, N, tile_size):
            for tk in range(0, K, tile_size):
                trace.append((ti, tj, tk))
                # Compute tile block accumulation
                i_end = min(M, ti + tile_size)
                j_end = min(N, tj + tile_size)
                k_end = min(K, tk + tile_size)
                
                for i in range(ti, i_end):
                    for k in range(tk, k_end):
                        a_ik = A[i][k]
                        for j in range(tj, j_end):
                            C[i][j] += a_ik * B[k][j]
                            
    return C, trace"""
    new_t36 = """def tiled_gemm_2d(
    A: list[list[float]], 
    B: list[list[float]], 
    BM: int, BN: int, BK: int
) -> tuple[list[list[float]], list[tuple[int, int, int]]]:
    M = len(A)
    K = len(A[0])
    N = len(B[0])
    
    C = [[0.0] * N for _ in range(M)]
    trace = []
    
    for ti in range(0, M, BM):
        for tj in range(0, N, BN):
            for tk in range(0, K, BK):
                trace.append((ti, tj, tk))
                i_end = min(M, ti + BM)
                j_end = min(N, tj + BN)
                k_end = min(K, tk + BK)
                
                for i in range(ti, i_end):
                    for k in range(tk, k_end):
                        a_ik = A[i][k]
                        for j in range(tj, j_end):
                            C[i][j] += a_ik * B[k][j]
                            
    return C, trace"""
    content = content.replace(old_t36, new_t36)

    # Topic 37
    content = content.replace("def alpha_beta_cost(size_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:", "def alpha_beta_transfer_time(msg_bytes: int, alpha: float, beta: float, hops: int = 1) -> float:\n    size_bytes = msg_bytes")

    # Topic 38
    content = content.replace("def ring_allreduce_trace(P: int, initial_state: list[list[float]]) -> list[list[list[float]]]:", "def ring_allreduce_simulation(node_buffers: list[list[float]]) -> list[list[list[float]]]:\n    initial_state = node_buffers\n    P = len(node_buffers)")

    # Topic 39
    old_t39 = """def zero3_shard_and_gather(weights: list[float], world_size: int) -> list[list[float]]:
    N = len(weights)
    chunk_size = (N + world_size - 1) // world_size
    padded_len = chunk_size * world_size
    
    padded_weights = weights + [0.0] * (padded_len - N)
    
    # 1. Shard across ranks
    shards = []
    for r in range(world_size):
        start = r * chunk_size
        end = start + chunk_size
        shards.append(padded_weights[start:end])
        
    return shards"""
    new_t39 = """def zero3_parameter_shard_and_allgather(param_weights: list[float], world_size: int, rank: int) -> tuple[list[float], list[float]]:
    N = len(param_weights)
    chunk_size = (N + world_size - 1) // world_size
    padded_len = chunk_size * world_size
    
    padded_weights = param_weights + [0.0] * (padded_len - N)
    
    start = rank * chunk_size
    end = start + chunk_size
    shard = padded_weights[start:end]
    
    # Allgather simulate
    reconstructed = []
    for r in range(world_size):
        r_start = r * chunk_size
        r_end = r_start + chunk_size
        reconstructed.extend(padded_weights[r_start:r_end])
        
    return shard, reconstructed[:N]"""
    content = content.replace(old_t39, new_t39)

    # Topic 40
    content = content.replace("def plan_memory_liveness(liveness: dict[str, tuple[int, int, int]]) -> int:", "def greedy_buffer_liveness_allocator(intervals: dict[str, tuple[int, int, int]]) -> int:\n    liveness = intervals")

    # Topic 41
    old_t41 = """def moe_token_dispatch(
    gate_logits: list[list[float]], 
    num_experts: int, 
    capacity: int
) -> list[int]:
    expert_counts = {e: 0 for e in range(num_experts)}
    assignments = []
    
    for token_logits in gate_logits:
        top_expert = max(range(num_experts), key=lambda e: token_logits[e])
        if expert_counts[top_expert] < capacity:
            expert_counts[top_expert] += 1
            assignments.append(top_expert)
        else:
            assignments.append(-1)  # Dropped due to capacity overflow
            
    return assignments"""
    new_t41 = """def moe_topk_routing_with_capacity(
    gate_logits: list[list[float]], 
    top_k: int, 
    capacity_limit: int
) -> list[list[int]]:
    num_experts = len(gate_logits[0]) if gate_logits else 0
    expert_counts = {e: 0 for e in range(num_experts)}
    assignments = []
    
    for token_logits in gate_logits:
        indexed_logits = list(enumerate(token_logits))
        indexed_logits.sort(key=lambda x: x[1], reverse=True)
        top_experts = [idx for idx, _ in indexed_logits[:top_k]]
        
        token_assignments = []
        for expert in top_experts:
            if expert_counts[expert] < capacity_limit:
                expert_counts[expert] += 1
                token_assignments.append(expert)
            else:
                token_assignments.append(-1)
        assignments.append(token_assignments)
            
    return assignments"""
    content = content.replace(old_t41, new_t41)

    with open(file_path, "w") as f:
        f.write(content)

import glob
files = glob.glob("/Users/onurseckinsenoglu/repos/dsa_visualizer/research/ml-infra-curriculum/next-research/agentic-runs/2026-08-20-curriculum-v8-uncapped-expansion/rounds/round-01/*.md")
for f in files:
    process_file(f)
