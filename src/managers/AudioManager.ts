import { AudioEvent, GameState } from "../types/enums";
import { ASSET_PATHS } from "../config/assets";

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private isBackgroundMusicPlaying = false;
  private backgroundMusicBuffer: AudioBuffer | null = null;
  private backgroundMusicSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.initializeAudioContext();
    this.loadBackgroundMusic();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.backgroundMusicGain = this.audioContext.createGain();
      this.backgroundMusicGain.connect(this.audioContext.destination);
      this.backgroundMusicGain.gain.value = 1; // Low volume for background music
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
    }
  }

  private async loadBackgroundMusic(): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(`${ASSET_PATHS.audio}/background-music.wav`);
      const arrayBuffer = await response.arrayBuffer();
      this.backgroundMusicBuffer = await this.audioContext.decodeAudioData(
        arrayBuffer
      );
      console.log("🎵 Background music loaded successfully");
    } catch (error) {
      console.warn("Failed to load background music:", error);
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
        console.log("🔥 Bonus sound");
        this.playBonusSound();
        break;
      case AudioEvent.BACKGROUND_MUSIC:
        // Only start background music if game state is PLAYING
        if (gameState === GameState.PLAYING) {
          this.startBackgroundMusic();
        }
        break;
      default:
        console.log(`Audio event ${event} not implemented yet`);
    }
  }

  stopBackgroundMusic(): void {
    console.log("🛑 AudioManager: Stopping background music");
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

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
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

    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
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

    notes.forEach((frequency, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, time);

      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

      oscillator.start(time);
      oscillator.stop(time + 0.3);

      time += 0.15;
    });
  }

  private playBonusSound(): void {
    if (!this.audioContext) return;

    // Play a short celebratory melody
    const melody = [659.25, 783.99, 1046.5, 783.99, 1046.5]; // E5, G5, C6, G5, C6
    let time = this.audioContext.currentTime;

    melody.forEach((frequency, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, time);

      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      oscillator.start(time);
      oscillator.stop(time + 0.4);

      time += 0.2;
    });
  }

  private startBackgroundMusic(): void {
    if (
      !this.audioContext ||
      this.isBackgroundMusicPlaying ||
      !this.backgroundMusicBuffer
    )
      return;

    console.log("🎵 AudioManager: Starting background music");
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
      console.log("🎵 Playing background music file");
    } catch (error) {
      console.warn("Failed to play background music file:", error);
    }
  }

  cleanup(): void {
    this.stopBackgroundMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
