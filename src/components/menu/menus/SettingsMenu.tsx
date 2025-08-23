import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";

import { ArrowLeft } from "lucide-react";

const SettingsMenu: React.FC = () => {
  const { gameStateManager } = useGameStore();

  // Get audio settings from AudioManager
  const audioSettings = useGameStore((state) => state.audioSettings);
  const updateAudioSettings = useGameStore(
    (state) => state.updateAudioSettings
  );

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

  const goBack = () => {
    // Use centralized close settings transition
    gameStateManager?.closeSettings();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="flex items-center mb-6 w-[70%] gap-2">
        <Button
          onClick={goBack}
          variant="default"
          className="bg-primary hover:bg-primary-dark text-white w-10 h-10"
        >
          <ArrowLeft size={25} />
        </Button>
        <h2 className="text-2xl font-bold text-white uppercase">
          Innstillinger
        </h2>
      </div>

      <div className="space-y-2 w-[70%]">
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
      </div>
    </div>
  );
};

export default SettingsMenu;
