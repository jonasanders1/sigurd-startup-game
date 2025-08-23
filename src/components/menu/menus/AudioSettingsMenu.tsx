import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";

import { ArrowLeft } from "lucide-react";

const AudioSettingsMenu: React.FC = () => {
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
    <div className="flex items-center justify-center h-full">
      <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-secondary max-w-md w-full">
        <div className="flex items-center mb-6 gap-2">
          <Button
            onClick={goBack}
            variant="ghost"
            className="text-muted-foreground hover:text-white p-1"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-primary">Lydinnstillinger</h2>
        </div>
        
        <div className="space-y-4">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Master Volume</span>
              <button
                onClick={() => updateAudioSettings({ masterMuted: !masterMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  masterMuted ? 'bg-red-600 text-white' : 'bg-secondary text-white'
                }`}
              >
                {masterMuted ? 'Muted' : `${masterVolume}%`}
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
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Music Volume</span>
              <button
                onClick={() => updateAudioSettings({ musicMuted: !musicMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  musicMuted ? 'bg-red-600 text-white' : 'bg-secondary text-white'
                }`}
              >
                {musicMuted ? 'Muted' : `${musicVolume}%`}
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
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Sound Effects</span>
              <button
                onClick={() => updateAudioSettings({ sfxMuted: !sfxMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  sfxMuted ? 'bg-red-600 text-white' : 'bg-secondary text-white'
                }`}
              >
                {sfxMuted ? 'Muted' : `${sfxVolume}%`}
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
        </div>
      </div>
    </div>
  );
};

export default AudioSettingsMenu; 