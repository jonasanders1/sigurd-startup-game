import React, { useEffect, useState, useRef } from "react";
import Menu from "../Menu";
import { LoadingProgress } from "../../../managers/LoadingManager";
import { logger } from "../../../lib/logger";

interface LoadingMenuProps {
  onLoadingComplete: () => void;
  loadingManager: {
    load: () => Promise<void>;
    setProgressCallback: (
      callback: (progress: LoadingProgress) => void
    ) => void;
    getProgress: () => LoadingProgress;
  };
}

const LoadingMenu: React.FC<LoadingMenuProps> = ({
  onLoadingComplete,
  loadingManager,
}) => {
  const [progress, setProgress] = useState<LoadingProgress>({
    currentStep: "",
    currentMessage: "Starter opp...",
    progress: 0,
    isComplete: false,
  });

  const [dotAnimation, setDotAnimation] = useState("");
  const hasStartedLoading = useRef(false);
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up dot animation for visual feedback
    let dots = 0;
    animationInterval.current = setInterval(() => {
      dots = (dots + 1) % 4;
      setDotAnimation(".".repeat(dots));
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
        logger.asset("Loading complete, notifying parent component");
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
        logger.error("Loading failed:", error);
        setProgress({
          currentStep: "error",
          currentMessage: "Lasting feilet. Vennligst last siden på nytt.",
          progress: 0,
          isComplete: false,
          error: error instanceof Error ? error.message : "Unknown error",
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
    if (progress.error) return "bg-destructive";
    if (progress.isComplete) return "bg-primary";
    if (progress.progress > 66) return "bg-primary-light";
    if (progress.progress > 33) return "bg-primary";
    return "bg-primary-dark";
  };

  // Calculate actual width for smooth animation
  const progressWidth = Math.min(Math.max(progress.progress, 0), 100);

  return (
    <Menu showShortcuts={false}>
      <div className="flex flex-col items-center justify-center p-8 max-w-lg w-full">
        {/* Logo or Title */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-pixel">
            Sigurd Startup
          </h1>
          <p className="text-muted-foreground text-sm">
            Forbereder din gründerreise
          </p>
        </div>

        {/* Loading Spinner/Animation */}
        <div className="mb-6">
          {!progress.error ? (
            <div className="relative w-24 h-24">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

              {/* Inner pulsing circle */}
              <div className="absolute inset-4 rounded-full bg-primary/20 animate-pulse"></div>

              {/* Center icon or percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-foreground font-bold text-lg font-mono">
                  {progress.progress}%
                </span>
              </div>
            </div>
          ) : (
            // Error icon
            <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-destructive"
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
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center mb-4">
          <p className="text-foreground text-lg font-medium font-mono">
            {progress.currentMessage}
            {!progress.error && !progress.isComplete && dotAnimation}
          </p>
          {progress.currentStep && !progress.error && (
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              {getStepDescription(progress.currentStep)}
            </p>
          )}
        </div>

        {/* Error Details */}
        {progress.error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm font-mono">
              Feilmelding: {progress.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-lg transition-colors font-mono"
            >
              Last på nytt
            </button>
          </div>
        )}
      </div>
    </Menu>
  );
};

// Helper function for step descriptions
const getStepDescription = (stepId: string): string => {
  const descriptions: Record<string, string> = {
    "host-communication": "Etablerer forbindelse",
    "background-images": "Klargjør spillverdener",
    "player-sprites": "Vekker Sigurd til live",
    "monster-sprites": "Forbereder utfordringer",
    "ui-sprites": "Bygger grensesnitt",
    "audio-files": "Tuner inn lydlandskap",
    "map-data": "Kartlegger reisen",
    finalization: "Siste forberedelser",
    complete: "Alt klart!",
  };
  return descriptions[stepId] || "";
};

export default LoadingMenu;
