import './style.css';
import {Encounter, PERIODS, hitbox, headPoint} from './game.js';
import {Renderer} from './render.js';
import {Sound} from './audio.js';

const $ = s => document.querySelector(s), app = $('#app'), cv = $('#game');
const BASE = import.meta.env.BASE_URL;
const read = (key, fallback) => { try { return {...fallback, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const settings = read('mach20-settings', {volume: .8, music: true, effects: true});
const progress = read('mach20-progress', {unlocked: 1, best: {}});
const NUM = ['一', '二', '三', '四', '卒'];
const PEOPLE = {nagisa: 'Nagisa Shiota', karma: 'Karma Akabane', kaede: 'Kaede Kayano', koro: 'Koro-sensei'};
const TENTACLE = '<svg viewBox="0 0 24 52" aria-hidden="true"><path d="M12 2c7 0 8 9 4 18s-6 15 1 23c2 3 0 7-4 7-7 0-9-9-5-18s5-14-1-22C5 6 7 2 12 2z"/></svg>';

const sound = new Sound(); sound.setVolume(settings.volume); sound.setMusic(settings.music);
let R, game = null, screen = 'title', index = 0, hitstop = 0, firing = 0, paused = false, ending = null, last = performance.now(), hudCache = {};

const loadImage = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

async function boot() {
  try {
    await Promise.all(['"Dela Gothic One"', '"Zen Kaku Gothic New"', '"Yomogi"'].map(f => document.fonts.load(`40px ${f}`, '暗殺Aa')));
  } catch {}
  let koro;
  try { koro = await loadImage(`${BASE}portraits/koro.png`); } catch { return fatal('The character art could not load. Reload to try again.'); }
  try { R = new Renderer(cv, {koro}); } catch { return fatal('This browser could not start the 2D canvas.'); }
  R.reduced = !settings.effects;
  addEventListener('resize', () => { R.resize(); setScene(); });
  title();
  requestAnimationFrame(frame);
}
function fatal(msg) { app.innerHTML = `<div class="sheet-wrap"><section class="paper small"><h2>Class is cancelled</h2><p>${msg}</p><button class="btn primary" onclick="location.reload()">Reload</button></section></div>`; }
function setScene() { const p = PERIODS[screen === 'title' ? 0 : index]; R.setScene(screen === 'title' ? 'morning' : p.scene, p); }
const portrait = (who, cls = '') => `<img class="${cls}" src="${BASE}portraits/${who}.png" alt="${PEOPLE[who]}">`;
const stampFor = best => !best ? '' : best.points >= 95 ? '<span class="stamp hanamaru">花丸</span>' : `<span class="stamp">${best.points}<small>点</small></span>`;

// --- title -----------------------------------------------------------------------------------
function title() {
  screen = 'title'; game = null; paused = false; ending = null; setScene();
  if (sound.ctx) sound.startSong('morning');
  app.innerHTML = `
  <main class="title">
    <header class="logo">
      <p class="logo-jp" lang="ja">暗殺教室</p>
      <h1 class="logo-en">Mach<b>20</b></h1>
      <p class="logo-sub">He moves at twenty times the speed of sound. You only need to be right once.</p>
    </header>
    <section class="timetable" aria-labelledby="tt-h">
      <h2 id="tt-h"><span lang="ja">時間割</span> Today's timetable</h2>
      <ol>${PERIODS.map((p, i) => {
        const locked = i + 1 > progress.unlocked;
        return `<li><button class="period${locked ? ' locked' : ''}" data-p="${i}" ${locked ? 'disabled aria-disabled="true"' : ''}>
          <span class="num" lang="ja">${NUM[i]}</span>
          <span class="subj"><b>${p.name}</b><small>${locked ? 'Clear the period before to unlock' : `${p.clones} afterimages, ${p.hp} tentacles`}</small></span>
          ${stampFor(progress.best[i])}
        </button></li>`;
      }).join('')}</ol>
    </section>
    <nav class="title-links">
      <button class="link" id="howto">How to play</button>
      <button class="link" id="opts">Settings</button>
    </nav>
    <p class="fine">Unofficial fan game. Assassination Classroom and its characters belong to Yūsei Matsui, Shueisha and the anime's rights holders.</p>
  </main>`;
  app.querySelectorAll('.period:not(.locked)').forEach(b => {
    b.onclick = () => { sound.unlock(); sound.play('ui'); play(+b.dataset.p); };
    b.onpointerenter = () => sound.play('tick');
  });
  $('#howto').onclick = () => { sound.unlock(); howTo(); };
  $('#opts').onclick = () => { sound.unlock(); settingsSheet(); };
}

function howTo(onClose) {
  const box = overlay(`
    <section class="manual" role="dialog" aria-modal="true" aria-labelledby="man-h">
      <h2 id="man-h">How to assassinate your teacher</h2>
      <div class="strip">
        <figure class="panel p1"><div class="art">${portrait('koro', 'k a')}${portrait('koro', 'k b')}${portrait('koro', 'k c')}</div><span class="sfx" lang="ja">残像</span>
          <figcaption>He splits into afterimages. The real one moves first; the copies fade in late.</figcaption></figure>
        <figure class="panel p2"><div class="art">${portrait('koro', 'k a')}${portrait('koro', 'k c')}<i class="swap"></i></div><span class="sfx" lang="ja">シュッ</span>
          <figcaption>He swaps places at Mach 20. Keep your eyes on the real one.</figcaption></figure>
        <figure class="panel p3"><div class="art">${portrait('koro', 'k b')}<i class="reticle"></i></div><span class="sfx" lang="ja">ビシッ</span>
          <figcaption>When they freeze, shoot him. Hit a copy and a tentacle grows back.</figcaption></figure>
        <figure class="panel p4"><div class="art">${portrait('nagisa', 'n')}</div><span class="sfx" lang="ja">パンッ</span>
          <figcaption>No tentacles left? Clap to stun him, then strike as the red ring meets the yellow one.</figcaption></figure>
      </div>
      <table class="keys"><tbody>
        <tr><th>Mouse</th><td>Aim. Click to shoot, or to strike with the knife.</td></tr>
        <tr><th><kbd>Q</kbd></th><td>Karma lunges in. Every afterimage pops.</td></tr>
        <tr><th><kbd>E</kbd></th><td>Kaede brings pudding. He slows down and lingers.</td></tr>
        <tr><th><kbd>Space</kbd></th><td>Clap to stun him when the chance comes.</td></tr>
        <tr><th><kbd>Esc</kbd></th><td>Pause.</td></tr>
      </tbody></table>
      <button class="btn primary" data-close>Got it</button>
    </section>`, onClose);
  return box;
}
function settingsSheet(onClose) {
  const box = overlay(`
    <section class="paper small" role="dialog" aria-modal="true" aria-labelledby="set-h">
      <h2 id="set-h">Settings</h2>
      <label class="field"><span>Volume</span><input type="range" id="vol" min="0" max="1" step=".05" value="${settings.volume}"></label>
      <label class="field check"><input type="checkbox" id="mus" ${settings.music ? 'checked' : ''}><span>Music</span></label>
      <label class="field check"><input type="checkbox" id="fx" ${settings.effects ? 'checked' : ''}><span>Screen shake and flashes</span></label>
      <button class="btn primary" data-close>Done</button>
    </section>`, onClose);
  const save = () => { write('mach20-settings', settings); sound.setVolume(settings.volume); sound.setMusic(settings.music); R.reduced = !settings.effects; };
  box.querySelector('#vol').oninput = e => { settings.volume = +e.target.value; save(); };
  box.querySelector('#mus').onchange = e => { settings.music = e.target.checked; save(); };
  box.querySelector('#fx').onchange = e => { settings.effects = e.target.checked; save(); };
}
function overlay(html, onClose) {
  const box = document.createElement('div'); box.className = 'sheet-wrap'; box.innerHTML = html;
  const close = () => { box.remove(); sound.play('ui'); onClose?.(); };
  box.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  box.onclick = e => { if (e.target === box) close(); };
  box.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  app.append(box); box.querySelector('button, input')?.focus();
  return box;
}

// --- play ------------------------------------------------------------------------------------
function play(i) {
  index = i; screen = 'play'; paused = false; ending = null; hudCache = {};
  game = new Encounter(i, (Math.random() * 2 ** 31) | 0);
  setScene(); R.fx = []; R.texts = []; R.bubbles = [];
  sound.unlock(); sound.startSong(PERIODS[i].scene);
  const p = PERIODS[i];
  app.innerHTML = `
  <div class="hud">
    <div class="hud-period"><b lang="ja">${p.kanji}</b><span>${p.name}</span></div>
    <div class="hud-tentacles" aria-label="Tentacles left"><div id="pips"></div></div>
    <div class="hud-clock" id="clockbox"><b id="clock"></b></div>
    <div class="hud-score"><b id="score">0</b><span id="combo"></span></div>
    <div class="hud-skills">
      <button class="skill" id="sk-karma" aria-label="Karma: pop every afterimage (Q)"><span class="face karma">${portrait('karma')}</span><span class="meta"><kbd>Q</kbd><em>Karma</em><small>Pops afterimages</small></span><i class="cd"></i></button>
      <button class="skill" id="sk-kaede" aria-label="Kaede: pudding slows him (E)"><span class="face kaede">${portrait('kaede')}</span><span class="meta"><kbd>E</kbd><em>Kaede</em><small>Pudding slows him</small></span><i class="cd"></i></button>
    </div>
    <div class="prompt" id="prompt" aria-live="polite"></div>
    <div class="penalty" id="penalty"></div>
    <div class="cutin" id="cutin"></div>
    <div class="card" id="card"><b lang="ja">${p.kanji}</b><span>${p.name}</span></div>
    <button class="pause-btn" id="pausebtn" aria-label="Pause">Pause</button>
  </div>`;
  $('#sk-karma').onclick = e => { e.stopPropagation(); useKarma(); };
  $('#sk-kaede').onclick = e => { e.stopPropagation(); useKaede(); };
  $('#pausebtn').onclick = e => { e.stopPropagation(); pause(); };
  $('#pips').innerHTML = Array.from({length: p.hp}, () => `<i>${TENTACLE}</i>`).join('');
  document.body.classList.add('playing');
}
function useKarma() { if (game && !paused && game.karma()) sound.unlock(); }
function useKaede() { if (game && !paused && game.kaede()) sound.unlock(); }

function cutin(who, line, big = false) {
  const el = $('#cutin'); if (!el) return;
  el.className = `cutin ${who}${big ? ' big' : ''}`;
  el.innerHTML = `<div class="band"><div class="who">${portrait(who)}</div><p><b>${PEOPLE[who]}</b><span>${line}</span></p></div>`;
  void el.offsetWidth; el.classList.add('show'); sound.play('cutin');
}
function prompt(html) { const el = $('#prompt'); if (el) { el.innerHTML = html; el.classList.toggle('show', !!html); } }

function handle(ev) {
  const at = ev.at;
  switch (ev.type) {
    case 'intro': sound.play('bell'); R.say(ev.line, headPoint(game.real), 3.4); break;
    case 'split': sound.play('whoosh', 2); R.text('残像!', 960, 300, {size: 110, color: '#ffd21f'}); R.burst(ev.x, ev.y - 180, 1, 'ring', {speed: 0, life: .5, r: 60}); break;
    case 'whoosh': sound.play('whoosh', ev.count / 2); break;
    case 'zip': sound.play('zip'); break;
    case 'window': sound.play('window'); break;
    case 'whiff':
      sound.play('shot'); R.burst(ev.x, ev.y, 6, 'spark', {speed: 300, life: .3, r: 6});
      if (ev.target) R.text('シュッ', ev.x, ev.y - 60, {size: 60, color: '#bfe8ff', life: .6});
      break;
    case 'hit':
      sound.play('shot'); sound.play('hit'); hitstop = .09;
      if (!R.reduced) R.impact = .07;
      R.kick(28, .15); R.burst(ev.x, ev.y, 16, 'goo', {speed: 700, up: 300, r: 7}); R.burst(ev.x, ev.y, 1, 'chunk', {speed: 400, up: 700, r: 10, life: 1.4});
      R.burst(ev.x, ev.y, 1, 'ring', {speed: 0, life: .35, r: 20, color: '#ffd21f'});
      R.text('ビシッ!', ev.x + 40, ev.y - 120, {size: 120, color: '#ffd21f'});
      if (ev.line) R.say(ev.line, at, 1.6);
      if (game.combo > 1) R.text(`${game.combo} combo`, ev.x, ev.y + 40, {size: 46, color: '#fff', rot: -.08, life: .8});
      break;
    case 'miss':
      sound.play('shot'); sound.play('miss'); R.kick(8);
      R.text('ハズレ', at.x, at.y - 40, {size: 84, color: '#c58cff'});
      R.say('Nurufufufu. ' + ev.line.replace(/^Nurufufufu\. /, ''), ev.real, 1.8);
      penalty('−3 s · tentacle regrown');
      break;
    case 'timeout': sound.play('miss'); R.say(ev.line, at, 1.6); break;
    case 'say': R.say(ev.line, at, 1.4); break;
    case 'opening':
      sound.play('cutin'); cutin('nagisa', 'Now. While he can’t move.', true);
      prompt('<kbd>Space</kbd> or click to clap');
      break;
    case 'clap':
      sound.play('clap'); R.kick(30, .7); R.burst(at.x, at.y, 1, 'ring', {speed: 0, life: .6, r: 40});
      R.text('パンッ!!', at.x, at.y - 150, {size: 150, color: '#fff', rot: .06});
      prompt('Click when the red ring meets the yellow one');
      break;
    case 'slash': {
      sound.play('slash'); R.kick(36, .9); const c = hitbox(game.real);
      R.slash(c.x - 520, c.y - 340, c.x + 520, c.y + 300); prompt('');
      if (ev.final) { ending = {t: 0}; R.say('Congratulations on graduating, everyone.', at, 6); }
      else { R.say('A full circle! That would have got me. Almost.', at, 2.6); R.text('ズバッ', c.x, c.y - 260, {size: 140, color: '#7fd36b'}); }
      break;
    }
    case 'escape': sound.play('zip'); prompt(''); R.say(ev.line, at, 1.8); R.text('ヌルフフ', at.x, at.y - 60, {size: 80, color: '#7fe08a'}); penalty('He escaped · two tentacles regrown'); break;
    case 'karma': cutin('karma', 'Over here, sensei.'); R.slash(80, 760, 1840, 560); R.text('ズバッ', 960, 420, {size: 120, color: '#ff5a4a'}); sound.play('slash'); break;
    case 'kaede': cutin('kaede', 'Pudding! Your favourite, sensei.'); R.text('プリン', 960, 760, {size: 90, color: '#ffd765'}); break;
    case 'won': if (!ending) setTimeout(() => results(), 300); break;
    case 'bell': sound.play('bell'); prompt(''); setTimeout(() => results(), 1200); break;
  }
}
function penalty(text) { const el = $('#penalty'); if (!el) return; el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

function updateHud() {
  const g = game, set = (id, v, fn) => { if (hudCache[id] !== v) { hudCache[id] = v; fn(v); } };
  set('hp', g.hp, v => $('#pips')?.querySelectorAll('i').forEach((el, i) => el.classList.toggle('lost', i >= v)));
  const secs = Math.ceil(g.time);
  set('time', secs, v => { $('#clock').textContent = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; $('#clockbox').classList.toggle('low', v <= 15); });
  set('score', g.score, v => { $('#score').textContent = v.toLocaleString('en-US'); });
  set('combo', g.combo, v => { $('#combo').textContent = v > 1 ? `${v}× combo` : ''; });
  for (const [id, cd, max, ok] of [['karma', g.karmaCd, 28, ['split', 'shuffle', 'window'].includes(g.state)], ['kaede', g.kaedeCd, 22, !g.lure && ['teach', 'split', 'shuffle', 'window'].includes(g.state)]]) {
    const el = $(`#sk-${id}`); if (!el) continue;
    el.style.setProperty('--cd', (cd / max).toFixed(3));
    el.classList.toggle('ready', cd <= 0 && ok); el.classList.toggle('cooling', cd > 0);
  }
  set('card', g.state === 'intro', v => $('#card')?.classList.toggle('show', v));
}

// --- pause, results, ending -----------------------------------------------------------------
function pause() {
  if (screen !== 'play' || paused || !game || ['won', 'lost'].includes(game.state) || ending) return;
  paused = true; document.body.classList.remove('playing');
  overlay(`
    <section class="paper small" role="dialog" aria-modal="true" aria-labelledby="pz-h">
      <h2 id="pz-h">Paused</h2>
      <p>${PERIODS[index].kanji} ${PERIODS[index].name}. The clock stops while you think.</p>
      <div class="actions"><button class="btn primary" data-close>Resume</button><button class="btn" id="pz-restart">Restart period</button><button class="btn" id="pz-help">How to play</button><button class="btn" id="pz-opts">Settings</button><button class="btn" id="pz-quit">Timetable</button></div>
    </section>`, () => { paused = false; document.body.classList.add('playing'); });
  $('#pz-restart').onclick = () => { closeSheets(); play(index); };
  $('#pz-quit').onclick = () => { closeSheets(); document.body.classList.remove('playing'); title(); };
  $('#pz-help').onclick = () => howTo();
  $('#pz-opts').onclick = () => settingsSheet();
}
const closeSheets = () => app.querySelectorAll('.sheet-wrap').forEach(s => s.remove());

function results() {
  if (screen !== 'play') return;
  screen = 'result'; document.body.classList.remove('playing');
  const r = game.result(), p = PERIODS[index];
  if (r.won) {
    const prev = progress.best[index];
    if (!prev || r.points > prev.points || (r.points === prev.points && r.score > prev.score)) progress.best[index] = {points: r.points, score: r.score};
    progress.unlocked = Math.max(progress.unlocked, Math.min(PERIODS.length, index + 2));
    write('mach20-progress', progress);
  }
  const next = r.won && index < PERIODS.length - 1;
  const mark = !r.won ? '<div class="mark fail" lang="ja">補習</div>' : r.points >= 95 ? `<div class="mark"><svg class="hanamaru" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 30c30 0 62 20 62 60s-34 68-70 66-62-30-58-62 30-50 60-48 48 22 46 46-22 40-44 40-36-14-34-32 16-26 30-24 22 10 20 20"/></svg><b>100<small>点</small></b></div>` : `<div class="mark"><b>${r.points}<small>点</small></b></div>`;
  const comment = !r.won ? 'The bell rang before the knife landed. Remedial lesson! Try following the one that moves first.' : r.points >= 95 ? p.win : r.misses > 2 ? 'You shot a lot of my afterimages. Watch, then shoot. ' + p.win : p.win;
  const box = overlay(`
    <section class="paper test" role="dialog" aria-modal="true" aria-labelledby="res-h">
      <header class="test-head"><span lang="ja">3年E組</span><span>Name <b>Nagisa Shiota</b></span></header>
      <h2 id="res-h"><span lang="ja">${p.kanji}</span> ${p.name}</h2>
      ${mark}
      <p class="comment">${comment}<span class="sig">Koro</span></p>
      <dl class="stats">
        <div><dt>Tentacles hit</dt><dd>${r.hits}</dd></div>
        <div><dt>Afterimages shot</dt><dd>${r.misses}</dd></div>
        <div><dt>Accuracy</dt><dd>${Math.round(r.accuracy * 100)}%</dd></div>
        <div><dt>Time left</dt><dd>${Math.ceil(r.timeLeft)} s</dd></div>
        <div><dt>Best combo</dt><dd>${r.bestCombo}</dd></div>
        <div><dt>Score</dt><dd>${r.score.toLocaleString('en-US')}</dd></div>
      </dl>
      <div class="actions">
        ${next ? '<button class="btn primary" id="r-next">Next period</button>' : ''}
        <button class="btn${next ? '' : ' primary'}" id="r-retry">${r.won ? 'Play again' : 'Try again'}</button>
        <button class="btn" id="r-menu">Timetable</button>
      </div>
    </section>`);
  box.onclick = null;
  setTimeout(() => sound.play('stamp'), 450);
  if (next) $('#r-next').onclick = () => { closeSheets(); play(index + 1); };
  $('#r-retry').onclick = () => { closeSheets(); play(index); };
  $('#r-menu').onclick = () => { closeSheets(); title(); };
  $(next ? '#r-next' : '#r-retry').focus();
}

function finale() {
  screen = 'ending'; document.body.classList.remove('playing');
  progress.best[index] = {points: Math.max(progress.best[index]?.points || 0, game.result().points), score: game.result().score};
  write('mach20-progress', progress);
  app.innerHTML = `
  <section class="ending" aria-live="polite">
    <p style="--d:0s">Class 3-E kept its promise.</p>
    <p style="--d:2.4s">One year of lessons, one last strike.</p>
    <p class="big" style="--d:5s">Thank you, Koro-sensei.</p>
    <p class="small" style="--d:8s">Every student of Class 3-E graduated.</p>
    <button class="btn primary" style="--d:9.5s" id="end-menu">Back to the timetable</button>
  </section>`;
  $('#end-menu').onclick = () => title();
}

// --- loop and input ----------------------------------------------------------------------------
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  firing = Math.max(0, firing - dt);
  let zoom = 1, focus;
  if (game && screen === 'play' && !paused) {
    if (hitstop > 0) hitstop -= dt;
    else {
      const slow = ['opening', 'strike'].includes(game.state) ? .55 : 1;
      game.update(dt * slow);
      for (const ev of game.drain()) handle(ev);
    }
    if (screen === 'play') updateHud();
    if (['opening', 'strike', 'finish'].includes(game.state) || ending) { zoom = 1.14; focus = hitbox(game.real); }
    if (ending) {
      ending.t += dt;
      if (ending.t > 2.2) {
        const e = game.real; e.alpha = Math.max(0, 1 - (ending.t - 2.2) / 3);
        const h = hitbox(e); R.burst(h.x + (Math.random() - .5) * h.rx * 2, h.y + (Math.random() - .5) * h.ry * 2, 3, 'mote', {speed: 60, life: 2.4, r: 4});
      }
      if (ending.t > 6 && screen === 'play') finale();
    }
  } else if (game && screen === 'ending') { zoom = 1.14; focus = hitbox(game.real); }
  if (R) R.draw(screen === 'title' ? null : game, dt, {hud: screen === 'play' && !paused && !ending, firing, zoom, focus,
    showcase: screen === 'title' ? {x: innerWidth / innerHeight > 1.3 ? 1420 : 1180, y: 900, s: 1.32, face: R.time % 9 > 7.6 ? 'smug' : 'normal'} : null});
  requestAnimationFrame(frame);
}

addEventListener('pointermove', e => { if (R) R.mouse = R.toStage(e.clientX, e.clientY); });
cv.addEventListener('pointerdown', e => {
  if (!R || screen !== 'play' || paused || !game || ending) return;
  sound.unlock(); R.mouse = R.toStage(e.clientX, e.clientY);
  if (e.button !== 0) return;
  const {x, y} = R.mouse;
  if (game.state === 'opening') return game.clap();
  if (game.state === 'strike') return game.strike();
  if (!game.active || game.state === 'resolve') return;
  R.recoil = 1; firing = .06;
  game.shoot(x, y);
});
cv.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  if (screen !== 'play' || !game) return;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (!paused) { e.preventDefault(); pause(); } return; }
  if (paused || e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'q') useKarma();
  if (k === 'e') useKaede();
  if (e.code === 'Space') { e.preventDefault(); if (game.state === 'opening') game.clap(); else if (game.state === 'strike') game.strike(); }
});
addEventListener('blur', () => { if (screen === 'play') pause(); });

// handy for automated checks: window.__mach20.game
window.__mach20 = {get game() { return game; }, get screen() { return screen; }, get renderer() { return R; }, play: i => play(i)};
boot();
