import { StateCreator } from "zustand";
import { DEFAULT_AUDIO_SETTINGS } from "../../types/constants";

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
}

export interface AudioSettingsSlice {
  audioSettings: AudioSettings;
  audioManager: AudioManagerInterface | null;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  resetAudioSettings: () => void;
  setAudioManager: (audioManager: AudioManagerInterface) => void;
}

export const createAudioSettingsSlice: StateCreator<AudioSettingsSlice> = (
  set,
  get
) => ({
  audioSettings: DEFAULT_AUDIO_SETTINGS,
  audioManager: null,

  updateAudioSettings: (newSettings: Partial<AudioSettings>) => {
    set({
      audioSettings: { ...get().audioSettings, ...newSettings },
    });

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
});
