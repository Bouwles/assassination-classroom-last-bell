// Encounter rules for Mach 20. Pure logic: no DOM, deterministic for a given seed.
// Koro-sensei splits into afterimages, shuffles at Mach 20, then freezes for a moment.
// Shoot the real one to knock off a tentacle; strip them all, clap, then land the knife.

export const KORO = {height: 440, img: {w: 775, h: 727}, head: {x: 430, y: 140, r: 72}, hit: {x: 420, y: 330, rx: 150, ry: 300}};
export const RING = {start: 300, target: 72, tol: 26};

export const PERIODS = [
  {kanji: '一時間目', name: 'Homeroom', scene: 'morning', clones: 3, swaps: 4, swap: .5, pairs: 1, cycle: 0, window: 2, hp: 3, time: 80, ring: 1.25, size: 1,
    board: ['出席', 'Roll call'], intro: 'Good morning! Roll call starts now. Feel free to shoot while I take attendance.',
    win: 'A clean first period. Watch the one who moves first; afterimages always arrive late.'},
  {kanji: '二時間目', name: 'P.E.', scene: 'noon', clones: 4, swaps: 6, swap: .42, pairs: 1, cycle: .2, window: 1.7, hp: 4, time: 85, ring: 1.15, size: .95,
    board: ['体育', 'P.E.'], intro: 'Fresh air! Mr. Karasuma lent me the field. Try to keep up.',
    win: 'Your eyes are getting faster than my feet. Almost.'},
  {kanji: '三時間目', name: 'After school', scene: 'sunset', clones: 5, swaps: 7, swap: .36, pairs: 2, cycle: .3, window: 1.45, hp: 5, time: 90, ring: 1.05, size: .8,
    board: ['放課後', 'Review'], intro: 'Staying late? Splendid. Extra lessons are my favourite.',
    win: 'Two at once and you still found me. I will need new tricks.'},
  {kanji: '四時間目', name: 'Night study', scene: 'night', clones: 5, swaps: 9, swap: .31, pairs: 2, cycle: .4, window: 1.25, hp: 6, time: 95, ring: .95, size: .8,
    board: ['夜間', 'Night study'], intro: 'Under the moon I cut, nurufufu. It is a little faster at night.',
    win: 'Even in the dark you kept your eyes on me. I am proud of that.'},
  {kanji: '卒業', name: 'Graduation', scene: 'graduation', clones: 6, swaps: 10, swap: .28, pairs: 2, cycle: .5, window: 1.1, hp: 7, time: 110, ring: .85, size: .74,
    board: ['卒業', 'Graduation'], intro: 'This is the final lesson, everyone. Come at me with everything I taught you.',
    win: 'Congratulations on graduating, everyone.'},
];

const LINES = {
  hit: ['Nyuya!? A tentacle!', 'Gah! Well tracked!', 'You followed that?!', 'My tentacle! Nice eyes.'],
  miss: ['Nurufufufu. That one was empty.', 'Wrong me!', 'An afterimage. Try again.', 'Too slow, I was over here.'],
  timeout: ['Hesitation is an assassin\'s enemy.', 'Shoot while I stand still!', 'I was waiting, you know.'],
  dodge: ['Too obvious! I saw that coming.', 'Wait until I stand still.', 'Mach 20, remember?'],
  escape: ['So close! Nurufufu.', 'A hair\'s breadth! Again!'],
};

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

export function slotLayout(n, size = 1) {
  const span = Math.min(1180, 250 * (n - 1));
  return Array.from({length: n}, (_, i) => {
    const back = n > 3 && i % 2 === 1;
    return {x: 960 - span / 2 + (n > 1 ? span * i / (n - 1) : 0), y: back ? 770 : 830, s: (back ? .84 : 1) * size};
  });
}

// Body hitbox of a Koro-sensei drawn with its feet at (e.x, e.y).
export function hitbox(e) {
  const k = KORO.height * e.s / KORO.img.h;
  return {x: e.x + (KORO.hit.x - KORO.img.w / 2) * k, y: e.y - (KORO.img.h - KORO.hit.y) * k, rx: KORO.hit.rx * k, ry: KORO.hit.ry * k};
}
export const headPoint = e => { const k = KORO.height * e.s / KORO.img.h; return {x: e.x + (KORO.head.x - KORO.img.w / 2) * k, y: e.y - (KORO.img.h - KORO.head.y) * k}; };

const ease = t => t < .5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
const ACTIVE = new Set(['teach', 'split', 'shuffle', 'window', 'resolve']);

