import { create } from 'zustand';
import { DEFAULT_AUDIO_SETTINGS } from '../../types/constants';
import { log } from 'console';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
}

interface AudioManagerInterface {
  updateVolumes: () => void;
  startPowerUpMelodyWithDuration: (duration: number) => void;
  stopPowerUpMelody: () => void;
  isPowerUpMelodyActive: () => boolean;
}

interface AudioState {
  audioSettings: AudioSettings;
  audioManager: AudioManagerInterface | null;
}

interface AudioActions {
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  resetAudioSettings: () => void;
  setAudioManager: (audioManager: AudioManagerInterface) => void;
}

export type AudioStore = AudioState & AudioActions;

export const useAudioStore = create<AudioStore>((set, get) => ({
  // State
  audioSettings: DEFAULT_AUDIO_SETTINGS,
  audioManager: null,

  // Actions
  updateAudioSettings: (newSettings: Partial<AudioSettings>) => {
    set({
      audioSettings: { ...get().audioSettings, ...newSettings },
    });
    console.log("Updated audio settings", newSettings);

    // Update AudioManager if available
    const audioManager = get().audioManager;
    if (audioManager && audioManager.updateVolumes) {
      audioManager.updateVolumes();
    }
  },

  resetAudioSettings: () => {
    set({ audioSettings: DEFAULT_AUDIO_SETTINGS });

    // Update AudioManager if available
    const audioManager = get().audioManager;
    if (audioManager && audioManager.updateVolumes) {
      audioManager.updateVolumes();
    }
  },

  setAudioManager: (audioManager: AudioManagerInterface) => {
    set({ audioManager });
  },
}));