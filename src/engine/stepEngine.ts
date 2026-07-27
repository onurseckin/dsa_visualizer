import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AlgorithmDefinition, AlgorithmStep } from "../types/dsa";
import { resolveInput } from "./inputResolver";

interface UseStepEngineOptions {
  algorithm?: AlgorithmDefinition;
  input?: unknown;
  steps?: AlgorithmStep[];
  onStepChange?: (step: AlgorithmStep) => void;
  defaultSpeed?: number;
}

export interface StepEngineControls {
  currentStepIndex: number;
  currentStep: AlgorithmStep | null;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

export function useStepEngine({
  algorithm,
  input,
  steps,
  onStepChange,
  defaultSpeed = 300,
}: UseStepEngineOptions): StepEngineControls {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(defaultSpeed);

  const resolvedSteps = useMemo(() => {
    if (steps) return steps;
    if (algorithm) {
      const inputToUse = input !== undefined ? input : algorithm.defaultInput;
      const actualInput = resolveInput(inputToUse, algorithm.defaultInput);
      return algorithm.generateSteps(actualInput);
    }
    return [];
  }, [algorithm, input, steps]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const stepsRef = useRef(resolvedSteps);
  // Initialized to 0 so the initial index-0 render never notifies (nothing fires on
  // page load); also guards StrictMode's double-invoked effects from double-firing.
  const lastNotifiedIndexRef = useRef<number>(0);

  // Keep refs updated to prevent effect dependency churn
  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    stepsRef.current = resolvedSteps;
  }, [resolvedSteps]);

  const totalSteps = resolvedSteps.length;
  const currentStep = resolvedSteps[currentStepIndex] || null;

  // Fire onStepChange in a clean dedicated effect (outside setState updaters).
  // Only notify when the index actually moved since the last notification.
  useEffect(() => {
    if (currentStepIndex === lastNotifiedIndexRef.current) return;
    lastNotifiedIndexRef.current = currentStepIndex;
    if (stepsRef.current[currentStepIndex] && onStepChangeRef.current) {
      onStepChangeRef.current(stepsRef.current[currentStepIndex]);
    }
  }, [currentStepIndex]);

  // Clear timer helper
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    setIsPlaying(false);
    stopTimer();
  }, [stopTimer]);

  // Step Forward
  const stepForward = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < stepsRef.current.length - 1) {
        return prev + 1;
      } else {
        pause();
        return prev;
      }
    });
  }, [pause]);

  // Step Backward
  const stepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Go to explicit step
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < stepsRef.current.length) {
      setCurrentStepIndex(index);
    }
  }, []);

  // Reset to step 0
  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(0);
  }, [pause]);

  // Play playback
  const play = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    setCurrentStepIndex((prev) => (prev >= stepsRef.current.length - 1 ? 0 : prev));
    setIsPlaying(true);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prevIsPlaying) => {
      if (prevIsPlaying) {
        stopTimer();
        return false;
      }
      if (stepsRef.current.length > 0) {
        setCurrentStepIndex((prevIndex) =>
          prevIndex >= stepsRef.current.length - 1 ? 0 : prevIndex,
        );
        return true;
      }
      return false;
    });
  }, [stopTimer]);

  // Set speed
  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
  }, []);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      stopTimer();
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < stepsRef.current.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speed);
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [isPlaying, speed, stopTimer]);

  // Reset step index if steps array changes; pre-marking index 0 as notified
  // keeps the reset quiet (no notification on algorithm switch).
  useEffect(() => {
    lastNotifiedIndexRef.current = 0;
    setCurrentStepIndex(0);
    setIsPlaying(false);
    stopTimer();
  }, [resolvedSteps, stopTimer]);

  return {
    currentStepIndex,
    currentStep,
    totalSteps,
    isPlaying,
    speed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    goToStep,
    reset,
    setSpeed,
  };
}
