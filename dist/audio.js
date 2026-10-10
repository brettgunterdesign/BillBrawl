// Bill Brawl's original soundtrack and effects. All audio is synthesized locally.
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const hz = note => 440 * 2 ** ((note - 69) / 12);
const THEMES = {
  dock: { root: 50, bpm: 126, melody: [12, null, 7, 10, null, 12, 15, null, 14, null, 10, 7, 5, null, 7, null] },
  roof: { root: 55, bpm: 136, melody: [12, 7, null, 14, 15, null, 19, 17, null, 15, 14, null, 10, 7, null, 10] },
  pump: { root: 45, bpm: 120, melody: [12, null, null, 7, 10, null, 14, 12, null, 7, 5, null, 3, 5, null, 10] },
  neon: { root: 52, bpm: 140, melody: [12, null, 15, 19, 17, null, 15, 14, 12, null, 10, 14, 7, null, 10, null] },
  ice: { root: 57, bpm: 112, melody: [19, null, 17, null, 14, 12, null, 10, 12, null, 14, 17, null, 15, 14, null] },
  jungle: { root: 48, bpm: 132, melody: [12, 15, null, 7, 10, null, 12, 17, 15, null, 12, null, 10, 7, 5, null] },
  lava: { root: 43, bpm: 138, melody: [12, null, 13, 12, 7, null, 10, 7, 3, 5, null, 7, 10, null, 13, null] }
};
const LOBBY = { root: 53, bpm: 104, melody: [12, null, 16, null, 19, 16, null, 14, 12, null, 9, 12, null, 14, 16, null] };
const ZOMBIE = { root: 38, bpm: 118, melody: [12, null, null, 13, 7, null, 10, null, 12, null, 6, null, 7, 6, null, 3] };

export class AudioDirector {
  constructor() {
    this.enabled = true;
    this.paused = false;
    this.musicVolume = .42;
    this.sfxVolume = .72;
    this.scene = 'lobby';
    this.theme = 'dock';
    this.wave = 1;
    this.step = 0;
    this.nextNote = 0;
    this.context = null;
    this.timer = null;
    this.voices = new Set();
    this.lastEffects = new Map();
    this.destroyed = false;
  }

