import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ALGORITHM_REGISTRY } from '../algorithms/registry';
import { useStepEngine } from '../engine/stepEngine';
import { MainLayout } from '../components/MainLayout';
import { useSettings } from '../app/SettingsContext';
import { isDialogOpen, isTypingTarget } from '../app/keyboardGuards';

/* Space activates the focused button or link. Hijacking it there would mean that
   tabbing to any toggle and pressing Space scrubs playback instead of flipping
   that toggle, so the shortcut defers to the element's own activation. */
const activatesOnSpace = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  target.closest('button, [role="button"], a[href], summary') !== null;

export const Route = createFileRoute('/workspace/$algorithmId')({
  beforeLoad: ({ params }) => {
    if (!ALGORITHM_REGISTRY[params.algorithmId]) {
      throw redirect({ to: '/workspace/$algorithmId', params: { algorithmId: 'bubble-sort' } });
    }
  },
  component: WorkspacePage,
});

function WorkspacePage(): React.ReactElement {
  const { algorithmId } = Route.useParams();
  const { panels, setPanel, setLastAlgorithmId, speed: persistedSpeed, setSpeed: setPersistedSpeed } =
    useSettings();

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

  const {
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    togglePlay,
    pause,
    stepForward,
    stepBackward,
    reset,
    setSpeed,
  } = useStepEngine({
    steps,
    // The step engine only reads this once on mount; the persisted value is
    // the user's last-set playback speed, carried across reloads (R6.5-style
    // preference, but app-wide rather than page-scoped — see SettingsContext).
    defaultSpeed: persistedSpeed,
  });

  const handleSpeedChange = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    setPersistedSpeed(nextSpeed);
  };

  /* The engine hands back fresh callbacks as the index and play state move, so the
     listener reads them through a ref: the window binding is installed once
     instead of being torn down and re-added on every tick of playback. */
  const playbackRef = useRef({ stepForward, stepBackward, togglePlay, pause });
  useEffect(() => {
    playbackRef.current = { stepForward, stepBackward, togglePlay, pause };
  }, [stepForward, stepBackward, togglePlay, pause]);

  // R6.6: ArrowRight/ArrowLeft/Space drive playback from anywhere on the workspace.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Modified keys belong to the browser and the OS (Cmd+Left is "back").
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;
      if (isDialogOpen()) return;

      const playback = playbackRef.current;

      /* Stepping takes the wheel: the interval would otherwise keep advancing on
         its own schedule, so ArrowLeft during playback looked like a no-op (the
         next tick undid it) and ArrowRight double-stepped. This is also what the
         step buttons already say by disabling themselves while playing. */
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        playback.pause();
        playback.stepForward();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        playback.pause();
        playback.stepBackward();
        return;
      }
      // ' ' is the standard key value; 'Spacebar' is the legacy Edge/IE spelling.
      if (event.key === ' ' || event.key === 'Spacebar') {
        if (activatesOnSpace(event.target)) return;
        // Without this the page (or the nearest scroller) pages down on every play.
        event.preventDefault();
        playback.togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        onSpeedChange: handleSpeedChange,
        dataSize,
        onDataSizeChange: setDataSize,
        onGenerateRandom: handleGenerateRandom,
        supportsCustomSize: supportsRandomArray,
      }}
    />
  );
}
