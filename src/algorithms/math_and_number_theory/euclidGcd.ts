import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface EuclidGcdInput {
  a: number;
  b: number;
}

export const PYTHON_EUCLID_GCD_CODE = `def euclid_gcd(a: int, b: int) -> int:
    while b != 0:
        remainder = a % b
        a = b
        b = remainder
    return a`;

export const DEFAULT_EUCLID_GCD_INPUT: EuclidGcdInput = {
  a: 48,
  b: 18,
};

export const generateEuclidGcdSteps = (input: EuclidGcdInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  let currentA = Math.abs(Math.floor(input.a));
  let currentB = Math.abs(Math.floor(input.b));
  const initialA = currentA;
  const initialB = currentB;

  const history: string[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    aVal: number,
    bVal: number,
    remVal?: number,
    qVal?: number
  ) => {
    const elements: ArrayElement[] = [
      {
        id: 'val-a',
        value: aVal,
        state: 'active',
        pointers: ['a'],
      },
      {
        id: 'val-b',
        value: bVal,
        state: 'compare',
        pointers: ['b'],
      },
    ];

    if (remVal !== undefined) {
      elements.push({
        id: 'val-rem',
        value: remVal,
        state: 'swap',
        pointers: ['a % b'],
      });
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements,
      },
      auxiliaryState: {
        visited: [...history],
        hashMap: {
          'Initial Inputs': `a = ${initialA}, b = ${initialB}`,
          'Current State': `gcd(${aVal}, ${bVal})`,
          ...(remVal !== undefined && qVal !== undefined
            ? { Equation: `${aVal} = ${qVal} * ${bVal} + ${remVal}` }
            : {}),
        },
        customState: {
          a: aVal,
          b: bVal,
          ...(remVal !== undefined ? { remainder: remVal } : {}),
          ...(qVal !== undefined ? { quotient: qVal } : {}),
        },
      },
      variables: {
        a: aVal,
        b: bVal,
        ...(remVal !== undefined ? { remainder: remVal } : {}),
      },
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    `Start with gcd(${currentA}, ${currentB})`,
    `We want the largest number that divides both ${currentA} and ${currentB}. Rather than testing divisors, we will keep shrinking the pair using remainders until the answer falls out on its own.`,
    currentA,
    currentB
  );

  history.push(`gcd(${currentA}, ${currentB})`);

  while (currentB !== 0) {
    // Line 2: Loop condition check
    addStep(
      2,
      `Check b: still ${currentB}, not zero`,
      `As long as b is non-zero the pair can be reduced further, so we take another remainder and keep going.`,
      currentA,
      currentB
    );

    const remainder = currentA % currentB;
    const quotient = Math.floor(currentA / currentB);

    // Line 3: Modulo operation
    addStep(
      3,
      `Compute ${currentA} mod ${currentB} = ${remainder}`,
      `Since ${currentA} = ${quotient} × ${currentB} + ${remainder}, anything that divides both ${currentA} and ${currentB} must also divide ${remainder}. So gcd(${currentA}, ${currentB}) is the same as gcd(${currentB}, ${remainder}) — the identical answer on a smaller pair.`,
      currentA,
      currentB,
      remainder,
      quotient
    );

    // Line 4: Update a
    const prevA = currentA;
    currentA = currentB;
    addStep(
      4,
      `Slide the divisor into a`,
      `We shift the pair down: the old divisor ${currentB} becomes the new a, replacing ${prevA}. We are now solving the same problem one size smaller.`,
      currentA,
      currentB,
      remainder,
      quotient
    );

    // Line 5: Update b
    const prevB = currentB;
    currentB = remainder;
    history.push(`gcd(${currentA}, ${currentB})`);

    addStep(
      5,
      `Set b to the remainder ${remainder}`,
      `The remainder ${remainder} takes over as b (it was ${prevB}), leaving us at gcd(${currentA}, ${currentB}). Notice how quickly the numbers shrink — they roughly halve every couple of steps.`,
      currentA,
      currentB
    );
  }

  // Line 2: Loop condition check (false)
  addStep(
    2,
    'Loop ends: b reached 0',
    'With b at 0 there is no remainder left to chase, so the loop stops. Whatever now sits in a divides everything that came before it.',
    currentA,
    currentB
  );

  // Line 6: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Return GCD = ${currentA}`,
      why: `The last non-zero remainder, ${currentA}, divides both original numbers ${initialA} and ${initialB}, and nothing larger can — so it is their greatest common divisor.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: [
        {
          id: 'val-gcd',
          value: currentA,
          state: 'sorted',
          pointers: ['GCD'],
        },
      ],
    },
    auxiliaryState: {
      visited: [...history],
      hashMap: {
        'Initial Inputs': `a = ${initialA}, b = ${initialB}`,
        'Final GCD': `${currentA}`,
      },
      customState: {
        gcd: currentA,
        stepsCount: steps.length,
      },
    },
    variables: {
      gcd: currentA,
    },
  });

  return steps;
};

export const euclidGcd: AlgorithmDefinition<EuclidGcdInput> = {
  id: 'euclid-gcd',
  title: 'Euclidean Algorithm (GCD)',
  category: 'math_and_number_theory',
  difficulty: 'Easy',
  description:
    'Computes the Greatest Common Divisor (GCD) of two non-negative integers with the classical Euclidean algorithm. It rests on one elegant fact — gcd(a, b) = gcd(b, a mod b) — so each remainder step shrinks the problem until the answer is simply the last non-zero value.',
  constraints: [
    '0 <= a, b <= 10^9',
  ],
  examples: [
    {
      input: 'a = 48, b = 18',
      output: '6',
      explanation: '48 = 2*18 + 12 -> gcd(18, 12). 18 = 1*12 + 6 -> gcd(12, 6). 12 = 2*6 + 0 -> GCD is 6.',
    },
    {
      input: 'a = 101, b = 10',
      output: '1',
      explanation: '101 % 10 = 1, 10 % 1 = 0 -> GCD is 1 (coprime integers).',
    },
  ],
  code: PYTHON_EUCLID_GCD_CODE,
  timeComplexity: {
    best: 'O(1)',
    average: 'O(log(min(a, b)))',
    worst: 'O(log(min(a, b)))',
  },
  spaceComplexity: 'O(1)',
  complexityAnalysis: {
    time: 'Each remainder step shrinks the numbers fast: after any two consecutive iterations the smaller value has at least halved, so the loop runs on the order of log(min(a, b)) times. That is why even billion-scale inputs finish in a few dozen steps. In the best case b divides a immediately and a single iteration suffices — O(1).',
    space: 'We only ever hold three integers — a, b, and the current remainder — no matter how large the inputs are, so extra memory stays constant at O(1).',
  },
  defaultInput: DEFAULT_EUCLID_GCD_INPUT,
  generateSteps: generateEuclidGcdSteps,
};
