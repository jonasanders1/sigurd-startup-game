/**
 * Audio configuration
 * Contains default audio settings and volume configurations
 */

import { AudioSettings } from "@/stores/slices/audioSettingsSlice";

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 50,
  musicVolume: 80,
  sfxVolume: 20,
  masterMuted: false,
  musicMuted: false,
  sfxMuted: false,
};