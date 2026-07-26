import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AlgorithmStep } from '../types/dsa';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { useStepEngine } from '../engine/stepEngine';
import soundEngine from '../engine/soundEngine';
import { deriveStepCue } from '../engine/stepSound';
import { MainLayout } from '../components/MainLayout';
import { useSettings } from '../app/SettingsContext';

export const Route = createFileRoute('/workspace/$algorithmId')({
  beforeLoad: ({ params }) => {
    if (!ALGORITHM_REGISTRY[params.algorithmId]) {
      throw redirect({ to: '/workspace/$algorithmId', params: { algorithmId: 'bubble-sort' } });
    }
  },
  component: WorkspacePage,
});

function WorkspacePage() {
  const { algorithmId } = Route.useParams();
  const { panels, setPanel, soundEnabled, setLastAlgorithmId } = useSettings();

  const [dataSize, setDataSize] = useState<number>(10);
  const [inputSeed, setInputSeed] = useState<number>(1);

  // beforeLoad redirected unknown ids, so the registry lookup always hits.
  const algorithm = ALGORITHM_REGISTRY[algorithmId];

  // Keep the persisted "last visited" id in sync for navbar/drawer navigation.
  useEffect(() => {
    setLastAlgorithmId(algorithmId);
  }, [algorithmId, setLastAlgorithmId]);

  // Random sized inputs only fit algorithms that consume a plain number array;
  // object-shaped inputs (e.g. Two Sum's {nums, target}) keep their curated default.
  const supportsRandomArray =
    algorithm.category === 'arrays_and_hashing' && Array.isArray(algorithm.defaultInput);

  const currentInput = useMemo(() => {
    if (supportsRandomArray) {
      const arr: number[] = [];
      for (let i = 0; i < dataSize; i++) {
        const val = Math.floor(Math.abs(Math.sin(inputSeed * 997 + i * 13)) * 85) + 15;
        arr.push(val);
      }
      return arr;
    }
    return algorithm.defaultInput;
  }, [algorithm, supportsRandomArray, dataSize, inputSeed]);

  const steps = useMemo(() => {
    return algorithm.generateSteps(currentInput);
  }, [algorithm, currentInput]);

  // Ref tracks the last step index that triggered sound (prevents duplicate triggers/echoes)
  const lastHandledStepRef = useRef<number>(-1);
  // The step the listener last heard: cue classification is a delta against it.
  const prevHandledStepRef = useRef<AlgorithmStep | null>(null);

  // A new steps array means a new run, so the delta baseline must not leak across it.
  useEffect(() => {
    lastHandledStepRef.current = -1;
    prevHandledStepRef.current = null;
  }, [steps]);

  const handleStepChange = useCallback(
    (step: AlgorithmStep) => {
      if (lastHandledStepRef.current === step.stepIndex) return;
      const prevStep = prevHandledStepRef.current;
      lastHandledStepRef.current = step.stepIndex;
      // Tracked even while muted so re-enabling sound resumes with a valid baseline.
      prevHandledStepRef.current = step;

      if (!soundEnabled) return;
      soundEngine.playCue(deriveStepCue(step, prevStep, steps.length));
    },
    [soundEnabled, steps.length]
  );

  const {
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    setSpeed,
  } = useStepEngine({
    steps,
    soundEnabled,
    onStepChange: handleStepChange,
  });

  const handleGenerateRandom = () => {
    setInputSeed((prev) => prev + 1);
  };

  return (
    <MainLayout
      algorithm={algorithm}
      currentStep={currentStep}
      panels={panels}
      onToggleTutorial={() => setPanel('tutorial', false)}
      onToggleAuxiliary={() => setPanel('auxiliary', false)}
      controlProps={{
        isPlaying,
        onPlayPause: togglePlay,
        onStepBack: stepBackward,
        onStepForward: stepForward,
        onReset: reset,
        currentStep: currentStepIndex,
        totalSteps,
        speed,
        onSpeedChange: setSpeed,
        dataSize,
        onDataSizeChange: setDataSize,
        onGenerateRandom: handleGenerateRandom,
        supportsCustomSize: supportsRandomArray,
      }}
    />
  );
}
