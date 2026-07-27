import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VectorVisualizer } from "../../../components/primitives/VectorVisualizer";
import { generateMarkovChainsSteps, DEFAULT_MARKOV_CHAINS_INPUT } from "../markovChains";
import type { VectorVisualSnapshot } from "../../../types/dsa";

describe("markovChains React component spec", () => {
  it("renders VectorVisualizer with generated markov chain snapshot", () => {
    const steps = generateMarkovChainsSteps(DEFAULT_MARKOV_CHAINS_INPUT);
    const snapshot = steps[0].primarySnapshot as VectorVisualSnapshot;

    render(
      <VectorVisualizer vectors={snapshot.vectors} planeTitle="Markov Chains & Random Walks" />,
    );

    expect(screen.getByText("Markov Chains & Random Walks")).toBeInTheDocument();
  });

  it("simulates steps cleanly without crashing", () => {
    const steps = generateMarkovChainsSteps({
      numStates: 2,
      transitionMatrix: [
        [0.8, 0.2],
        [0.1, 0.9],
      ],
      initialDistribution: [1, 0],
      steps: 3,
    });
    expect(steps.length).toBeGreaterThan(1);
  });
});
