import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface SieveInput {
  limit: number;
}

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

export const DEFAULT_SIEVE_INPUT: SieveInput = {
  limit: 30,
};

export const generateSieveSteps = (input: SieveInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const limit = Math.max(0, Math.floor(input.limit));

  const isPrime: boolean[] = new Array(limit + 1).fill(true);
  if (limit >= 0) isPrime[0] = false;
  if (limit >= 1) isPrime[1] = false;

  const elements: ArrayElement[] = Array.from({ length: limit + 1 }, (_, k) => ({
    id: `el-${k}`,
    value: k,
    state: k < 2 ? 'visited' : 'default',
  }));

  const getAuxiliaryState = (currentPrimes: number[]) => {
    const isPrimeMap: Record<string, string> = {};
    for (let k = 0; k <= limit; k++) {
      isPrimeMap[`isPrime[${k}]`] = isPrime[k] ? 'true' : 'false';
    }
    return {
      hashMap: isPrimeMap,
      visited: currentPrimes.map((p) => `Prime ${p}`),
      customState: {
        limit,
        booleanSnapshot: isPrime.map((val) => (val ? 'T' : 'F')).join(''),
        primesFoundCount: currentPrimes.length,
        primesList: currentPrimes.length > 0 ? currentPrimes.join(', ') : 'None',
      },
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentPrimes: number[] = []
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: getAuxiliaryState(currentPrimes),
      variables,
    });
  };

  addStep(
    1,
    'Initialize Sieve of Eratosthenes',
    `Find all prime numbers up to limit n = ${limit}.`,
    { limit },
    []
  );

  addStep(
    2,
    `Check base case limit < 2`,
    limit < 2 ? `limit = ${limit} is less than 2.` : `limit = ${limit} >= 2, proceed with algorithm.`,
    { limit },
    []
  );

  if (limit < 2) {
    addStep(
      3,
      'Sieve complete (limit < 2)',
      `No prime numbers exist for limit ${limit}. Return empty list.`,
      { limit, primeCount: 0 },
      []
    );
    return steps;
  }

  addStep(
    5,
    'Initialize boolean array is_prime',
    `Create boolean array of size ${limit + 1} with all elements set to True.`,
    { limit },
    []
  );

  addStep(
    6,
    'Mark 0 and 1 as non-prime',
    '0 and 1 are defined as neither prime nor composite, so set is_prime[0] = False and is_prime[1] = False.',
    { limit, 'is_prime[0]': false, 'is_prime[1]': false },
    []
  );

  addStep(
    8,
    'Initialize pointer p = 2',
    'Start testing prime candidates at p = 2 (smallest prime).',
    { p: 2, limit },
    []
  );

  for (let p = 2; p * p <= limit; p++) {
    elements[p].pointers = ['p'];

    addStep(
      9,
      `Check loop condition (p * p <= limit: ${p * p} <= ${limit})`,
      `p = ${p} is within square root limit boundary. Continue sieve loop.`,
      { p, 'p*p': p * p, limit }
    );

    addStep(
      10,
      `Check if p = ${p} is prime`,
      isPrime[p]
        ? `is_prime[${p}] is True. ${p} is prime; eliminate all of its multiples starting at ${p * p}.`
        : `is_prime[${p}] is False. ${p} is composite; skip to next candidate.`,
      { p, 'is_prime[p]': isPrime[p] }
    );

    if (isPrime[p]) {
      elements[p].state = 'active';

      for (let i = p * p; i <= limit; i += p) {
        const wasPrime = isPrime[i];
        isPrime[i] = false;

        elements[i].state = 'visited';
        elements[i].pointers = [`multiple of ${p}`];

        addStep(
          12,
          `Mark multiple i = ${i} as composite`,
          wasPrime
            ? `${i} is a composite multiple of prime ${p} (${p} x ${i / p}). Set is_prime[${i}] = False.`
            : `${i} was already marked composite by a smaller prime factor.`,
          { p, i, 'is_prime[i]': false }
        );

        elements[i].pointers = undefined;
      }

      elements[p].state = 'sorted';
      elements[p].pointers = undefined;
    }

    addStep(
      13,
      `Increment p (p = ${p + 1})`,
      `Move to next candidate number ${p + 1}.`,
      { p: p + 1 }
    );
  }

  addStep(
    9,
    `Check loop condition (p * p > limit)`,
    `Outer loop terminates because p * p exceeds ${limit}. All remaining True entries are prime.`,
    { limit }
  );

  addStep(
    15,
    'Collect prime numbers',
    'Iterate through is_prime array from index 2 to limit and collect indices with True.',
    { limit }
  );

  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) {
      primes.push(i);
      elements[i].state = 'sorted';
    }
  }

  addStep(
    20,
    'Return prime numbers list',
    `Identified ${primes.length} prime numbers up to ${limit}: ${primes.join(', ')}.`,
    { limit, primeCount: primes.length, primes: primes.join(', ') },
    primes
  );

  return steps;
};

export const sievePrimes: AlgorithmDefinition<SieveInput> = {
  id: 'sieve-primes',
  title: 'Sieve of Eratosthenes',
  category: 'math_and_number_theory',
  difficulty: 'Easy',
  description:
    'Sieve of Eratosthenes is an ancient algorithm for finding all prime numbers up to a given limit by iteratively marking multiples of each prime as composite.',
  code: PYTHON_SIEVE_CODE,
  timeComplexity: {
    best: 'O(n log log n)',
    average: 'O(n log log n)',
    worst: 'O(n log log n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_SIEVE_INPUT,
  generateSteps: generateSieveSteps,
};