  async unlock() {
    if (this.destroyed) return false;
    try {
      if (!this.context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) return false;
        this.context = new Context();
        const c = this.context;
        this.master = c.createGain();
        this.master.gain.value = .8;
        this.musicBus = c.createGain();
        this.sfxBus = c.createGain();
        this.limiter = c.createDynamicsCompressor();
        this.limiter.threshold.value = -12;
        this.limiter.knee.value = 10;
        this.limiter.ratio.value = 8;
        this.limiter.attack.value = .003;
        this.limiter.release.value = .12;
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.master.connect(this.limiter);
        this.limiter.connect(c.destination);
        this.noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const samples = this.noiseBuffer.getChannelData(0);
        let seed = 10711;
        for (let i = 0; i < samples.length; i++) {
          seed = (seed * 16807) % 2147483647;
          samples[i] = seed / 1073741824 - 1;
        }
        // Narrow pulse has the bright, hollow character of a small arcade chip.
        const real = new Float32Array(33), imag = new Float32Array(33);
        for (let n = 1; n < 33; n++) {
          real[n] = Math.sin(2 * Math.PI * n * .24) / (Math.PI * n);
          imag[n] = (1 - Math.cos(2 * Math.PI * n * .24)) / (Math.PI * n);
        }
        this.pulse = c.createPeriodicWave(real, imag);
        this._volumes(true);
        this.nextNote = c.currentTime + .025;
        this.timer = setInterval(() => this._schedule(), 25);
      }
      if (this.context.state !== 'running') await this.context.resume();
      if (this.nextNote < this.context.currentTime) this.nextNote = this.context.currentTime + .025;
      this._schedule();
      return this.context.state === 'running';
    } catch {
      // Some privacy modes and embedded browsers disallow audio entirely.
      return false;
    }
  }

  setEnabled(value) {
    this.enabled = !!value;
    if (!this.enabled) this._stopVoices();
    this._volumes();
    if (this.context) this.nextNote = this.context.currentTime + .025;
  }

  setVolumes(music, sfx) {
    if (Number.isFinite(music)) this.musicVolume = clamp(music, 0, 1);
    if (Number.isFinite(sfx)) this.sfxVolume = clamp(sfx, 0, 1);
    this._volumes();
  }

  setScene(scene, theme = this.theme) {
    if (!['lobby', 'pvp', 'zombie', 'gameover'].includes(scene)) scene = 'lobby';
    const changed = scene !== this.scene || theme !== this.theme;
    this.scene = scene;
    this.theme = theme || 'dock';
    if (changed) {
      this._stopVoices('music');
      this.step = 0;
      this.wave = 1;
      if (this.context) this.nextNote = this.context.currentTime + .025;
    }
  }

  setPaused(value) {
    const wasPaused = this.paused;
    this.paused = !!value;
    if (this.paused) this._stopVoices();
    this._volumes();
    if (wasPaused && !this.paused && this.context) this.nextNote = this.context.currentTime + .025;
  }

  _volumes(immediate = false) {
    if (!this.context) return;
    const t = this.context.currentTime;
    const on = this.enabled && !this.paused;
    for (const [bus, value] of [[this.musicBus, on ? this.musicVolume : 0], [this.sfxBus, on ? this.sfxVolume : 0]]) {
      bus.gain.cancelScheduledValues(t);
      if (immediate) bus.gain.setValueAtTime(value, t);
      else bus.gain.setTargetAtTime(value, t, .015);
    }
  }

  _stopVoices(kind) {
    for (const voice of [...this.voices]) {
      if (kind && voice.kind !== kind) continue;
      try { voice.source.stop(); } catch { /* already stopped */ }
      this._release(voice);
    }
  }

  _release(voice) {
    if (!this.voices.delete(voice)) return;
    for (const node of voice.nodes) {
      try { node.disconnect(); } catch { /* disconnected */ }
    }
  }

  _voice(source, duration, options = {}) {
    const c = this.context;
    if (!c || this.destroyed || !this.enabled || this.paused) return;
    // Keep a busy four-player fight from creating unbounded audio nodes.
    if (this.voices.size >= 64) {
      const old = [...this.voices].find(v => v.kind === 'music') || this.voices.values().next().value;
      try { old.source.stop(); } catch { /* already stopped */ }
      this._release(old);
    }
    const when = Math.max(c.currentTime, options.when ?? c.currentTime);
    const gain = c.createGain(), nodes = [source, gain];
    let output = source;
    if (options.filter) {
      const filter = c.createBiquadFilter();
      filter.type = options.filter;
      filter.frequency.setValueAtTime(options.cutoff || 1600, when);
      if (options.cutoffEnd) filter.frequency.exponentialRampToValueAtTime(options.cutoffEnd, when + duration);
      filter.Q.value = options.q || .7;
      source.connect(filter);
      output = filter;
      nodes.push(filter);
    }
    output.connect(gain);
    const level = Math.max(.0001, options.volume ?? .08), attack = Math.min(options.attack ?? .003, duration / 3);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(level, when + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    const bus = options.kind === 'music' ? this.musicBus : this.sfxBus;
    if (c.createStereoPanner && options.pan) {
      const pan = c.createStereoPanner();
      pan.pan.value = clamp(options.pan, -.7, .7);
      gain.connect(pan);
      pan.connect(bus);
      nodes.push(pan);
    } else gain.connect(bus);
    const voice = { source, nodes, kind: options.kind || 'sfx' };
    this.voices.add(voice);
    source.onended = () => this._release(voice);
    source.start(when);
    source.stop(when + duration + .01);
  }

  _tone(frequency, duration, options = {}) {
    if (!this.context || !this.enabled || this.paused || this.destroyed) return;
    const source = this.context.createOscillator(), when = Math.max(this.context.currentTime, options.when ?? this.context.currentTime);
    if (options.type === 'pulse') source.setPeriodicWave(this.pulse);
    else source.type = options.type || 'square';
    source.frequency.setValueAtTime(Math.max(12, frequency), when);
    if (options.end) source.frequency.exponentialRampToValueAtTime(Math.max(12, options.end), when + duration);
    if (options.detune) source.detune.value = options.detune;
    this._voice(source, duration, options);
  }

  _noise(duration, options = {}) {
    if (!this.context || !this.enabled || this.paused || this.destroyed) return;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    this._voice(source, duration, { filter: 'lowpass', cutoff: 2500, ...options });
  }

  _track() {
    if (this.scene === 'lobby' || this.scene === 'gameover') return LOBBY;
    if (this.scene === 'zombie') return { ...ZOMBIE, bpm: ZOMBIE.bpm + Math.min(34, (this.wave - 1) * 2) };
    const theme = String(this.theme).toLowerCase();
    if (/roof|sky/.test(theme)) return THEMES.roof;
    if (/pump|sewer|factory/.test(theme)) return THEMES.pump;
    if (/neon|city|arcade/.test(theme)) return THEMES.neon;
    if (/ice|snow|frost/.test(theme)) return THEMES.ice;
    if (/jungle|forest|garden/.test(theme)) return THEMES.jungle;
    if (/lava|volcano|forge/.test(theme)) return THEMES.lava;
    return THEMES.dock;
  }

  _schedule() {
    const c = this.context;
    if (!c || c.state !== 'running' || this.destroyed || !this.enabled || this.paused || this.musicVolume === 0) return;
    if (this.nextNote < c.currentTime - .1) this.nextNote = c.currentTime + .025;
    const track = this._track(), length = 60 / track.bpm / 4;
    while (this.nextNote < c.currentTime + .1) {
      this._musicStep(track, this.step++, this.nextNote, length);
      this.nextNote += length;
    }
  }

  _musicStep(track, step, when, length) {
    const s = step % 16, bar = Math.floor(step / 16) % 4;
    const zombie = this.scene === 'zombie', lobby = this.scene === 'lobby' || this.scene === 'gameover';
    const progression = lobby ? [0, 5, 9, 7] : zombie ? [0, 0, 1, -2] : [0, -2, 5, 3];
    const chord = track.root + progression[bar];
    const music = { kind: 'music', when };
    if (s % 4 === 0 || (!lobby && s === 10)) {
      this._tone(hz(chord - 12 + (s === 8 ? 7 : 0)), length * 2.6, { ...music, type: 'triangle', volume: .11 });
      this._tone(135, .1, { ...music, type: 'sine', end: 38, volume: .14 });
    }
    if (s === 4 || s === 12) {
      this._noise(.1, { ...music, filter: 'highpass', cutoff: 1400, volume: lobby ? .035 : .067 });
      this._tone(155, .065, { ...music, type: 'triangle', end: 85, volume: .045 });
    }
    if (s % 2 === 0 || (zombie && this.wave >= 4)) this._noise(.024, { ...music, filter: 'highpass', cutoff: 6400, volume: s % 4 ? .022 : .035 });
    const note = track.melody[s];
    if (note !== null) this._tone(hz(track.root + note + (bar === 2 ? 5 : bar === 3 ? -2 : 0)), length * (s % 2 ? .8 : 1.35), {
      ...music, type: lobby ? 'triangle' : 'pulse', volume: lobby ? .07 : .046, pan: -.2
    });
    if (s % 2 === 1 && (!lobby || bar % 2 === 0)) {
      const arpeggio = zombie ? [0, 3, 6, 10] : lobby ? [0, 4, 7, 11] : [0, 3, 7, 10];
      this._tone(hz(chord + 12 + arpeggio[Math.floor(s / 2) % 4]), length * .55, { ...music, type: 'pulse', volume: .018, pan: .25 });
    }
    if (zombie && this.wave >= 3 && s % 4 === 2) this._tone(hz(chord - 12), length * .6, { ...music, type: 'sawtooth', filter: 'lowpass', cutoff: 350, volume: .035 });
    if (zombie && this.wave >= 7 && s === 15) this._noise(.12, { ...music, cutoff: 950, volume: .04 });
  }

  play(type, data = {}) {
    if (!data || typeof data !== 'object') data = {};
    // Wave tracking works even before audio is unlocked or while muted.
    if (Number.isFinite(data.wave)) this.wave = clamp(data.wave, 1, 1000);
    const c = this.context;
    if (!c || c.state !== 'running' || !this.enabled || this.paused || this.destroyed) return;
    const now = c.currentTime;
    const key = type === 'shot' ? `${type}:${data.weapon || 'pistol'}` : type;
    const cooldown = type === 'shot' ? .025 : /zombie[-_]?(hit|growl|spawn)/.test(type) ? .07 : .018;
    if (now - (this.lastEffects.get(key) ?? -10) < cooldown) return;
    this.lastEffects.set(key, now);
    const pan = Number.isFinite(data.x) ? clamp(data.x / 640 * 1.4 - .7, -.7, .7) : 0;
    const tone = (f, d, opts = {}) => this._tone(f, d, { pan, ...opts, when: now + (opts.delay || 0) });
    const noise = (d, opts = {}) => this._noise(d, { pan, ...opts, when: now + (opts.delay || 0) });
    const flourish = (notes, spacing = .07, volume = .09) => notes.forEach((n, i) => tone(hz(n), .16, { type: 'pulse', volume, delay: i * spacing }));
    if (type === 'shot' || Object.hasOwn({ pistol: 1, shotgun: 1, grenade: 1, smg: 1, sniper: 1, rocket: 1, ricochet: 1, flamethrower: 1, railgun: 1, crossbow: 1, melee: 1, wrench: 1, bat: 1 }, type)) {
      const weapon = type === 'shot' ? data.weapon || 'pistol' : type;
      switch (weapon) {
        case 'pistol': tone(490, .065, { end: 70, volume: .13 }); noise(.06, { cutoff: 3700, volume: .14 }); break;
        case 'shotgun': noise(.22, { cutoff: 5200, cutoffEnd: 450, volume: .29 }); tone(130, .19, { type: 'triangle', end: 32, volume: .23 }); noise(.07, { delay: .15, cutoff: 1700, volume: .075 }); break;
        case 'smg': noise(.047, { filter: 'highpass', cutoff: 1500, volume: .17 }); tone(330, .035, { end: 95, volume: .085 }); break;
        case 'sniper': noise(.18, { cutoff: 7900, cutoffEnd: 600, volume: .22 }); tone(850, .14, { end: 65, volume: .16 }); tone(150, .2, { type: 'triangle', volume: .085, delay: .04 }); break;
        case 'rocket': noise(.33, { cutoff: 900, cutoffEnd: 4000, volume: .17 }); tone(90, .26, { type: 'sawtooth', end: 230, volume: .11 }); break;
        case 'ricochet': tone(1300, .15, { type: 'triangle', end: 440, volume: .14 }); tone(1850, .07, { type: 'pulse', end: 600, volume: .05 }); break;
        case 'flamethrower': noise(.19, { cutoff: 1500, cutoffEnd: 650, volume: .18 }); tone(52, .1, { type: 'sawtooth', end: 34, volume: .065 }); break;
        case 'railgun': tone(1200, .22, { type: 'sawtooth', end: 110, filter: 'lowpass', cutoff: 4500, volume: .13 }); tone(2100, .13, { type: 'triangle', end: 480, volume: .09 }); noise(.09, { filter: 'highpass', cutoff: 4000, volume: .1 }); break;
        case 'crossbow': tone(620, .11, { type: 'triangle', end: 115, volume: .15 }); noise(.045, { cutoff: 1100, volume: .095 }); break;
        case 'melee': case 'wrench': case 'bat': noise(.14, { filter: 'bandpass', cutoff: 800, cutoffEnd: 3000, volume: .16 }); tone(90, .06, { type: 'triangle', end: 30, volume: .12 }); break;
        case 'grenade': tone(760, .04, { type: 'triangle', end: 390, volume: .07 }); noise(.07, { delay: .04, cutoff: 950, volume: .08 }); break;
        default: tone(470, .075, { end: 90, volume: .12 }); noise(.08, { cutoff: 2400, volume: .12 });
      }
      return;
    }
    switch (type) {
      case 'explosion': noise(.65, { cutoff: 4200, cutoffEnd: 160, volume: .3 }); tone(105, .45, { type: 'triangle', end: 22, volume: .3 }); tone(42, .5, { type: 'sine', end: 20, volume: .16 }); break;
      case 'pickup': case 'upgrade': flourish(type === 'upgrade' ? [60, 64, 67, 72, 76] : [72, 79], .05, .085); break;
      case 'jump': tone(140, .095, { type: 'triangle', end: 480, volume: .055 }); break;
      case 'throw': tone(500, .12, { type: 'triangle', end: 110, volume: .05 }); noise(.08, { filter: 'bandpass', cutoff: 1700, volume: .045 }); break;
      case 'empty': tone(110, .024, { type: 'triangle', volume: .075 }); noise(.02, { filter: 'highpass', cutoff: 1800, volume: .04 }); break;
      case 'death': tone(370, .32, { type: 'sawtooth', end: 45, filter: 'lowpass', cutoff: 1100, volume: .11 }); noise(.12, { cutoff: 1300, volume: .11 }); break;
      case 'chirp': case 'call': this._call(data.species || 'platypus', now, pan); break;
      case 'bounce': case 'ricochet-hit': tone(1250, .09, { type: 'triangle', end: 700, volume: .08 }); break;
      case 'hit': case 'zombie-hit': case 'zombieHit': noise(.07, { cutoff: 850, volume: .14 }); tone(160, .09, { type: 'triangle', end: 70, volume: .08 }); break;
      case 'zombie-death': case 'zombieDeath': tone(170, .29, { type: 'sawtooth', end: 35, filter: 'lowpass', cutoff: 500, volume: .12 }); noise(.18, { cutoff: 600, volume: .1 }); break;
      case 'zombie-growl': case 'zombieGrowl': tone(65 + this.wave % 4 * 5, .48, { type: 'sawtooth', end: 38, filter: 'lowpass', cutoff: 310, volume: .1 }); tone(72, .4, { type: 'triangle', end: 45, volume: .065, delay: .03 }); break;
      case 'spawn': case 'zombie-spawn': case 'zombieSpawn': noise(.25, { cutoff: 650, cutoffEnd: 1800, volume: .07 }); tone(85, .17, { type: 'triangle', end: 50, volume: .07 }); break;
      case 'wave': case 'wave-start': case 'waveStart': flourish([38, 45, 50, 51], .12, .1); noise(.25, { delay: .32, cutoff: 1800, volume: .12 }); break;
      case 'wave-clear': case 'waveClear': flourish([62, 65, 69, 74], .085, .085); break;
      case 'revive': flourish([55, 62, 67, 74, 79], .07, .1); break;
      case 'down': tone(320, .5, { type: 'triangle', end: 85, volume: .12 }); tone(240, .45, { type: 'pulse', end: 65, volume: .055, delay: .12 }); break;
      case 'round': tone(240, .12, { type: 'pulse', end: 320, volume: .08 }); break;
      case 'go': flourish([67, 79], .045, .1); break;
      case 'win': flourish([60, 64, 67, 72, 67, 76, 79], .075, .1); break;
      case 'gameover': flourish([60, 58, 55, 48], .19, .09); break;
      case 'ui': tone(660, .055, { type: 'triangle', end: 880, volume: .065 }); break;
    }
  }

  _call(species, now, pan) {
    // Character voices are deliberately stylized rather than sampled animals.
    const note = (f, end, delay, duration, type = 'triangle', volume = .1, cutoff = 1800) => this._tone(f, duration, {
      when: now + delay, end, type, pan, volume, filter: 'lowpass', cutoff
    });
    switch (species) {
      case 'duck': note(470, 280, 0, .14, 'sawtooth', .11, 1000); note(430, 245, .17, .14, 'sawtooth', .1, 1000); break;
      case 'pelican': note(165, 100, 0, .24, 'sawtooth', .12, 650); note(205, 125, .14, .2, 'triangle', .1); break;
      case 'toucan': note(780, 1050, 0, .09, 'pulse', .075); note(970, 730, .12, .12, 'pulse', .075); note(750, 560, .25, .09, 'pulse', .065); break;
      case 'puffin': note(520, 350, 0, .08, 'triangle', .12); note(660, 440, .1, .09, 'triangle', .12); note(530, 360, .21, .1, 'triangle', .12); break;
      case 'shoebill': for (let i = 0; i < 4; i++) { this._noise(.035, { when: now + i * .06, pan, cutoff: 1700, volume: .13 }); note(95, 45, i * .06, .05, 'triangle', .09); } break;
      default: note(340, 540, 0, .1, 'triangle', .12); note(520, 260, .11, .19, 'triangle', .12); note(410, 220, .15, .16, 'pulse', .04, 950);
    }
  }

  destroy() {
    this.destroyed = true;
    clearInterval(this.timer);
    this.timer = null;
    this._stopVoices();
    this.lastEffects.clear();
    if (this.context) {
      this.context.close().catch(() => {});
      this.context = null;
    }
  }
}
