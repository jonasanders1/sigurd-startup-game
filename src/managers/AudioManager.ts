import { AudioEvent, GameState } from '../types/enums';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private isBackgroundMusicPlaying = false;
  private backgroundMusicTimeout: number | null = null;
  private activeOscillators: OscillatorNode[] = [];

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.backgroundMusicGain = this.audioContext.createGain();
      this.backgroundMusicGain.connect(this.audioContext.destination);
      this.backgroundMusicGain.gain.value = 0.1; // Low volume for background music
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureAudioContext(): void {
    if (this.audioContext?.state === 'suspended') {
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
    console.log('🛑 AudioManager: Stopping background music');
    this.isBackgroundMusicPlaying = false;
    
    // Clear any pending timeout for the next melody loop
    if (this.backgroundMusicTimeout !== null) {
      clearTimeout(this.backgroundMusicTimeout);
      this.backgroundMusicTimeout = null;
    }

    // Stop all active oscillators immediately
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped, ignore error
      }
    });
    this.activeOscillators = [];
  }

  private playBombCollectSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  private playMonsterHitSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

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

      oscillator.type = 'triangle';
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
    const melody = [659.25, 783.99, 1046.50, 783.99, 1046.50]; // E5, G5, C6, G5, C6
    let time = this.audioContext.currentTime;

    melody.forEach((frequency, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, time);

      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      oscillator.start(time);
      oscillator.stop(time + 0.4);

      time += 0.2;
    });
  }

  private startBackgroundMusic(): void {
    if (!this.audioContext || this.isBackgroundMusicPlaying) return;

    console.log('🎵 AudioManager: Starting background music');
    this.isBackgroundMusicPlaying = true;
    this.playBackgroundMelody();
  }

  private playBackgroundMelody(): void {
    if (!this.audioContext || !this.backgroundMusicGain || !this.isBackgroundMusicPlaying) return;

    // Simple repeating melody
    const melody = [
      { freq: 440, duration: 0.5 }, // A4
      { freq: 493.88, duration: 0.5 }, // B4
      { freq: 523.25, duration: 0.5 }, // C5
      { freq: 587.33, duration: 0.5 }, // D5
      { freq: 523.25, duration: 0.5 }, // C5
      { freq: 493.88, duration: 0.5 }, // B4
      { freq: 440, duration: 1.0 }, // A4
    ];

    let time = this.audioContext.currentTime;

    melody.forEach(note => {
      if (!this.audioContext || !this.backgroundMusicGain || !this.isBackgroundMusicPlaying) return;

      const oscillator = this.audioContext.createOscillator();
      oscillator.connect(this.backgroundMusicGain);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(note.freq, time);

      oscillator.start(time);
      oscillator.stop(time + note.duration);

      // Track active oscillators so we can stop them immediately if needed
      this.activeOscillators.push(oscillator);
      
      // Remove from tracking when it naturally ends
      oscillator.onended = () => {
        const index = this.activeOscillators.indexOf(oscillator);
        if (index > -1) {
          this.activeOscillators.splice(index, 1);
        }
      };

      time += note.duration;
    });

    // Schedule next loop only if music should still be playing
    const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    this.backgroundMusicTimeout = setTimeout(() => {
      if (this.isBackgroundMusicPlaying) {
        this.playBackgroundMelody();
      }
    }, totalDuration * 1000) as unknown as number;
  }

  cleanup(): void {
    this.stopBackgroundMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}