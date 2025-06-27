import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
  duration?: number;
  steps?: number;
  easing?: 'linear' | 'ease-out' | 'ease-in' | 'ease-in-out' | 'gentle-ease-out';
  delay?: number;
  onComplete?: () => void;
}

export const useAnimatedCounter = (
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) => {
  const {
    duration = 3000,
    steps = 60,
    easing = 'ease-out',
    delay = 0,
    onComplete
  } = options;

  const [animatedValue, setAnimatedValue] = useState(0);
  const hasCompleted = useRef(false);
  const lastTargetValue = useRef(targetValue);

  useEffect(() => {
    if (targetValue === 0) {
      setAnimatedValue(0);
      hasCompleted.current = false;
      return;
    }

    // Reset if target value changed (new bonus screen)
    if (lastTargetValue.current !== targetValue) {
      hasCompleted.current = false;
      setAnimatedValue(0);
      lastTargetValue.current = targetValue;
    }

    // If animation already completed for this target value, just return the final value
    if (hasCompleted.current) {
      setAnimatedValue(targetValue);
      return;
    }

    // Add a small delay before starting animation
    const startTimer = setTimeout(() => {
      // Calculate step duration to ensure consistent animation time
      // regardless of target value - all animations will take exactly 'duration' milliseconds
      const stepDuration = duration / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        
        // Calculate progress (0 to 1) - this ensures consistent timing
        // regardless of whether target is 10,000 or 50,000
        const progress = currentStep / steps;
        
        // Apply easing function
        let easedProgress: number;
        switch (easing) {
          case 'linear':
            easedProgress = progress;
            break;
          case 'ease-out':
            // Use quadratic ease-out for gentler animation
            easedProgress = 1 - (1 - progress) * (1 - progress);
            break;
          case 'gentle-ease-out':
            // Custom easing: starts faster, ends slower but not as dramatic
            easedProgress = 1 - Math.pow(1 - progress, 1.5);
            break;
          case 'ease-in':
            easedProgress = progress * progress;
            break;
          case 'ease-in-out':
            easedProgress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            break;
          default:
            easedProgress = 1 - (1 - progress) * (1 - progress);
        }
        
        // Calculate smooth decimal value
        const smoothValue = targetValue * easedProgress;
        // Round to nearest integer for display
        const displayValue = Math.round(smoothValue);
        
        setAnimatedValue(displayValue);
        
        if (currentStep >= steps) {
          setAnimatedValue(targetValue);
          hasCompleted.current = true;
          clearInterval(timer);
          // Call onComplete callback when animation finishes
          if (onComplete) {
            onComplete();
          }
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [targetValue, duration, steps, easing, delay, onComplete]);

  return animatedValue;
}; 