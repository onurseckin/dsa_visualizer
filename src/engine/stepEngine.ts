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

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || null;

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
      if (prev < steps.length - 1) {
        const next = prev + 1;
        if (onStepChange && steps[next]) {
          onStepChange(steps[next]);
        }
        return next;
      } else {
        pause();
        return prev;
      }
    });
  }, [steps, onStepChange, pause]);

  // Step Backward
  const stepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev > 0) {
        const next = prev - 1;
        if (onStepChange && steps[next]) {
          onStepChange(steps[next]);
        }
        return next;
      }
      return prev;
    });
  }, [steps, onStepChange]);

  // Go to explicit step
  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentStepIndex(index);
        if (onStepChange && steps[index]) {
          onStepChange(steps[index]);
        }
      }
    },
    [steps, onStepChange]
  );

  // Reset to step 0
  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(0);
    if (onStepChange && steps[0]) {
      onStepChange(steps[0]);
    }
  }, [pause, steps, onStepChange]);

  // Play playback
  const play = useCallback(() => {
    if (steps.length === 0) return;
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [steps.length, currentStepIndex]);

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
          if (prev < steps.length - 1) {
            const next = prev + 1;
            if (onStepChange && steps[next]) {
              onStepChange(steps[next]);
            }
            return next;
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
  }, [isPlaying, speed, steps, onStepChange, stopTimer]);

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
