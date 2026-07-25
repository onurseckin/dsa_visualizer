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
    'Initialize Euclidean Algorithm',
    `Calculate Greatest Common Divisor (GCD) of a = ${currentA} and b = ${currentB}.`,
    currentA,
    currentB
  );

  history.push(`gcd(${currentA}, ${currentB})`);

  while (currentB !== 0) {
    // Line 2: Loop condition check
    addStep(
      2,
      `Check loop condition (b != 0)`,
      `b is currently ${currentB} (non-zero), so continue the Euclidean reduction loop.`,
      currentA,
      currentB
    );

    const remainder = currentA % currentB;
    const quotient = Math.floor(currentA / currentB);

    // Line 3: Modulo operation
    addStep(
      3,
      `Compute remainder (remainder = a % b)`,
      `${currentA} % ${currentB} = ${remainder} (since ${currentA} = ${quotient} * ${currentB} + ${remainder}). By Division Theorem, gcd(${currentA}, ${currentB}) = gcd(${currentB}, ${remainder}).`,
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
      `Update a = b`,
      `Assign previous divisor b = ${currentB} to a (was ${prevA}).`,
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
      `Update b = remainder`,
      `Assign remainder ${remainder} to b (was ${prevB}). Next state: gcd(${currentA}, ${currentB}). Divisors shrink exponentially in each step.`,
      currentA,
      currentB
    );
  }

  // Line 2: Loop condition check (false)
  addStep(
    2,
    'Check loop condition (b == 0)',
    'b is now 0, so the while loop terminates.',
    currentA,
    currentB
  );

  // Line 6: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Return result GCD = ${currentA}`,
      why: `The Greatest Common Divisor of ${initialA} and ${initialB} is ${currentA}. When b reaches 0, the last non-zero remainder is the exact GCD.`,
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
    'Computes the Greatest Common Divisor (GCD) of two non-negative integers using the classical Euclidean algorithm. Based on the fundamental principle that the GCD of two numbers also divides their remainder (gcd(a, b) = gcd(b, a mod b)), reducing subproblem sizes logarithmically.',
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
  defaultInput: DEFAULT_EUCLID_GCD_INPUT,
  generateSteps: generateEuclidGcdSteps,
};
