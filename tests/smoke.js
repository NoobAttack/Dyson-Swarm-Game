// Smoke test for index.html. Loads the game in a fake browser and checks that the
// core systems still work. Run after every milestone:
//   npm install jsdom      (once, anywhere on NODE_PATH or in this folder)
//   node tests/smoke.js
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function boot(saved, errs = []) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/', pretendToBeVisual: true });
  const w = dom.window;
  if (saved) w.localStorage.setItem('dysonswarm_save', saved);
  w.confirm = () => true;
  w.addEventListener('error', e => errs.push(e.message));
  w.eval(html.match(/<script>([\s\S]*)<\/script>/)[1] + `
  window.G = { get state() { return state; }, set state(v) { state = v; }, tick, buy, render, save, loop, click,
    throttle, totalRate, rawRate, heatGen, heatCool, heatCapacity, haulCapacity, feedDemand, feedEfficiency,
    thermalOutlook, simulateAway, showAway, buyUpgrade, buyDmUpgrade, ascend, dmGain, dmMult, effectMult, importSave, hardReset,
    BUILDINGS, UPGRADES, DM_UPGRADES, HEAT, PRESTIGE, SAVE_VERSION };`);
  return w;
}
let failed = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failed++; };
const nums = s => [s.energy, s.total, s.run, s.heat, s.played, s.dm, s.dmTotal, ...Object.values(s.owned), ...Object.values(s.made)];
const finite = s => nums(s).every(Number.isFinite);
const text = w => w.document.body.textContent;

// ---- fresh game, clicking, buying ----
let errs = [];
let w = boot(null, errs), G = w.G;
ok(G.state.v === G.SAVE_VERSION && finite(G.state), 'fresh boot');
for (let i = 0; i < 60; i++) w.document.getElementById('collect').click();
ok(G.state.clicks === 60 && G.state.energy >= 60 && G.state.run === G.state.total, 'clicking works');
const btns = w.document.querySelectorAll('#list .row button');
ok(btns.length === G.BUILDINGS.length, 'one buy button per building');
btns[0].click();
ok(G.state.owned.collector === 1, 'buy button buys');
G.loop();
ok(G.state.ach.hands === true, 'achievement unlocks');
G.state.energy = 1e9;
w.document.querySelectorAll('#modes button')[3].click();
btns[0].click();
ok(G.state.owned.collector > 50 && G.state.energy >= 0, 'max buy');

// ---- tabs and group chips ----
const views = () => [...w.document.querySelectorAll('.view')].filter(v => !v.hidden).map(v => v.dataset.view).join();
const tabBtns = w.document.querySelectorAll('#tabs button');
ok(views() === 'build' && tabBtns.length === 4, 'starts on the Build tab');
tabBtns[1].click(); ok(views() === 'upgrades', 'Upgrades tab');
tabBtns[2].click(); ok(views() === 'ascend', 'Ascend tab');
tabBtns[3].click(); ok(views() === 'stats', 'Stats tab');
tabBtns[0].click();
const boxes = () => [...w.document.querySelectorAll('.groupbox')].map(b => b.hidden ? 0 : b.querySelectorAll('.row').length).join();
ok(boxes() === '6,0,0', 'Energy group shown first');
w.document.querySelectorAll('#groups button')[1].click(); ok(boxes() === '0,3,0', 'Cooling chip');
w.document.querySelectorAll('#groups button')[2].click(); ok(boxes() === '0,0,2', 'Logistics chip');
G.state.energy = 1e4; G.render();
ok(tabBtns[1].querySelector('.tbadge').textContent === '3', 'Upgrades tab counts affordable upgrades');

// ---- heat ----
G.state.owned.disassembler = 50; G.tick(600);
ok(Math.abs(G.throttle() - G.HEAT.minThrottle) < 1e-9 && G.totalRate() > 0, 'overheat floors at minThrottle, never stops');
ok(G.state.heat <= G.heatCapacity() * G.HEAT.maxRatio + 1e-6, 'heat is clamped');
G.state.owned.droplet = 400; G.tick(3600);
ok(G.state.heat === 0 && G.throttle() === 1, 'enough radiators cool to zero');

