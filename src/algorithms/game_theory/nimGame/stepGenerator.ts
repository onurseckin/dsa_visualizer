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
    `Evaluating Nim position with ${n} piles: [${piles.join(", ")}].`,
    "The Sprague-Grundy theorem proves that the game outcome depends entirely on the bitwise XOR sum (Nim-sum) of all pile sizes.",
    { n, piles: piles.join(", ") },
  );

  addStep(
    2,
    "Initializing running Nim-sum accumulator to 0.",
    "The Nim-sum aggregates parity counts across all binary bit positions of the pile sizes.",
    { xorSum: 0 },
  );

  addStep(
    3,
    `Recorded pile count n = ${n}.`,
    "Preparing to iterate through all piles to compute the combined Nim-sum.",
    { n },
  );

  if (n === 0) {
    addStep(
      7,
      "Checking Nim-sum on empty board: xorSum = 0.",
      "With 0 piles, the Nim-sum is 0 by definition.",
      {
        n,
        xorSum: 0,
      },
    );
    addStep(
      8,
      "Game complete: no piles to play (Second Player Wins).",
      "No legal moves remain, so the player to move loses under normal play rules.",
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
      `Inspecting pile ${i} of size ${piles[i]} (binary 0b${piles[i].toString(2)}).`,
      `Folding pile ${i} into the global XOR total to analyze bit parities.`,
      { i, pileSize: piles[i] },
    );

    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    addStep(
      5,
      `Accumulating pile ${i}: ${prevXor} ^ ${piles[i]} = ${currentXorSum} (binary 0b${currentXorSum.toString(2)}).`,
      `Each 1-bit in the Nim-sum indicates an odd number of piles having that power-of-two component.`,
      { i, pileSize: piles[i], prevXorSum: prevXor, xorSum: currentXorSum },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    7,
    `Evaluated final Nim-sum S = ${currentXorSum}.`,
    `A Nim-sum of 0 represents a losing P-position for the player to move; a non-zero Nim-sum represents a winning N-position.`,
    { xorSum: currentXorSum },
  );

  if (currentXorSum === 0) {
    addStep(
      8,
      "Nim-sum is 0: Second Player Wins.",
      "Any valid move by the First Player forces the Nim-sum to become non-zero, allowing the Second Player to restore it to 0 on every turn.",
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
    `Nim-sum S = ${currentXorSum} ≠ 0: First Player has a forced winning move. Searching for optimal pile...`,
    "A non-zero Nim-sum guarantees the existence of at least one pile that can be reduced to make the new total Nim-sum 0.",
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
      `Testing pile ${i} of size ${piles[i]} for a winning reduction.`,
      `Checking if modifying pile ${i} can zero out the system Nim-sum.`,
      { i, pileSize: piles[i] },
      -1,
      -1,
      "First Player",
    );

    const targetSize = piles[i] ^ currentXorSum;
    elements[i].pointers = [`i=${i}`, `target=${targetSize}`];

    addStep(
      11,
      `Target pile size for pile ${i}: ${piles[i]} ^ ${currentXorSum} = ${targetSize}.`,
      `Changing pile ${i} to ${targetSize} cancels out the current Nim-sum S.`,
      { i, pileSize: piles[i], targetSize },
      -1,
      -1,
      "First Player",
    );

    addStep(
      12,
      `Testing target size ${targetSize} against current pile size ${piles[i]}.`,
      targetSize < piles[i]
        ? `Target size ${targetSize} is strictly smaller than the current pile size, making this a legal reducing move.`
        : `Target size exceeds current pile size, which is illegal in Nim where objects can only be removed.`,
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
        `Selected pile ${i} (original size ${piles[i]}, target size ${targetSize}).`,
        `Reducing pile ${i} to ${targetSize} leaves the opponent with a zero Nim-sum.`,
        { i, targetSize, removeAmount },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        14,
        "Set winner = 'First Player'.",
        "First Player has a forced winning strategy from this position.",
        { winner: "First Player" },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        15,
        `Set winning_pile = ${i}.`,
        `Pile index ${i} will be reduced to execute the winning strategy.`,
        { winningPile: i },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        16,
        `Set target_size = ${targetSize}.`,
        `Target pile size after removing ${removeAmount} objects.`,
        { targetSize },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        17,
        `Calculate objects to remove: ${piles[i]} - ${targetSize} = ${removeAmount}.`,
        `Removing ${removeAmount} objects from pile ${i} leaves the remaining piles with exact Nim-sum 0.`,
        { removeAmount },
        i,
        targetSize,
        "First Player",
      );

      addStep(
        18,
        `Reducing pile ${i} from ${piles[i]} to ${targetSize} (removing ${removeAmount} objects).`,
        `First Player forces a win by transitioning the board into a P-position with Nim-sum 0.`,
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
