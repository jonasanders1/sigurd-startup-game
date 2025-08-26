import React, { useEffect, useState, useRef } from 'react';
import Menu from '../Menu';
import { LoadingProgress } from '../../../managers/LoadingManager';
import { logger } from '../../../lib/logger';

interface LoadingMenuProps {
  onLoadingComplete: () => void;
  loadingManager: {
    load: () => Promise<void>;
    setProgressCallback: (callback: (progress: LoadingProgress) => void) => void;
    getProgress: () => LoadingProgress;
  };
}

const LoadingMenu: React.FC<LoadingMenuProps> = ({ onLoadingComplete, loadingManager }) => {
  const [progress, setProgress] = useState<LoadingProgress>({
    currentStep: '',
    currentMessage: 'Starter opp...',
    progress: 0,
    isComplete: false,
  });

  const [dotAnimation, setDotAnimation] = useState('');
  const hasStartedLoading = useRef(false);
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up dot animation for visual feedback
    let dots = 0;
    animationInterval.current = setInterval(() => {
      dots = (dots + 1) % 4;
      setDotAnimation('.'.repeat(dots));
    }, 500);

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Prevent multiple loading attempts
    if (hasStartedLoading.current) return;
    hasStartedLoading.current = true;

    // Set up progress callback
    loadingManager.setProgressCallback((newProgress: LoadingProgress) => {
      setProgress(newProgress);
      
      if (newProgress.isComplete) {
        logger.asset('Loading complete, notifying parent component');
        // Small delay to show the completion message
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    });

    // Start loading process
    const startLoading = async () => {
      try {
        await loadingManager.load();
      } catch (error) {
        logger.error('Loading failed:', error);
        setProgress({
          currentStep: 'error',
          currentMessage: 'Lasting feilet. Vennligst last siden på nytt.',
          progress: 0,
          isComplete: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Start loading after a brief delay for UI to render
    setTimeout(() => {
      startLoading();
    }, 100);
  }, [loadingManager, onLoadingComplete]);

  // Determine progress bar color based on state
  const getProgressBarColor = () => {
    if (progress.error) return 'bg-red-500';
    if (progress.isComplete) return 'bg-green-500';
    if (progress.progress > 66) return 'bg-blue-400';
    if (progress.progress > 33) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  // Calculate actual width for smooth animation
  const progressWidth = Math.min(Math.max(progress.progress, 0), 100);

  return (
    <Menu>
      <div className="flex flex-col items-center justify-center p-8 max-w-lg w-full">
        {/* Logo or Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Sigurd Startup</h1>
          <p className="text-gray-300 text-sm">Forbereder din gründerreise</p>
        </div>

        {/* Loading Spinner/Animation */}
        <div className="mb-6">
          {!progress.error ? (
            <div className="relative w-24 h-24">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 rounded-full bg-blue-500/20 animate-pulse"></div>
              
              {/* Center icon or percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {progress.progress}%
                </span>
              </div>
            </div>
          ) : (
            // Error icon
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-4">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center mb-4">
          <p className="text-white text-lg font-medium">
            {progress.currentMessage}{!progress.error && !progress.isComplete && dotAnimation}
          </p>
          {progress.currentStep && !progress.error && (
            <p className="text-gray-400 text-sm mt-1">
              {getStepDescription(progress.currentStep)}
            </p>
          )}
        </div>

        {/* Error Details */}
        {progress.error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              Feilmelding: {progress.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Last på nytt
            </button>
          </div>
        )}

        {/* Loading Tips */}
        {!progress.error && !progress.isComplete && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs italic">
              {getLoadingTip(progress.progress)}
            </p>
          </div>
        )}
      </div>
    </Menu>
  );
};

// Helper function for step descriptions
const getStepDescription = (stepId: string): string => {
  const descriptions: Record<string, string> = {
    'host-communication': 'Etablerer forbindelse',
    'background-images': 'Klargjør spillverdener',
    'player-sprites': 'Vekker Sigurd til live',
    'monster-sprites': 'Forbereder utfordringer',
    'ui-sprites': 'Bygger grensesnitt',
    'audio-files': 'Tuner inn lydlandskap',
    'map-data': 'Kartlegger reisen',
    'finalization': 'Siste forberedelser',
    'complete': 'Alt klart!',
  };
  return descriptions[stepId] || '';
};

// Helper function for loading tips
const getLoadingTip = (progress: number): string => {
  const tips = [
    'Visste du at Sigurd må navigere gjennom 6 forskjellige norske institusjoner?',
    'Tips: Hold mellomromstasten for å flyte gjennom luften!',
    'Samle alle dokumenter i riktig rekkefølge for bonuspoeng!',
    'Pass deg for Byråkrat-klonen - den følger alltid samme rute.',
    'Hodeløs konsulent beveger seg uforutsigbart - vær forsiktig!',
    'Skatte-spøkelset kan fly gjennom plattformer.',
    'Power mode lar deg samle mynter raskere!',
    'Jo flere dokumenter du samler korrekt, jo høyere multiplikator!',
  ];
  
  // Select tip based on progress
  const tipIndex = Math.floor((progress / 100) * tips.length);
  return tips[Math.min(tipIndex, tips.length - 1)];
};

export default LoadingMenu;