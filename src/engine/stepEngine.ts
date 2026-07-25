import { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmStep } from '../types/dsa';

interface UseStepEngineOptions {
  steps: AlgorithmStep[];
  soundEnabled: boolean;
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
  steps,
  onStepChange,
  defaultSpeed = 300,
}: UseStepEngineOptions): StepEngineControls {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(defaultSpeed);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onStepChangeRef = useRef(onStepChange);
  const stepsRef = useRef(steps);

  // Keep refs updated to prevent effect dependency churn
  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || null;

  // Fire onStepChange in a clean dedicated effect (outside setState updaters)
  useEffect(() => {
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
  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < stepsRef.current.length) {
        setCurrentStepIndex(index);
      }
    },
    []
  );

  // Reset to step 0
  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(0);
  }, [pause]);

  // Play playback
  const play = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    if (currentStepIndex >= stepsRef.current.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

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

  // Reset step index if steps array changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    stopTimer();
  }, [steps, stopTimer]);

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