// ---- thermal clarity ----
{
  const w6 = boot(null), G6 = w6.G, d6 = w6.document;
  G6.state.owned.collector = 8; G6.state.energy = 1e6; G6.render();
  const o = G6.thermalOutlook();
  ok(o.safe === (o.g <= o.c) && o.out === 1, 'outlook: small swarm is safe');
  const prev = () => d6.querySelectorAll('#list .row .prev')[0];
  ok(/Buy 1: \+0\.50 heat\/s/.test(prev().textContent) && /still safe/.test(prev().textContent), 'row preview shows heat added and stays safe');
  G6.state.owned.collector = 9; G6.render();   // 9 x 0.5 = 4.5 <= 5 cooling, 10 would be 5: still safe, 11 is not
  d6.querySelectorAll('#modes button')[1].click();   // x10
  ok(/START overheating/.test(prev().textContent) && /hot|warn/.test(prev().className), 'row preview warns before a purchase crosses into overheating');
  const before = G6.thermalOutlook();
  G6.state.owned.collector = 19;
  const after = G6.thermalOutlook();
  ok(!after.safe && after.out < 1 && after.settled <= G6.rawRate() && before.safe, 'outlook: too much heat settles at reduced output');
  G6.render();
  ok(/will settle at \d+% of capacity/.test(d6.getElementById('heatverdict').textContent), 'HUD verdict explains where heat settles');
  ok(d6.getElementById('heatsettle').style.display === 'block', 'settle marker shown when heat will exceed cooling');
  ok(d6.querySelectorAll('#thermbreak .trow').length === G6.BUILDINGS.filter(b => b.heat).length && /Solar Collector/.test(d6.getElementById('thermbreak').textContent), 'heat breakdown lists heat makers');
  ok(/Radiator Fin/.test(d6.getElementById('thermverdict').textContent), 'thermal panel suggests how many radiators');
  G6.state.energy = 1e9; G6.state.owned.fin = 50; G6.render();
  const rp = [...d6.querySelectorAll('#list .row .prev')][6];
  ok(/cooling\/s/.test(rp.textContent), 'radiator preview shows cooling added');
  // supply lines panel
  ok(/No supply lines running/.test(d6.getElementById('supverdict').textContent), 'supply panel explains idle state');
  G6.state.owned.driver = 100; G6.render();
  ok(/Stopped/.test(d6.getElementById('supverdict').textContent) && /Cargo Tug/.test(d6.getElementById('supverdict').textContent), 'supply panel says transport is missing');
  G6.state.owned.tug = 1; G6.render();
  ok(/Transport is short/.test(d6.getElementById('supverdict').textContent) && /Cargo Tug/.test(d6.getElementById('supverdict').textContent), 'supply panel says how much transport to add');
  G6.state.owned.tug = 500; G6.render();
  ok(/Fully supplied/.test(d6.getElementById('supverdict').textContent) && /Swarm Satellite/.test(d6.getElementById('suplines').textContent), 'supply panel shows full supply and per-line output');
}

// ---- upgrades ----
G.state.energy = 1e12;
const before = G.rawRate();
const upBtn = [...w.document.querySelectorAll('#upgrades .up')].find(e => e.style.display !== 'none').querySelector('button');
upBtn.click();
ok(Object.keys(G.state.upgrades).length === 1, 'upgrade button buys once');
upBtn.click();
ok(Object.keys(G.state.upgrades).length === 1, 'upgrade cannot be bought twice');
for (const u of G.UPGRADES) G.buyUpgrade(u);
ok(G.rawRate() > before * 3.9 && G.effectMult('heat') < 1 && G.effectMult('haul') > 1, 'upgrade effects apply');
G.render();
ok(/All upgrades owned/.test(text(w)), 'upgrade list empties when all bought');

// ---- supply lines ----
G.state.owned.driver = 30;
const sat0 = G.state.made.satellite; G.tick(100);
ok(G.state.made.satellite === sat0 && G.feedEfficiency() === 0, 'no transport, no supply');
G.state.owned.tug = 1000; G.tick(100);
ok(G.state.made.satellite > sat0 && G.state.made.driver > 0 && G.state.made.miner > 0, 'supply lines build lower tiers');
G.state.owned.tug = 1; G.state.owned.freighter = 0;
ok(G.feedEfficiency() > 0 && G.feedEfficiency() < 1, 'short transport slows supply');
const cost0 = w.document.querySelectorAll('#list .row button')[2].textContent;
G.state.made.satellite += 500; G.render();
ok(w.document.querySelectorAll('#list .row button')[2].textContent === cost0, 'supplied units do not raise price');

// ---- offline matches online with supply lines running ----
G.state.owned.tug = 200;
const snap = JSON.stringify(G.state);
G.tick(28800); const a = G.state.energy;
G.state = JSON.parse(snap);
for (let i = 0; i < 28800; i++) G.tick(1);
const b = G.state.energy;
console.log('  8h offline', a.toExponential(3), 'vs live', b.toExponential(3));
ok(Math.abs(a - b) / b < 0.02 && finite(G.state), 'offline progress matches live play');

// ---- ascend ----
G.state.run = G.PRESTIGE.base * 400;
const gain = G.dmGain();
w.document.getElementById('ascend').click();
ok(gain === 20 && G.state.dm === 20 && G.state.dmTotal === 20 && G.state.owned.collector === 0 && G.state.energy === 0
  && Object.keys(G.state.upgrades).length === 0 && G.state.made.satellite === 0 && G.state.ach.hands === true && G.state.clicks === 60,
  'ascend resets the run and keeps permanent things');