export class Encounter {
  constructor(index, seed = 1) {
    this.index = index; this.p = PERIODS[index]; this.rand = rng(seed);
    this.hp = this.p.hp; this.time = this.p.time; this.state = 'intro'; this.timer = 2.6;
    this.hits = this.misses = this.shots = this.score = this.combo = this.bestCombo = 0;
    this.karmaCd = 0; this.kaedeCd = 0; this.lure = false; this.ringT = 0;
    this.events = []; this.entities = [this.make(true, 960, 820, this.p.size)];
    this.emit('intro', {line: this.p.intro});
  }
  get real() { return this.entities.find(e => e.real); }
  get active() { return ACTIVE.has(this.state); }
  get ring() { return RING.start * Math.max(0, 1 - this.ringT / this.p.ring); }
  make(real, x, y, s) { return {real, x, y, s, from: null, to: null, t: 1, dur: 1, arc: 0, alpha: real ? 1 : 0, face: 'normal', faceT: 0, popT: -1, slot: -1}; }
  emit(type, data = {}) { this.events.push({type, ...data}); }
  pick(list) { return list[Math.floor(this.rand() * list.length)]; }
  setFace(e, face, t = 1.2) { e.face = face; e.faceT = t; }
  moveTo(e, to, dur, arc = 0) { e.from = {x: e.x, y: e.y, s: e.s}; e.to = to; e.t = 0; e.dur = dur; e.arc = arc; }

