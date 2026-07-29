import type {
  AlgorithmStep,
  ArrayElement,
  ArrayVisualSnapshot,
  ElementState,
} from "../../../types/dsa";

export interface SieveInput {
  limit: number;
}

export const generateSieveSteps = (input: SieveInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const limit = Math.max(0, Math.floor(typeof input?.limit === "number" ? input.limit : 30));

  const isPrime: boolean[] = new Array(limit + 1).fill(true);
  if (limit >= 0) isPrime[0] = false;
  if (limit >= 1) isPrime[1] = false;

  const getArraySnapshot = (currentP?: number, activeMultiple?: number): ArrayVisualSnapshot => {
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
      } else if (k < 2) {
        state = "visited";
      } else if (!isPrime[k]) {
        state = "visited";
      } else if (isPrime[k]) {
        state = "sorted";
      }

      elements.push({
        id: `num-${k}`,
        value: isPrime[k] ? "T" : "F",
        label: `${k}: ${isPrime[k] ? "Prime" : "Composite"}`,
        state,
        ...(pointers.length > 0 ? { pointers } : {}),
      });
    }

    return {
      kind: "array",
      elements,
    };
  };

  const getAuxiliaryState = (currentPrimes: number[]) => {
    const isPrimeMap: Record<string, string> = {};
    for (let k = 0; k <= limit; k++) {
      isPrimeMap[`isPrime[${k}]`] = isPrime[k] ? "true" : "false";
    }
    return {
      hashMap: isPrimeMap,
      visited: currentPrimes.map((p) => `Prime ${p}`),
      customState: {
        limit,
        booleanSnapshot: isPrime.map((val) => (val ? "T" : "F")).join(""),
        primesFoundCount: currentPrimes.length,
        primesList: currentPrimes.length > 0 ? currentPrimes.join(", ") : "None",
      },
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentPrimes: number[] = [],
    currentP?: number,
    activeMultiple?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getArraySnapshot(currentP, activeMultiple),
      auxiliaryState: getAuxiliaryState(currentPrimes),
      variables,
    });
  };

  addStep(
    1,
    `Start the sieve up to ${limit}`,
    `We want every prime up to ${limit}. Rather than testing each number for primality one by one, we will cross out composites in bulk and keep whatever survives.`,
    { limit },
    [],
  );

  addStep(
    2,
    `Check whether limit is below 2`,
    limit < 2
      ? `The smallest prime is 2, and our limit is only ${limit}, so there is nothing to search for.`
      : `The smallest prime is 2 and our limit ${limit} reaches at least that far, so the search is worth running.`,
    { limit },
    [],
  );

  if (limit < 2) {
    addStep(
      3,
      "Return an empty list",
      `No number below 2 is prime, so with limit ${limit} we simply return an empty result.`,
      { limit, primeCount: 0 },
      [],
    );
    return steps;
  }

  addStep(
    5,
    `Assume all ${limit + 1} numbers are prime`,
    `We start optimistic: every entry in the boolean array is marked True. The sieve's whole job is to knock out the composites, one prime at a time.`,
    { limit },
    [],
  );

  addStep(
    6,
    "Rule out 0 and 1",
    "Neither 0 nor 1 counts as prime by definition, so we flip both to False before the real work begins.",
    { limit, "is_prime[0]": false, "is_prime[1]": false },
    [],
  );

  addStep(
    8,
    "Start scanning at p = 2",
    "We begin with the smallest prime, 2. Each candidate that survives to this point will get to eliminate its own multiples.",
    { p: 2, limit },
    [],
    2,
  );

  for (let p = 2; p * p <= limit; p++) {
    addStep(
      9,
      `Confirm p² stays in range (${p * p} <= ${limit})`,
      `Every composite up to ${limit} has a factor no larger than its square root, so we only need base primes while p² is in range — and ${p}² = ${p * p} still is.`,
      { p, "p*p": p * p, limit },
      [],
      p,
    );

    addStep(
      10,
      `Ask whether ${p} is still prime`,
      isPrime[p]
        ? `Nothing smaller has crossed ${p} out, so it must be prime — any composite this size would already have been hit by a smaller factor. Time to eliminate its multiples, starting at ${p * p}.`
        : `${p} was already crossed out by a smaller prime factor, so we skip it — its multiples were handled long ago.`,
      { p, "is_prime[p]": isPrime[p] },
      [],
      p,
    );

    if (isPrime[p]) {
      addStep(
        11,
        `Start inner loop: cross out multiples of ${p} beginning at ${p * p}`,
        `We start at ${p}² = ${p * p} because all smaller multiples of ${p} were already crossed out by earlier (smaller) prime factors. Step size is ${p}.`,
        { p, startAt: p * p, step: p },
        [],
        p,
      );

      for (let i = p * p; i <= limit; i += p) {
        const wasPrime = isPrime[i];
        isPrime[i] = false;

        addStep(
          12,
          `Cross out ${i} as composite (multiple of ${p})`,
          wasPrime
            ? `${i} is ${p} × ${i / p}, so it cannot be prime and we mark it False. We started crossing at ${p * p} because smaller multiples of ${p} already fell to smaller primes.`
            : `${i} was already crossed out by a smaller prime factor, so this mark changes nothing — we just move along.`,
          { p, i, "is_prime[i]": false },
          [],
          p,
          i,
        );
      }
    }

    addStep(
      13,
      `Move on to p = ${p + 1}`,
      `We are done with ${p}, so we advance to the next candidate and let the array tell us whether it survived.`,
      { p: p + 1 },
      [],
      p + 1,
    );
  }

  addStep(
    9,
    `Stop the loop: p² exceeds ${limit}`,
    `Once p² passes ${limit}, any number still unmarked must be prime — a composite that small would already have been caught by one of its smaller factors.`,
    { limit },
  );

  addStep(
    15,
    "Collect the surviving numbers",
    `We sweep from 2 to ${limit} and gather every index still marked True — those are exactly the primes.`,
    { limit },
  );

  addStep(
    16,
    `Begin collection loop: scan from 2 to ${limit}`,
    "We now iterate over every index from 2 onwards to identify which positions remained True in the sieve.",
    { limit, from: 2, to: limit },
  );

  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    addStep(
      17,
      `Check is_prime[${i}]`,
      isPrime[i]
        ? `is_prime[${i}] is True — ${i} survived the sieve and is prime.`
        : `is_prime[${i}] is False — ${i} was crossed out by a smaller factor.`,
      { i, "is_prime[i]": isPrime[i] },
    );

    if (isPrime[i]) {
      primes.push(i);

      addStep(
        18,
        `Append ${i} to primes list`,
        `${i} is prime — we collect it. The primes list so far: [${[...primes].join(", ")}].`,
        { i, primesCount: primes.length },
        [...primes],
      );
    }
  }

  addStep(
    20,
    "Return the list of primes",
    `We found ${primes.length} primes up to ${limit}: ${primes.join(", ")}. All that crossing-out cost only about n log log n operations — remarkably close to linear.`,
    { limit, primeCount: primes.length, primes: primes.join(", ") },
    primes,
  );

  return steps;
};
