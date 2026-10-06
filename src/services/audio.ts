class SoundManager {
  private ctx: AudioContext | null = null;
  public soundOn: boolean = true;
  public musicOn: boolean = true;
  public musicVolume: number = 0.35;
  private musicInterval: any = null;
  private musicBar: number = 0;
  private musicGainNode: GainNode | null = null;
  private customMusicAudio: HTMLAudioElement | null = null;

  constructor() {
    try {
      const s = localStorage.getItem('nabard_sound_enabled');
      if (s !== null) this.soundOn = s === 'true';
      const m = localStorage.getItem('nabard_music_enabled');
      if (m !== null) this.musicOn = m === 'true';
      const v = localStorage.getItem('nabard_music_vol');
      if (v !== null) this.musicVolume = parseFloat(v);
    } catch {
      // ignore
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundOn = enabled;
    try {
      localStorage.setItem('nabard_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
    if (enabled) {
      this.play('select');
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicOn = enabled;
    try {
      localStorage.setItem('nabard_music_enabled', String(enabled));
    } catch {
      // ignore
    }
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('nabard_music_vol', String(this.musicVolume));
    } catch {
      // ignore
    }
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
    if (this.customMusicAudio) {
      this.customMusicAudio.volume = this.musicVolume;
    }
  }

  private ensureMasterGain(): GainNode | null {
    const c = this.ensureContext();
    if (!c) return null;
    if (!this.musicGainNode) {
      this.musicGainNode = c.createGain();
      this.musicGainNode.connect(c.destination);
    }
    this.musicGainNode.gain.value = this.musicVolume;
    return this.musicGainNode;
  }

  public tone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.12, slide?: number): void {
    if (!this.soundOn) return;
    const c = this.ensureContext();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slide) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), c.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch {
      // ignore
    }
  }

  public noise(duration: number = 0.15, volume: number = 0.15): void {
    if (!this.soundOn) return;
    const c = this.ensureContext();
    if (!c) return;
    try {
      const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = c.createBufferSource();
      src.buffer = buffer;
      const gain = c.createGain();
      gain.gain.value = volume;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start();
    } catch {
      // ignore
    }
  }

  public play(name: string): void {
    if (!this.soundOn) return;
    switch (name) {
      case 'select':
      case 'click':
        this.tone(600, 0.06, 'square', 0.06);
        break;
      case 'coin':
        this.tone(987, 0.08, 'sine', 0.1);
        setTimeout(() => this.tone(1318, 0.15, 'sine', 0.1), 70);
        break;
      case 'attack':
        this.noise(0.18, 0.16);
        this.tone(220, 0.2, 'sawtooth', 0.09, 80);
        break;
      case 'slash':
        this.noise(0.09, 0.11);
        this.tone(1000, 0.08, 'sawtooth', 0.05, 250);
        break;
      case 'hit':
        this.tone(120, 0.16, 'square', 0.16, 60);
        this.noise(0.09, 0.1);
        break;
      case 'crit':
        this.tone(200, 0.1, 'square', 0.15);
        setTimeout(() => this.tone(800, 0.2, 'square', 0.12, 1200), 70);
        break;
      case 'death':
        this.tone(380, 0.5, 'sawtooth', 0.14, 50);
        this.noise(0.3, 0.12);
        break;
      case 'ability':
        this.tone(700, 0.1, 'sine', 0.1);
        setTimeout(() => this.tone(1050, 0.16, 'sine', 0.1), 80);
        break;
      case 'heal':
        this.tone(520, 0.14, 'sine', 0.09);
        setTimeout(() => this.tone(780, 0.18, 'sine', 0.09), 100);
        break;
      case 'shield':
        this.tone(500, 0.12, 'triangle', 0.1);
        setTimeout(() => this.tone(750, 0.14, 'triangle', 0.09), 80);
        break;
      case 'freeze':
        this.tone(1400, 0.3, 'sine', 0.07, 900);
        break;
      case 'thorns':
        this.tone(300, 0.12, 'square', 0.1, 150);
        break;
      case 'poison':
        this.tone(180, 0.25, 'sawtooth', 0.08, 90);
        break;
      case 'dodge':
        this.tone(900, 0.12, 'sine', 0.08, 300);
        break;
      case 'taunt':
        this.tone(300, 0.1, 'square', 0.1);
        setTimeout(() => this.tone(300, 0.15, 'square', 0.1), 120);
        break;
      case 'revive':
        [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'sine', 0.1), i * 100));
        break;
      case 'summon':
        this.tone(500, 0.2, 'sine', 0.1, 1000);
        break;
      case 'victory':
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.15), i * 130));
        break;
      case 'defeat':
        [440, 349, 293, 220].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.1), i * 160));
        break;
      case 'pack_open':
        [400, 550, 700, 900, 1200].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'sine', 0.1), i * 80));
        break;
    }
  }

  public playCustomCardSound(audioDataUri: string | null | undefined): void {
    if (!this.soundOn || !audioDataUri) return;
    try {
      const audio = new Audio(audioDataUri);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  public startMusic(): void {
    if (!this.musicOn) return;
    if (this.customMusicAudio) {
      this.customMusicAudio.play().catch(() => {});
      return;
    }
    if (this.musicInterval) return;
    const master = this.ensureMasterGain();
    if (!master) return;
    this.musicInterval = setInterval(() => this.playMusicBar(), 2400);
    this.playMusicBar();
  }

  public stopMusic(): void {
    if (this.customMusicAudio) {
      this.customMusicAudio.pause();
    }
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public setCustomMusicFile(file: File): void {
    try {
      if (this.customMusicAudio) {
        this.customMusicAudio.pause();
      }
      this.customMusicAudio = new Audio(URL.createObjectURL(file));
      this.customMusicAudio.loop = true;
      this.customMusicAudio.volume = this.musicVolume;
      this.stopMusic();
      if (this.musicOn) {
        this.customMusicAudio.play().catch(() => {});
      }
    } catch (e) {
      console.error('Failed to load custom music', e);
    }
  }

  public clearCustomMusic(): void {
    if (this.customMusicAudio) {
      this.customMusicAudio.pause();
      this.customMusicAudio = null;
    }
    if (this.musicOn) {
      this.startMusic();
    }
  }

  private playMusicBar(): void {
    const c = this.ctx;
    const out = this.musicGainNode;
    if (!c || !out) return;
    const t = c.currentTime + 0.05;
    const bar = this.musicBar % 8;
    const chords = [
      [110.0, 130.8, 164.8], // Am
      [87.3, 110.0, 130.8],  // F
      [98.0, 123.5, 146.8],  // G
      [82.4, 98.0, 123.5],   // Em
    ];
    const chord = chords[Math.floor(bar / 2)];

    this.synthKick(t);
    this.synthKick(t + 0.6);
    this.synthSnare(t + 1.2);
    this.synthSnare(t + 1.8);

    this.synthBass(chord[0] / 2, t);
    this.synthBass(chord[0] / 2, t + 1.2);

    this.synthPad(chord, t, 2.3);

    if (bar >= 4) {
      const melodyScale = [440, 523.3, 587.3, 659.3, 784];
      const idx = (this.musicBar * 3) % melodyScale.length;
      this.synthLead(melodyScale[idx], t + 0.6);
      this.synthLead(melodyScale[(idx + 2) % melodyScale.length], t + 1.5);
    }
    this.musicBar++;
  }

  private synthKick(t: number): void {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(this.musicGainNode);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private synthSnare(t: number): void {
    if (!this.ctx || !this.musicGainNode) return;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.14), this.ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.value = 0.12;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.musicGainNode);
    src.start(t);
  }

  private synthBass(freq: number, t: number): void {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc.connect(g);
    g.connect(this.musicGainNode);
    osc.start(t);
    osc.stop(t + 1.05);
  }

  private synthPad(freqs: number[], t: number, dur: number): void {
    if (!this.ctx || !this.musicGainNode) return;
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      const flt = this.ctx!.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      flt.type = 'lowpass';
      flt.frequency.value = 850;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.4);
      g.gain.linearRampToValueAtTime(0.001, t + dur);
      osc.connect(flt);
      flt.connect(g);
      g.connect(this.musicGainNode!);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  private synthLead(freq: number, t: number): void {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g);
    g.connect(this.musicGainNode);
    osc.start(t);
    osc.stop(t + 0.55);
  }
}

export const sound = new SoundManager();
