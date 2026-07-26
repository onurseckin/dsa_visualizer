export const Z_ALGORITHM_CODE = `def z_algorithm(text: str, pattern: str) -> list[int]:
    s = pattern + "$" + text
    n, m = len(s), len(pattern)
    z = [0] * n
    l, r = 0, 0
    matches = []

    for i in range(1, n):
        if i <= r:
            z[i] = min(r - i + 1, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] - 1 > r:
            l = i
            r = i + z[i] - 1
        if i > m and z[i] == m:
            matches.append(i - m - 1)
    return matches`;
