import React from "react";
import { useGameStore } from "../../stores/gameStore";
import { GameState, MenuType } from "../../types/enums";
import { Button } from "../ui/button";
import {
  Play,
  Settings,
  Home,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft
} from "lucide-react";
import { useFullscreen } from "../../hooks/useFullscreen";
import { mapDefinitions } from "../../maps/mapDefinitions";
import { GAME_CONFIG } from "../../types/constants";

const Menu: React.FC = () => {
  const {
    showMenu,
    setState,
    setMenuType,
    resetGame,
    currentLevel,
    lives,
    score,
    correctOrderCount,
    audioSettings,
    updateAudioSettings,
    previousMenu,
    setBonusAnimationComplete,
    powerModeActive,
    powerModeEndTime,
    multiplier
  } = useGameStore();

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Don't render anything if no menu should be shown
  if (!showMenu) return null;

  // Handler functions
  const startGame = () => {
    setMenuType(MenuType.COUNTDOWN);
    setState(GameState.COUNTDOWN);
    setTimeout(() => setState(GameState.PLAYING), 3000);
  };

  const resumeGame = () => setState(GameState.PLAYING);

  const restartGame = () => {
    resetGame();
    const mapDefinition = mapDefinitions[0];
    useGameStore.getState().initializeLevel(mapDefinition);
    setMenuType(MenuType.COUNTDOWN);
    setState(GameState.COUNTDOWN);
    setTimeout(() => setState(GameState.PLAYING), 3000);
  };

  const quitToMenu = () => {
    resetGame();
    setState(GameState.MENU);
    setMenuType(MenuType.START);
  };

  const openSettings = () => setMenuType(MenuType.SETTINGS);
  const openAudioSettings = () => setMenuType(MenuType.AUDIO_SETTINGS);
  const goBack = () => setMenuType(previousMenu || MenuType.START);

  const proceedToNextLevel = () => {
    setBonusAnimationComplete(false);
    useGameStore.getState().nextLevel();
    const nextLevel = useGameStore.getState().currentLevel;
    if (nextLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[nextLevel - 1];
      useGameStore.getState().initializeLevel(mapDefinition);
      setMenuType(MenuType.COUNTDOWN);
      setState(GameState.COUNTDOWN);
      setTimeout(() => setState(GameState.PLAYING), 3000);
    } else {
      setState(GameState.VICTORY);
      setMenuType(MenuType.VICTORY);
    }
  };

  // Render appropriate menu content
  const renderContent = () => {
    switch (showMenu) {
      case MenuType.START:
        return <StartMenu onStart={startGame} onSettings={openSettings} isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />;
      
      case MenuType.COUNTDOWN:
        return <CountdownOverlay />;
      
      case MenuType.PAUSE:
        return <PauseMenu onResume={resumeGame} onRestart={restartGame} onSettings={openSettings} onQuit={quitToMenu} />;
      
      case MenuType.SETTINGS:
        return <SettingsMenu onBack={goBack} onAudioSettings={openAudioSettings} />;
      
      case MenuType.AUDIO_SETTINGS:
        return <AudioSettingsMenu onBack={goBack} audioSettings={audioSettings} updateAudioSettings={updateAudioSettings} />;
      
      case MenuType.BONUS:
        return <BonusScreen correctCount={correctOrderCount} onComplete={proceedToNextLevel} />;
      
      case MenuType.VICTORY:
        return <VictoryMenu score={score} onQuit={quitToMenu} />;
      
      case MenuType.GAME_OVER:
        return <GameOverMenu score={score} onRestart={restartGame} onQuit={quitToMenu} />;
      
      case MenuType.IN_GAME:
        return <InGameHUD score={score} lives={lives} level={currentLevel} multiplier={multiplier} powerMode={powerModeActive} powerEndTime={powerModeEndTime} />;
      
      default:
        return null;
    }
  };

  // Special handling for IN_GAME HUD (no overlay)
  if (showMenu === MenuType.IN_GAME) {
    return renderContent();
  }

  // All other menus have overlay
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      {renderContent()}
    </div>
  );
};

