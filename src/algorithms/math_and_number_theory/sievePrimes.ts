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
    `Start the sieve up to ${limit}`,
    `We want every prime up to ${limit}. Rather than testing each number for primality one by one, we will cross out composites in bulk and keep whatever survives.`,
    { limit },
    []
  );

  addStep(
    2,
    `Check whether limit is below 2`,
    limit < 2
      ? `The smallest prime is 2, and our limit is only ${limit}, so there is nothing to search for.`
      : `The smallest prime is 2 and our limit ${limit} reaches at least that far, so the search is worth running.`,
    { limit },
    []
  );

  if (limit < 2) {
    addStep(
      3,
      'Return an empty list',
      `No number below 2 is prime, so with limit ${limit} we simply return an empty result.`,
      { limit, primeCount: 0 },
      []
    );
    return steps;
  }

  addStep(
    5,
    `Assume all ${limit + 1} numbers are prime`,
    `We start optimistic: every entry in the boolean array is marked True. The sieve's whole job is to knock out the composites, one prime at a time.`,
    { limit },
    []
  );

  addStep(
    6,
    'Rule out 0 and 1',
    'Neither 0 nor 1 counts as prime by definition, so we flip both to False before the real work begins.',
    { limit, 'is_prime[0]': false, 'is_prime[1]': false },
    []
  );

  addStep(
    8,
    'Start scanning at p = 2',
    'We begin with the smallest prime, 2. Each candidate that survives to this point will get to eliminate its own multiples.',
    { p: 2, limit },
    []
  );

  for (let p = 2; p * p <= limit; p++) {
    elements[p].pointers = ['p'];

    addStep(
      9,
      `Confirm p² stays in range (${p * p} <= ${limit})`,
      `Every composite up to ${limit} has a factor no larger than its square root, so we only need base primes while p² is in range — and ${p}² = ${p * p} still is.`,
      { p, 'p*p': p * p, limit }
    );

    addStep(
      10,
      `Ask whether ${p} is still prime`,
      isPrime[p]
        ? `Nothing smaller has crossed ${p} out, so it must be prime — any composite this size would already have been hit by a smaller factor. Time to eliminate its multiples, starting at ${p * p}.`
        : `${p} was already crossed out by a smaller prime factor, so we skip it — its multiples were handled long ago.`,
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
          `Cross out ${i} as composite`,
          wasPrime
            ? `${i} is ${p} × ${i / p}, so it cannot be prime and we mark it False. We started crossing at ${p * p} because smaller multiples of ${p} already fell to smaller primes.`
            : `${i} was already crossed out by a smaller prime factor, so this mark changes nothing — we just move along.`,
          { p, i, 'is_prime[i]': false }
        );

        elements[i].pointers = undefined;
      }

      elements[p].state = 'sorted';
      elements[p].pointers = undefined;
    }

    addStep(
      13,
      `Move on to p = ${p + 1}`,
      `We are done with ${p}, so we advance to the next candidate and let the array tell us whether it survived.`,
      { p: p + 1 }
    );
  }

  addStep(
    9,
    `Stop the loop: p² exceeds ${limit}`,
    `Once p² passes ${limit}, any number still unmarked must be prime — a composite that small would already have been caught by one of its smaller factors.`,
    { limit }
  );

  addStep(
    15,
    'Collect the surviving numbers',
    `We sweep from 2 to ${limit} and gather every index still marked True — those are exactly the primes.`,
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
    'Return the list of primes',
    `We found ${primes.length} primes up to ${limit}: ${primes.join(', ')}. All that crossing-out cost only about n log log n operations — remarkably close to linear.`,
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
    'The Sieve of Eratosthenes is an ancient algorithm for finding all prime numbers up to a given limit. Instead of testing numbers individually, it crosses out the multiples of each discovered prime (starting from p²), leaving only primes standing — in nearly linear O(n log log n) time.',
  constraints: [
    '0 <= limit <= 10^5',
  ],
  examples: [
    {
      input: 'limit = 10',
      output: '[2, 3, 5, 7]',
      explanation: 'Composite numbers 4, 6, 8, 9, 10 are eliminated, leaving primes 2, 3, 5, 7.',
    },
    {
      input: 'limit = 30',
      output: '[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]',
      explanation: 'Iteratively marks multiples of 2, 3, 5 up to sqrt(30) ~ 5.',
    },
  ],
  code: PYTHON_SIEVE_CODE,
  timeComplexity: {
    best: 'O(n log log n)',
    average: 'O(n log log n)',
    worst: 'O(n log log n)',
  },
  spaceComplexity: 'O(n)',
  complexityAnalysis: {
    time: 'Crossing out the multiples of a prime p costs about n/p work, so the total is n/2 + n/3 + n/5 + … taken over only the primes, and that sum famously grows as n log log n — barely worse than a single linear pass. We also stop taking new base primes once p² exceeds n, so most numbers are never used as a base at all; they just get crossed out once or twice.',
    space: 'The boolean array keeps one flag per number from 0 to n, so memory grows linearly with the limit — O(n). The final list of primes is smaller and fits within that same bound.',
  },
  defaultInput: DEFAULT_SIEVE_INPUT,
  generateSteps: generateSieveSteps,
};
