export const NIM_GAME_CODE = `def nim_game(piles: list[int]) -> dict[str, str | int]:
    xor_sum = 0
    n = len(piles)
    for i in range(n):
        xor_sum ^= piles[i]

    if xor_sum == 0:
        return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}

    for i in range(n):
        target_size = piles[i] ^ xor_sum
        if target_size < piles[i]:
            return {
                "winner": "First Player",
                "winning_pile": i,
                "target_size": target_size,
                "remove": piles[i] - target_size,
            }

    return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}`;

