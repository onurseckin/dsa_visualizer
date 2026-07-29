import type {
  AlgorithmStep,
  ArrayElement,
  ArrayVisualSnapshot,
  ElementState,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface SieveInput {
  limit: number;
}

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Prime Identification Problem",
      narrative:
        "The problem requires finding all prime numbers up to an upper bound N, where a prime is a natural number greater than 1 with no positive divisors other than 1 and itself.",
      elements: [
        { id: "i-0", value: "0", label: "0: Non-prime", state: "visited" as ElementState },
        { id: "i-1", value: "1", label: "1: Non-prime", state: "visited" as ElementState },
        { id: "i-2", value: "2", label: "2: Prime", state: "sorted" as ElementState },
        { id: "i-3", value: "3", label: "3: Prime", state: "sorted" as ElementState },
        { id: "i-4", value: "4", label: "4: Composite", state: "default" as ElementState },
      ],
    },
    {
      title: "Naive Trial Division Bottleneck",
      narrative:
        "Testing each candidate number independently for primality up to N takes O(N sqrt(N)) operations, performing repetitive division checks across overlapping factor spaces.",
      elements: [
        { id: "i-0", value: "2", label: "2: Check %2", state: "compare" as ElementState },
        { id: "i-1", value: "3", label: "3: Check %2,%3", state: "compare" as ElementState },
        { id: "i-2", value: "4", label: "4: Check %2", state: "visited" as ElementState },
        { id: "i-3", value: "5", label: "5: Check %2,%3", state: "compare" as ElementState },
        { id: "i-4", value: "6", label: "6: Check %2", state: "visited" as ElementState },
      ],
    },
    {
      title: "The Sieve of Eratosthenes Concept",
      narrative:
        "Instead of checking individual candidate primality, the Sieve of Eratosthenes initializes a boolean array of size N+1 and systematically eliminates multiples of known primes.",
      elements: [
        { id: "i-0", value: "T", label: "2: True", state: "pivot" as ElementState },
        { id: "i-1", value: "T", label: "3: True", state: "default" as ElementState },
        { id: "i-2", value: "T", label: "4: True", state: "default" as ElementState },
        { id: "i-3", value: "T", label: "5: True", state: "default" as ElementState },
        { id: "i-4", value: "T", label: "6: True", state: "default" as ElementState },
      ],
    },
    {
      title: "Base Exclusions: 0 and 1",
      narrative:
        "By definition, 0 and 1 are neither prime nor composite, so we immediately set their flags to False before starting prime multiple elimination.",
      elements: [
        { id: "i-0", value: "F", label: "0: False", state: "visited" as ElementState },
        { id: "i-1", value: "F", label: "1: False", state: "visited" as ElementState },
        { id: "i-2", value: "T", label: "2: True", state: "pivot" as ElementState },
        { id: "i-3", value: "T", label: "3: True", state: "default" as ElementState },
        { id: "i-4", value: "T", label: "4: True", state: "default" as ElementState },
      ],
    },
    {
      title: "Eliminating Multiples of Prime 2",
      narrative:
        "Starting with the first prime 2, we iterate through all strictly larger multiples of 2—such as 4, 6, and 8—and flip their boolean status to False.",
      elements: [
        { id: "i-0", value: "T", label: "2: Prime", state: "pivot" as ElementState },
        { id: "i-1", value: "T", label: "3: True", state: "default" as ElementState },
        { id: "i-2", value: "F", label: "4: Composite", state: "visited" as ElementState },
        { id: "i-3", value: "T", label: "5: True", state: "default" as ElementState },
        { id: "i-4", value: "F", label: "6: Composite", state: "visited" as ElementState },
      ],
    },
    {
      title: "Advancing to Next Prime Factor 3",
      narrative:
        "The next unmarked integer 3 is confirmed prime, and its multiples starting from 3 squared (9) are eliminated in steps of 3.",
      elements: [
        { id: "i-0", value: "T", label: "2: Prime", state: "sorted" as ElementState },
        { id: "i-1", value: "T", label: "3: Prime", state: "pivot" as ElementState },
        { id: "i-2", value: "F", label: "4: Composite", state: "visited" as ElementState },
        { id: "i-3", value: "T", label: "5: True", state: "default" as ElementState },
        { id: "i-4", value: "F", label: "6: Composite", state: "visited" as ElementState },
      ],
    },
    {
      title: "Optimization: Starting Sweeps at p²",
      narrative:
        "For any prime p, all composite multiples k * p with k < p have already been crossed out by smaller prime factors, so elimination sweeps begin safely at p squared.",
      elements: [
        { id: "i-0", value: "p²=9", label: "9: Start at 9", state: "compare" as ElementState },
        { id: "i-1", value: "12", label: "12: Skip (hit by 2)", state: "visited" as ElementState },
        { id: "i-2", value: "15", label: "15: Mark 15", state: "compare" as ElementState },
        { id: "i-3", value: "18", label: "18: Skip (hit by 2)", state: "visited" as ElementState },
        { id: "i-4", value: "21", label: "21: Mark 21", state: "compare" as ElementState },
      ],
    },
    {
      title: "Square Root Loop Termination",
      narrative:
        "We only need to iterate base prime p up to sqrt(N) because any composite integer x <= N must contain at least one prime factor p <= sqrt(N).",
      elements: [
        { id: "i-0", value: "p<=sqrt(N)", label: "Check bound", state: "pivot" as ElementState },
        { id: "i-1", value: "Done", label: "Stop loop", state: "sorted" as ElementState },
        { id: "i-2", value: "Survivors", label: "All Primes", state: "sorted" as ElementState },
      ],
    },
    {
      title: "Result Assembly and Complexity",
      narrative:
        "After the elimination phase concludes, all indices retaining True represent prime numbers, yielding an overall time complexity of O(N log log N) and space complexity of O(N).",
      elements: [
        { id: "i-0", value: "2", label: "2: Prime", state: "sorted" as ElementState },
        { id: "i-1", value: "3", label: "3: Prime", state: "sorted" as ElementState },
        { id: "i-2", value: "5", label: "5: Prime", state: "sorted" as ElementState },
        { id: "i-3", value: "7", label: "7: Prime", state: "sorted" as ElementState },
      ],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "array",
        name: "sieve_concept",
        elements: data.elements,
      },
    }),
  );
};

