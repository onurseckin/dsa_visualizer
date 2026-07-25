import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';

export interface EuclidGcdInput {
  a: number;
  b: number;
}

export const PYTHON_EUCLID_GCD_CODE = `def euclid_gcd(a: int, b: int) -> int:
    """
    Euclidean algorithm to calculate the Greatest Common Divisor (GCD) of a and b.
    Uses the recurrence gcd(a, b) = gcd(b, a % b) until b becomes 0.
    """
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
        state: 'active' as ElementState,
        pointers: ['a'],
      },
      {
        id: 'val-b',
        value: bVal,
        state: 'compare' as ElementState,
        pointers: ['b'],
      },
    ];

    if (remVal !== undefined) {
      elements.push({
        id: 'val-rem',
        value: remVal,
        state: 'swap' as ElementState,
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
    `Calculate GCD of a = ${currentA} and b = ${currentB}.`,
    currentA,
    currentB
  );

  history.push(`gcd(${currentA}, ${currentB})`);

  while (currentB !== 0) {
    // Line 2: Check condition
    addStep(
      2,
      `Check condition (b != 0)`,
      `b is currently ${currentB} (not zero), so continue the Euclidean reduction loop.`,
      currentA,
      currentB
    );

    const remainder = currentA % currentB;
    const quotient = Math.floor(currentA / currentB);

    // Line 3: Modulo operation
    addStep(
      3,
      `Compute remainder (remainder = a % b)`,
      `${currentA} % ${currentB} = ${remainder} (since ${currentA} = ${quotient} * ${currentB} + ${remainder}).`,
      currentA,
      currentB,
      remainder,
      quotient
    );

    // Line 4 & 5: Update state
    currentA = currentB;
    currentB = remainder;
    history.push(`gcd(${currentA}, ${currentB})`);

    addStep(
      4,
      `Update variables (a = b, b = remainder)`,
      `Set a = ${currentA} and b = ${currentB}.`,
      currentA,
      currentB
    );
  }

  // Line 2: Loop check failed
  addStep(
    2,
    'Check condition (b == 0)',
    'b is now 0, exiting the while loop.',
    currentA,
    currentB
  );

  // Line 6: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `GCD computed: ${currentA}`,
      why: `Greatest Common Divisor of ${initialA} and ${initialB} is ${currentA}.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: [
        {
          id: 'val-gcd',
          value: currentA,
          state: 'sorted' as ElementState,
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
    'Computes the Greatest Common Divisor (GCD) of two integers using the Euclidean algorithm by repeatedly replacing numbers with remainder after division.',
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
