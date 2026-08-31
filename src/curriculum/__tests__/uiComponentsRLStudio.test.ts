import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ReinforcementLearningStudio,
  ACTION_NAMES,
  ACTION_ARROWS,
  ACTION_DELTAS,
  DEFAULT_CARTPOLE_CONFIG,
  GRID_CONFIG_4X4_CLASSIC,
  GRID_CONFIG_CLIFF_WALKING,
  GRID_CONFIG_OBSTACLE_MAZE,
  GRID_CONFIG_SLIPPERY_FROZEN,
  GRIDWORLD_CONFIGS,
  RL_PRESETS,
  coordToStateIndex,
  stateIndexToCoord,
  getGridNextCoord,
  createGridworldMDP,
  stepGridworld,
  computeBellmanOptimalUpdate,
  stepValueIteration,
  solveValueIteration,
  evaluatePolicyIterative,
  evaluatePolicyExact,
  solveLinearSystem,
  improvePolicy,
  solvePolicyIteration,
  qLearningStep,
  selectEpsilonGreedyAction,
  computeEpsilonDecay,
  runQLearningEpisode,
  computeGAE,
  computePPOClippedObjective,
  generatePPOClippingCurve,
  computeSoftmaxLogits,
  computeCartPoleDerivatives,
  stepCartPolePhysics,
  resetCartPole,
  getValueColor,
  type RLPresetId,
  type GridAction,
  type CartPoleState,
} from "../../components/primitives/ReinforcementLearningStudio";

