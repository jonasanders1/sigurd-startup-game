/**
 * Audio Configuration
 * Centralized configuration for all audio settings including volumes and mute states
 */

// Define AudioSettings interface locally
export interface AudioSettings {
  masterVolume: number;
  masterMuted: boolean;
  musicVolume: number;
  musicMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 50,
  masterMuted: false,
  musicVolume: 30,
  musicMuted: false,
  sfxVolume: 70,
  sfxMuted: false,
};