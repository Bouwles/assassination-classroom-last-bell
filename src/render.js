// Canvas renderer. Stage is a virtual 1920x1080; backgrounds are painted once per scene.
import {KORO, RING, hitbox, rng} from './game.js';

const TAU = Math.PI * 2;
const FONT = {display: '"Dela Gothic One", "Zen Kaku Gothic New", sans-serif', ui: '"Zen Kaku Gothic New", sans-serif', chalk: '"Yomogi", "Zen Kaku Gothic New", cursive'};
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const shade = (c, t) => t > 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t);
const canvas = (w, h) => Object.assign(document.createElement('canvas'), {width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h))});
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };

export const SCENES = {
  morning: {room: true, wall: '#c99a66', floor: '#9c6a3f', ceil: '#d8bf98', board: '#2d5b48', sky: ['#7cc3ef', '#e6f6ff'], hills: ['#6f9fb4', '#3f7a52', '#5d9a4e'], light: '#fff1c4', lightA: .5, tint: '#fff2d8', tintA: 0, dust: '#fff6d8', song: 'morning'},
  noon: {room: false, sky: ['#3f9be8', '#cfeeff'], hills: ['#8bb3c8', '#4f8a62', '#2f6b3f'], ground: ['#d4b07a', '#b18352'], light: '#ffffff', tint: '#ffffff', tintA: 0, song: 'noon'},
  sunset: {room: true, wall: '#c98a5a', floor: '#8e5a35', ceil: '#c9a07c', board: '#2b5144', sky: ['#ff8a4c', '#ffd27a'], hills: ['#b5687a', '#6b4a5e', '#4a3b4f'], light: '#ffb062', lightA: .75, tint: '#ff9548', tintA: .16, dust: '#ffd1a0', song: 'sunset'},
  night: {room: true, wall: '#4a4c6b', floor: '#34324c', ceil: '#3c3d58', board: '#1f3b37', sky: ['#0b1230', '#26336b'], hills: ['#283463', '#1b2447', '#141b36'], light: '#b9d0ff', lightA: .4, tint: '#5068b8', tintA: .3, dust: '#cfe0ff', moon: true, lamps: true, song: 'night'},
  graduation: {room: false, night: true, sky: ['#070b24', '#2b2a66'], hills: ['#2a2f63', '#1a2148', '#111735'], ground: ['#3b3a5e', '#25243f'], light: '#c6d6ff', tint: '#5a64b8', tintA: .28, moon: true, sakura: true, song: 'graduation'},
};

// --- one-point perspective room ---------------------------------------------------------
const VP = {x: 960, y: 430}, F = 1280, ZB = 2.03, YC = -.508, YF = .46, ZN = .5;
const P = (X, Y, z) => [VP.x + F * X / z, VP.y + F * Y / z];