// Deterministic PRNG for reproducible test sequences
function createDeterministicRng(seed = 987654321) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("Reinforcement Learning & Policy Gradient Studio Engine Tests", () => {
  // ==========================================================================
  // 1. Component Instantiation & Presets
  // ==========================================================================
  describe("1. Component Instantiation & Presets", () => {
    it("should instantiate ReinforcementLearningStudio with default props", () => {
      const element = React.createElement(ReinforcementLearningStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ReinforcementLearningStudio);
    });

    it("should instantiate ReinforcementLearningStudio with custom props & callbacks", () => {
      let epCalled = false;
      let convCalled = false;

      const element = React.createElement(ReinforcementLearningStudio, {
        initialAlgorithm: "q_learning",
        initialEnvironment: "cliff_walking",
        initialPreset: "preset_cliff_walking_q",
        width: 960,
        height: 640,
        title: "Cliff Walking Testbench",
        onEpisodeComplete: () => {
          epCalled = true;
        },
        onConvergenceReached: () => {
          convCalled = true;
        },
      });

      expect(element.props.initialAlgorithm).toBe("q_learning");
      expect(element.props.initialEnvironment).toBe("cliff_walking");
      expect(element.props.initialPreset).toBe("preset_cliff_walking_q");
      expect(element.props.width).toBe(960);
      expect(element.props.height).toBe(640);
      expect(element.props.title).toBe("Cliff Walking Testbench");
      expect(typeof element.props.onEpisodeComplete).toBe("function");
      expect(typeof element.props.onConvergenceReached).toBe("function");
      expect(epCalled).toBe(false);
      expect(convCalled).toBe(false);

      element.props.onEpisodeComplete?.(1, 10.0, 5);
      element.props.onConvergenceReached?.("q_learning", 10, 0.0);
      expect(epCalled).toBe(true);
      expect(convCalled).toBe(true);
    });

    it("should register all gridworld configs in GRIDWORLD_CONFIGS", () => {
      expect(GRIDWORLD_CONFIGS.grid_4x4_classic).toEqual(GRID_CONFIG_4X4_CLASSIC);
      expect(GRIDWORLD_CONFIGS.cliff_walking).toEqual(GRID_CONFIG_CLIFF_WALKING);
      expect(GRIDWORLD_CONFIGS.obstacle_maze_5x5).toEqual(GRID_CONFIG_OBSTACLE_MAZE);
      expect(GRIDWORLD_CONFIGS.slippery_frozen_4x4).toEqual(GRID_CONFIG_SLIPPERY_FROZEN);
    });

    it("should provide valid configuration for all defined RL presets", () => {
      const presetIds: RLPresetId[] = [
        "preset_value_iteration_grid",
        "preset_policy_iteration_frozen",
        "preset_cliff_walking_q",
        "preset_maze_td_learning",
        "preset_ppo_gae_grid",
        "preset_cartpole_balance",
        "preset_high_slip_stochastic",
      ];

      for (const pid of presetIds) {
        const p = RL_PRESETS[pid];
        expect(p).toBeDefined();
        expect(p.id).toBe(pid);
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.description.length).toBeGreaterThan(0);
        expect(p.gamma).toBeGreaterThan(0);
        expect(p.gamma).toBeLessThanOrEqual(1.0);
        expect(p.alpha).toBeGreaterThan(0);
        expect(p.epsilon).toBeGreaterThanOrEqual(0);
        expect(p.epsilonMin).toBeGreaterThanOrEqual(0);
        expect(p.epsilonDecay).toBeGreaterThan(0);
        expect(p.gaeLambda).toBeGreaterThanOrEqual(0);
        expect(p.ppoClipEps).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 2. Gridworld Coordinate & MDP Model
  // ==========================================================================
  describe("2. Gridworld Coordinate & MDP Model", () => {
    it("should correctly convert between 2D coordinates and 1D state indices", () => {
      const cols = 5;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < cols; c++) {
          const s = coordToStateIndex(r, c, cols);
          const coord = stateIndexToCoord(s, cols);
          expect(coord.r).toBe(r);
          expect(coord.c).toBe(c);
        }
      }
    });

    it("should bound coordinates within grid boundaries and avoid obstacles", () => {
      const rows = 4;
      const cols = 4;
      const obstacles = [{ r: 1, c: 1 }];

      // Top boundary: moving Up from (0, 2) stays at (0, 2)
      const hitTop = getGridNextCoord(0, 2, 0, rows, cols, obstacles);
      expect(hitTop).toEqual({ r: 0, c: 2 });

      // Left boundary: moving Left from (2, 0) stays at (2, 0)
      const hitLeft = getGridNextCoord(2, 0, 3, rows, cols, obstacles);
      expect(hitLeft).toEqual({ r: 2, c: 0 });

      // Obstacle collision: moving Down from (0, 1) into obstacle (1, 1) stays at (0, 1)
      const hitObs = getGridNextCoord(0, 1, 2, rows, cols, obstacles);
      expect(hitObs).toEqual({ r: 0, c: 1 });

      // Free movement: moving Right from (0, 0) goes to (0, 1)
      const freeMove = getGridNextCoord(0, 0, 1, rows, cols, obstacles);
      expect(freeMove).toEqual({ r: 0, c: 1 });
    });

    it("should construct valid Gridworld MDP transition matrices with probabilities summing to 1.0", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      expect(mdp.numStates).toBe(16);
      expect(mdp.numActions).toBe(4);

      for (let s = 0; s < mdp.numStates; s++) {
        for (let a = 0; a < mdp.numActions; a++) {
          const outcomes = mdp.transitions[s][a];
          expect(outcomes.length).toBeGreaterThan(0);
          const sumProb = outcomes.reduce((acc, o) => acc + o.prob, 0);
          expect(Math.abs(sumProb - 1.0)).toBeLessThan(1e-6);
        }
      }
    });

    it("should simulate stochastic environment steps respecting slip probability", () => {
      const rng = createDeterministicRng(42);
      const mdp = createGridworldMDP(GRID_CONFIG_SLIPPERY_FROZEN);
      const s = 0;
      const a: GridAction = 1; // Right

      let countTarget = 0;
      const N = 500;
      for (let i = 0; i < N; i++) {
        const res = stepGridworld(s, a, mdp, rng);
        expect(res.nextState).toBeGreaterThanOrEqual(0);
        expect(res.nextState).toBeLessThan(mdp.numStates);
        if (res.nextState === 1) countTarget++;
      }

      // With slipProb = 0.33, intended action prob is ~0.67
      const fraction = countTarget / N;
      expect(fraction).toBeGreaterThan(0.5);
      expect(fraction).toBeLessThan(0.8);
    });
  });

  // ==========================================================================
  // 3. Bellman Optimality Operator & Contraction Property
  // ==========================================================================
  describe("3. Bellman Optimality Operator & Contraction Mapping", () => {
    it("should evaluate Bellman optimality operator T*(V)(s) correctly", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const V = new Array<number>(mdp.numStates).fill(0);
      const gamma = 0.95;

      const res = computeBellmanOptimalUpdate(mdp.startStateIndex, V, mdp, gamma);
      expect(res.value).toBeDefined();
      expect(res.qValues.length).toBe(4);
      expect(res.bestAction).toBeGreaterThanOrEqual(0);
      expect(res.bestAction).toBeLessThan(4);
    });

    it("should satisfy the Bellman Contraction Mapping Theorem: ||T(V1) - T(V2)||_inf <= gamma ||V1 - V2||_inf", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const gamma = 0.9;
      const rng = createDeterministicRng(101);

      // Generate two random value vectors V1 and V2
      const V1 = Array.from({ length: mdp.numStates }, () => rng() * 10 - 5);
      const V2 = Array.from({ length: mdp.numStates }, () => rng() * 10 - 5);

      // Compute ||V1 - V2||_inf
      let distV = 0.0;
      for (let s = 0; s < mdp.numStates; s++) {
        const diff = Math.abs(V1[s] - V2[s]);
        if (diff > distV) distV = diff;
      }

      // Apply Bellman Operator T*(V1) and T*(V2)
      const TV1 = stepValueIteration(V1, mdp, gamma).nextV;
      const TV2 = stepValueIteration(V2, mdp, gamma).nextV;

      // Compute ||TV1 - TV2||_inf
      let distTV = 0.0;
      for (let s = 0; s < mdp.numStates; s++) {
        const diff = Math.abs(TV1[s] - TV2[s]);
        if (diff > distTV) distTV = diff;
      }

      // Contraction inequality check
      expect(distTV).toBeLessThanOrEqual(gamma * distV + 1e-9);
    });
  });

  // ==========================================================================
  // 4. Value Iteration Convergence
  // ==========================================================================
  describe("4. Value Iteration Solver", () => {
    it("should perform single iteration step and record positive residual", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const V = new Array<number>(mdp.numStates).fill(0);
      const step = stepValueIteration(V, mdp, 0.95);

      expect(step.nextV.length).toBe(16);
      expect(step.policy.length).toBe(16);
      expect(step.residual).toBeGreaterThan(0);
      expect(step.qTable.length).toBe(16);
    });

    it("should converge monotonically on 4x4 Classic Gridworld", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const res = solveValueIteration(mdp, 0.95, 1e-4, 300);

      expect(res.converged).toBe(true);
      expect(res.iterations).toBeGreaterThan(1);
      expect(res.iterations).toBeLessThan(100);

      // Goal state V(goal) = 0 because it's absorbing terminal
      const goalState = coordToStateIndex(3, 3, 4);
      expect(res.values[goalState]).toBe(0);

      // State right adjacent to goal (3, 2) should have high value
      const preGoalState = coordToStateIndex(3, 2, 4);
      expect(res.values[preGoalState]).toBeGreaterThan(0.5);

      // Optimal policy at pre-goal state (3, 2) should be Right (action 1)
      expect(res.policy[preGoalState]).toBe(1);
    });

    it("should solve Cliff Walking environment without falling into cliff", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_CLIFF_WALKING);
      const res = solveValueIteration(mdp, 0.99, 1e-4, 500);

      expect(res.converged).toBe(true);
      const startState = coordToStateIndex(3, 0, 8);
      // Value at start should be negative due to step penalties, but much better than -100 cliff
      expect(res.values[startState]).toBeGreaterThan(-30);
    });
  });

  // ==========================================================================
  // 5. Policy Iteration & Exact Linear Solvers
  // ==========================================================================
  describe("5. Policy Iteration & Exact Matrix Solvers", () => {
    it("should solve linear systems A x = b accurately via Gaussian elimination", () => {
      const A = [
        [3, 2, -1],
        [2, -2, 4],
        [-1, 0.5, -1],
      ];
      const b = [1, -2, 0];

      const x = solveLinearSystem(A, b);
      expect(x.length).toBe(3);

      // Verify A * x == b
      for (let i = 0; i < 3; i++) {
        const dot = A[i][0] * x[0] + A[i][1] * x[1] + A[i][2] * x[2];
        expect(Math.abs(dot - b[i])).toBeLessThan(1e-6);
      }
    });

    it("should match exact matrix policy evaluation against iterative evaluation", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const policy: GridAction[] = new Array<GridAction>(mdp.numStates).fill(1); // all Right
      const gamma = 0.9;

      const vIterative = evaluatePolicyIterative(policy, mdp, gamma, 1e-6, 400);
      const vExact = evaluatePolicyExact(policy, mdp, gamma);

      for (let s = 0; s < mdp.numStates; s++) {
        expect(Math.abs(vIterative[s] - vExact[s])).toBeLessThan(1e-4);
      }
    });

    it("should extract improved greedy policy via improvePolicy", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const vi = solveValueIteration(mdp, 0.95, 1e-4, 300);
      const imp = improvePolicy(vi.values, mdp, 0.95);

      expect(imp.newPolicy.length).toBe(16);
      expect(imp.qTable.length).toBe(16);
      // Pre-goal state (3,2) should pick Right (action 1)
      const preGoal = coordToStateIndex(3, 2, 4);
      expect(imp.newPolicy[preGoal]).toBe(1);
    });

    it("should improve policy and converge to optimal policy via Policy Iteration", () => {
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const res = solvePolicyIteration(mdp, 0.95, 1e-4, 50);

      expect(res.converged).toBe(true);
      expect(res.iterations).toBeGreaterThanOrEqual(1);
      expect(res.iterations).toBeLessThan(20);

      // Policy iteration values should match Value Iteration values closely
      const viRes = solveValueIteration(mdp, 0.95, 1e-4, 300);
      for (let s = 0; s < mdp.numStates; s++) {
        expect(Math.abs(res.values[s] - viRes.values[s])).toBeLessThan(1e-3);
      }
    });
  });

  // ==========================================================================
  // 6. Watkins Q-Learning Engine
  // ==========================================================================
  describe("6. Watkins Q-Learning Engine", () => {
    it("should perform Q-learning TD update correctly", () => {
      const qTable = [
        [0.0, 0.0, 0.0, 0.0],
        [1.0, 2.0, 3.0, 4.0],
      ];
      const s = 0;
      const a: GridAction = 1;
      const r = 10.0;
      const nextS = 1;
      const done = false;
      const alpha = 0.5;
      const gamma = 0.9;

      // Target = r + gamma * max(qTable[1]) = 10 + 0.9 * 4.0 = 13.6
      // TD Error = 13.6 - 0.0 = 13.6
      // Updated Q = 0 + 0.5 * 13.6 = 6.8
      const step = qLearningStep(s, a, r, nextS, done, qTable, alpha, gamma);
      expect(step.target).toBeCloseTo(13.6, 5);
      expect(step.tdError).toBeCloseTo(13.6, 5);
      expect(step.updatedQ).toBeCloseTo(6.8, 5);
    });

    it("should zero future value upon terminal transition", () => {
      const qTable = [
        [0.0, 0.0, 0.0, 0.0],
        [5.0, 5.0, 5.0, 5.0],
      ];
      const s = 0;
      const a: GridAction = 2;
      const r = -1.0;
      const nextS = 1;
      const done = true; // terminal!
      const alpha = 0.2;
      const gamma = 0.95;

      // Target = -1 + 0 = -1
      const step = qLearningStep(s, a, r, nextS, done, qTable, alpha, gamma);
      expect(step.target).toBe(-1.0);
      expect(step.updatedQ).toBeCloseTo(-0.2, 5);
    });

    it("should select greedy action when epsilon is 0 and explore when epsilon is 1", () => {
      const rng = createDeterministicRng(555);
      const qValues = [1.0, 5.0, 2.0, 0.0];

      // Greedy (epsilon = 0) -> must always pick index 1
      for (let i = 0; i < 20; i++) {
        const act = selectEpsilonGreedyAction(qValues, 0.0, rng);
        expect(act).toBe(1);
      }

      // Random exploration (epsilon = 1) -> picks varied actions
      const counts = [0, 0, 0, 0];
      for (let i = 0; i < 400; i++) {
        const act = selectEpsilonGreedyAction(qValues, 1.0, rng);
        counts[act]++;
      }
      for (let a = 0; a < 4; a++) {
        expect(counts[a]).toBeGreaterThan(40);
      }
    });

    it("should decay epsilon properly over episodes", () => {
      const eps0 = 1.0;
      const epsMin = 0.05;
      const decay = 0.9;

      expect(computeEpsilonDecay(eps0, epsMin, decay, 0)).toBe(1.0);
      expect(computeEpsilonDecay(eps0, epsMin, decay, 1)).toBeCloseTo(0.9, 5);
      expect(computeEpsilonDecay(eps0, epsMin, decay, 2)).toBeCloseTo(0.81, 5);
      // Deep in training, epsilon must not drop below epsMin
      expect(computeEpsilonDecay(eps0, epsMin, decay, 100)).toBe(0.05);
    });

    it("should run full Q-learning episode successfully and return trajectory", () => {
      const rng = createDeterministicRng(777);
      const mdp = createGridworldMDP(GRID_CONFIG_4X4_CLASSIC);
      const qTable: number[][] = Array.from({ length: mdp.numStates }, () => [0, 0, 0, 0]);

      const epRes = runQLearningEpisode(mdp, qTable, 0.2, 0.95, 0.1, 100, rng);
      expect(epRes.steps).toBeGreaterThan(0);
      expect(epRes.trajectory.length).toBe(epRes.steps + 1);
      expect(epRes.tdErrors.length).toBe(epRes.steps);
    });
  });

  // ==========================================================================
  // 7. Generalized Advantage Estimator (GAE)
  // ==========================================================================
  describe("7. Generalized Advantage Estimator (GAE)", () => {
    it("should reduce to 1-step TD advantage when lambda = 0", () => {
      const rewards = [1.0, 2.0, 3.0];
      const values = [0.5, 1.0, 1.5];
      const dones = [false, false, true];
      const gamma = 0.9;
      const lambda = 0.0; // GAE(gamma, 0) == 1-step TD!

      const gae = computeGAE(rewards, values, dones, gamma, lambda, 0.0);

      // delta_0 = r_0 + gamma * V_1 - V_0 = 1.0 + 0.9 * 1.0 - 0.5 = 1.4
      // delta_1 = r_1 + gamma * V_2 - V_1 = 2.0 + 0.9 * 1.5 - 1.0 = 2.35
      // delta_2 = r_2 + gamma * 0 (done) - V_2 = 3.0 - 1.5 = 1.5
      expect(gae.advantages[0]).toBeCloseTo(1.4, 5);
      expect(gae.advantages[1]).toBeCloseTo(2.35, 5);
      expect(gae.advantages[2]).toBeCloseTo(1.5, 5);
    });

    it("should reduce to Monte Carlo return advantage when lambda = 1", () => {
      const rewards = [1.0, 1.0, 1.0];
      const values = [0.0, 0.0, 0.0];
      const dones = [false, false, true];
      const gamma = 1.0;
      const lambda = 1.0; // GAE(1, 1) == Monte Carlo G_t - V(s_t)!

      const gae = computeGAE(rewards, values, dones, gamma, lambda, 0.0);

      // Returns G_0 = 3.0, G_1 = 2.0, G_2 = 1.0
      expect(gae.advantages[0]).toBeCloseTo(3.0, 5);
      expect(gae.advantages[1]).toBeCloseTo(2.0, 5);
      expect(gae.advantages[2]).toBeCloseTo(1.0, 5);
    });

    it("should verify recursive backward advantage relationship: A_t = delta_t + gamma * lambda * A_{t+1}", () => {
      const rewards = [1.0, 2.0, 3.0, 4.0];
      const values = [0.2, 0.4, 0.6, 0.8];
      const dones = [false, false, false, true];
      const gamma = 0.95;
      const lambda = 0.8;

      const gae = computeGAE(rewards, values, dones, gamma, lambda, 0.0);

      for (let t = 0; t < 3; t++) {
        const expected = gae.tdErrors[t] + gamma * lambda * gae.advantages[t + 1];
        expect(gae.advantages[t]).toBeCloseTo(expected, 6);
      }
    });
  });

  // ==========================================================================
  // 8. PPO Clipped Surrogate Objective
  // ==========================================================================
  describe("8. PPO Clipped Surrogate Objective", () => {
    const clipEps = 0.2; // [0.8, 1.2]

    it("should not clip when ratio is within [1-eps, 1+eps]", () => {
      const adv = 1.5;
      const ratio = 1.05; // inside [0.8, 1.2]

      const res = computePPOClippedObjective(ratio, adv, clipEps);
      expect(res.isClipped).toBe(false);
      expect(res.objective).toBeCloseTo(1.05 * 1.5, 5);
      expect(res.clipped).toBeCloseTo(1.05 * 1.5, 5);
    });

    it("should clip upper bound when Advantage > 0 and ratio > 1+eps", () => {
      const adv = 2.0;
      const ratio = 1.5; // > 1.2

      const res = computePPOClippedObjective(ratio, adv, clipEps);
      expect(res.isClipped).toBe(true);
      expect(res.unclipped).toBeCloseTo(3.0, 5);
      expect(res.clipped).toBeCloseTo(1.2 * 2.0, 5); // 2.4
      expect(res.objective).toBeCloseTo(2.4, 5);
    });

    it("should clip lower bound when Advantage < 0 and ratio < 1-eps", () => {
      const adv = -2.0;
      const ratio = 0.5; // < 0.8

      const res = computePPOClippedObjective(ratio, adv, clipEps);
      expect(res.isClipped).toBe(true);
      expect(res.unclipped).toBeCloseTo(-1.0, 5); // 0.5 * -2 = -1.0
      expect(res.clipped).toBeCloseTo(0.8 * -2.0, 5); // -1.6
      expect(res.objective).toBeCloseTo(-1.6, 5); // min(-1.0, -1.6) = -1.6
    });

    it("should generate continuous clipping curve sweep points", () => {
      const points = generatePPOClippingCurve(1.0, 0.2, 0.0, 2.0, 21);
      expect(points.length).toBe(21);
      expect(points[0].ratio).toBe(0.0);
      expect(points[20].ratio).toBe(2.0);

      // Verify that for all ratio >= 1.2, objective is flat at 1.2 * 1.0 = 1.2
      for (const pt of points) {
        if (pt.ratio >= 1.2) {
          expect(pt.objective).toBeCloseTo(1.2, 4);
        }
      }
    });

    it("should compute softmax probabilities with temperature scaling", () => {
      const logits = [1.0, 2.0, 3.0];
      const probs = computeSoftmaxLogits(logits, 1.0);

      const sumP = probs.reduce((acc, p) => acc + p, 0);
      expect(sumP).toBeCloseTo(1.0, 6);
      expect(probs[2]).toBeGreaterThan(probs[1]);
      expect(probs[1]).toBeGreaterThan(probs[0]);

      // High temperature -> approaches uniform [1/3, 1/3, 1/3]
      const highTempProbs = computeSoftmaxLogits(logits, 100.0);
      expect(highTempProbs[0]).toBeCloseTo(0.333, 2);
      expect(highTempProbs[1]).toBeCloseTo(0.333, 2);
      expect(highTempProbs[2]).toBeCloseTo(0.333, 2);
    });
  });

  // ==========================================================================
  // 9. CartPole Non-Linear Physics Dynamics
  // ==========================================================================
  describe("9. CartPole Non-Linear Physics Dynamics", () => {
    it("should evaluate zero angular acceleration at upright equilibrium with zero force", () => {
      const state: CartPoleState = {
        x: 0,
        xDot: 0,
        theta: 0,
        thetaDot: 0,
      };

      const derivs = computeCartPoleDerivatives(state, 1, DEFAULT_CARTPOLE_CONFIG);
      expect(derivs[0]).toBe(0); // xDot
      expect(derivs[2]).toBe(0); // thetaDot
      // With force applied, cart accelerates and pole accelerates inversely
      expect(Math.abs(derivs[1])).toBeGreaterThan(0);
      expect(Math.abs(derivs[3])).toBeGreaterThan(0);
    });

    it("should step CartPole physics and check termination bounds", () => {
      const state: CartPoleState = {
        x: 2.39,
        xDot: 1.0,
        theta: 0.05,
        thetaDot: 0.1,
      };

      // Moving right with x=2.39 + dt*1.0 will cross 2.4m limit -> done!
      const res = stepCartPolePhysics(state, 1, DEFAULT_CARTPOLE_CONFIG);
      expect(res.nextState.x).toBeGreaterThan(2.4);
      expect(res.done).toBe(true);
      expect(res.reward).toBe(0.0);
    });

    it("should reset CartPole near upright equilibrium with small perturbations", () => {
      const rng = createDeterministicRng(999);
      for (let i = 0; i < 20; i++) {
        const s = resetCartPole(rng);
        expect(Math.abs(s.x)).toBeLessThan(0.05);
        expect(Math.abs(s.xDot)).toBeLessThan(0.05);
        expect(Math.abs(s.theta)).toBeLessThan(0.05);
        expect(Math.abs(s.thetaDot)).toBeLessThan(0.05);
      }
    });
  });

  // ==========================================================================
  // 10. Visualization & Color Helpers
  // ==========================================================================
  describe("10. Visualization & Color Helpers", () => {
    it("should generate valid color strings for min, mid, and max scalar values", () => {
      const colMin = getValueColor(0.0, 0.0, 10.0);
      const colMid = getValueColor(5.0, 0.0, 10.0);
      const colMax = getValueColor(10.0, 0.0, 10.0);

      expect(colMin).toContain("rgba(");
      expect(colMid).toContain("rgba(");
      expect(colMax).toContain("rgba(");
    });

    it("should export action metadata arrays with length 4", () => {
      expect(ACTION_NAMES.length).toBe(4);
      expect(ACTION_ARROWS.length).toBe(4);
      expect(ACTION_DELTAS.length).toBe(4);
    });
  });
});
