export const Z_ALGORITHM_CODE = `class Solution:
    def __init__(self):
        pass

    def findMatches(self, text: str, pattern: str) -> list[int]:
        if pattern == "":
            return list(range(len(text) + 1))
        separator = "\x00"
        s = pattern + separator + text
        n, pattern_length = len(s), len(pattern)
        z = [0] * n
        l, r = 0, 0
        for i in range(1, n):
            if i <= r:
                z[i] = min(r - i + 1, z[i - l])
            while i + z[i] < n and s[z[i]] == s[i + z[i]]:
                z[i] += 1
            if i + z[i] - 1 > r:
                l, r = i, i + z[i] - 1
        return [i - pattern_length - 1 for i in range(pattern_length + 1, n) if z[i] == pattern_length]`;
