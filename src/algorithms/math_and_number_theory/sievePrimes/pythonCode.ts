export const PYTHON_SIEVE_CODE = `def sieve_of_eratosthenes(limit: int) -> list[int]:
    if limit < 2:
        return []
    
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    
    p = 2
    while p * p <= limit:
        if is_prime[p]:
            for i in range(p * p, limit + 1, p):
                is_prime[i] = False
        p += 1
        
    primes = []
    for i in range(2, limit + 1):
        if is_prime[i]:
            primes.append(i)
            
    return primes`;
