import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
    qVal?: number,
  ) => {
    const elements: ArrayElement[] = [
      {
        id: "val-a",
        value: aVal,
        state: "active",
        pointers: ["a"],
      },
      {
        id: "val-b",
        value: bVal,
        state: "compare",
        pointers: ["b"],
      },
    ];

    if (remVal !== undefined) {
      elements.push({
        id: "val-rem",
        value: remVal,
        state: "swap",
        pointers: ["a % b"],
      });
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        visited: [...history],
        hashMap: {
          "Initial Inputs": `a = ${initialA}, b = ${initialB}`,
          "Current State": `gcd(${aVal}, ${bVal})`,
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
    currentB,
  );

  history.push(`gcd(${currentA}, ${currentB})`);

  while (currentB !== 0) {
    // Line 2: Loop condition check
    addStep(
      2,
      `Check b: still ${currentB}, not zero`,
      `As long as b is non-zero the pair can be reduced further, so we take another remainder and keep going.`,
      currentA,
      currentB,
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
      quotient,
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
      quotient,
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
      currentB,
    );
  }

  // Line 2: Loop condition check (false)
  addStep(
    2,
    "Loop ends: b reached 0",
    "With b at 0 there is no remainder left to chase, so the loop stops. Whatever now sits in a divides everything that came before it.",
    currentA,
    currentB,
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
      kind: "array",
      elements: [
        {
          id: "val-gcd",
          value: currentA,
          state: "sorted",
          pointers: ["GCD"],
        },
      ],
    },
    auxiliaryState: {
      visited: [...history],
      hashMap: {
        "Initial Inputs": `a = ${initialA}, b = ${initialB}`,
        "Final GCD": `${currentA}`,
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

const EUCLID_GCD_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Euclidean algorithm finds the greatest common divisor of two integers by repeatedly replacing the pair with a smaller pair that has the same answer. Everything rests on one identity, that the greatest common divisor of a and b equals that of b and the remainder of a divided by b, which is among the oldest and most reused facts in computing. It is worth learning properly because it is the engine behind reducing fractions, computing least common multiples, inverting numbers modulo m, and solving linear equations over the integers. It is also a model of the reduction technique: rather than searching for an answer, you shrink the problem while proving the answer never changes.",
  sections: [
    {
      heading: "The identity that drives everything",
      body: "Write a as q times b plus r, where q is the quotient and r the remainder. If some number d divides both a and b, then it divides a minus q times b, which is exactly r, so d is also a common divisor of b and r. Run the argument backwards: if d divides both b and r, then it divides q times b plus r, which is a, so d is a common divisor of a and b. The two pairs therefore have identical sets of common divisors, and if the sets are identical then so are their largest elements. That is the whole justification for throwing away a and continuing with the smaller pair, and it explains why no search over candidate divisors is ever needed.",
    },
    {
      heading: "How the loop runs",
      body: "You keep two values and repeat three assignments while the second is non-zero: take the remainder of the first divided by the second, move the second into the first, and move the remainder into the second. Because a remainder is always at least zero and strictly less than the divisor, the second value strictly decreases every iteration, so the process is a descent through non-negative integers. Following 48 and 18 makes it concrete: the pair becomes 18 and 12, then 12 and 6, then 6 and 0, and the answer is the 6 left standing. Notice how few iterations that took compared with testing divisors of 48 one at a time. The only implementation subtlety is ordering the assignments so the remainder is computed and saved before the first value is overwritten.",
    },
    {
      heading: "Why it terminates with the right answer",
      body: "The invariant is that at the top of every iteration the greatest common divisor of the current pair equals the greatest common divisor of the two numbers you started with, which is precisely what the remainder identity guarantees for each step. Termination follows from the strict decrease of the second value, since a strictly decreasing sequence of non-negative integers cannot be infinite and must land on zero. The base case is the pleasant one: the greatest common divisor of a and 0 is a, because every integer divides 0 and the largest divisor of a is a itself. Put the two together and the value sitting in the first slot when the loop exits, which is also the last non-zero remainder produced, is the answer for the original inputs. That is why the algorithm needs no factorization of either number, which matters enormously since factoring large integers is hard while taking remainders is cheap.",
    },
    {
      heading: "Remainders versus subtraction, and the alternatives",
      body: "There is an older subtractive form that repeatedly subtracts the smaller value from the larger, and it is correct for the same reason, since subtracting b once preserves the common divisors just as subtracting it q times does. Its weakness is lopsided input, where reducing a billion against 1 takes a billion subtractions, and the modulo operation collapses exactly that run of subtractions into a single step. The slowest inputs for the remainder version are consecutive Fibonacci numbers, because each division yields a quotient of one and so removes the least possible, which is the classical worst case identified by Lamé. When division is expensive relative to shifting, as with very large multi-word integers, the binary or Stein variant replaces division with halving and subtraction and wins in practice. For everyday code, prefer the library function your language already ships, and reach for these variants only when profiling says so.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Negative inputs need care because the sign conventions of the remainder operator differ between languages, with some truncating toward zero and others flooring, so the robust habit is to take absolute values first as this implementation does. The pair of zeros is a definitional question rather than a bug, and the usual convention is that the greatest common divisor of 0 and 0 is 0. Passing arguments in the wrong order costs nothing, since one extra iteration simply swaps them, so there is no need to sort the inputs first. When you compute a least common multiple from the result, divide before multiplying so that overflow is avoided, taking one number divided by the divisor and then multiplied by the other. And if you write the recursive form, remember it recurses only logarithmically deep, so stack depth is a non-issue here even though it would be for a subtractive version.",
    },
    {
      heading: "What the identity unlocks",
      body: "The extended version of the algorithm tracks how each remainder was built from the original inputs and returns coefficients x and y with a times x plus b times y equal to the divisor, which is the Bezout identity. Those coefficients are exactly how you invert a number modulo m, which in turn powers modular division, the Chinese remainder theorem, and RSA key setup. They also solve linear Diophantine equations, since such an equation has integer solutions precisely when the greatest common divisor of the coefficients divides the constant. On the mundane side, the divisor reduces fractions to lowest terms and folds across a list to give the greatest common divisor of a whole array, since the operation is associative. Structurally, the sequence of quotients the algorithm produces is the continued fraction expansion of the ratio, which links it to best rational approximations and the Stern-Brocot tree.",
    },
  ],
  keyTerms: [
    {
      term: "Greatest common divisor",
      definition:
        "The largest positive integer that divides both inputs without remainder. It equals the product of the shared prime factors, though the algorithm finds it without ever computing those factors.",
    },
    {
      term: "Remainder",
      definition:
        "What is left of a after subtracting as many whole copies of b as fit, always at least zero and strictly smaller than b. Its strict smallness is what forces the algorithm to terminate.",
    },
    {
      term: "Coprime",
      definition:
        "A pair of numbers whose greatest common divisor is 1, meaning they share no prime factor. The algorithm reports this by ending with a final value of 1.",
    },
    {
      term: "Bezout identity",
      definition:
        "The statement that for any a and b there exist integers x and y with a times x plus b times y equal to their greatest common divisor. The extended Euclidean algorithm computes those integers alongside the divisor.",
    },
    {
      term: "Loop invariant",
      definition:
        "A property that holds before and after every iteration and is used to argue correctness. Here it is that the greatest common divisor of the current pair never differs from that of the original pair.",
    },
  ],
};

const EUCLID_GCD_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature: it takes two integers a and b and returns their greatest common divisor.",
    2: "Loops as long as b is non-zero — each pass shrinks the pair using the identity gcd(a, b) = gcd(b, a % b), and it stops the moment there's no remainder left to chase.",
    3: "Computes a mod b, the remainder left over after dividing a by b; anything that divides both a and b must also divide this remainder.",
    4: "Slides the divisor into a, so the pair becomes (old b, remainder) — the same-answer problem, one size smaller.",
    5: "Sets b to the just-computed remainder, completing the shift to a smaller equivalent pair for the next iteration.",
    6: "Once b is 0, a holds the last non-zero remainder, which is exactly the greatest common divisor — so we return it.",
  },
};

export const euclidGcd: AlgorithmDefinition<EuclidGcdInput> = {
  id: "euclid-gcd",
  title: "Euclidean Algorithm (GCD)",
  category: "math_and_number_theory",
  difficulty: "Easy",
  description:
    "Computes the Greatest Common Divisor (GCD) of two non-negative integers with the classical Euclidean algorithm. It rests on one elegant fact — gcd(a, b) = gcd(b, a mod b) — so each remainder step shrinks the problem until the answer is simply the last non-zero value.",
  constraints: ["0 <= a, b <= 10^9"],
  examples: [
    {
      input: "a = 48, b = 18",
      output: "6",
      explanation:
        "48 = 2*18 + 12 -> gcd(18, 12). 18 = 1*12 + 6 -> gcd(12, 6). 12 = 2*6 + 0 -> GCD is 6.",
    },
    {
      input: "a = 101, b = 10",
      output: "1",
      explanation: "101 % 10 = 1, 10 % 1 = 0 -> GCD is 1 (coprime integers).",
    },
  ],
  code: PYTHON_EUCLID_GCD_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log(min(a, b)))",
    worst: "O(log(min(a, b)))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each remainder step shrinks the numbers fast: after any two consecutive iterations the smaller value has at least halved, so the loop runs on the order of log(min(a, b)) times. That is why even billion-scale inputs finish in a few dozen steps. In the best case b divides a immediately and a single iteration suffices — O(1).",
    space:
      "We only ever hold three integers — a, b, and the current remainder — no matter how large the inputs are, so extra memory stays constant at O(1).",
  },
  topicGuide: EUCLID_GCD_TOPIC_GUIDE,
  trivia: EUCLID_GCD_TRIVIA,
  defaultInput: DEFAULT_EUCLID_GCD_INPUT,
  generateSteps: generateEuclidGcdSteps,
};