  update(dt) {
    for (const e of this.entities) {
      if (e.t < 1) {
        e.t = Math.min(1, e.t + dt / e.dur);
        const k = ease(e.t);
        e.x = e.from.x + (e.to.x - e.from.x) * k;
        e.y = e.from.y + (e.to.y - e.from.y) * k - e.arc * Math.sin(Math.PI * e.t);
        e.s = e.from.s + (e.to.s - e.from.s) * k;
      }
      if (!e.real && e.popT < 0 && e.alpha < 1) e.alpha = Math.min(1, e.alpha + dt / .45);
      if (e.popT >= 0) e.popT += dt;
      if (e.faceT > 0 && (e.faceT -= dt) <= 0) e.face = 'normal';
    }
    this.entities = this.entities.filter(e => e.real || e.popT < .6);
    if (this.active) {
      this.karmaCd = Math.max(0, this.karmaCd - dt); this.kaedeCd = Math.max(0, this.kaedeCd - dt);
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; this.state = 'lost'; this.emit('bell'); return; }
    }
    if (this.state === 'strike') {
      this.ringT += dt;
      if (this.ring < RING.target - RING.tol) this.failFinish();
      return;
    }
    if (this.state === 'shuffle') return this.stepShuffle(dt);
    if ((this.timer -= dt) > 0) return;
    switch (this.state) {
      case 'intro': this.teach(); break;
      case 'teach': this.split(); break;
      case 'split': this.shuffle(); break;
      case 'window': this.emit('timeout', {line: this.pick(LINES.timeout), at: headPoint(this.real)}); this.setFace(this.real, 'smug'); this.resolve(1); break;
      case 'resolve': this.teach(); break;
      case 'opening': this.failFinish(); break;
      case 'finish': this.state = 'won'; this.emit('won'); break;
    }
  }

  teach() {
    this.state = 'teach'; this.timer = this.hits + this.misses === 0 ? 1.6 : 1; this.lure = false;
    const r = this.real; r.alpha = 1;
    if (Math.hypot(r.x - 960, r.y - 820) > 4) { this.moveTo(r, {x: 960, y: 820, s: this.p.size}, .22); this.emit('zip', {x: r.x, y: r.y}); }
  }
  split() {
    this.state = 'split'; this.timer = .6;
    const slots = slotLayout(this.p.clones, this.p.size), real = this.real;
    const order = slots.map((_, i) => i).sort(() => this.rand() - .5);
    this.slots = slots;
    this.entities = slots.map((_, i) => i === order[0] ? real : this.make(false, real.x, real.y, real.s));
    this.entities.forEach((e, i) => { e.slot = i; this.moveTo(e, slots[i], e.real ? .32 : .5); });
    this.emit('split', {x: real.x, y: real.y});
  }
  shuffle() {
    this.state = 'shuffle'; this.timer = 0; this.step = 0;
    this.steps = Math.ceil(this.p.swaps * (this.lure ? .6 : 1));
  }
  stepShuffle(dt) {
    if ((this.timer -= dt) > 0) return;
    if (this.step >= this.steps) { this.state = 'window'; this.timer = this.p.window * (this.lure ? 1.6 : 1); this.emit('window'); return; }
    this.step++;
    const dur = this.p.swap * (this.lure ? 1.7 : 1), n = this.slots.length;
    const bySlot = i => this.entities.find(e => e.slot === i && e.popT < 0);
    const free = [...Array(n).keys()].sort(() => this.rand() - .5);
    const realSlot = this.real.slot;
    if (this.rand() < .7) { free.splice(free.indexOf(realSlot), 1); free.unshift(realSlot); }
    const moves = [];
    if (n >= 3 && this.rand() < this.p.cycle) {
      const [a, b, c] = free.splice(0, 3);
      moves.push([a, b, 150], [b, c, -70], [c, a, 60]);
    } else {
      for (let k = 0; k < this.p.pairs && free.length >= 2; k++) {
        const [a, b] = free.splice(0, 2);
        moves.push([a, b, 160 - k * 40], [b, a, -60 - k * 20]);
      }
    }
    const movers = moves.map(([from]) => bySlot(from));
    moves.forEach(([, to, arc], i) => {
      const e = movers[i];
      if (!e) return;
      e.slot = to; this.moveTo(e, this.slots[to], dur, arc * e.s);
    });
    this.timer = dur * 1.12;
    this.emit('whoosh', {count: moves.length});
  }
  resolve(t) {
    this.state = 'resolve'; this.timer = t;
    for (const e of this.entities) if (!e.real && e.popT < 0) e.popT = 0;
  }

  shoot(x, y) {
    if (this.state === 'opening') return this.clap();
    if (this.state === 'strike') return this.strike();
    if (!this.active || this.state === 'resolve') return;
    this.shots++;
    const target = [...this.entities].filter(e => e.popT < 0 && e.alpha > .5).sort((a, b) => b.y - a.y).find(e => {
      const h = hitbox(e); return ((x - h.x) / h.rx) ** 2 + ((y - h.y) / h.ry) ** 2 <= 1;
    });
    if (this.state !== 'window' || !target) {
      this.emit('whiff', {x, y, target: !!target});
      if (target && this.rand() < .4) this.emit('say', {line: this.pick(LINES.dodge), at: headPoint(this.real)});
      return;
    }
    if (target.real) {
      this.hp--; this.hits++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += 100 + 50 * (this.combo - 1);
      this.setFace(target, 'pale', 1.4);
      this.emit('hit', {x, y, at: headPoint(target), line: this.hp > 0 ? this.pick(LINES.hit) : null, s: target.s});
      if (this.hp <= 0) { this.resolve(0); this.state = 'opening'; this.timer = 2.2; this.emit('opening'); }
      else this.resolve(1);
    } else {
      this.misses++; this.combo = 0; this.time = Math.max(.1, this.time - 3);
      this.score = Math.max(0, this.score - 50);
      if (this.hp < this.p.hp) this.hp++;
      this.setFace(target, 'wrong', 2); this.setFace(this.real, 'smug', 1.6);
      this.emit('miss', {x, y, at: headPoint(target), real: headPoint(this.real), line: this.pick(LINES.miss), healed: this.hp});
      this.resolve(1.25);
    }
  }
  clap() {
    if (this.state !== 'opening') return;
    this.state = 'strike'; this.ringT = 0; this.setFace(this.real, 'stunned', 9);
    this.emit('clap', {at: headPoint(this.real)});
  }
  strike() {
    if (this.state !== 'strike') return;
    if (Math.abs(this.ring - RING.target) <= RING.tol) {
      this.state = 'finish'; this.timer = this.index === PERIODS.length - 1 ? 1.2 : 2.4;
      this.setFace(this.real, 'right', 9);
      this.emit('slash', {at: headPoint(this.real), final: this.index === PERIODS.length - 1});
    } else this.failFinish();
  }
  failFinish() {
    this.hp = Math.min(2, this.p.hp); this.combo = 0;
    this.setFace(this.real, 'smug', 1.6);
    this.emit('escape', {line: this.pick(LINES.escape), at: headPoint(this.real)});
    this.resolve(1.3);
  }
  karma() {
    if (this.karmaCd > 0 || !['split', 'shuffle', 'window'].includes(this.state)) return false;
    this.karmaCd = 28;
    for (const e of this.entities) if (!e.real && e.popT < 0) e.popT = 0;
    this.emit('karma');
    return true;
  }
  kaede() {
    if (this.kaedeCd > 0 || this.lure || !['teach', 'split', 'shuffle', 'window'].includes(this.state)) return false;
    this.kaedeCd = 22; this.lure = true;
    if (this.state === 'window') this.timer += .8;
    if (this.state === 'shuffle') this.steps = Math.min(this.steps, this.step + Math.ceil((this.steps - this.step) * .6));
    this.setFace(this.real, 'pink', 2.5);
    this.emit('kaede');
    return true;
  }
  drain() { const e = this.events; this.events = []; return e; }

  result() {
    const won = this.state === 'won', used = 1 - this.time / this.p.time;
    const points = won ? Math.max(0, Math.min(100, 100 - this.misses * 10 - Math.round(Math.max(0, used - .5) * 40))) : 0;
    return {won, points, hits: this.hits, misses: this.misses, shots: this.shots, timeLeft: this.time, score: this.score + (won ? Math.round(this.time * 10) : 0), bestCombo: this.bestCombo,
      accuracy: this.hits + this.misses ? this.hits / (this.hits + this.misses) : 0};
  }
}
