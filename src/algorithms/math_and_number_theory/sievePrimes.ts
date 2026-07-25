import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface SieveInput {
  limit: number;
}

export const SIEVE_CODE = `function sieveOfEratosthenes(limit) {
  if (limit < 2) return [];
  const isPrime = new Array(limit + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let p = 2; p * p <= limit; p++) {
    if (isPrime[p]) {
      for (let i = p * p; i <= limit; i += p) {
        isPrime[i] = false;
      }
    }
  }
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) primes.push(i);
  }
  return primes;
}`;

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
        elements: elements.map((_, idx) => ({
          ...elements[idx],
          pointers: elements[idx].pointers ? [...elements[idx].pointers] : undefined,
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

  if (limit < 2) {
    addStep(
      2,
      'Sieve complete (limit < 2)',
      `No prime numbers exist for limit ${limit}.`,
      { limit, primeCount: 0 },
      []
    );
    return steps;
  }

  addStep(
    4,
    'Mark 0 and 1 as non-prime',
    '0 and 1 are defined as neither prime nor composite.',
    { limit, 'isPrime[0]': false, 'isPrime[1]': false },
    []
  );

  for (let p = 2; p * p <= limit; p++) {
    elements[p].pointers = ['p'];

    addStep(
      5,
      `Check candidate prime p = ${p}`,
      isPrime[p]
        ? `p = ${p} is marked true in isPrime array. Evaluate its multiples.`
        : `p = ${p} is already marked false (composite). Skip to next number.`,
      { p, 'isPrime[p]': isPrime[p], 'p*p': p * p }
    );

    if (isPrime[p]) {
      elements[p].state = 'active';

      for (let i = p * p; i <= limit; i += p) {
        const wasPrime = isPrime[i];
        isPrime[i] = false;

        elements[i].state = 'visited';
        elements[i].pointers = [`multiple of ${p}`];

        addStep(
          8,
          `Mark multiple i = ${i} as composite`,
          wasPrime
            ? `${i} is a multiple of prime ${p} (${p} x ${i / p}). Mark isPrime[${i}] = false.`
            : `${i} was already marked composite.`,
          { p, i, 'isPrime[i]': false }
        );

        elements[i].pointers = undefined;
      }

      elements[p].state = 'sorted';
      elements[p].pointers = undefined;
    }
  }

  // Collect primes
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) {
      primes.push(i);
      elements[i].state = 'sorted';
    }
  }

  addStep(
    14,
    'Sieve of Eratosthenes complete',
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
  code: SIEVE_CODE,
  timeComplexity: {
    best: 'O(n log log n)',
    average: 'O(n log log n)',
    worst: 'O(n log log n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_SIEVE_INPUT,
  generateSteps: generateSieveSteps,
};
