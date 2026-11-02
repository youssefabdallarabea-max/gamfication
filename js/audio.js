/**
 * نظام الصوت - لعبة مهمة إنقاذ كوكب الحاسوب
 * يستخدم Web Audio API لتوليد المؤثرات الصوتية
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.bgMusicNode = null;
    this.bgMusicGain = null;
    this.masterGain = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API غير متاح:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.5,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  _playTone(freq, duration, type = "sine", volume = 0.3, delay = 0) {
    if (!this.isInitialized || this.isMuted) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  playCorrect() {
    if (!this.isInitialized) return;
    // Happy ascending chime
    this._playTone(523.25, 0.15, "sine", 0.3, 0);      // C5
    this._playTone(659.25, 0.15, "sine", 0.3, 0.1);     // E5
    this._playTone(783.99, 0.15, "sine", 0.3, 0.2);     // G5
    this._playTone(1046.50, 0.3, "sine", 0.35, 0.3);    // C6
  }

  playWrong() {
    if (!this.isInitialized) return;
    // Gentle descending tone
    this._playTone(350, 0.2, "triangle", 0.2, 0);
    this._playTone(280, 0.3, "triangle", 0.15, 0.15);
  }

  playClick() {
    if (!this.isInitialized) return;
    this._playTone(800, 0.08, "sine", 0.15, 0);
  }

  playTransition() {
    if (!this.isInitialized) return;
    // Whoosh-like ascending
    this._playTone(300, 0.1, "sine", 0.1, 0);
    this._playTone(450, 0.1, "sine", 0.12, 0.05);
    this._playTone(600, 0.1, "sine", 0.14, 0.1);
    this._playTone(800, 0.15, "sine", 0.1, 0.15);
  }

  playBadge() {
    if (!this.isInitialized) return;
    // Triumphant fanfare
    this._playTone(523.25, 0.15, "sine", 0.25, 0);
    this._playTone(659.25, 0.15, "sine", 0.25, 0.12);
    this._playTone(783.99, 0.15, "sine", 0.25, 0.24);
    this._playTone(1046.50, 0.2, "sine", 0.3, 0.36);
    this._playTone(783.99, 0.1, "sine", 0.2, 0.5);
    this._playTone(1046.50, 0.4, "sine", 0.35, 0.58);
  }

  playVictory() {
    if (!this.isInitialized) return;
    // Grand victory melody
    const melody = [
      [523.25, 0.15], [523.25, 0.15], [523.25, 0.15], [659.25, 0.3],
      [587.33, 0.15], [659.25, 0.15], [783.99, 0.4],
      [1046.50, 0.2], [783.99, 0.15], [1046.50, 0.5]
    ];
    let time = 0;
    melody.forEach(([freq, dur]) => {
      this._playTone(freq, dur, "sine", 0.25, time);
      this._playTone(freq * 0.5, dur, "triangle", 0.1, time); // harmony
      time += dur * 0.8;
    });
  }

  playWelcome() {
    if (!this.isInitialized) return;
    // Friendly robot greeting
    this._playTone(400, 0.1, "square", 0.08, 0);
    this._playTone(600, 0.1, "square", 0.08, 0.12);
    this._playTone(800, 0.15, "sine", 0.12, 0.24);
    this._playTone(1000, 0.2, "sine", 0.1, 0.36);
  }

  startBgMusic() {
    if (!this.isInitialized || this.bgMusicNode) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    this.bgMusicGain = this.ctx.createGain();
    this.bgMusicGain.gain.value = this.isMuted ? 0 : 0.70;
    this.bgMusicGain.connect(this.masterGain);

    const playLoop = () => {
      // Simple ambient space music loop
      const notes = [261.63, 329.63, 392, 349.23, 293.66, 329.63, 261.63, 392];
      const dur = 1.2;
      let t = this.ctx.currentTime;

      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.20, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(this.bgMusicGain);
        osc.start(t);
        osc.stop(t + dur);

        // Soft pad harmony
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.value = freq * 0.5;
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.10, t + 0.4);
        g2.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc2.connect(g2);
        g2.connect(this.bgMusicGain);
        osc2.start(t);
        osc2.stop(t + dur);

        t += dur * 0.9;
      });

      this.bgMusicTimer = setTimeout(playLoop, dur * 0.9 * notes.length * 1000);
    };

    playLoop();
  }

  stopBgMusic() {
    if (this.bgMusicTimer) {
      clearTimeout(this.bgMusicTimer);
      this.bgMusicTimer = null;
    }
    if (this.bgMusicGain) {
      this.bgMusicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.bgMusicNode = null;
  }
}

// Global audio instance
const audioManager = new AudioManager();

