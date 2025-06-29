import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { MenuType } from "../../../types/enums";
import { ArrowLeft } from "lucide-react";

const SettingsMenu: React.FC = () => {
  const { setMenuType, previousMenu } = useGameStore();
  
  // Get audio settings from AudioManager
  const audioSettings = useGameStore(state => state.audioSettings);
  const updateAudioSettings = useGameStore(state => state.updateAudioSettings);

  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    masterMuted,
    musicMuted,
    sfxMuted
  } = audioSettings || {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 90,
    masterMuted: false,
    musicMuted: false,
    sfxMuted: false
  };

  const goBack = () => {
    // Go back to the previous menu that was stored when opening settings
    if (previousMenu) {
      setMenuType(previousMenu);
    } else {
      // Fallback to START menu if no previous menu is stored
      setMenuType(MenuType.START);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="bg-[#262521] backdrop-blur-sm rounded-xl p-8 border border-[#484744] max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#81b64c] uppercase">Settings</h2>
          <Button
            onClick={goBack}
            variant="ghost"
            className="text-[#cbcbca] hover:text-white p-1"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#cbcbca]">Master Volume</span>
              <button
                onClick={() => updateAudioSettings({ masterMuted: !masterMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  masterMuted ? 'bg-red-600 text-white' : 'bg-[#484744] text-white'
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
              onChange={(e) => updateAudioSettings({ masterVolume: Number(e.target.value) })}
              className="w-full accent-[#81b64c]"
              disabled={masterMuted}
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#cbcbca]">Music Volume</span>
              <button
                onClick={() => updateAudioSettings({ musicMuted: !musicMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  musicMuted ? 'bg-red-600 text-white' : 'bg-[#484744] text-white'
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
              onChange={(e) => updateAudioSettings({ musicVolume: Number(e.target.value) })}
              className="w-full accent-[#81b64c]"
              disabled={musicMuted}
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#cbcbca]">Sound Effects</span>
              <button
                onClick={() => updateAudioSettings({ sfxMuted: !sfxMuted })}
                className={`px-3 py-1 rounded text-sm font-mono ${
                  sfxMuted ? 'bg-red-600 text-white' : 'bg-[#484744] text-white'
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
              onChange={(e) => updateAudioSettings({ sfxVolume: Number(e.target.value) })}
              className="w-full accent-[#81b64c]"
              disabled={sfxMuted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu; 