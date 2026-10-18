// Everything is synthesized with Web Audio; no recordings ship with the game.
const NOTE = n => 440 * 2 ** ((n - 69) / 12);
const SONGS = {
  // [bpm, root midi, chord roots in semitones per bar]
  morning: [118, 60, [0, 9, 5, 7]],
  noon: [128, 62, [0, 5, 9, 7]],
  sunset: [104, 57, [0, 8, 3, 10]],
  night: [96, 57, [0, 5, 8, 7]],
  graduation: [88, 60, [5, 7, 4, 9]],
};

export class Sound {
  constructor() { this.ctx = null; this.volume = .8; this.musicOn = true; this.song = null; }
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination);
      this.music = this.ctx.createGain(); this.music.gain.value = .5; this.music.connect(this.out);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.setVolume(this.volume);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  setVolume(v) { this.volume = v; if (this.out) this.out.gain.value = v * .7; }
  setMusic(on) { this.musicOn = on; if (this.music) this.music.gain.value = on ? .5 : 0; }

  tone(freq, dur, {type = 'sine', gain = .2, slide = 1, at = 0, attack = .004, dest} = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + .05);
  }
  noise(dur, {freq = 1200, q = 1, gain = .2, type = 'bandpass', slide = 1, at = 0, dest} = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + at, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.out); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  bellTone(freq, at, gain = .12) {
    for (const [m, g, d] of [[1, 1, 2.6], [2.76, .35, 1.2], [5.4, .15, .6]]) this.tone(freq * m, d, {gain: gain * g, at, attack: .002});
  }

  play(name, n = 1) {
    if (!this.ctx) return;
    switch (name) {
      case 'shot': this.noise(.07, {freq: 2400, q: .8, gain: .35, slide: .4}); this.tone(900, .05, {type: 'square', gain: .05, slide: .5}); break;
      case 'hit': this.tone(320, .28, {type: 'sine', gain: .45, slide: .35}); this.noise(.22, {freq: 700, q: 2, gain: .3, slide: .5}); this.tone(1400, .1, {type: 'triangle', gain: .12, slide: 2}); break;
      case 'miss': this.tone(700, .18, {type: 'triangle', gain: .2, slide: .5}); this.tone(520, .25, {type: 'triangle', gain: .16, slide: .5, at: .1}); break;
      case 'pop': this.tone(1100, .09, {type: 'sine', gain: .12, slide: 2.2}); break;
      case 'whoosh': this.noise(.24, {freq: 500, q: 1.2, gain: .12 * Math.min(2, n), slide: 6}); break;
      case 'zip': this.noise(.16, {freq: 2600, q: 1, gain: .12, slide: .3}); break;
      case 'window': this.tone(1568, .12, {type: 'sine', gain: .07}); break;
      case 'clap': this.noise(.35, {freq: 1800, q: .6, gain: .7, slide: .5}); this.tone(180, .3, {type: 'sine', gain: .4, slide: .4}); break;
      case 'slash': this.noise(.4, {freq: 6000, q: 3, gain: .35, slide: .2}); this.tone(2200, .3, {type: 'sawtooth', gain: .05, slide: .3}); break;
      case 'cutin': this.noise(.3, {freq: 300, q: 1, gain: .18, slide: 8}); this.tone(660, .12, {type: 'square', gain: .05, at: .05}); break;
      case 'tick': this.tone(2000, .03, {type: 'square', gain: .03}); break;
      case 'ui': this.tone(880, .06, {type: 'triangle', gain: .08, slide: 1.5}); break;
      case 'bell': [64, 60, 62, 55, 55, 62, 64, 60].forEach((m, i) => this.bellTone(NOTE(m + 12), i * .55 + (i > 3 ? .4 : 0))); break;
      case 'stamp': this.tone(140, .2, {type: 'sine', gain: .5, slide: .5}); this.noise(.1, {freq: 400, gain: .3}); break;
    }
  }

  // Tiny step sequencer: marimba arpeggio, soft bass, brushed hats.
  startSong(name) {
    if (!this.ctx || this.song === name) return;
    this.stopSong(); this.song = name;
    const [bpm, root, chords] = SONGS[name], step = 60 / bpm / 2;
    let n = 0, next = this.ctx.currentTime + .1;
    this.seq = setInterval(() => {
      while (next < this.ctx.currentTime + .3) {
        const bar = Math.floor(n / 8) % 4, beat = n % 8, at = next - this.ctx.currentTime;
        const chordRoot = root + chords[bar];
        if (beat % 4 === 0) this.tone(NOTE(chordRoot - 24), step * 3.5, {type: 'triangle', gain: .14, at, dest: this.music});
        // ponytail: fifths and octaves only, so every chord stays consonant without a key table
        const arp = [0, 7, 12, 19, 12, 7, 14, 12][beat];
        this.tone(NOTE(chordRoot + arp), step * 1.6, {type: 'sine', gain: beat % 2 ? .05 : .08, at, dest: this.music});
        this.tone(NOTE(chordRoot + arp) * 4, .05, {type: 'sine', gain: .012, at, dest: this.music});
        if (beat % 2 === 1) this.noise(.04, {freq: 8000, type: 'highpass', gain: .025, at, dest: this.music});
        next += step; n++;
      }
    }, 100);
  }
  stopSong() { clearInterval(this.seq); this.song = null; }
}