// Individual menu components
const StartMenu: React.FC<{ onStart: () => void; onSettings: () => void; isFullscreen: boolean; toggleFullscreen: () => void }> = ({ onStart, onSettings, isFullscreen, toggleFullscreen }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center space-y-6 min-w-[300px]">
    <h1 className="text-4xl font-bold text-white mb-8">Sigurd Startup</h1>
    <Button onClick={onStart} className="w-full" size="lg">
      <Play className="mr-2 h-5 w-5" />
      Start Game
    </Button>
    <Button onClick={onSettings} variant="outline" className="w-full">
      <Settings className="mr-2 h-4 w-4" />
      Settings
    </Button>
    <Button
      onClick={() => {
        const gameElement = document.querySelector("sigurd-startup") as HTMLElement;
        if (gameElement) toggleFullscreen(gameElement);
        else toggleFullscreen();
      }}
      variant="ghost"
      className="w-full"
    >
      {isFullscreen ? (
        <>
          <Minimize className="mr-2 h-4 w-4" />
          Exit Fullscreen
        </>
      ) : (
        <>
          <Maximize className="mr-2 h-4 w-4" />
          Fullscreen
        </>
      )}
    </Button>
  </div>
);

const CountdownOverlay: React.FC = () => {
  const [countdown, setCountdown] = React.useState(3);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-white text-6xl font-bold animate-pulse">
      {countdown > 0 ? countdown : "GO!"}
    </div>
  );
};

const PauseMenu: React.FC<{ onResume: () => void; onRestart: () => void; onSettings: () => void; onQuit: () => void }> = ({ onResume, onRestart, onSettings, onQuit }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center space-y-6 min-w-[300px]">
    <h2 className="text-3xl font-bold text-white mb-6">Game Paused</h2>
    <Button onClick={onResume} className="w-full" size="lg">
      <Play className="mr-2 h-5 w-5" />
      Resume
    </Button>
    <Button onClick={onRestart} variant="outline" className="w-full">
      <RotateCcw className="mr-2 h-4 w-4" />
      Restart
    </Button>
    <Button onClick={onSettings} variant="outline" className="w-full">
      <Settings className="mr-2 h-4 w-4" />
      Settings
    </Button>
    <Button onClick={onQuit} variant="ghost" className="w-full">
      <Home className="mr-2 h-4 w-4" />
      Main Menu
    </Button>
  </div>
);

const SettingsMenu: React.FC<{ onBack: () => void; onAudioSettings: () => void }> = ({ onBack, onAudioSettings }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl space-y-6 min-w-[300px]">
    <div className="flex items-center justify-between mb-6">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      <div className="w-10" />
    </div>
    <Button onClick={onAudioSettings} variant="outline" className="w-full">
      <Volume2 className="mr-2 h-4 w-4" />
      Audio Settings
    </Button>
  </div>
);

