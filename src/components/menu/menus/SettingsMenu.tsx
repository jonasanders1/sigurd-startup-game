import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useAudioStore,
  useGameStore,
  useStateStore,
} from "../../../stores/gameStore";
import { sendAudioSettingsUpdate } from "../../../lib/communicationUtils";
import { useCanvasDimensions } from "../../../hooks/useCanvasDimensions";

import { ArrowLeft, Loader2 } from "lucide-react";
import { DEFAULT_AUDIO_SETTINGS } from "../../../config/audio";

const SettingsMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { audioSettings, updateAudioSettings } = useAudioStore();
  const { scale, isFullscreen } = useCanvasDimensions();
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialSettings, setInitialSettings] = useState<
    typeof audioSettings | null
  >(null);

  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    masterMuted,
    musicMuted,
    sfxMuted,
  } = audioSettings || {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 90,
    masterMuted: false,
    musicMuted: false,
    sfxMuted: false,
  };

  // Store initial settings on component mount
  useEffect(() => {
    if (audioSettings && !initialSettings) {
      setInitialSettings({ ...audioSettings });
    }
  }, [audioSettings]);

  // Check if settings have changed from initial state
  const hasChanges = useMemo(() => {
    if (!initialSettings) return false;

    return (
      initialSettings.masterVolume !== masterVolume ||
      initialSettings.musicVolume !== musicVolume ||
      initialSettings.sfxVolume !== sfxVolume ||
      initialSettings.masterMuted !== masterMuted ||
      initialSettings.musicMuted !== musicMuted ||
      initialSettings.sfxMuted !== sfxMuted
    );
  }, [
    initialSettings,
    masterVolume,
    musicVolume,
    sfxVolume,
    masterMuted,
    musicMuted,
    sfxMuted,
  ]);

  const goBack = () => {
    // Send audio settings to host before closing if there are changes
    if (hasChanges) {
      sendAudioSettingsUpdate(
        masterVolume,
        musicVolume,
        sfxVolume,
        masterMuted,
        musicMuted,
        sfxMuted
      );
    }

    // Use centralized close settings transition
    gameStateManager?.closeNestedMenu();
  };

  const handleUpdateAudio = async () => {
    setIsUpdating(true);

    // Send audio settings to host for storage
    sendAudioSettingsUpdate(
      masterVolume,
      musicVolume,
      sfxVolume,
      masterMuted,
      musicMuted,
      sfxMuted
    );

    // Update initial settings to current values after successful update
    setInitialSettings({
      masterVolume,
      musicVolume,
      sfxVolume,
      masterMuted,
      musicMuted,
      sfxMuted,
    });

    // Simulate async operation for visual feedback
    setTimeout(() => {
      setIsUpdating(false);
    }, 800);
  };

  // Calculate responsive container styles
  const containerStyle: React.CSSProperties = {
    width: '80%',
    maxWidth: isFullscreen ? `${600 * scale}px` : '600px',
    fontSize: isFullscreen ? `${16 * scale}px` : '16px',
  };

  // Button size classes based on scale
  const buttonSizeClass = isFullscreen && scale > 1.2 
    ? "w-12 h-12" 
    : "w-10 h-10";

  const textSizeClass = isFullscreen && scale > 1.2
    ? "text-3xl"
    : "text-2xl";

  return (
    <div className="flex flex-col justify-center h-full px-4" style={containerStyle}>
      <div className="flex items-center mb-6 gap-2">
        <Button
          onClick={goBack}
          variant="default"
          className={`bg-primary hover:bg-primary-dark text-white ${buttonSizeClass}`}
        >
          <ArrowLeft size={isFullscreen && scale > 1.2 ? 30 : 25} />
        </Button>
        <h2 className={`${textSizeClass} font-bold text-white uppercase`}>
          Innstillinger
        </h2>
      </div>

      <div className="space-y-2">
        {/* Master Volume */}
        <div className="p-3 bg-card rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Master volum</span>
            <button
              onClick={() => updateAudioSettings({ masterMuted: !masterMuted })}
              className={`px-3 py-1 rounded text-sm font-mono ${
                masterMuted
                  ? "bg-destructive text-white"
                  : "bg-secondary text-white"
              }`}
            >
              {masterMuted ? "Muted" : `${masterVolume}%`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterMuted ? 0 : masterVolume}
            onChange={(e) =>
              updateAudioSettings({ masterVolume: Number(e.target.value) })
            }
            className="w-full accent-primary"
            disabled={masterMuted}
          />
        </div>

        {/* Music Volume */}
        <div className="p-3 bg-card rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Musikk volum</span>
            <button
              onClick={() => updateAudioSettings({ musicMuted: !musicMuted })}
              className={`px-3 py-1 rounded text-sm font-mono ${
                musicMuted
                  ? "bg-destructive text-white"
                  : "bg-secondary text-white"
              }`}
            >
              {musicMuted ? "Muted" : `${musicVolume}%`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={musicMuted ? 0 : musicVolume}
            onChange={(e) =>
              updateAudioSettings({ musicVolume: Number(e.target.value) })
            }
            className="w-full accent-primary"
            disabled={musicMuted}
          />
        </div>

        {/* SFX Volume */}
        <div className="p-3 bg-card rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Lyd effekter</span>
            <button
              onClick={() => updateAudioSettings({ sfxMuted: !sfxMuted })}
              className={`px-3 py-1 rounded text-sm font-mono ${
                sfxMuted
                  ? "bg-destructive text-white"
                  : "bg-secondary text-white"
              }`}
            >
              {sfxMuted ? "Muted" : `${sfxVolume}%`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sfxMuted ? 0 : sfxVolume}
            onChange={(e) =>
              updateAudioSettings({ sfxVolume: Number(e.target.value) })
            }
            className="w-full accent-primary"
            disabled={sfxMuted}
          />
        </div>
        <div className="text-center text-sm text-gray-400">
          <p>(Trykk på tallene for å mute lyd)</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              updateAudioSettings(DEFAULT_AUDIO_SETTINGS);
            }}
            className="flex-1 bg-secondary hover:bg-secondary-dark hover:text-white text-white active:scale-[0.98] transition-all duration-300 ease-in-out transform"
          >
            Tilbakestill
          </Button>

          <Button
            variant="default"
            onClick={handleUpdateAudio}
            disabled={!hasChanges || isUpdating}
            className={`
              flex-1 transition-all duration-300 ease-in-out transform
              ${
                !hasChanges
                  ? "bg-secondary hover:bg-secondary text-gray-500 cursor-not-allowed opacity-60"
                  : isUpdating
                  ? "bg-primary-dark hover:bg-primary-dark"
                  : "bg-primary hover:bg-primary-dark active:scale-[0.98]"
              }

            `}
          >
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Oppdaterer...</span>
              </div>
            ) : (
              "Oppdater lyd"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
