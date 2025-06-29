export interface GameScore {
  score: number;
  map: string;
  timestamp: number;
  playerName?: string;
  level?: number;
  lives?: number;
  multiplier?: number;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export const sendScoreToHost = (score: number, map: string, playerName?: string, level?: number, lives?: number, multiplier?: number) => {
  const scoreData: GameScore = {
    score,
    map,
    timestamp: Date.now(),
    playerName: playerName || 'Anonymous',
    level,
    lives,
    multiplier
  };
  
  console.log('🎮 Sending score to host:', scoreData);
  
  // Send current score update
  const scoreEvent = new CustomEvent('scoreUpdate', {
    detail: { score },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(scoreEvent);
  
  // Send detailed score data
  const detailedScoreEvent = new CustomEvent('game:score-updated', {
    detail: scoreData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(detailedScoreEvent);
};

export const sendGameReady = () => {
  console.log('🎮 Game ready signal sent to host');
  const event = new CustomEvent('game:ready', {
    detail: { timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameStateUpdate = (state: string, map?: string) => {
  console.log('🎮 Game state update sent to host:', state, map);
  const event = new CustomEvent('game:state-updated', {
    detail: { state, map, timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const getAudioSettings = (): AudioSettings | null => {
  if (typeof window !== 'undefined' && window.sigurdGame) {
    return window.sigurdGame.audioSettings;
  }
  return null;
};

export const setAudioSettings = (settings: AudioSettings) => {
  if (typeof window !== 'undefined' && window.sigurdGame) {
    window.sigurdGame.setAudioSettings(settings);
  }
};

// Listen for audio settings changes from the host
let audioSettingsListener: ((event: Event) => void) | null = null;

export const initializeAudioSettingsListener = (callback: (settings: AudioSettings) => void) => {
  if (typeof window !== 'undefined') {
    // Remove existing listener if any
    if (audioSettingsListener) {
      window.removeEventListener('game:audio-settings-changed', audioSettingsListener);
    }
    
    // Store the callback and add the listener
    audioSettingsListener = (event: Event) => {
      const customEvent = event as CustomEvent<AudioSettings>;
      console.log('🎮 Audio settings received from host:', customEvent.detail);
      callback(customEvent.detail);
    };
    
    window.addEventListener('game:audio-settings-changed', audioSettingsListener);
  }
};

export const cleanupAudioSettingsListener = () => {
  if (typeof window !== 'undefined' && audioSettingsListener) {
    window.removeEventListener('game:audio-settings-changed', audioSettingsListener);
    audioSettingsListener = null;
  }
};

// Declare global game interface for TypeScript
declare global {
  interface Window {
    sigurdGame?: {
      audioSettings: AudioSettings;
      setAudioSettings: (settings: AudioSettings) => void;
      sendScore: (score: number, map: string, playerName?: string) => void;
      updateCurrentScore: (score: number) => void;
      _handleScoreUpdate: (score: number, map: string, playerName?: string) => void;
      _updateCurrentScore: (score: number) => void;
    };
  }
}