const AudioSettingsMenu: React.FC<{ onBack: () => void; audioSettings: any; updateAudioSettings: (settings: any) => void }> = ({ onBack, audioSettings, updateAudioSettings }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl space-y-6 min-w-[400px]">
    <div className="flex items-center justify-between mb-6">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-2xl font-bold text-white">Audio Settings</h2>
      <div className="w-10" />
    </div>

    {/* Master Volume */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-white">Master Volume</label>
        <Button
          onClick={() => updateAudioSettings({ masterMuted: !audioSettings.masterMuted })}
          variant="ghost"
          size="sm"
        >
          {audioSettings.masterMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={audioSettings.masterVolume}
        onChange={(e) => updateAudioSettings({ masterVolume: parseInt(e.target.value) })}
        className="w-full"
        disabled={audioSettings.masterMuted}
      />
    </div>

    {/* Music Volume */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-white">Music Volume</label>
        <Button
          onClick={() => updateAudioSettings({ musicMuted: !audioSettings.musicMuted })}
          variant="ghost"
          size="sm"
        >
          {audioSettings.musicMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={audioSettings.musicVolume}
        onChange={(e) => updateAudioSettings({ musicVolume: parseInt(e.target.value) })}
        className="w-full"
        disabled={audioSettings.musicMuted}
      />
    </div>

    {/* SFX Volume */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-white">Sound Effects</label>
        <Button
          onClick={() => updateAudioSettings({ sfxMuted: !audioSettings.sfxMuted })}
          variant="ghost"
          size="sm"
        >
          {audioSettings.sfxMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={audioSettings.sfxVolume}
        onChange={(e) => updateAudioSettings({ sfxVolume: parseInt(e.target.value) })}
        className="w-full"
        disabled={audioSettings.sfxMuted}
      />
    </div>
  </div>
);

const BonusScreen: React.FC<{ correctCount: number; onComplete: () => void }> = ({ correctCount, onComplete }) => {
  const [displayedCount, setDisplayedCount] = React.useState(0);
  const [showPoints, setShowPoints] = React.useState(false);
  const bonusPoints = GAME_CONFIG.BONUS_POINTS[correctCount as keyof typeof GAME_CONFIG.BONUS_POINTS] || 0;

  React.useEffect(() => {
    const countInterval = setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= correctCount) {
          clearInterval(countInterval);
          setShowPoints(true);
          setTimeout(onComplete, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(countInterval);
  }, [correctCount, onComplete]);

  return (
    <div className="text-center space-y-8">
      <h1 className="text-6xl font-bold text-yellow-400 animate-pulse">BONUS!</h1>
      <div className="text-4xl text-white">
        {displayedCount} / {GAME_CONFIG.TOTAL_BOMBS}
      </div>
      {showPoints && (
        <div className="text-5xl font-bold text-green-400 animate-bounce">
          +{bonusPoints.toLocaleString()}
        </div>
      )}
    </div>
  );
};

const VictoryMenu: React.FC<{ score: number; onQuit: () => void }> = ({ score, onQuit }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center space-y-6 min-w-[300px]">
    <h1 className="text-4xl font-bold text-yellow-400 mb-4">Victory!</h1>
    <p className="text-xl text-white mb-2">Congratulations!</p>
    <p className="text-lg text-gray-300 mb-6">
      Final Score: <span className="text-yellow-400 font-bold">{score}</span>
    </p>
    <Button onClick={onQuit} className="w-full" size="lg">
      <Home className="mr-2 h-5 w-5" />
      Main Menu
    </Button>
  </div>
);

const GameOverMenu: React.FC<{ score: number; onRestart: () => void; onQuit: () => void }> = ({ score, onRestart, onQuit }) => (
  <div className="bg-gray-900 p-8 rounded-lg shadow-2xl text-center space-y-6 min-w-[300px]">
    <h1 className="text-4xl font-bold text-red-500 mb-4">Game Over</h1>
    <p className="text-lg text-gray-300 mb-6">
      Final Score: <span className="text-yellow-400 font-bold">{score}</span>
    </p>
    <Button onClick={onRestart} className="w-full" size="lg">
      <RotateCcw className="mr-2 h-5 w-5" />
      Try Again
    </Button>
    <Button onClick={onQuit} variant="outline" className="w-full">
      <Home className="mr-2 h-4 w-4" />
      Main Menu
    </Button>
  </div>
);

const InGameHUD: React.FC<{ score: number; lives: number; level: number; multiplier: number; powerMode: boolean; powerEndTime: number }> = ({ score, lives, level, multiplier, powerMode, powerEndTime }) => {
  const [powerTimeLeft, setPowerTimeLeft] = React.useState(0);

  React.useEffect(() => {
    if (powerMode) {
      const interval = setInterval(() => {
        const timeLeft = Math.max(0, powerEndTime - Date.now());
        setPowerTimeLeft(Math.ceil(timeLeft / 1000));
        if (timeLeft <= 0) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [powerMode, powerEndTime]);

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between text-white font-bold">
      <div className="bg-black/50 px-4 py-2 rounded">
        Score: {score.toLocaleString()}
        {multiplier > 1 && (
          <span className="ml-2 text-yellow-400">x{multiplier}</span>
        )}
      </div>
      <div className="bg-black/50 px-4 py-2 rounded">
        Level: {level}
      </div>
      <div className="bg-black/50 px-4 py-2 rounded">
        Lives: {lives}
      </div>
      {powerMode && (
        <div className="bg-blue-600/80 px-4 py-2 rounded animate-pulse">
          Power Mode: {powerTimeLeft}s
        </div>
      )}
    </div>
  );
};

export default Menu;
