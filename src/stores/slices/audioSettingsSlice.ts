import { StateCreator } from 'zustand';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export interface AudioSettingsSlice {
  audioSettings: AudioSettings;
  audioManager: any | null;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  resetAudioSettings: () => void;
  setAudioManager: (audioManager: any) => void;
}

const defaultAudioSettings: AudioSettings = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  masterMuted: false,
  musicMuted: false,
  sfxMuted: false
};

export const createAudioSettingsSlice: StateCreator<AudioSettingsSlice> = (set, get) => ({
  audioSettings: defaultAudioSettings,
  audioManager: null,
  
  updateAudioSettings: (newSettings: Partial<AudioSettings>) => {
    set({
      audioSettings: { ...get().audioSettings, ...newSettings }
    });
    
    // Update AudioManager if available
    const audioManager = get().audioManager;
    if (audioManager && audioManager.updateVolumes) {
      audioManager.updateVolumes();
    }
  },
  
  resetAudioSettings: () => {
    set({ audioSettings: defaultAudioSettings });
    
    // Update AudioManager if available
    const audioManager = get().audioManager;
    if (audioManager && audioManager.updateVolumes) {
      audioManager.updateVolumes();
    }
  },
  
  setAudioManager: (audioManager: any) => {
    set({ audioManager });
  }
}); 