function paintSky(g, sc, x0, y0, x1, y1, r) {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  grad.addColorStop(0, sc.sky[0]); grad.addColorStop(1, sc.sky[1]);
  g.fillStyle = grad; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (sc.moon || sc.night) for (let i = 0; i < 160; i++) {
    g.globalAlpha = .3 + r() * .7; g.fillStyle = '#ffffff';
    g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0) * .8, r() < .1 ? 2.4 : 1.3, r() < .1 ? 2.4 : 1.3);
  }
  g.globalAlpha = 1;
}
function paintClouds(g, r, x0, x1, y0, y1, n, base, shadow) {
  for (let i = 0; i < n; i++) {
    const cx = x0 + r() * (x1 - x0), cy = y0 + r() * (y1 - y0), w = 160 + r() * 320;
    const puffs = Array.from({length: 9}, () => [cx + (r() - .5) * w, cy - r() * w * .22, w * (.14 + r() * .14)]);
    g.fillStyle = shadow; for (const [x, y, rr] of puffs) { g.beginPath(); g.arc(x, y + rr * .25, rr, 0, TAU); g.fill(); }
    g.fillStyle = base; for (const [x, y, rr] of puffs) { g.beginPath(); g.arc(x - rr * .12, y - rr * .05, rr * .92, 0, TAU); g.fill(); }
  }
}
function paintRidge(g, r, x0, x1, base, amp, color, step = 14) {
  const ph = [r() * 10, r() * 10, r() * 10];
  g.fillStyle = color; g.beginPath(); g.moveTo(x0, 2000);
  for (let x = x0; x <= x1 + step; x += step) g.lineTo(x, base - amp * (.55 * Math.sin(x / 260 + ph[0]) + .3 * Math.sin(x / 97 + ph[1]) + .15 * Math.sin(x / 41 + ph[2]) + .5));
  g.lineTo(x1, 2000); g.fill();
}
function paintTrees(g, r, x0, x1, base, h, dark, light) {
  for (let x = x0; x < x1; x += 18 + r() * 22) {
    const th = h * (.6 + r() * .6), w = th * .34, y = base + r() * 16;
    g.fillStyle = dark; poly(g, [[x, y - th], [x + w, y], [x - w, y]]); g.fill();
    g.fillStyle = light; poly(g, [[x, y - th], [x - w * .1, y - th * .25], [x - w * .75, y]]); g.globalAlpha = .45; g.fill(); g.globalAlpha = 1;
  }
}
function moonCanvas(r) {
  const c = canvas(r * 4, r * 4), g = c.getContext('2d'), m = r * 2;
  const disk = canvas(r * 4, r * 4), d = disk.getContext('2d');
  const body = d.createRadialGradient(m - r * .3, m - r * .3, r * .1, m, m, r);
  body.addColorStop(0, '#fffdf0'); body.addColorStop(1, '#e3dcc0');
  d.fillStyle = body; d.beginPath(); d.arc(m, m, r, 0, TAU); d.fill();
  d.fillStyle = 'rgba(160,150,120,.25)';
  for (const [a, b, s] of [[-.4, -.2, .18], [-.55, .3, .12], [-.2, .5, .1], [-.65, -.5, .08]]) { d.beginPath(); d.arc(m + a * r, m + b * r, s * r, 0, TAU); d.fill(); }
  // Seven tenths of the moon are gone; only the permanent crescent remains.
  d.globalCompositeOperation = 'destination-out'; d.fillStyle = '#000'; d.beginPath(); d.arc(m + r * .62, m - r * .22, r * .95, 0, TAU); d.fill();
  g.filter = `blur(${Math.round(r * .25)}px)`; g.globalAlpha = .8; g.drawImage(disk, 0, 0);
  g.filter = 'none'; g.globalAlpha = 1; g.drawImage(disk, 0, 0);
  g.fillStyle = '#d8d2b8';
  const pr = rng(9);
  for (let i = 0; i < 26; i++) { const a = -1.4 + pr() * 2.2, dd = r * (1.05 + pr() * .6); g.globalAlpha = .4 + pr() * .5; g.beginPath(); g.arc(m + r * .3 + Math.cos(a) * dd, m - r * .1 + Math.sin(a) * dd, 1 + pr() * 3.5, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  return c;
}
function planks(g, r, x0, x1, y0, y1, color, w = 34) {
  for (let x = x0; x < x1; x += w) {
    g.fillStyle = shade(color, (r() - .5) * .14); g.fillRect(x, y0, w, y1 - y0);
    g.fillStyle = 'rgba(40,20,5,.28)'; g.fillRect(x, y0, 2, y1 - y0);
    g.strokeStyle = 'rgba(60,30,10,.08)'; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const gx = x + 6 + r() * (w - 12); g.beginPath(); g.moveTo(gx, y0); for (let y = y0; y < y1; y += 30) g.lineTo(gx + Math.sin(y / 50 + k) * 2, y); g.stroke(); }
  }
}
function wallQuad(X, z0, z1, y0, y1) { return [P(X, y0, z0), P(X, y0, z1), P(X, y1, z1), P(X, y1, z0)]; }

function paintRoom(g, sc, r, period) {
  // ceiling
  g.fillStyle = sc.ceil; poly(g, [P(-1.2, YC, ZN), P(1.2, YC, ZN), P(1, YC, ZB), P(-1, YC, ZB)]); g.fill();
  for (let z = .7; z < ZB; z += .28) { g.fillStyle = shade(sc.ceil, -.22); poly(g, [P(-1, YC, z), P(1, YC, z), P(1, YC, z + .035), P(-1, YC, z + .035)]); g.fill(); }
  for (const x of [-.5, .4]) {
    g.fillStyle = sc.lamps ? '#fdfcf2' : shade(sc.ceil, .35);
    poly(g, [P(x, YC + .01, .9), P(x + .1, YC + .01, .9), P(x + .1, YC + .01, 1.6), P(x, YC + .01, 1.6)]); g.fill();
  }
  // floor boards
  g.fillStyle = sc.floor; poly(g, [P(-1, YF, ZN), P(1, YF, ZN), P(1, YF, ZB), P(-1, YF, ZB)]); g.fill();
  for (let X = -1; X < 1; X += .1) {
    g.fillStyle = shade(sc.floor, (r() - .5) * .12); poly(g, [P(X, YF, ZN), P(X + .1, YF, ZN), P(X + .1, YF, ZB), P(X, YF, ZB)]); g.fill();
    g.strokeStyle = 'rgba(30,15,5,.3)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...P(X, YF, ZN)); g.lineTo(...P(X, YF, ZB)); g.stroke();
    for (let k = 0; k < 3; k++) { const z = ZN + r() * (ZB - ZN); g.beginPath(); g.moveTo(...P(X, YF, z)); g.lineTo(...P(X + .1, YF, z)); g.stroke(); }
  }
  // left wall with windows
  g.fillStyle = shade(sc.wall, -.18); poly(g, wallQuad(-1, ZN, ZB, YC, YF)); g.fill();
  const wins = [[.62, 1.02], [1.1, 1.5], [1.58, 1.96]], wy0 = -.37, wy1 = .14;
  for (const [z0, z1] of wins) {
    const q = wallQuad(-1, z0, z1, wy0, wy1);
    g.save(); poly(g, q); g.clip();
    const xs = q.map(p => p[0]), ys = q.map(p => p[1]), bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
    paintSky(g, sc, bx0, by0, bx1, by1, r);
    if (sc.moon && z0 > 1.5) g.drawImage(moonCanvas(46), (bx0 + bx1) / 2 - 92, by0 + 10);
    if (!sc.moon && !sc.lamps) paintClouds(g, r, bx0, bx1, by0 + 20, by0 + (by1 - by0) * .35, 2, 'rgba(255,255,255,.95)', shade(sc.sky[1], -.12));
    paintRidge(g, r, bx0, bx1, by1 - (by1 - by0) * .32, 60, sc.hills[0], 8);
    paintTrees(g, r, bx0, bx1, by1 - (by1 - by0) * .08, 120, sc.hills[2], shade(sc.hills[2], .3));
    g.restore();
    // frames: outer, vertical meeting stile, crossbar
    g.strokeStyle = shade(sc.wall, -.5); g.lineJoin = 'round';
    g.lineWidth = 16 / z0; poly(g, q); g.stroke();
    const zm = (z0 + z1) / 2; g.lineWidth = 12 / zm;
    g.beginPath(); g.moveTo(...P(-1, wy0, zm)); g.lineTo(...P(-1, wy1, zm)); g.moveTo(...P(-1, -.12, z0)); g.lineTo(...P(-1, -.12, z1)); g.stroke();
    g.fillStyle = shade(sc.wall, -.35); poly(g, [P(-1, wy1, z0), P(-1, wy1, z1), P(-.96, wy1 + .01, z1), P(-.96, wy1 + .01, z0)]); g.fill();
  }
  g.fillStyle = shade(sc.wall, -.32); poly(g, wallQuad(-1, ZN, ZB, .3, YF)); g.fill();
  // right wall: notice board, transom windows, front sliding door
  g.fillStyle = shade(sc.wall, -.08); poly(g, wallQuad(1, ZN, ZB, YC, YF)); g.fill();
  g.fillStyle = shade(sc.wall, -.26); poly(g, wallQuad(1, ZN, ZB, .3, YF)); g.fill();
  for (let z = .7; z < 1.65; z += .24) { g.fillStyle = shade(sc.sky[1], -.25); poly(g, wallQuad(1, z, z + .2, -.46, -.33)); g.fill(); g.strokeStyle = shade(sc.wall, -.5); g.lineWidth = 8 / z; poly(g, wallQuad(1, z, z + .2, -.46, -.33)); g.stroke(); }
  g.fillStyle = '#a77a4b'; poly(g, wallQuad(1, 1.1, 1.6, -.22, .06)); g.fill();
  g.strokeStyle = shade(sc.wall, -.45); g.lineWidth = 6; poly(g, wallQuad(1, 1.1, 1.6, -.22, .06)); g.stroke();
  for (let i = 0; i < 6; i++) {
    const z = 1.13 + r() * .38, y = -.2 + r() * .17;
    g.fillStyle = ['#f7f7f2', '#fff4b8', '#ffd9e4', '#dff0ff'][i % 4]; poly(g, wallQuad(1, z, z + .08, y, y + .1)); g.fill();
    g.fillStyle = '#d33'; g.beginPath(); g.arc(...P(1, y + .01, z + .04), 3, 0, TAU); g.fill();
  }
  const door = wallQuad(1, 1.7, 1.98, -.3, YF);
  g.fillStyle = shade(sc.wall, -.3); poly(g, door); g.fill();
  g.fillStyle = shade(sc.sky[1], -.35); poly(g, wallQuad(1, 1.74, 1.94, -.26, -.05)); g.fill();
  g.strokeStyle = shade(sc.wall, -.55); g.lineWidth = 5; poly(g, door); g.stroke();
  // front wall
  const [L, T] = P(-1, YC, ZB), [R, B] = P(1, YF, ZB);
  planks(g, r, L, R, T, B, sc.wall);
  g.fillStyle = shade(sc.wall, -.25); g.fillRect(L, B - 70, R - L, 70);
  g.fillStyle = shade(sc.wall, -.45); g.fillRect(L, B - 74, R - L, 6);
  // chalkboard
  const [bx0, by0] = P(-.64, -.31, ZB), [bx1, by1] = P(.64, .07, ZB);
  g.fillStyle = shade(sc.wall, -.45); g.fillRect(bx0 - 14, by0 - 14, bx1 - bx0 + 28, by1 - by0 + 28);
  const bg = g.createLinearGradient(0, by0, 0, by1); bg.addColorStop(0, shade(sc.board, .06)); bg.addColorStop(1, shade(sc.board, -.1));
  g.fillStyle = bg; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  g.save(); g.beginPath(); g.rect(bx0, by0, bx1 - bx0, by1 - by0); g.clip();
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.015 + r() * .03})`; g.beginPath(); g.ellipse(bx0 + r() * (bx1 - bx0), by0 + r() * (by1 - by0), 40 + r() * 120, 10 + r() * 30, r() * .4 - .2, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 26;
  for (let i = 0; i < 6; i++) { const y = by0 + r() * (by1 - by0); g.beginPath(); g.moveTo(bx0 + r() * 200, y); g.quadraticCurveTo(bx0 + 400 + r() * 200, y - 30, bx0 + 700 + r() * 200, y + 10); g.stroke(); }
  g.restore();
  chalkText(g, period, bx0, by0, bx1, by1);
  g.fillStyle = shade(sc.wall, -.5); g.fillRect(bx0 - 20, by1 + 8, bx1 - bx0 + 40, 12);
  g.fillStyle = '#f5f5f0'; g.fillRect(bx0 + 120, by1 + 4, 34, 6); g.fillStyle = '#f2c94c'; g.fillRect(bx0 + 170, by1 + 4, 30, 6);
  // wall clock
  const [cx, cy] = P(0, -.43, ZB);
  g.fillStyle = shade(sc.wall, -.5); g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.fill();
  g.fillStyle = '#f8f6ee'; g.beginPath(); g.arc(cx, cy, 28, 0, TAU); g.fill();
  g.strokeStyle = '#222'; g.lineWidth = 3; g.lineCap = 'round';
  const hr = {morning: 8.6, sunset: 17.2, night: 21.5}[period.scene] ?? 12;
  for (const [a, len] of [[hr / 12 * TAU, 15], [(hr % 1) * TAU, 22]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len); g.stroke(); }
  // window light: shafts and floor patches
  const dir = [1.15, 1, -.25];
  const toFloor = (Y, z) => { const t = (YF - Y) / dir[1]; return [-1 + dir[0] * t, YF, z + dir[2] * t]; };
  g.save(); g.globalCompositeOperation = 'screen';
  for (const [z0, z1] of wins) {
    const a = toFloor(wy0, z0), b = toFloor(wy0, z1), c = toFloor(wy1, z1), d = toFloor(wy1, z0);
    g.globalAlpha = sc.lightA * .55; g.fillStyle = sc.light; poly(g, [P(...a), P(...b), P(...c), P(...d)]); g.fill();
    const top = P(-1, wy0, (z0 + z1) / 2), bot = P(...toFloor(wy0, (z0 + z1) / 2));
    const sg = g.createLinearGradient(...top, ...bot); sg.addColorStop(0, sc.light); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = sc.lightA * .3; g.fillStyle = sg;
    poly(g, [P(-1, wy0, z0), P(-1, wy0, z1), P(...b), P(...c), P(...d), P(-1, wy1, z0)]); g.fill();
  }
  g.restore();
  // corner occlusion
  const occ = g.createRadialGradient(960, 480, 300, 960, 480, 1500);
  occ.addColorStop(0, 'rgba(0,0,0,0)'); occ.addColorStop(1, 'rgba(20,8,0,.45)');
  g.fillStyle = occ; g.fillRect(-400, -220, 2720, 1520);
}

function chalkText(g, period, x0, y0, x1, y1) {
  g.save(); g.fillStyle = 'rgba(245,245,235,.88)'; g.strokeStyle = 'rgba(245,245,235,.8)'; g.textBaseline = 'top';
  g.font = `64px ${FONT.chalk}`; g.fillText(period.board[0], x0 + 50, y0 + 30);
  g.font = `34px ${FONT.chalk}`; g.fillText(period.board[1], x0 + 54, y0 + 108);
  g.font = `30px ${FONT.chalk}`; g.fillText('Mach 20  =  6,800 m/s', x0 + 54, y0 + 170);
  g.fillText('afterimages arrive late', x0 + 54, y0 + 212);
  // a quick doodle of the teacher, as students always draw it
  const dx = x1 - 300, dy = y0 + 120; g.lineWidth = 4;
  g.beginPath(); g.arc(dx, dy, 52, 0, TAU); g.stroke();
  g.beginPath(); g.arc(dx, dy + 6, 32, .15 * Math.PI, .85 * Math.PI); g.stroke();
  g.fillRect(dx - 20, dy - 14, 6, 6); g.fillRect(dx + 14, dy - 14, 6, 6);
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(dx + i * 14, dy + 52); g.quadraticCurveTo(dx + i * 22, dy + 80, dx + i * 18 + 10, dy + 92); g.stroke(); }
  // duty column, written vertically like a real Japanese board
  g.font = `30px ${FONT.chalk}`;
  [...'日直'].forEach((c, i) => g.fillText(c, x1 - 70, y0 + 30 + i * 36));
  [...'潮田'].forEach((c, i) => g.fillText(c, x1 - 70, y0 + 120 + i * 36));
  [...'赤羽'].forEach((c, i) => g.fillText(c, x1 - 112, y0 + 120 + i * 36));
  g.restore();
}

function paintField(g, sc, r) {
  paintSky(g, sc, -400, -220, 2320, 640, r);
  if (sc.moon) g.drawImage(moonCanvas(150), 1500 - 300, 250 - 300);
  else paintClouds(g, r, -300, 2200, 60, 330, 7, '#ffffff', '#cfe0ef');
  paintRidge(g, r, -400, 2320, 470, 150, sc.hills[0]);
  paintRidge(g, r, -400, 2320, 560, 90, sc.hills[1]);
  // the old 3-E schoolhouse on the mountain
  const sx = 40, sy = 600;
  g.fillStyle = sc.night ? '#2c2433' : '#6e4a2c'; g.fillRect(sx, sy - 150, 560, 150);
  g.fillStyle = sc.night ? '#1d1a2a' : '#4c5a6e'; poly(g, [[sx - 30, sy - 150], [sx + 590, sy - 150], [sx + 540, sy - 215], [sx + 20, sy - 215]]); g.fill();
  for (let i = 0; i < 7; i++) { g.fillStyle = sc.night ? (i === 3 ? '#ffd98a' : '#3b3f66') : '#cfe4f2'; g.fillRect(sx + 30 + i * 76, sy - 120, 54, 60); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx + 56 + i * 76, sy - 120, 3, 60); }
  paintTrees(g, r, -400, 2320, 615, 150, sc.hills[2], shade(sc.hills[2], .25));
  const gg = g.createLinearGradient(0, 600, 0, 1300); gg.addColorStop(0, sc.ground[0]); gg.addColorStop(1, sc.ground[1]);
  g.fillStyle = gg; g.fillRect(-400, 600, 2720, 700);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5;
  g.beginPath(); g.ellipse(960, 860, 900, 170, 0, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
  g.beginPath(); g.ellipse(960, 860, 1100, 230, 0, Math.PI * 1.06, Math.PI * 1.94); g.stroke();
  for (let i = 0; i < 400; i++) { const y = 610 + r() ** 2 * 690; g.fillStyle = `rgba(0,0,0,${.04 + r() * .06})`; g.fillRect(-400 + r() * 2720, y, 2 + (y - 600) / 80, 1 + (y - 600) / 200); }
  if (sc.sakura) for (const [x, flip] of [[-120, 1], [2040, -1]]) sakuraTree(g, r, x, 1100, flip, sc);
  const occ = g.createRadialGradient(960, 600, 400, 960, 600, 1500);
  occ.addColorStop(0, 'rgba(0,0,0,0)'); occ.addColorStop(1, sc.night ? 'rgba(0,0,20,.55)' : 'rgba(30,40,60,.2)');
  g.fillStyle = occ; g.fillRect(-400, -220, 2720, 1520);
}
function sakuraTree(g, r, x, y, flip, sc) {
  g.strokeStyle = '#1e1624'; g.lineCap = 'round';
  const branches = [];
  const grow = (x0, y0, a, len, w, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 20 * flip, (y0 + y1) / 2, x1, y1); g.stroke();
    if (d > 4) branches.push([x1, y1]);
    if (d < 6) { grow(x1, y1, a - .45 + r() * .2, len * .74, w * .62, d + 1); grow(x1, y1, a + .35 + r() * .2, len * .7, w * .6, d + 1); }
  };
  grow(x, y, -Math.PI / 2 + .35 * flip, 300, 46, 0);
  // blossoms: shadowed underside, lit top, then individual five-petal flowers
  const clusters = branches.flatMap(([bx, by]) => Array.from({length: 8}, () => [bx + (r() - .5) * 120, by + (r() - .5) * 80, 16 + r() * 24]));
  g.fillStyle = sc.night ? '#9a4f7c' : '#d9779f'; for (const [x, y, rr] of clusters) { g.beginPath(); g.arc(x, y + rr * .3, rr, 0, TAU); g.fill(); }
  g.fillStyle = sc.night ? '#d98bb4' : '#f6b3cf'; for (const [x, y, rr] of clusters) { g.beginPath(); g.arc(x - rr * .1, y - rr * .1, rr * .85, 0, TAU); g.fill(); }
  for (const [x, y, rr] of clusters) for (let k = 0; k < 3; k++) {
    const fx = x + (r() - .5) * rr * 1.4, fy = y - r() * rr * .8, fs = 3 + r() * 3;
    g.fillStyle = sc.night ? '#f5cde2' : '#ffe3ef';
    for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; g.beginPath(); g.arc(fx + Math.cos(a) * fs, fy + Math.sin(a) * fs, fs * .75, 0, TAU); g.fill(); }
    g.fillStyle = '#c2457a'; g.beginPath(); g.arc(fx, fy, fs * .4, 0, TAU); g.fill();
  }
}

function paintDesks(g) {
  // the edge of Nagisa's own desk
  g.save(); g.filter = 'blur(2.5px)';
  const top = g.createLinearGradient(0, 1010, 0, 1300); top.addColorStop(0, '#e2bd88'); top.addColorStop(1, '#a87c4a');
  g.fillStyle = top; poly(g, [[300, 1010], [1620, 1010], [1820, 1300], [100, 1300]]); g.fill();
  g.fillStyle = '#f3d8ae'; g.fillRect(300, 1008, 1320, 5);
  g.strokeStyle = 'rgba(90,50,20,.18)'; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const y = 1030 + i * 26; g.beginPath(); g.moveTo(250 - i * 20, y); g.bezierCurveTo(700, y - 6, 1200, y + 8, 1680 + i * 20, y); g.stroke(); }
  g.restore();
}

// --- Koro-sensei sprite variants ----------------------------------------------------------
const H = KORO.head;
function variant(img, face, sc) {
  const c = canvas(KORO.img.w, KORO.img.h), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const atop = (style, alpha) => { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = style; g.fillRect(0, 0, c.width, c.height); g.globalAlpha = 1; };
  g.save(); g.beginPath(); g.ellipse(H.x, H.y, H.r + 6, H.r + 4, 0, 0, TAU); g.clip();
  if (face === 'smug') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(46,160,64,.85)'; for (let y = H.y - H.r; y < H.y + H.r; y += 24) g.fillRect(0, y, c.width, 11); }
  if (face === 'wrong') { atop('#7d43c4', .78); g.strokeStyle = '#3a1468'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(H.x - 46, H.y - 30); g.lineTo(H.x + 46, H.y + 52); g.moveTo(H.x + 46, H.y - 30); g.lineTo(H.x - 46, H.y + 52); g.stroke(); }
  if (face === 'right') { atop('#ff6a1c', .7); g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#c0140e'; g.lineWidth = 14; g.beginPath(); g.arc(H.x, H.y + 8, 50, 0, TAU); g.stroke(); }
  if (face === 'pale' || face === 'stunned') atop('#ffffff', .35);
  if (face === 'pink') atop('#ff79b4', .5);
  if (face === 'angry') atop('#c8231b', .72);
  g.restore();
  if (face === 'stunned') {
    g.strokeStyle = '#222'; g.lineWidth = 2.5;
    for (const ex of [H.x - 26, H.x + 26]) { g.beginPath(); for (let a = 0; a < 14; a += .3) g.lineTo(ex + Math.cos(a) * a * .8, H.y + 6 + Math.sin(a) * a * .8); g.stroke(); }
  }
  if (face === 'pale' || face === 'stunned') {
    g.fillStyle = '#9fd8ff'; g.strokeStyle = '#2b5c86'; g.lineWidth = 3;
    for (const [x, y, s] of [[H.x + 84, H.y - 30, 1], [H.x - 88, H.y - 10, .8], [H.x + 92, H.y + 26, .7]]) {
      g.beginPath(); g.moveTo(x, y - 22 * s); g.quadraticCurveTo(x + 14 * s, y + 4 * s, x, y + 12 * s); g.quadraticCurveTo(x - 14 * s, y + 4 * s, x, y - 22 * s); g.fill(); g.stroke();
    }
  }
  if (face === 'ghost') atop('#bfe8ff', .55);
  if (face === 'ink') atop('#000000', 1);
  if (face === 'gold') atop('#ffe9a8', .6);
  if (sc.tintA && face !== 'ink' && face !== 'ghost') atop(sc.tint, sc.tintA);
  return c;
}

// --- renderer --------------------------------------------------------------------------
export class Renderer {
  constructor(el, assets) {
    this.el = el; this.g = el.getContext('2d'); this.koro = assets.koro;
    this.cache = new Map(); this.trails = new WeakMap(); this.fx = []; this.texts = []; this.bubbles = [];
    this.shake = 0; this.flash = 0; this.impact = 0; this.zoom = 1; this.recoil = 0; this.slashT = -1; this.reduced = false;
    this.mouse = {x: 960, y: 540}; this.time = 0; this.sceneKey = null;
    this.ambient = Array.from({length: 70}, () => ({x: Math.random() * 1920, y: Math.random() * 1080, v: Math.random(), a: Math.random() * TAU}));
    this.grain = this.makeGrain();
    this.resize();
  }
  makeGrain() {
    const c = canvas(256, 256), g = c.getContext('2d'), d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
    g.putImageData(d, 0, 0); return c;
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, Hh = innerHeight;
    this.el.width = Math.round(W * dpr); this.el.height = Math.round(Hh * dpr);
    let s = Math.max(W / 1920, Hh / 1080); s = Math.min(s, W / 1440, Hh / 940);
    this.view = {dpr, s, ox: W / 2 - 960 * s, oy: Hh / 2 - 550 * s, W, H: Hh};
    this.sceneKey = null;
  }
  toStage(cx, cy) { const v = this.view; return {x: (cx - v.ox) / v.s, y: (cy - v.oy) / v.s}; }
  toScreen(x, y) { const v = this.view; return {x: v.ox + x * v.s, y: v.oy + y * v.s}; }
  setScene(name, period) {
    const key = name + period.kanji + this.view.s;
    if (this.sceneKey === key) return;
    this.sceneKey = key; this.scene = SCENES[name]; this.sceneName = name;
    const q = this.view.s * this.view.dpr, r = rng(42);
    this.bg = canvas(2720 * q, 1520 * q);
    const g = this.bg.getContext('2d'); g.scale(q, q); g.translate(400, 220);
    g.fillStyle = this.scene.room ? this.scene.wall : this.scene.sky[0]; g.fillRect(-400, -220, 2720, 1520);
    this.scene.room ? paintRoom(g, this.scene, r, period) : paintField(g, this.scene, r);
    this.fg = null;
    if (this.scene.room) { this.fg = canvas(2720 * q, 1520 * q); const f = this.fg.getContext('2d'); f.scale(q, q); f.translate(400, 220); paintDesks(f); }
    this.cache.clear();
  }
  sprite(face) {
    if (!this.cache.has(face)) this.cache.set(face, variant(this.koro, face, this.scene));
    return this.cache.get(face);
  }

  // --- effects API, driven by encounter events ---
  text(str, x, y, {size = 90, color = '#fff', rot = (Math.random() - .5) * .3, life = .9} = {}) { this.texts.push({str, x, y, size, color, rot, t: 0, life}); }
  say(str, at, life = 2.2) { this.bubbles = [{str, x: at.x, y: at.y, t: 0, life}]; }
  burst(x, y, n, kind, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (opts.speed || 600) * (.3 + Math.random() * .7);
      this.fx.push({kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 0), t: 0, life: (opts.life || .7) * (.6 + Math.random() * .6), r: (opts.r || 8) * (.5 + Math.random()), rot: Math.random() * TAU, vr: (Math.random() - .5) * 14, color: opts.color});
    }
  }
  kick(shake, flash = 0) { if (this.reduced) return; this.shake = Math.max(this.shake, shake); this.flash = Math.max(this.flash, flash); }
  slash(x0, y0, x1, y1) { this.slashLine = [x0, y0, x1, y1]; this.slashT = 0; }

  // --- frame ---
  draw(game, dt, opts = {}) {
    this.time += dt;
    const g = this.g, v = this.view, sc = this.scene, t = this.time;
    this.shake *= Math.pow(.0005, dt); this.flash = Math.max(0, this.flash - dt * 3); this.impact = Math.max(0, this.impact - dt);
    this.recoil = Math.max(0, this.recoil - dt * 6);
    const targetZoom = opts.zoom || 1; this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 4);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = sc.room ? shade(sc.wall, -.5) : sc.sky[0]; g.fillRect(0, 0, this.el.width, this.el.height);
    const sx = (Math.random() - .5) * this.shake, sy = (Math.random() - .5) * this.shake;
    const focus = opts.focus || {x: 960, y: 560};
    const world = () => {
      g.setTransform(v.dpr * v.s, 0, 0, v.dpr * v.s, v.dpr * v.ox, v.dpr * v.oy);
      g.translate(focus.x + sx, focus.y + sy); g.scale(this.zoom, this.zoom); g.translate(-focus.x, -focus.y);
    };
    world();
    g.drawImage(this.bg, -400, -220, 2720, 1520);
    this.drawAmbient(g, dt, 'back');
    if (game?.lure) this.drawPudding(g, 960, 860);
    if (game) this.drawEntities(g, game, dt);
    if (opts.showcase) this.drawKoro(g, {x: opts.showcase.x, y: opts.showcase.y, s: opts.showcase.s, alpha: 1, face: opts.showcase.face || 'normal', popT: -1}, 0);
    if (this.fg) g.drawImage(this.fg, -400, -220, 2720, 1520);
    this.drawAmbient(g, dt, 'front');
    this.drawFx(g, dt);
    if (game?.state === 'strike' || game?.state === 'opening') this.drawSpeedLines(g, game);
    if (game?.state === 'strike') this.drawRing(g, game);
    this.drawSlash(g, dt);
    this.drawTexts(g, dt);
    this.drawBubbles(g, dt);
    if (this.impact > 0 && game) this.drawImpact(g, game);
    // screen-space overlays
    g.setTransform(v.dpr * v.s, 0, 0, v.dpr * v.s, v.dpr * v.ox, v.dpr * v.oy);
    if (opts.hud) { this.drawGun(g, opts.firing); this.drawCrosshair(g, game, opts); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const vg = g.createRadialGradient(this.el.width / 2, this.el.height / 2, this.el.height * .35, this.el.width / 2, this.el.height / 2, this.el.height * .95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)');
    g.fillStyle = vg; g.fillRect(0, 0, this.el.width, this.el.height);
    g.globalAlpha = .5; g.fillStyle = g.createPattern(this.grain, 'repeat');
    g.translate((Math.random() * 256) | 0, (Math.random() * 256) | 0); g.fillRect(-256, -256, this.el.width + 256, this.el.height + 256);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(.85, this.flash)})`; g.fillRect(0, 0, this.el.width, this.el.height); }
  }

  drawAmbient(g, dt, layer) {
    const sc = this.scene;
    if (layer === 'back' && sc.room) {
      g.save(); g.globalCompositeOperation = 'screen';
      for (const p of this.ambient) {
        p.y -= dt * (6 + p.v * 10); p.x += Math.sin(this.time * .5 + p.a) * dt * 8;
        if (p.y < 100) { p.y = 1000; p.x = Math.random() * 1200; }
        g.globalAlpha = (.25 + .35 * Math.sin(this.time * 2 + p.a) ** 2) * (p.x < 900 ? 1 : .3);
        g.fillStyle = sc.dust; g.beginPath(); g.arc(p.x, p.y, 1.2 + p.v * 2, 0, TAU); g.fill();
      }
      g.restore();
    }
    if (layer === 'front' && sc.sakura) {
      for (const p of this.ambient) {
        p.y += dt * (60 + p.v * 80); p.x += dt * (50 + Math.sin(this.time + p.a) * 60); p.a += dt * (1 + p.v * 3);
        if (p.y > 1150) { p.y = -40; p.x = Math.random() * 2400 - 300; }
        if (p.x > 2300) p.x = -300;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.scale(1, Math.abs(Math.sin(p.a * 1.7)) + .2);
        g.fillStyle = p.v > .5 ? '#ffc4dc' : '#f59bc0'; g.globalAlpha = .9;
        g.beginPath(); g.ellipse(0, 0, 7 + p.v * 5, 4 + p.v * 3, 0, 0, TAU); g.fill(); g.restore();
      }
    }
  }

  drawEntities(g, game, dt) {
    const list = [...game.entities].sort((a, b) => a.y - b.y);
    for (const e of list) {
      let tr = this.trails.get(e); if (!tr) this.trails.set(e, tr = []);
      const moving = e.t < 1;
      if (moving) tr.push({x: e.x, y: e.y, s: e.s, a: 1});
      for (const p of tr) p.a -= dt * 4;
      while (tr.length && (tr[0].a <= 0 || tr.length > 10)) tr.shift();
      for (const p of tr) this.drawKoro(g, {x: p.x, y: p.y, s: p.s, alpha: p.a * .35 * e.alpha, face: 'ghost', popT: -1}, 0);
      const prev = tr.length > 1 ? tr[tr.length - 2] : null;
      const vx = moving && prev ? (e.x - prev.x) / Math.max(dt, .001) : 0;
      if (moving && Math.abs(vx) > 600) this.drawStreaks(g, e, vx);
      this.drawKoro(g, e, moving ? Math.max(-1, Math.min(1, vx / 5000)) : 0);
    }
  }
  drawKoro(g, e, smear) {
    const h = KORO.height * e.s, w = h * KORO.img.w / KORO.img.h, t = this.time;
    const breathe = 1 + Math.sin(t * 2.6) * .012, sway = Math.sin(t * 1.3) * .015;
    const pop = e.popT >= 0 ? e.popT / .6 : 0;
    if (e.alpha <= .01 || pop >= 1) return;
    g.save();
    g.globalAlpha = .28 * e.alpha * (1 - pop);
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(e.x + 10 * e.s, e.y - 4, w * .3, 14 * e.s, 0, 0, TAU); g.fill();
    g.globalAlpha = e.alpha * (1 - pop);
    g.translate(e.x, e.y); g.rotate(sway); g.scale(1 + Math.abs(smear) * .35, breathe * (1 - Math.abs(smear) * .12));
    g.translate(-smear * w * .15, 0);
    const img = this.sprite(e.popT >= 0 && e.face === 'normal' ? 'ghost' : e.face);
    if (pop > 0) {
      const slices = 9;
      for (let i = 0; i < slices; i++) {
        const sy = KORO.img.h * i / slices, off = (i % 2 ? 1 : -1) * pop * 260 * (1 + i % 3 * .4);
        g.drawImage(img, 0, sy, KORO.img.w, KORO.img.h / slices, -w / 2 + off, -h + h * i / slices, w, h / slices + 1);
      }
    } else g.drawImage(img, -w / 2, -h, w, h);
    g.restore();
  }
  drawStreaks(g, e, vx) {
    const h = KORO.height * e.s; g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const y = e.y - h * (.15 + .8 * ((i * .37 + this.time * 3) % 1)), len = 120 + (i * 53) % 160;
      g.lineWidth = 2 + i % 3; g.globalAlpha = .5;
      g.beginPath(); g.moveTo(e.x - Math.sign(vx) * 60, y); g.lineTo(e.x - Math.sign(vx) * (60 + len), y); g.stroke();
    }
    g.restore();
  }
  drawPudding(g, x, y) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 6, 90, 16, 0, 0, TAU); g.fill();
    g.fillStyle = '#f4f6fb'; g.beginPath(); g.ellipse(0, 0, 84, 18, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffd765'; g.strokeStyle = '#7a4a10'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-58, -2); g.lineTo(-40, -86); g.quadraticCurveTo(0, -100, 40, -86); g.lineTo(58, -2); g.quadraticCurveTo(0, 12, -58, -2); g.fill(); g.stroke();
    g.fillStyle = '#7b3b0c'; g.beginPath(); g.moveTo(-40, -86); g.quadraticCurveTo(0, -102, 40, -86); g.lineTo(46, -60); g.quadraticCurveTo(30, -50, 20, -64); g.quadraticCurveTo(0, -48, -16, -66); g.quadraticCurveTo(-34, -52, -46, -62); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-34, -70, 8, 50);
    g.restore();
  }
  drawFx(g, dt) {
    for (const p of this.fx) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'goo' || p.kind === 'chunk' ? 1600 : 0) * dt; p.vx *= Math.pow(.2, dt); p.rot += p.vr * dt;
      const k = 1 - p.t / p.life; if (k <= 0) continue;
      g.save(); g.globalAlpha = Math.min(1, k * 2); g.translate(p.x, p.y); g.rotate(p.rot);
      if (p.kind === 'goo') { g.fillStyle = '#ffd21f'; g.strokeStyle = '#5a3a00'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, p.r, 0, TAU); g.fill(); g.stroke(); }
      if (p.kind === 'chunk') { g.fillStyle = '#ffcf1a'; g.strokeStyle = '#4a3000'; g.lineWidth = 4; g.beginPath(); g.roundRect(-p.r * 3, -p.r, p.r * 6, p.r * 2, p.r); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-p.r * 2, -p.r * .6, p.r * 3, p.r * .4); }
      if (p.kind === 'spark') { g.strokeStyle = p.color || '#b9ffcf'; g.lineWidth = 3; g.beginPath(); g.moveTo(-p.r, 0); g.lineTo(p.r * 2, 0); g.stroke(); }
      if (p.kind === 'ring') { g.strokeStyle = p.color || '#fff'; g.lineWidth = 10 * k; g.beginPath(); g.arc(0, 0, p.r + (1 - k) * 420, 0, TAU); g.stroke(); }
      if (p.kind === 'mote') { p.vy -= 160 * dt; g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,220,120,${.5 * k})`; g.beginPath(); g.arc(0, 0, p.r * 2.5, 0, TAU); g.fill(); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(0, 0, p.r * .8, 0, TAU); g.fill(); }
      g.restore();
    }
    this.fx = this.fx.filter(p => p.t < p.life);
  }
  drawTexts(g, dt) {
    for (const s of this.texts) {
      s.t += dt; const k = s.t / s.life; if (k >= 1) continue;
      const pop = k < .12 ? .6 + k / .12 * .6 : 1.2 - Math.min(.2, (k - .12) * .5);
      g.save(); g.translate(s.x, s.y - k * 30); g.rotate(s.rot); g.scale(pop, pop); g.globalAlpha = k > .75 ? (1 - k) / .25 : 1;
      g.font = `${s.size}px ${FONT.display}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = s.size * .2; g.strokeStyle = '#000'; g.strokeText(s.str, 0, 0);
      g.fillStyle = s.color; g.fillText(s.str, 0, 0);
      g.restore();
    }
    this.texts = this.texts.filter(s => s.t < s.life);
  }
  drawBubbles(g, dt) {
    for (const b of this.bubbles) {
      b.t += dt; if (b.t >= b.life) continue;
      g.save(); g.font = `700 28px ${FONT.ui}`;
      const words = b.str.split(' '), lines = []; let line = '';
      for (const w of words) { const tryL = line ? line + ' ' + w : w; if (g.measureText(tryL).width > 380 && line) { lines.push(line); line = w; } else line = tryL; }
      lines.push(line);
      const w = Math.max(...lines.map(l => g.measureText(l).width)) + 56, h = lines.length * 36 + 34;
      const bx = Math.max(40, Math.min(1880 - w, b.x - w / 2 + 40)), by = Math.max(70, b.y - h - 110);
      const appear = Math.min(1, b.t / .12), fade = b.t > b.life - .25 ? (b.life - b.t) / .25 : 1;
      g.globalAlpha = fade; g.translate(bx + w / 2, by + h); g.scale(appear, appear); g.translate(-(bx + w / 2), -(by + h));
      g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4;
      g.beginPath(); g.roundRect(bx, by, w, h, 28); g.fill(); g.stroke();
      const tx = Math.max(bx + 30, Math.min(bx + w - 30, b.x));
      g.beginPath(); g.moveTo(tx - 16, by + h - 2); g.lineTo(b.x + 6, b.y - 70); g.lineTo(tx + 14, by + h - 2); g.fill(); g.stroke();
      g.fillRect(tx - 14, by + h - 6, 26, 6);
      g.fillStyle = '#111'; g.textBaseline = 'top';
      lines.forEach((l, i) => g.fillText(l, bx + 28, by + 18 + i * 36));
      g.restore();
    }
    this.bubbles = this.bubbles.filter(b => b.t < b.life);
  }
  drawSpeedLines(g, game) {
    const c = game.real ? hitbox(game.real) : {x: 960, y: 500};
    g.save(); g.fillStyle = 'rgba(0,0,0,.55)';
    const r0 = 330, seed = Math.floor(this.time * 20);
    const pr = rng(seed + 1);
    for (let i = 0; i < 90; i++) {
      const a = pr() * TAU, wdt = .006 + pr() * .012, r1 = r0 + pr() * 120;
      g.beginPath(); g.moveTo(c.x + Math.cos(a) * r1, c.y + Math.sin(a) * r1);
      g.lineTo(c.x + Math.cos(a - wdt) * 2200, c.y + Math.sin(a - wdt) * 2200); g.lineTo(c.x + Math.cos(a + wdt) * 2200, c.y + Math.sin(a + wdt) * 2200); g.fill();
    }
    g.restore();
  }
  drawRing(g, game) {
    const c = hitbox(game.real), r = game.ring, ok = Math.abs(r - RING.target) <= RING.tol;
    g.save(); g.lineWidth = 6; g.setLineDash([14, 10]); g.strokeStyle = ok ? '#ffd21f' : 'rgba(255,255,255,.8)';
    g.beginPath(); g.arc(c.x, c.y, RING.target, 0, TAU); g.stroke(); g.setLineDash([]);
    g.lineWidth = ok ? 12 : 8; g.strokeStyle = ok ? '#ffd21f' : '#e8262b';
    g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.stroke();
    g.restore();
  }
  drawSlash(g, dt) {
    if (this.slashT < 0) return;
    this.slashT += dt; const k = this.slashT / .5; if (k >= 1) { this.slashT = -1; return; }
    // tapered blade stroke: thin at both tips, widest in the middle
    const [x0, y0, x1, y1] = this.slashLine, e = Math.min(1, k * 4), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    for (const [W, c] of [[30, '#000'], [18, '#fff']]) {
      const side = sgn => Array.from({length: 25}, (_, i) => { const t = i / 24, w = Math.sin(Math.PI * t) * W * (1 - k * .85) * sgn; return [x0 + dx * t * e + nx * w, y0 + dy * t * e + ny * w]; });
      g.fillStyle = c; poly(g, [...side(1), ...side(-1).reverse()]); g.fill();
    }
  }
  drawImpact(g, game) {
    // Anime impact frame: two frames of inverted ink silhouette.
    g.save(); g.fillStyle = '#fff'; g.fillRect(-400, -220, 2720, 1520);
    const c = hitbox(game.real); const pr = rng(Math.floor(this.time * 30));
    g.fillStyle = '#000';
    for (let i = 0; i < 60; i++) { const a = pr() * TAU, w = .01 + pr() * .03; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(a - w) * 2400, c.y + Math.sin(a - w) * 2400); g.lineTo(c.x + Math.cos(a + w) * 2400, c.y + Math.sin(a + w) * 2400); g.fill(); }
    const e = game.real, h = KORO.height * e.s, w = h * KORO.img.w / KORO.img.h;
    g.drawImage(this.sprite('ink'), e.x - w / 2, e.y - h, w, h);
    g.restore();
  }
  drawGun(g, firing) {
    const m = this.mouse, rc = this.recoil;
    const bx = 1450 + (m.x - 960) * .07 + rc * 26, by = 890 + (m.y - 540) * .06 + rc * 22;
    g.save(); g.translate(bx, by); g.rotate(-.5 - rc * .12); g.lineJoin = 'round'; g.lineCap = 'round';
    const ink = (fill, path, w = 5) => { g.fillStyle = fill; g.beginPath(); path(); g.fill(); g.strokeStyle = '#08090b'; g.lineWidth = w; g.stroke(); };
    const lin = (y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; };
    // shirt cuff, mostly off-screen
    ink(lin(250, 520, ['#ffffff', '#cdd6e6']), () => { g.moveTo(120, 300); g.lineTo(330, 250); g.lineTo(470, 620); g.lineTo(190, 660); g.closePath(); });
    g.strokeStyle = 'rgba(80,100,140,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(150, 360); g.lineTo(345, 305); g.stroke();
    // grip
    ink(lin(40, 360, ['#2c2f36', '#1b1d22']), () => { g.moveTo(-10, 40); g.lineTo(78, 40); g.lineTo(150, 320); g.lineTo(52, 352); g.closePath(); });
    // frame, trigger guard
    ink('#22252b', () => { g.moveTo(-230, 26); g.lineTo(70, 26); g.lineTo(76, 58); g.lineTo(-200, 58); g.closePath(); });
    ink('#22252b', () => { g.moveTo(-140, 56); g.quadraticCurveTo(-150, 120, -80, 122); g.lineTo(-10, 118); g.lineTo(-6, 100); g.lineTo(-76, 102); g.quadraticCurveTo(-118, 100, -114, 56); g.closePath(); }, 4);
    // slide with bevel light
    ink(lin(-40, 30, ['#6c7280', '#3a3e47', '#22252b']), () => { g.moveTo(-262, -38); g.lineTo(96, -38); g.quadraticCurveTo(112, -38, 112, -22); g.lineTo(112, 30); g.lineTo(-262, 30); g.closePath(); });
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-250, -33, 330, 4);
    g.fillStyle = '#121317'; g.fillRect(-70, -30, 70, 20); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-70, -12, 70, 2);
    g.fillStyle = '#15171b'; for (let i = 0; i < 7; i++) g.fillRect(36 + i * 9, -28, 4, 52);
    ink('#2a2d33', () => { g.rect(78, -52, 22, 16); }, 3);
    ink('#2a2d33', () => { g.rect(-240, -50, 12, 14); }, 3);
    // orange safety tip of an airsoft barrel
    ink(lin(-38, 30, ['#ffa04a', '#ff6a14', '#c94a06']), () => { g.roundRect(-286, -38, 28, 68, 7); });
    g.fillStyle = '#08090b'; g.beginPath(); g.ellipse(-286, -4, 6, 13, 0, 0, TAU); g.fill();
    // right hand: thumb along the frame, index on the guard, three fingers round the grip
    const skin = lin(30, 330, ['#ffe2cc', '#f2c3a2', '#d99a78']);
    ink(skin, () => { g.moveTo(40, 70); g.bezierCurveTo(110, 48, 190, 110, 205, 215); g.bezierCurveTo(215, 290, 150, 320, 112, 298); g.bezierCurveTo(86, 270, 58, 200, 40, 70); g.closePath(); });
    for (let i = 0; i < 3; i++) ink(skin, () => { g.roundRect(-34 + i * 14, 150 + i * 52, 112, 46, 22); });
    ink(skin, () => { g.roundRect(-150, 92, 170, 34, 17); });
    ink(skin, () => { g.moveTo(-150, 30); g.bezierCurveTo(-60, 20, 20, 30, 70, 60); g.lineTo(60, 100); g.bezierCurveTo(0, 80, -80, 66, -150, 62); g.quadraticCurveTo(-166, 46, -150, 30); g.closePath(); });
    g.strokeStyle = 'rgba(150,80,50,.55)'; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(40 + i * 14, 162 + i * 52); g.quadraticCurveTo(54 + i * 14, 174 + i * 52, 44 + i * 14, 188 + i * 52); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(128, 118, 30, 11, .8, 0, TAU); g.fill();
    if (firing > 0) {
      g.globalCompositeOperation = 'lighter';
      const fl = g.createRadialGradient(-300, -4, 0, -300, -4, 110); fl.addColorStop(0, 'rgba(255,255,230,1)'); fl.addColorStop(.4, 'rgba(255,220,120,.7)'); fl.addColorStop(1, 'rgba(255,160,40,0)');
      g.fillStyle = fl; g.beginPath(); g.arc(-300, -4, 110, 0, TAU); g.fill();
    }
    g.restore();
  }
  drawCrosshair(g, game, opts) {
    if (game?.state === 'strike' || game?.state === 'opening') return;
    const {x, y} = this.mouse, live = game?.state === 'window';
    const over = live && game.entities.some(e => { const h = hitbox(e); return ((x - h.x) / h.rx) ** 2 + ((y - h.y) / h.ry) ** 2 <= 1 && e.popT < 0; });
    const col = over ? '#ffd21f' : live ? '#ffffff' : 'rgba(255,255,255,.55)';
    const gap = (live ? 12 : 20) + this.recoil * 30;
    g.save(); g.lineCap = 'round';
    for (const [w, c] of [[8, 'rgba(0,0,0,.65)'], [3.5, col]]) {
      g.lineWidth = w; g.strokeStyle = c; g.beginPath();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(x + dx * gap, y + dy * gap); g.lineTo(x + dx * (gap + 18), y + dy * (gap + 18)); }
      g.stroke();
    }
    g.fillStyle = col; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
    if (live) {
      const k = Math.max(0, game.timer / (game.p.window * (game.lure ? 1.6 : 1)));
      for (const [w, c] of [[9, 'rgba(0,0,0,.5)'], [5, col]]) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.arc(x, y, 44, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke(); }
    }
    g.restore();
  }
}
