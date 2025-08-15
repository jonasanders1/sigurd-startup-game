import { AudioEvent, GameState } from "../types/enums";
import { getAudioPath } from "../config/assets";
import { useGameStore } from "../stores/gameStore";
import { GAME_CONFIG } from "../types/constants";
import { log } from "../lib/logger";

// Type definition for webkit AudioContext
interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private isBackgroundMusicPlaying = false;
  private backgroundMusicBuffer: AudioBuffer | null = null;
  private backgroundMusicSource: AudioBufferSourceNode | null = null;
  
  // Power-up melody management
  private powerUpMelodyActive = false;
  private powerUpMelodyTimeout: NodeJS.Timeout | null = null;
  private powerUpMelodyOscillators: AudioScheduledSourceNode[] = [];

  constructor() {
    this.initializeAudioContext();
    this.loadBackgroundMusic();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as WebkitWindow).webkitAudioContext)();
      this.backgroundMusicGain = this.audioContext.createGain();
      this.backgroundMusicGain.connect(this.audioContext.destination);
      this.updateAudioVolumes(); // Set initial volume based on settings
    } catch (error) {
      log.warn("Web Audio API not supported:", error);
    }
  }

  private async loadBackgroundMusic(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Use the new asset import system
      const audioPath = getAudioPath("background-music");
      const response = await fetch(audioPath);
      const arrayBuffer = await response.arrayBuffer();
      this.backgroundMusicBuffer = await this.audioContext.decodeAudioData(
        arrayBuffer
      );
    } catch (error) {
      log.warn("Failed to load background music:", error);
    }
  }

  private ensureAudioContext(): void {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  playSound(event: AudioEvent, gameState?: GameState): void {
    this.ensureAudioContext();

    switch (event) {
      case AudioEvent.BOMB_COLLECT:
        this.playBombCollectSound();
        break;
      case AudioEvent.MONSTER_HIT:
        this.playMonsterHitSound();
        break;
      case AudioEvent.MAP_CLEARED:
        this.playMapClearedSound();
        break;
      case AudioEvent.BONUS_SCREEN:
        log.audio("Bonus sound");
        this.playBonusSound();
        break;
      case AudioEvent.COIN_COLLECT:
        this.playCoinCollectSound();
        break;
      case AudioEvent.POWER_COIN_ACTIVATE:
        this.playPowerCoinActivateSound();
        // Note: PowerUp melody is now started by the coin effect system with proper duration
        // No need to start it here as it will be started by startPowerUpMelodyWithDuration
        break;
      case AudioEvent.BACKGROUND_MUSIC:
        // Only start background music if game state is PLAYING
        if (gameState === GameState.PLAYING) {
          this.startBackgroundMusic();
        }
        break;
      default:
        log.debug(`Audio event ${event} not implemented yet`);
    }
  }

  stopBackgroundMusic(): void {
    this.isBackgroundMusicPlaying = false;

    // Stop the current audio source if playing
    if (this.backgroundMusicSource) {
      try {
        this.backgroundMusicSource.stop();
      } catch (error) {
        // Source might already be stopped, ignore error
      }
      this.backgroundMusicSource = null;
    }
  }

  private playBombCollectSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1200,
      this.audioContext.currentTime + 0.1
    );

    const sfxVolume = this.getSFXVolume();
    gainNode.gain.setValueAtTime(
      0.3 * sfxVolume,
      this.audioContext.currentTime
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  private playMonsterHitSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      50,
      this.audioContext.currentTime + 0.3
    );

    const sfxVolume = this.getSFXVolume();
    gainNode.gain.setValueAtTime(
      0.4 * sfxVolume,
      this.audioContext.currentTime
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  private playMapClearedSound(): void {
    if (!this.audioContext) return;

    // Play a ascending melody
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5, D5, E5, F5, G5
    let time = this.audioContext.currentTime;
    const sfxVolume = this.getSFXVolume();

    notes.forEach((frequency, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, time);

      gainNode.gain.setValueAtTime(0.3 * sfxVolume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      oscillator.start(time);
      oscillator.stop(time + 0.3);

      time += 0.15;
    });
  }

  private playBonusSound(): void {
    if (!this.audioContext) return;

    // Alternating pitches to mimic rapid point counting
    const melody = [880.0, 987.77]; // A5 and B5 (repeats)
    const noteDuration = 0.07; // each note ~70ms
    const gap = 0.03; // small gap for distinct ticks
    const totalTime = 6; // total duration in seconds

    let time = this.audioContext.currentTime;
    const sfxVolume = this.getSFXVolume();

    // Keep playing until we fill ~6 seconds
    while (time < this.audioContext.currentTime + totalTime) {
      melody.forEach((frequency) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.type = "square"; // punchy arcade beep
        oscillator.frequency.setValueAtTime(frequency, time);

        gainNode.gain.setValueAtTime(0.4 * sfxVolume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

        oscillator.start(time);
        oscillator.stop(time + noteDuration);

        time += noteDuration + gap;
      });
    }
  }

  private playCoinCollectSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1500,
      this.audioContext.currentTime + 0.1
    );

    const sfxVolume = this.getSFXVolume();
    gainNode.gain.setValueAtTime(
      0.3 * sfxVolume,
      this.audioContext.currentTime
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  private playPowerCoinActivateSound(): void {
    if (!this.audioContext) return;

    // Play a power-up sound with multiple oscillators
    const time = this.audioContext.currentTime;
    const sfxVolume = this.getSFXVolume();

    // Main power sound
    const mainOsc = this.audioContext.createOscillator();
    const mainGain = this.audioContext.createGain();
    mainOsc.connect(mainGain);
    mainGain.connect(this.audioContext.destination);

    mainOsc.type = "square";
    mainOsc.frequency.setValueAtTime(200, time);
    mainOsc.frequency.exponentialRampToValueAtTime(400, time + 0.3);

    mainGain.gain.setValueAtTime(0.2 * sfxVolume, time);
    mainGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    mainOsc.start(time);
    mainOsc.stop(time + 0.5);

    // High frequency overlay
    const highOsc = this.audioContext.createOscillator();
    const highGain = this.audioContext.createGain();
    highOsc.connect(highGain);
    highGain.connect(this.audioContext.destination);

    highOsc.type = "sine";
    highOsc.frequency.setValueAtTime(800, time);
    highOsc.frequency.exponentialRampToValueAtTime(1200, time + 0.2);

    highGain.gain.setValueAtTime(0.15 * sfxVolume, time);
    highGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    highOsc.start(time);
    highOsc.stop(time + 0.3);
  }

  private startBackgroundMusic(): void {
    if (
      !this.audioContext ||
      this.isBackgroundMusicPlaying ||
      !this.backgroundMusicBuffer
    )
      return;

    this.isBackgroundMusicPlaying = true;
    this.playBackgroundMusicFile();
  }

  private playBackgroundMusicFile(): void {
    if (
      !this.audioContext ||
      !this.backgroundMusicGain ||
      !this.backgroundMusicBuffer ||
      !this.isBackgroundMusicPlaying
    )
      return;

    try {
      this.backgroundMusicSource = this.audioContext.createBufferSource();
      this.backgroundMusicSource.buffer = this.backgroundMusicBuffer;
      this.backgroundMusicSource.connect(this.backgroundMusicGain);

      // Set up looping
      this.backgroundMusicSource.loop = true;

      // Handle when the audio ends (for non-looping or if loop is disabled)
      this.backgroundMusicSource.onended = () => {
        if (this.isBackgroundMusicPlaying) {
          // Restart the music if it should still be playing
          setTimeout(() => {
            if (this.isBackgroundMusicPlaying) {
              this.playBackgroundMusicFile();
            }
          }, 100);
        }
      };

      this.backgroundMusicSource.start();
    } catch (error) {
      log.warn("Failed to play background music file:", error);
    }
  }

  private playPowerUpMelody(duration: number): void {
    if (!this.audioContext) return;

    // Clear any existing oscillators first
    this.clearPowerUpOscillators();

    const sfxVolume = this.getSFXVolume();
    const startTime = this.audioContext.currentTime;

    // Fast repeating "stressing" motif (like Pac-Man power-up)
    const motif = [880.0, 1046.5, 987.77, 1174.66]; // A5, C6, B5, D6
    const noteDuration = 0.15; // short and urgent

    let time = startTime;
    while (time < startTime + duration) {
      motif.forEach((freq) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.type = "square"; // arcade feel
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.3 * sfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

        osc.connect(gain);
        gain.connect(this.audioContext!.destination);

        osc.start(time);
        osc.stop(time + noteDuration);
        
        // Store oscillator reference for immediate stopping if needed
        this.powerUpMelodyOscillators.push(osc);

        time += noteDuration;
      });
    }
  }

  private clearPowerUpOscillators(): void {
    // Stop all oscillators immediately
    this.powerUpMelodyOscillators.forEach(osc => {
      try {
        osc.stop(0); // Stop immediately (at time 0)
        osc.disconnect(); // Disconnect from audio graph
      } catch (e) {
        // Oscillator might have already stopped, ignore error
      }
    });
    this.powerUpMelodyOscillators = [];
  }

  cleanup(): void {
    this.stopBackgroundMusic();
    this.stopPowerUpMelody();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  private updateAudioVolumes(): void {
    const audioSettings = useGameStore.getState().audioSettings;
    if (this.backgroundMusicGain) {
      const musicVolume =
        audioSettings.masterMuted || audioSettings.musicMuted
          ? 0
          : (audioSettings.masterVolume / 100) *
            (audioSettings.musicVolume / 100);
      this.backgroundMusicGain.gain.value = musicVolume;
    }
  }

  private getSFXVolume(): number {
    const audioSettings = useGameStore.getState().audioSettings;
    return audioSettings.masterMuted || audioSettings.sfxMuted
      ? 0
      : (audioSettings.masterVolume / 100) * (audioSettings.sfxVolume / 100);
  }

  // Public method to update audio volumes when settings change
  public updateVolumes(): void {
    this.updateAudioVolumes();
  }

    private startPowerUpMelody(duration: number): void {
    // Stop any existing power-up melody
    this.stopPowerUpMelody();
    
    log.audio(`Starting PowerUp melody for ${duration}ms (${duration/1000}s)`);
    
    // Pause background music during power-up
    this.pauseBackgroundMusic();
    
    // Mark melody as active
    this.powerUpMelodyActive = true;
    
    // Start the power-up melody
    this.playPowerUpMelody(duration / 1000); // Convert to seconds
    
    // Schedule background music to resume after power-up ends
    this.powerUpMelodyTimeout = setTimeout(() => {
      log.audio("PowerUp melody timeout reached, stopping melody");
      this.stopPowerUpMelody();
      // stopPowerUpMelody will handle resuming background music if appropriate
    }, duration);
  }

  private pauseBackgroundMusic(): void {
    if (this.backgroundMusicGain) {
      this.backgroundMusicGain.gain.value = 0;
    }
  }

  private resumeBackgroundMusic(): void {
    if (this.backgroundMusicGain) {
      // If background music should be playing but source is gone, restart it
      if (this.isBackgroundMusicPlaying && !this.backgroundMusicSource) {
        log.audio("Background music source lost, restarting music");
        this.playBackgroundMusicFile();
      }
      // Restore volume based on current settings
      this.updateAudioVolumes();
    }
  }

  // Public method to start power-up melody with specific duration
  public startPowerUpMelodyWithDuration(duration: number): void {
    this.startPowerUpMelody(duration);
  }

  // Public method to stop power-up melody (called when power-up ends early)
  public stopPowerUpMelody(): void {
    if (this.powerUpMelodyActive) {
      log.audio("Stopping PowerUp melody");
      this.powerUpMelodyActive = false;
      
      // Clear the timeout
      if (this.powerUpMelodyTimeout) {
        clearTimeout(this.powerUpMelodyTimeout);
        this.powerUpMelodyTimeout = null;
      }
      
      // Stop all oscillators immediately
      this.clearPowerUpOscillators();
      
      // Check game state to see if we should resume background music
      const gameState = useGameStore.getState();
      if (gameState.currentState === GameState.PLAYING) {
        // Resume background music only if game is still playing
        this.resumeBackgroundMusic();
      }
    } else {
      log.audio("stopPowerUpMelody called but melody was not active");
    }
  }

  // Public method to check if power-up melody is active
  public isPowerUpMelodyActive(): boolean {
    return this.powerUpMelodyActive;
  }

  // Public method to check if background music is actually playing
  public isBackgroundMusicActuallyPlaying(): boolean {
    // Music is only actually playing if we have a source and the flag is set
    // and power-up melody is not active (which would mute the background music)
    return this.isBackgroundMusicPlaying && 
           this.backgroundMusicSource !== null && 
           !this.powerUpMelodyActive;
  }

  // Debug method to get PowerUp melody status
  public getPowerUpMelodyStatus(): any {
    return {
      isActive: this.powerUpMelodyActive,
      hasTimeout: this.powerUpMelodyTimeout !== null,
      timeoutId: this.powerUpMelodyTimeout,
      backgroundMusicPlaying: this.isBackgroundMusicPlaying
    };
  }
}
