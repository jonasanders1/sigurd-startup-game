import { StateCreator } from "zustand";
import { DEFAULT_AUDIO_SETTINGS } from "../../types/constants";
import {
  sendAudioSettingsUpdate,
  sendGameSettingsUpdate,
} from "../../lib/communicationUtils";

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
    const updatedSettings = { ...get().audioSettings, ...newSettings };
    set({
      audioSettings: updatedSettings,
    });

    // Send audio settings update to host
    sendAudioSettingsUpdate(updatedSettings);

    // Update AudioManager if available
    const audioManager = get().audioManager;
    if (audioManager && audioManager.updateVolumes) {
      audioManager.updateVolumes();
    }
  },

  resetAudioSettings: () => {
    set({ audioSettings: DEFAULT_AUDIO_SETTINGS });

    // Send reset audio settings update to host
    sendAudioSettingsUpdate(DEFAULT_AUDIO_SETTINGS);

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
