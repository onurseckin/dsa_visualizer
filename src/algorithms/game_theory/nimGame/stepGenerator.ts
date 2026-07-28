import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface NimInput {
  piles: number[];
}

export const generateNimGameSteps = (input: NimInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = input?.piles && Array.isArray(input.piles) ? [...input.piles] : [3, 4, 5];
  const n = piles.length;

  const elements: ArrayElement[] = piles.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  let currentXorSum = 0;

  const getAuxiliaryState = (
    xorVal: number,
    winningPileIdx: number = -1,
    targetVal: number = -1,
    winner: string = "In Progress",
  ) => {
    const hashMap: Record<string, string | number> = {
      xorSum: xorVal,
      xorSumBinary: `0b${xorVal.toString(2)}`,
      winner,
    };
    piles.forEach((pSize, idx) => {
      hashMap[`pile_${idx}`] = pSize;
    });

    return {
      hashMap,
      customState: {
        xorSum: xorVal,
        xorSumBinary: xorVal.toString(2),
        piles: piles.join(", "),
        winningPile: winningPileIdx >= 0 ? `Pile ${winningPileIdx}` : "None",
        targetSize: targetVal >= 0 ? targetVal : "N/A",
        winnerStatus: winner,
      },
      visited: piles.map((size, idx) => `Pile ${idx}: ${size} objects`),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    winningPileIdx: number = -1,
    targetVal: number = -1,
    winner: string = "In Progress",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: getAuxiliaryState(currentXorSum, winningPileIdx, targetVal, winner),
      variables: {
        xorSum: currentXorSum,
        ...variables,
      },
    });
  };

  addStep(
    1,
    `Evaluate ${n} piles: [${piles.join(", ")}]`,
    "To decide who wins this Nim position, we compute the Nim-sum (bitwise XOR of all pile sizes).",
    { n, piles: piles.join(", ") },
  );

  addStep(
    2,
    "Initialize running xor_sum = 0",
    "Starting accumulator for folding pile sizes via bitwise XOR.",
    { xorSum: 0 },
  );

  addStep(
    3,
    `Calculate total piles n = ${n}`,
    "Determines total iterations for computing the Nim-sum.",
    { n },
  );

  if (n === 0) {
    addStep(7, "Check Nim-sum on empty board: xor_sum = 0", "With 0 piles, the Nim-sum is 0.", {
      n,
      xorSum: 0,
    });
    addStep(
      8,
      "Game complete: no piles to play (Second Player Wins)",
      "With no piles there is no legal move, so the First Player loses and Second Player wins by default.",
      { n, xorSum: 0, winner: "Second Player" },
      -1,
      -1,
      "Second Player",
    );
    return steps;
  }

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = [`i=${i}`, `val=${piles[i]}`];

    addStep(
      4,
      `Inspect pile ${i} of size ${piles[i]}`,
      `Preparing to fold pile ${i} (value ${piles[i]}, binary 0b${piles[i].toString(2)}) into the running XOR accumulator.`,
      { i, pileSize: piles[i] },
    );

    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    addStep(
      5,
      `XOR in pile ${i} of size ${piles[i]}: ${prevXor} ^ ${piles[i]} = ${currentXorSum}`,
      `Running XOR total updated to ${currentXorSum} (binary 0b${currentXorSum.toString(2)}). Each set bit in the Nim-sum indicates an odd count of piles having that power-of-two bit set.`,
      { i, pileSize: piles[i], prevXorSum: prevXor, xorSum: currentXorSum },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    7,
    `Evaluate final Nim-sum = ${currentXorSum}`,
    `If Nim-sum is 0, the position is a P-position (Second Player wins). If Nim-sum != 0, it is an N-position (First Player wins).`,
    { xorSum: currentXorSum },
  );

  if (currentXorSum === 0) {
    addStep(
      8,
      "Nim-sum is 0: Second Player Wins",
      "Any legal move by the First Player forces the Nim-sum to become non-zero. The Second Player can always restore it to 0, eventually leaving First Player with zero moves.",
      { xorSum: 0, winner: "Second Player", winningPile: -1, targetSize: 0 },
      -1,
      -1,
      "Second Player",
    );
    return steps;
  }

  // Reset visual element states for winning move search loop
  for (let i = 0; i < n; i++) {
    elements[i].state = "default";
    elements[i].pointers = undefined;
  }

  addStep(
    10,
    `Nim-sum ${currentXorSum} ≠ 0: First Player wins. Searching for winning move...`,
    "A non-zero Nim-sum guarantees at least one pile can be legally reduced so that all pile sizes XOR to 0.",
    { xorSum: currentXorSum, winner: "First Player" },
    -1,
    -1,
    "First Player",
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "compare";
    elements[i].pointers = [`i=${i}`];

    addStep(
      10,
      `Inspect pile ${i} for winning move`,
      `Checking if pile ${i} can be reduced to zero out the Nim-sum ${currentXorSum}.`,
      { i, pileSize: piles[i] },
      -1,
      -1,
      "First Player",
    );

    const targetSize = piles[i] ^ currentXorSum;
    elements[i].pointers = [`i=${i}`, `target=${targetSize}`];

    addStep(
      11,
      `Calculate target size for pile ${i}: ${piles[i]} ^ ${currentXorSum} = ${targetSize}`,
      `To zero out the total Nim-sum, pile ${i} must be changed to target size ${targetSize}.`,
      { i, pileSize: piles[i], targetSize },
      -1,
      -1,
      "First Player",
    );

    addStep(
      12,
      `Test pile ${i}: target ${targetSize} < current ${piles[i]}?`,
      targetSize < piles[i]
        ? `Target size ${targetSize} is strictly smaller than pile size ${piles[i]}. This is a valid winning move!`
        : `Target size ${targetSize} is not smaller than pile size ${piles[i]}. Cannot add objects in Nim, so skipping pile ${i}.`,
      { i, pileSize: piles[i], targetSize, isWinningMove: targetSize < piles[i] },
      -1,
      -1,
      "First Player",
    );

    if (targetSize < piles[i]) {
      const removeAmount = piles[i] - targetSize;

      elements[i].state = "sorted";
      elements[i].pointers = ["winning move"];

      addStep(
        13,
        `Construct winning response object for pile ${i}`,
        `Selected pile ${i} (original size ${piles[i]}, new target size ${targetSize}).`,
        { i, targetSize, removeAmount },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        14,
        "Set winner = 'First Player'",
        "First Player has a forced winning strategy from this position.",
        { winner: "First Player" },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        15,
        `Set winning_pile = ${i}`,
        `Pile index ${i} will be reduced to execute the winning strategy.`,
        { winningPile: i },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        16,
        `Set target_size = ${targetSize}`,
        `Target pile size after removing ${removeAmount} objects.`,
        { targetSize },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        17,
        `Calculate objects to remove: ${piles[i]} - ${targetSize} = ${removeAmount}`,
        `Removing ${removeAmount} objects from pile ${i} leaves the remaining piles with exact Nim-sum 0.`,
        { removeAmount },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        18,
        `Shrink pile ${i} from ${piles[i]} to ${targetSize}`,
        `First Player wins by removing ${removeAmount} objects from pile ${i}, leaving a total Nim-sum of 0 for opponent.`,
        {
          winningPile: i,
          originalSize: piles[i],
          targetSize,
          removeAmount,
          winner: "First Player",
          xorSum: currentXorSum,
        },
        i,
        targetSize,
        "First Player",
      );
      break;
    }

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  return steps;
};
