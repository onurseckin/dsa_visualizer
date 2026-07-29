import math
import collections

def test_kahan():
    # Kahan test
    vals = [1.0, 1e-16, 1e-16]
    sum_val = 0.0
    c = 0.0
    for v in vals:
        if math.isnan(v) or math.isinf(v):
            c = 0.0
            sum_val += v
            continue
        y = v - c
        t = sum_val + y
        c = (t - sum_val) - y
        sum_val = t
    assert sum_val == 1.0000000000000002, f"Kahan output mismatch: {sum_val}"
    print("Kahan test PASSED")

def test_quantization():
    # Scale & zero point
    vals = [-1.0, 0.0, 1.0]
    qmin, qmax = 0, 255
    min_val, max_val = min(vals), max(vals)
    scale = (max_val - min_val) / (qmax - qmin)
    zero_point = round(qmin - min_val / scale)
    quantized = [max(qmin, min(qmax, round(v / scale + zero_point))) for v in vals]
    assert zero_point == 128, f"Zero point mismatch: {zero_point}"
    assert quantized == [0, 128, 255], f"Quantized output mismatch: {quantized}"
    print("Quantization test PASSED")

def test_online_softmax():
    blocks = [[1.0, 2.0], [3.0, 4.0]]
    m = -float('inf')
    l = 0.0
    unnormalized_rescaled_blocks = []
    
    for block in blocks:
        block_max = max(block)
        m_new = max(m, block_max)
        scale_prev = math.exp(m - m_new) if m != -float('inf') else 0.0
        l = scale_prev * l
        
        rescaled_prev = []
        for prev_b in unnormalized_rescaled_blocks:
            rescaled_prev.append([val * scale_prev for val in prev_b])
        unnormalized_rescaled_blocks = rescaled_prev
        
        curr_unnormalized = [math.exp(x - m_new) for x in block]
        l += sum(curr_unnormalized)
        unnormalized_rescaled_blocks.append(curr_unnormalized)
        m = m_new
        
    flat_out = []
    for b in unnormalized_rescaled_blocks:
        flat_out.extend([val / l for val in b])
        
    # Exact full softmax
    all_vals = [1.0, 2.0, 3.0, 4.0]
    max_all = max(all_vals)
    exps = [math.exp(x - max_all) for x in all_vals]
    sum_exps = sum(exps)
    exact_softmax = [e / sum_exps for e in exps]
    
    for a, b in zip(flat_out, exact_softmax):
        assert abs(a - b) < 1e-6, f"Online Softmax mismatch: {a} vs {b}"
    print("Online Softmax test PASSED")

def test_flash_attention_tiling():
    # Test FlashAttention tiling vs exact attention for 2 blocks of size 2
    # Q: [4, D], K: [4, D], V: [4, D]
    Q = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.0, 0.0]]
    K = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.0, 0.0]]
    V = [[0.5, 1.5], [1.0, 2.0], [1.5, 2.5], [2.0, 3.0]]
    d_k = 2.0
    scale = 1.0 / math.sqrt(d_k)
    
    # Exact full attention
    O_exact = []
    for i in range(4):
        scores = []
        for j in range(4):
            dot = sum(Q[i][k] * K[j][k] for k in range(2))
            scores.append(dot * scale)
        max_s = max(scores)
        exps = [math.exp(s - max_s) for s in scores]
        sum_e = sum(exps)
        probs = [e / sum_e for e in exps]
        out_row = [sum(probs[j] * V[j][k] for j in range(4)) for k in range(2)]
        O_exact.append(out_row)

    # Tiled FlashAttention (Block size B_r = 2, B_c = 2)
    O_tiled = [[0.0, 0.0] for _ in range(4)]
    l_vec = [0.0] * 4
    m_vec = [-float('inf')] * 4
    
    # Loop over K, V blocks (2 blocks of size 2)
    for j_block in range(2):
        K_b = K[j_block*2 : (j_block+1)*2]
        V_b = V[j_block*2 : (j_block+1)*2]
        for i in range(4):
            scores_b = []
            for j in range(2):
                dot = sum(Q[i][k] * K_b[j][k] for k in range(2))
                scores_b.append(dot * scale)
            m_block = max(scores_b)
            m_new = max(m_vec[i], m_block)
            
            p_b = [math.exp(s - m_block) for s in scores_b]
            l_block = sum(p_b)
            
            scale_prev = math.exp(m_vec[i] - m_new) if m_vec[i] != -float('inf') else 0.0
            scale_curr = math.exp(m_block - m_new)
            
            l_new = scale_prev * l_vec[i] + scale_curr * l_block
            
            out_block = [sum(p_b[j] * V_b[j][k] for j in range(2)) for k in range(2)]
            
            O_new = []
            for k in range(2):
                prev_contrib = scale_prev * l_vec[i] * O_tiled[i][k]
                curr_contrib = scale_curr * out_block[k]
                O_new.append((prev_contrib + curr_contrib) / l_new)
                
            O_tiled[i] = O_new
            l_vec[i] = l_new
            m_vec[i] = m_new

    for i in range(4):
        for k in range(2):
            assert abs(O_tiled[i][k] - O_exact[i][k]) < 1e-6, f"FlashAttention Tiling mismatch at row {i}, col {k}: {O_tiled[i][k]} vs {O_exact[i][k]}"
    print("FlashAttention Tiling test PASSED")

def test_1f1b_bubble():
    P = 4
    M = 8
    t_f = 1.0
    t_b = 2.0
    ideal_time = M * (t_f + t_b)
    bubble_time = (P - 1) * (t_f + t_b)
    total_time = ideal_time + bubble_time
    bubble_fraction = (P - 1) / (M + P - 1)
    
    assert ideal_time == 24.0, f"Ideal time mismatch: {ideal_time}"
    assert bubble_time == 9.0, f"Bubble time mismatch: {bubble_time}"
    assert abs(bubble_fraction - 9.0/33.0) < 1e-6, f"Bubble fraction mismatch: {bubble_fraction}"
    print("1F1B Bubble test PASSED")

if __name__ == "__main__":
    test_kahan()
    test_quantization()
    test_online_softmax()
    test_flash_attention_tiling()
    test_1f1b_bubble()
    print("ALL CONTRACT EXECUTABLE TESTS PASSED PERFECTLY!")
