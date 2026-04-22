import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PixelBezel } from "@/components/ui/pixel-bezel";
import {
  useAudioStore,
  useStateStore,
} from "../../../stores/gameStore";
import { sendAudioSettingsUpdate } from "../../../lib/communicationUtils";

import { ArrowLeft, Loader2 } from "lucide-react";
import { DEFAULT_AUDIO_SETTINGS } from "../../../config/audio";

const SettingsMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { audioSettings, updateAudioSettings } = useAudioStore();
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

  useEffect(() => {
    if (audioSettings && !initialSettings) {
      setInitialSettings({ ...audioSettings });
    }
  }, [audioSettings]);

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
    gameStateManager?.closeNestedMenu();
  };

  const handleUpdateAudio = async () => {
    setIsUpdating(true);

    sendAudioSettingsUpdate(
      masterVolume,
      musicVolume,
      sfxVolume,
      masterMuted,
      musicMuted,
      sfxMuted
    );

    setInitialSettings({
      masterVolume,
      musicVolume,
      sfxVolume,
      masterMuted,
      musicMuted,
      sfxMuted,
    });

    setTimeout(() => {
      setIsUpdating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col justify-center w-[80%]">
      <div className="flex items-center mb-6 gap-3">
        <Button
          onClick={goBack}
          variant="outline"
          size="icon"
          className="text-foreground hover:text-primary"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-pixel text-foreground tracking-wide uppercase">
          Innstillinger
        </h2>
      </div>

      <div className="space-y-2">
        {/* Master Volume */}
        <PixelBezel className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--foreground-muted)] font-mono text-sm">Master volum</span>
            <button
              onClick={() => updateAudioSettings({ masterMuted: !masterMuted })}
              className={`px-3 py-1 rounded-sm text-sm font-pixel tracking-wide border ${
                masterMuted
                  ? "bg-destructive border-destructive text-primary-foreground"
                  : "bg-[var(--surface-raised)] border-[var(--surface-line)] text-foreground"
              }`}
            >
              {masterMuted ? "MUTED" : `${masterVolume}%`}
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
        </PixelBezel>

        {/* Music Volume */}
        <PixelBezel className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--foreground-muted)] font-mono text-sm">Musikk volum</span>
            <button
              onClick={() => updateAudioSettings({ musicMuted: !musicMuted })}
              className={`px-3 py-1 rounded-sm text-sm font-pixel tracking-wide border ${
                musicMuted
                  ? "bg-destructive border-destructive text-primary-foreground"
                  : "bg-[var(--surface-raised)] border-[var(--surface-line)] text-foreground"
              }`}
            >
              {musicMuted ? "MUTED" : `${musicVolume}%`}
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
        </PixelBezel>

        {/* SFX Volume */}
        <PixelBezel className="p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--foreground-muted)] font-mono text-sm">Lyd effekter</span>
            <button
              onClick={() => updateAudioSettings({ sfxMuted: !sfxMuted })}
              className={`px-3 py-1 rounded-sm text-sm font-pixel tracking-wide border ${
                sfxMuted
                  ? "bg-destructive border-destructive text-primary-foreground"
                  : "bg-[var(--surface-raised)] border-[var(--surface-line)] text-foreground"
              }`}
            >
              {sfxMuted ? "MUTED" : `${sfxVolume}%`}
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
        </PixelBezel>

        <p className="text-center text-xs text-[var(--foreground-dim)] font-mono py-1">
          Trykk på tallene for å mute lyd
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              updateAudioSettings(DEFAULT_AUDIO_SETTINGS);
            }}
            className="flex-1"
          >
            Tilbakestill
          </Button>

          <Button
            variant="default"
            onClick={handleUpdateAudio}
            disabled={!hasChanges || isUpdating}
            className={`flex-1 ${
              !hasChanges ? "opacity-50 cursor-not-allowed" : ""
            }`}
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