export const generateSieveSteps = (input: SieveInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const limit = Math.max(
    0,
    Math.floor(
      typeof rawInput === "number" ? rawInput : typeof input?.limit === "number" ? input.limit : 10,
    ),
  );

  const isPrime: boolean[] = new Array(limit + 1).fill(true);

  const getArraySnapshot = (
    currentP?: number,
    activeMultiple?: number,
    stepTag?: string,
  ): ArrayVisualSnapshot => {
    const elements: ArrayElement[] = [];
    for (let k = 0; k <= limit; k++) {
      const pointers: string[] = [];
      if (k === currentP) pointers.push("p");
      if (k === activeMultiple) pointers.push("i");

      let state: ElementState = "default";
      if (k === activeMultiple) {
        state = "compare";
      } else if (k === currentP) {
        state = "pivot";
      } else if (k < 2 && stepTag !== "init") {
        state = "visited";
      } else if (!isPrime[k]) {
        state = "visited";
      } else if (isPrime[k] && stepTag === "done") {
        state = "sorted";
      }

      elements.push({
        id: `num-${k}`,
        value: stepTag === "init" || isPrime[k] ? "T" : "F",
        label: `${k}`,
        state,
        ...(pointers.length > 0 ? { pointers } : {}),
      });
    }

    return {
      kind: "array",
      name: "isPrime",
      elements,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize a boolean sieve array of size ${limit + 1} with all values initially set to True, ready to mark composites.`,
      primarySnapshot: getArraySnapshot(undefined, undefined, "init"),
    }),
  );

  if (limit >= 0) {
    if (limit >= 0) isPrime[0] = false;
    if (limit >= 1) isPrime[1] = false;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative:
          "We mark index 0 and index 1 as False because neither 0 nor 1 meets the mathematical definition of a prime number.",
        primarySnapshot: getArraySnapshot(),
      }),
    );
  }

  if (limit < 2) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Since limit ${limit} is less than 2, there are no prime numbers within the search range, so we return an empty array.`,
        primarySnapshot: {
          kind: "array",
          name: "primes",
          elements: [],
        },
      }),
    );
    return steps;
  }

  for (let p = 2; p * p <= limit; p++) {
    if (isPrime[p]) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `We examine candidate prime p = ${p}. Since isPrime[${p}] is True, we confirm ${p} is prime and will sweep its multiples starting at ${p * p}.`,
          primarySnapshot: getArraySnapshot(p),
        }),
      );

      for (let i = p * p; i <= limit; i += p) {
        isPrime[i] = false;
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `We mark index i = ${i} as False because it is a composite multiple of prime p = ${p} (${p} x ${i / p}).`,
            primarySnapshot: getArraySnapshot(p, i),
          }),
        );
      }
    }
  }

  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) {
      primes.push(i);
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Index ${i} remained True throughout the sieve sweep, identifying it as a prime number and adding it to our result list.`,
          primarySnapshot: getArraySnapshot(i, undefined, "done"),
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The sieve process is complete, yielding ${primes.length} prime numbers up to limit ${limit}: [${primes.join(", ")}].`,
      primarySnapshot: {
        kind: "array",
        name: "primes",
        elements: primes.map((prime) => ({
          id: `prime-${prime}`,
          value: prime,
          label: `${prime}`,
          state: "sorted" as ElementState,
        })),
      },
    }),
  );

  return steps;
};
