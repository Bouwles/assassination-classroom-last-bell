// Drives the built game in Chromium with ordinary mouse/keyboard input and saves screenshots.
// Usage: npm run build && node tests/screens.mjs [outDir]
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const out = process.argv[2] || 'test-results/screens';
mkdirSync(out, {recursive: true});
const server = spawn('node', ['server.mjs', '--no-open'], {env: {...process.env, PORT: '4199'}, stdio: 'ignore'});
await new Promise(r => setTimeout(r, 800));
const browser = await chromium.launch({channel: process.env.CHANNEL || 'chrome', args: ['--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
const shot = name => page.screenshot({path: `${out}/${name}.png`});
const until = (fn, arg, ms = 30000) => page.waitForFunction(fn, arg, {timeout: ms, polling: 16});
const state = () => page.evaluate(() => window.__mach20.game?.state);
// screen position of the real Koro-sensei's body
const realAt = () => page.evaluate(() => {
  const {game, renderer} = window.__mach20, e = game.real, k = 440 * e.s / 727;
  return renderer.toScreen(e.x + (420 - 387.5) * k, e.y - (727 - 330) * k);
});

try {
  await page.goto('http://127.0.0.1:4199/');
  await page.waitForSelector('.timetable');
  await page.waitForTimeout(900);
  await shot('01-title');
  await page.click('#howto'); await page.waitForTimeout(500); await shot('02-howto');
  await page.keyboard.press('Escape');
  const period = Number(process.env.PERIOD || 0);
  await page.evaluate(i => window.__mach20.play(i), period);
  await page.waitForTimeout(700); await shot('03-intro');
  await until(() => window.__mach20.game.state === 'shuffle');
  await page.waitForTimeout(250); await shot('04-shuffle');
  let n = 0;
  while (!['opening', 'won', 'lost'].includes(await state())) {
    await until(() => ['window', 'opening', 'lost'].includes(window.__mach20.game.state));
    if (await state() !== 'window') break;
    if (n === 0) { await shot('05-window'); if (process.env.QUICK) break; }
    if (n === 1) { // deliberately shoot an afterimage once to see the miss reaction
      const fake = await page.evaluate(() => { const {game, renderer} = window.__mach20, e = game.entities.find(x => !x.real), k = 440 * e.s / 727; return renderer.toScreen(e.x + 18 * k, e.y - 397 * k); });
      await page.mouse.click(fake.x, fake.y); await page.waitForTimeout(250); await shot('07-miss');
    } else {
      const p = await realAt(); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up();
      await page.waitForTimeout(40); if (n === 0) await shot('06-hit');
    }
    n++;
    await until(() => window.__mach20.game.state !== 'window');
  }
  if (process.env.QUICK) throw 'quick';
  await page.waitForTimeout(400); await shot('08-opening');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500); await shot('09-strike');
  await until(() => { const g = window.__mach20.game; return g.state !== 'strike' || Math.abs(g.ring - 72) < 10; });
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(120); await shot('10-slash');
  await page.waitForSelector('.test', {timeout: 15000}).catch(() => {});
  await page.waitForTimeout(1500); await shot('11-result');
} catch (e) { if (e !== 'quick') throw e; } finally {
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close(); server.kill();
}
