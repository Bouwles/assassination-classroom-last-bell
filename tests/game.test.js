import test from 'node:test';
import assert from 'node:assert/strict';
import {Encounter, PERIODS, RING, hitbox} from '../src/game.js';

const run = (g, until, max = 60) => { for (let t = 0; t < max && !until(g); t += 1 / 60) g.update(1 / 60); };
const aim = e => { const h = hitbox(e); return [h.x, h.y]; };

test('shuffle always keeps exactly one real Koro-sensei on distinct slots', () => {
  PERIODS.forEach((_, i) => {
    const g = new Encounter(i, 7 + i);
    run(g, g => g.state === 'window');
    assert.equal(g.state, 'window');
    assert.equal(g.entities.filter(e => e.real).length, 1);
    assert.equal(g.entities.length, PERIODS[i].clones);
    assert.equal(new Set(g.entities.map(e => e.slot)).size, PERIODS[i].clones);
    for (const e of g.entities) assert.ok(Math.abs(e.x - g.slots[e.slot].x) < 1, 'entities settle on their slot');
  });
});

test('hitting the real one strips a tentacle, hitting an afterimage regrows one', () => {
  const g = new Encounter(1, 3);
  run(g, g => g.state === 'window');
  g.shoot(...aim(g.real));
  assert.equal(g.hp, PERIODS[1].hp - 1);
  run(g, g => g.state === 'window');
  const fake = g.entities.find(e => !e.real);
  const before = g.time;
  g.shoot(...aim(fake));
  assert.equal(g.hp, PERIODS[1].hp);
  assert.ok(g.time <= before - 3);
  assert.equal(g.combo, 0);
});

test('shots while he is moving never land', () => {
  const g = new Encounter(0, 9);
  run(g, g => g.state === 'shuffle');
  g.shoot(...aim(g.real));
  assert.equal(g.hp, PERIODS[0].hp);
});

test('perfect play clears a period, then clap and a timed knife win it', () => {
  const g = new Encounter(0, 11);
  while (g.state !== 'opening') { run(g, g => g.state === 'window' || g.state === 'opening'); if (g.state === 'window') g.shoot(...aim(g.real)); }
  g.shoot(0, 0);
  assert.equal(g.state, 'strike');
  run(g, g => Math.abs(g.ring - RING.target) < 4, 5);
  g.strike();
  run(g, g => g.state === 'won', 5);
  const r = g.result();
  assert.ok(r.won && r.points >= 95 && r.misses === 0);
});

test('a mistimed knife lets him escape with two tentacles regrown', () => {
  const g = new Encounter(0, 12);
  while (g.state !== 'opening') { run(g, g => g.state === 'window' || g.state === 'opening'); if (g.state === 'window') g.shoot(...aim(g.real)); }
  g.clap(); g.strike();
  assert.equal(g.hp, 2);
  assert.equal(g.state, 'resolve');
});

test('the bell ends the period when time runs out', () => {
  const g = new Encounter(0, 5);
  run(g, g => g.state === 'lost', 200);
  assert.equal(g.state, 'lost');
  assert.equal(g.result().won, false);
});

test('Karma pops every afterimage, Kaede slows the next shuffle', () => {
  const g = new Encounter(2, 4);
  run(g, g => g.state === 'shuffle');
  assert.ok(g.karma());
  run(g, g => g.state === 'window');
  assert.ok(g.entities.every(e => e.real));
  assert.equal(g.karma(), false, 'karma is on cooldown');
  const h = new Encounter(2, 4);
  run(h, h => h.state === 'teach');
  assert.ok(h.kaede());
  run(h, h => h.state === 'window');
  assert.ok(h.timer > PERIODS[2].window * 1.5);
});
