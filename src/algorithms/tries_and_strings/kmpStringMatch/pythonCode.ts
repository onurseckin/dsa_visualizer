export const KMP_CODE = `def kmp_search(text: str, pattern: str) -> list[int]:
    n, m = len(text), len(pattern)
    if m == 0 or n == 0 or m > n:
        return []
    lps = [0] * m
    length = 0
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    p_idx, t_idx = 0, 0
    matches = []
    while t_idx < n:
        if pattern[p_idx] == text[t_idx]:
            p_idx += 1
            t_idx += 1
        if p_idx == m:
            matches.append(t_idx - p_idx)
            p_idx = lps[p_idx - 1]
        elif t_idx < n and pattern[p_idx] != text[t_idx]:
            if p_idx != 0:
                p_idx = lps[p_idx - 1]
            else:
                t_idx += 1
    return matches`;