ok(Math.abs(G.dmMult() - (1 + 20 * G.PRESTIGE.bonusPer)) < 1e-9, 'dark matter boosts output');
w.document.querySelector('#dmups .up button').click();
ok(G.state.dmUp.sink === 1 && G.state.dm === 19 && Math.abs(G.effectMult('heat') - 0.9) < 1e-9, 'dark matter upgrade reduces heat');
for (let i = 0; i < 20; i++) for (const d of G.DM_UPGRADES) G.buyDmUpgrade(d);
ok(G.DM_UPGRADES.every(d => (G.state.dmUp[d.id] || 0) <= d.max) && G.state.dm >= 0, 'dark matter upgrades respect max and balance');
ok(G.ascend() === false, 'cannot ascend for zero');

// ---- save round trip ----
G.state.owned.collector = 7; G.state.made.satellite = 2.5; G.save();
let w2 = boot(w.localStorage.getItem('dysonswarm_save'), errs);
ok(JSON.stringify(w2.G.state.owned) === JSON.stringify(G.state.owned) && w2.G.state.dmUp.sink === G.state.dmUp.sink
  && w2.G.state.dmTotal === 20 && w2.G.state.made.satellite >= 2.5, 'save and reload');

// ---- old saves ----
const v1 = JSON.stringify({ v: 1, energy: 5000, total: 90000, owned: { collector: 30, mirror: 12, satellite: 3, driver: 0, miner: 0, disassembler: 0 }, last: Date.now() - 3600e3 });
let w3 = boot(v1, errs), G3 = w3.G;
ok(G3.state.v === G3.SAVE_VERSION && finite(G3.state) && G3.state.owned.fin === 0 && G3.state.energy > 5000 && G3.state.run >= 90000, 'v1 save migrates with offline progress');
const away3 = w3.document.getElementById('away');
ok(!away3.hidden && /Welcome back/.test(away3.textContent) && /1h 0m/.test(away3.textContent) && /collected while you were gone/.test(away3.textContent), 'welcome back screen shows time away and earnings');
away3.querySelector('#awayok').click();
ok(away3.hidden, 'welcome back screen closes');
{ // a long absence while the page stays open is reported too
  const w5 = boot(null), G5 = w5.G;
  G5.state.owned.collector = 20; G5.state.energy = 0;
  const r = G5.simulateAway(3 * 24 * 3600);
  ok(r.capped && r.counted === 8 * 3600 && r.gained > 0 && Math.abs(r.gained - G5.state.energy) < 1e-6, 'away report is capped at 8h and matches energy gained');
  G5.showAway(r);
  const t5 = w5.document.getElementById('away').textContent;
  ok(/3d 0h 0m/.test(t5) && /Offline progress stops after 8h/.test(t5), 'welcome back screen notes the cap');
  G5.state.owned.collector = 0; G5.state.owned.disassembler = 3;
  const r2 = G5.simulateAway(3600); G5.showAway(r2);
  ok(r2.overheated && /overheating/i.test(w5.document.getElementById('away').textContent), 'welcome back screen warns about overheating');
}
const v2 = JSON.stringify({ v: 2, energy: 123, total: 5e6, owned: { collector: 60, mirror: 30, satellite: 10, driver: 4, miner: 0, disassembler: 0, fin: 20, heatpipe: 3, droplet: 0 }, heat: 50, played: 999, clicks: 77, ach: { hands: true, swarm: true }, last: Date.now() });
let w4 = boot(v2, errs), G4 = w4.G;
ok(G4.state.v === G4.SAVE_VERSION && finite(G4.state) && G4.state.owned.fin === 20 && G4.state.owned.tug === 0 && G4.state.run === 5e6
  && G4.state.ach.swarm === true && G4.state.clicks === 77 && G4.state.dm === 0, 'v2 save migrates');
ok(!/NaN|undefined/.test(text(w3) + text(w4) + text(w)), 'no NaN or undefined in the UI');

// ---- import, export, reset ----
w.prompt = () => w.btoa(JSON.stringify(G4.state)); G.importSave();
ok(G.state.owned.collector === 60, 'import');
w.prompt = () => 'garbage!!'; G.importSave();
ok(G.state.owned.collector === 60, 'bad import rejected');
w.prompt = () => w.btoa(JSON.stringify({ v: 3, energy: 'x', owned: { collector: null }, made: 5, dmUp: { sink: 99 } })); G.importSave();
ok(finite(G.state) && G.state.dmUp.sink <= 5, 'junk fields sanitized');
G.hardReset(); G.render();
ok(G.state.energy === 0 && G.state.heat === 0 && G.state.dmTotal === 0, 'hard reset');
ok(boot('{not json', errs).G.state.energy === 0, 'corrupt save starts fresh');
ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join('; ') : ''));

console.log(failed ? failed + ' FAILED' : 'ALL PASSED');
process.exit(failed ? 1 : 0);
