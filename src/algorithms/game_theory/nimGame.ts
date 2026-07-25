import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface NimInput {
  piles: number[];
}

export const NIM_GAME_CODE = `def nim_game(piles):
    xor_sum = 0
    n = len(piles)
    for i in range(n):
        xor_sum ^= piles[i]

    if xor_sum == 0:
        return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}

    for i in range(n):
        target_size = piles[i] ^ xor_sum
        if target_size < piles[i]:
            return {
                "winner": "First Player",
                "winning_pile": i,
                "target_size": target_size,
                "remove": piles[i] - target_size,
            }

    return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}`;

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

export const generateNimGameSteps = (input: NimInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = input.piles ? [...input.piles] : [];
  const n = piles.length;

  const elements: ArrayElement[] = piles.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  let currentXorSum = 0;

  const getAuxiliaryState = (
    xorVal: number,
    winningPileIdx: number = -1,
    targetVal: number = -1,
    winner: string = 'In Progress'
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
        piles: piles.join(', '),
        winningPile: winningPileIdx >= 0 ? `Pile ${winningPileIdx}` : 'None',
        targetSize: targetVal >= 0 ? targetVal : 'N/A',
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
    winner: string = 'In Progress'
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
      auxiliaryState: getAuxiliaryState(
        currentXorSum,
        winningPileIdx,
        targetVal,
        winner
      ),
      variables: {
        xorSum: currentXorSum,
        ...variables,
      },
    });
  };

  addStep(
    1,
    'Initialize Nim Game Sprague-Grundy XOR Sum',
    `Evaluating ${n} piles: [${piles.join(', ')}]. Initial Nim-sum XOR = 0.`,
    { n, piles: piles.join(', ') }
  );

  if (n === 0) {
    addStep(
      8,
      'Nim Game complete (Empty piles)',
      'No piles present in game.',
      { n, xorSum: 0 },
      -1,
      -1,
      'Second Player'
    );
    return steps;
  }

  // XOR Sum calculation loop
  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = [`i=${i}`, `val=${piles[i]}`];

    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    addStep(
      5,
      `XOR pile[${i}] (${piles[i]}) into running Nim-sum`,
      `${prevXor} ^ ${piles[i]} = ${currentXorSum} (binary: 0b${currentXorSum.toString(2)}).`,
      { i, pileSize: piles[i], prevXorSum: prevXor, xorSum: currentXorSum }
    );

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  addStep(
    7,
    `Final Nim-sum XOR = ${currentXorSum}`,
    `Sprague-Grundy theorem states that if XOR sum is 0, Second Player wins; otherwise First Player wins.`,
    { xorSum: currentXorSum }
  );

  if (currentXorSum === 0) {
    addStep(
      8,
      'XOR Sum is 0: P-Position (Second Player Wins)',
      'No winning move exists for the First Player. Second Player can force a win.',
      { xorSum: 0, winner: 'Second Player' },
      -1,
      -1,
      'Second Player'
    );
    return steps;
  }

  // Find winning move for First Player
  addStep(
    10,
    `XOR Sum is ${currentXorSum} ≠ 0: N-Position (First Player Wins)`,
    'Searching for a pile i such that (pile[i] ^ xorSum) < pile[i] to execute a winning move.',
    { xorSum: currentXorSum, winner: 'First Player' },
    -1,
    -1,
    'First Player'
  );

  for (let i = 0; i < n; i++) {
    const targetSize = piles[i] ^ currentXorSum;

    elements[i].state = 'compare';
    elements[i].pointers = [`i=${i}`, `target=${targetSize}`];

    addStep(
      12,
      `Test pile[${i}] (${piles[i]}): targetSize = ${piles[i]} ^ ${currentXorSum} = ${targetSize}`,
      targetSize < piles[i]
        ? `Target size ${targetSize} < current pile size ${piles[i]}. Winning move found!`
        : `Target size ${targetSize} >= current pile size ${piles[i]}. Cannot reduce this pile.`,
      { i, pileSize: piles[i], targetSize, isWinningMove: targetSize < piles[i] },
      -1,
      -1,
      'First Player'
    );

    if (targetSize < piles[i]) {
      const removeAmount = piles[i] - targetSize;
      elements[i].state = 'sorted';
      elements[i].pointers = ['winning move'];

      addStep(
        13,
        `Winning Move: Reduce pile ${i} from ${piles[i]} to ${targetSize} (remove ${removeAmount} objects)`,
        `By making this move, the new XOR sum of all piles becomes 0, passing a losing (P) position to the Second Player.`,
        {
          winningPile: i,
          originalSize: piles[i],
          targetSize,
          removeAmount,
          winner: 'First Player',
        },
        i,
        targetSize,
        'First Player'
      );
      break;
    }

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  return steps;
};

export const nimGame: AlgorithmDefinition<NimInput> = {
  id: 'nim-game',
  title: 'Nim Game Sprague-Grundy',
  category: 'game_theory',
  difficulty: 'Medium',
  description:
    'Nim Game algorithm calculates the Sprague-Grundy XOR sum of pile sizes to determine the winning player and identify the optimal winning move in impartial games.',
  code: NIM_GAME_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: DEFAULT_NIM_INPUT,
  generateSteps: generateNimGameSteps,
};
