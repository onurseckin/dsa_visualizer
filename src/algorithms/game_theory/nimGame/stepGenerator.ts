import type { AlgorithmStep, ArrayElement } from "../../../types/dsa";

export interface NimInput {
  piles: number[];
}

export const generateNimGameSteps = (input: NimInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = input.piles ? [...input.piles] : [];
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
    `To decide who wins this Nim position we never simulate moves — we compute the Nim-sum, the XOR of every pile size, starting the running total at 0.`,
    { n, piles: piles.join(", ") },
  );

  if (n === 0) {
    addStep(
      8,
      "Game complete: no piles to play",
      "With no piles there is no legal first move, so the First Player loses on the spot and the Second Player wins by default.",
      { n, xorSum: 0 },
      -1,
      -1,
      "Second Player",
    );
    return steps;
  }

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = [`i=${i}`, `val=${piles[i]}`];

    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    addStep(
      5,
      `XOR in pile ${i} of size ${piles[i]}`,
      `We fold pile ${i} into the running total: ${prevXor} ^ ${piles[i]} = ${currentXorSum} (binary 0b${currentXorSum.toString(2)}). Each bit of the Nim-sum tracks whether that power of two appears an odd number of times across the piles.`,
      { i, pileSize: piles[i], prevXorSum: prevXor, xorSum: currentXorSum },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    7,
    `Nim-sum settles at ${currentXorSum}`,
    `This one number decides the whole game: a Nim-sum of 0 means every available move hands the opponent a winning position, while a non-zero sum means we can strike first and win.`,
    { xorSum: currentXorSum },
  );

  if (currentXorSum === 0) {
    addStep(
      8,
      "Nim-sum is 0: Second Player Wins",
      "Whatever the First Player does, the Nim-sum turns non-zero, and the Second Player can always answer with a move that resets it to 0. Trapped in that cycle, the First Player eventually runs out of moves.",
      { xorSum: 0, winner: "Second Player" },
      -1,
      -1,
      "Second Player",
    );
    return steps;
  }

  addStep(
    10,
    `Nim-sum ${currentXorSum} ≠ 0: First Player wins`,
    `A non-zero Nim-sum guarantees at least one pile can be shrunk so that everything XORs back to 0. We now search for that pile to make the win concrete.`,
    { xorSum: currentXorSum, winner: "First Player" },
    -1,
    -1,
    "First Player",
  );

  for (let i = 0; i < n; i++) {
    const targetSize = piles[i] ^ currentXorSum;

    elements[i].state = "compare";
    elements[i].pointers = [`i=${i}`, `target=${targetSize}`];

    addStep(
      12,
      `Test pile ${i}: target size ${targetSize}`,
      targetSize < piles[i]
        ? `XOR-ing pile ${i}'s size ${piles[i]} with the Nim-sum gives ${targetSize}, which is smaller — so we can legally shrink this pile down to it. That is our winning move.`
        : `XOR-ing ${piles[i]} with the Nim-sum gives ${targetSize}, which is not smaller than the pile, and Nim only lets us remove objects. We move on to the next pile.`,
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
        `Shrink pile ${i} from ${piles[i]} to ${targetSize}`,
        `Removing ${removeAmount} objects leaves the piles XOR-ing to exactly 0, handing the opponent the losing position. From here we simply keep restoring a zero Nim-sum after each of their moves until they have nothing left.`,
        {
          winningPile: i,
          originalSize: piles[i],
          targetSize,
          removeAmount,
          winner: "First Player",
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
