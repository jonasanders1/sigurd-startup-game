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
    if (hasStartedLoading.current) return;
    hasStartedLoading.current = true;

    loadingManager.setProgressCallback((newProgress: LoadingProgress) => {
      setProgress(newProgress);

      if (newProgress.isComplete) {
        logger.asset("Loading complete, notifying parent component");
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    });

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

    setTimeout(() => {
      startLoading();
    }, 100);
  }, [loadingManager, onLoadingComplete]);

  const getProgressBarColor = () => {
    if (progress.error) return "bg-destructive";
    if (progress.isComplete) return "bg-primary";
    if (progress.progress > 66) return "bg-primary-light";
    if (progress.progress > 33) return "bg-primary";
    return "bg-primary-dark";
  };

  const progressWidth = Math.min(Math.max(progress.progress, 0), 100);

  return (
    <Menu showShortcuts={false}>
      <div className="flex flex-col items-center justify-center p-8 max-w-lg w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-pixel text-foreground tracking-wide mb-2">
            SIGURD STARTUP
          </h1>
          <p className="text-[var(--foreground-dim)] text-sm font-mono">
            Frobotereder din gründerreise
          </p>
        </div>

        <div className="mb-6">
          {!progress.error ? (
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-primary/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-foreground font-pixel text-lg">
                  {progress.progress}%
                </span>
              </div>
            </div>
          ) : (
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

        <div className="w-full mb-4">
          <div className="w-full h-1.5 bg-[var(--surface)] border border-[var(--surface-line)] rounded-sm overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-out`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-foreground text-base font-mono">
            {progress.currentMessage}
            {!progress.error && !progress.isComplete && dotAnimation}
          </p>
          {progress.currentStep && !progress.error && (
            <p className="text-[var(--foreground-dim)] text-sm mt-1 font-mono">
              {getStepDescription(progress.currentStep)}
            </p>
          )}
        </div>

        {progress.error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-sm">
            <p className="text-destructive text-sm font-mono">
              Feilmelding: {progress.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-destructive text-white rounded-sm font-pixel tracking-wide text-sm arcade-press"
            >
              LAST PÅ NYTT
            </button>
          </div>
        )}
      </div>
    </Menu>
  );
};

const getStepDescription = (stepId: string): string => {
  const descriptions: Record<string, string> = {
    "host-communication": "Etablerer frobotindelse",
    "background-images": "Klargjør spillverdener",
    "player-sprites": "Vekker Sigurd til live",
    "monster-sprites": "Frobotereder utfordringer",
    "ui-sprites": "Bygger grensesnitt",
    "audio-files": "Tuner inn lydlandskap",
    "map-data": "Kartlegger reisen",
    finalization: "Siste froboteredelser",
    complete: "Alt klart!",
  };
  return descriptions[stepId] || "";
};

export default LoadingMenu;
