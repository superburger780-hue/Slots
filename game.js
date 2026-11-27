const FB_URL = "https://" + "sixseven-783d2-default-rtdb.europe-west1.firebasedatabase.app";
const elById = id => document.getElementById(id);
const fmt = n => Math.round(n).toString();

let audioCtx = null, sndOn = true;

function initAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}

function toggleSnd(btn) {
  sndOn = !sndOn;
  initAudio();
  btn.textContent = sndOn ? '🔊' : '🔇';
  btn.classList.toggle('active-toggle', sndOn);
}

function playTick(c) {
  if (!sndOn) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(170 + c * 25, now);
  o.frequency.exponentialRampToValueAtTime(55, now + 0.06);
  g.gain.setValueAtTime(0.14, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(now);
  o.stop(now + 0.07);
}

function playCascade(combo) {
  if (!sndOn) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const shift = Math.pow(1.07, Math.min(combo, 10));
  const notes = new Array(523.25, 659.25, 783.99, 1046.50);
  notes.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * shift, now + i * 0.045);
    g.gain.setValueAtTime(0.001, now + i * 0.045);
    g.gain.linearRampToValueAtTime(0.16, now + i * 0.045 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.24);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now + i * 0.045);
    o.stop(now + i * 0.045 + 0.25);
  });
}

function playPhonkWild() {
  if (!sndOn) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const shaper = audioCtx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    curve[i] = Math.tanh(((i * 2) / 256 - 1) * 5.0);
  }
  shaper.curve = curve;
  shaper.connect(audioCtx.destination);

  const melody = new Array(
    { t: 0.00, f: 587.33, d: 0.13 },
    { t: 0.14, f: 587.33, d: 0.13 },
    { t: 0.28, f: 698.46, d: 0.13 },
    { t: 0.42, f: 587.33, d: 0.13 },
    { t: 0.56, f: 880.00, d: 0.15 },
    { t: 0.72, f: 783.99, d: 0.15 },
    { t: 0.88, f: 698.46, d: 0.22 },
    { t: 1.12, f: 587.33, d: 0.13 },
    { t: 1.26, f: 698.46, d: 0.13 },
    { t: 1.40, f: 880.00, d: 0.15 },
    { t: 1.56, f: 1046.50, d: 0.28 }
  );

  new Array(1.0, 1.48).forEach(ratio => {
    melody.forEach(n => {
      const st = now + n.t;
      const o = audioCtx.createOscillator();
      const flt = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(n.f * ratio, st);
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(1200, st);
      flt.Q.setValueAtTime(2.8, st);
      g.gain.setValueAtTime(0.24, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + n.d);
      o.connect(flt);
      flt.connect(g);
      g.connect(shaper);
      o.start(st);
      o.stop(st + n.d + 0.02);
    });
  });

  new Array(0.00, 0.42, 0.56, 1.12, 1.40).forEach(off => {
    const b = audioCtx.createOscillator();
    const bg = audioCtx.createGain();
    b.type = 'sine';
    b.frequency.setValueAtTime(155, now + off);
    b.frequency.exponentialRampToValueAtTime(34, now + off + 0.36);
    bg.gain.setValueAtTime(0.75, now + off);
    bg.gain.exponentialRampToValueAtTime(0.001, now + off + 0.38);
    b.connect(bg);
    bg.connect(shaper);
    b.start(now + off);
    b.stop(now + off + 0.4);
  });

  const noiseLen = Math.floor(audioCtx.sampleRate * 1.9);
  const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;

  for (let h = 0; h < 24; h++) {
    const t = now + h * 0.075;
    const src = audioCtx.createBufferSource();
    const hp = audioCtx.createBiquadFilter();
    const hg = audioCtx.createGain();
    src.buffer = noiseBuf;
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7500, t);
    const isClap = (h === 4 || h === 12 || h === 20);
    hg.gain.setValueAtTime(isClap ? 0.32 : 0.09, t);
    hg.gain.exponentialRampToValueAtTime(0.001, t + (isClap ? 0.14 : 0.035));
    src.connect(hp);
    hp.connect(hg);
    hg.connect(audioCtx.destination);
    src.start(t);
    src.stop(t + 0.15);
  }
}

function playBigWin() {
  if (!sndOn) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  new Array(261.63, 329.63, 392.00, 523.25, 659.25, 783.99).forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const flt = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, now + i * 0.08);
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(2400, now + i * 0.08);
    g.gain.setValueAtTime(0.001, now + i * 0.08);
    g.gain.linearRampToValueAtTime(0.14, now + i * 0.08 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.1);
    o.connect(flt);
    flt.connect(g);
    g.connect(audioCtx.destination);
    o.start(now + i * 0.08);
    o.stop(now + i * 0.08 + 1.15);
  });
}

const BETS = new Array(10, 25, 50, 100, 250, 500, 1000, 2500);
const COLS = 6;
const ROWS = 5;
const ADMIN_PASS = '7777';

const SYMBOLS = new Array(
  { id: 'crown', icon: '👑', mult: 1.5, weight: 5 },
  { id: 'cup', icon: '🏆', mult: 0.9, weight: 8 },
  { id: 'bell', icon: '🔔', mult: 0.65, weight: 12 },
  { id: 'clover', icon: '🍀', mult: 0.4, weight: 18 },
  { id: 'cherry', icon: '🍒', mult: 0.25, weight: 26 }
);

const WILD_MULTS = new Array(2, 2, 2, 3, 3, 5, 5, 10, 15, 25);
const ORB_MULTS = new Array(2, 2, 2, 3, 5, 10, 15, 25);

function itemAt(arr, idx) {
  return arr.slice(idx, idx + 1).pop();
}

let savedId = 'p_' + Math.random().toString(36).slice(2, 8);
try {
  savedId = localStorage.getItem('rg_player_id') || savedId;
  localStorage.setItem('rg_player_id', savedId);
} catch (e) {}

let me = {
  id: savedId,
  name: 'Игрок_' + (100 + Math.floor(Math.random() * 899)),
  avatar: '👑',
  balance: 1000,
  chance: 10,
  isAdmin: false,
  forceWild: false,
  force500k: false,
  lastSeen: Date.now()
};

let playersCache = {};
let app = {
  betIndex: 2,
  isSpinning: false,
  turbo: false,
  autoSpins: 0,
  freeSpins: 0,
  bonusMult: 1,
  grid: new Array()
};

const sleep = ms => new Promise(r => setTimeout(r, app.turbo ? ms * 0.45 : ms));

function pickAv(el, av) {
  document.querySelectorAll('.avatar-opt').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  me.avatar = av;
}

let secretClicks = 0;
let adminFieldUnlocked = false;

function tapSecret() {
  if (adminFieldUnlocked) return;
  secretClicks++;
  if (secretClicks >= 5) {
    adminFieldUnlocked = true;
    const passInput = elById('admin-pass-input');
    passInput.classList.remove('hidden');
    passInput.focus();
  }
}

async function fbReq(path, method, body) {
  try {
    const opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(FB_URL + path + '.json', opts);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    elById('net-status').innerHTML = '<span class="dot online"></span>В сети (Firebase)';
    return await res.json();
  } catch (e) {
    elById('net-status').innerHTML = '<span class="dot offline"></span>Ошибка: ' + e.message;
    return null;
  }
}

function pushMe() {
  me.lastSeen = Date.now();
  Reflect.set(playersCache, me.id, Object.assign({}, me));
  updateHUD();
  if (me.isAdmin) renderAdmin();
  fbReq('/players/' + me.id, 'PUT', me);
}

async function pollServer() {
  if (elById('game-screen').classList.contains('hidden')) return;
  const db = await fbReq('/players', 'GET');
  if (db && typeof db === 'object') {
    playersCache = db;
    const rem = Reflect.get(db, me.id);
    if (rem) {
      let ack = false;
      if (typeof rem.balance === 'number' && rem.balance !== me.balance && !app.isSpinning) {
        me.balance = rem.balance;
        updateHUD();
      }
      if (typeof rem.chance === 'number') me.chance = rem.chance;
      if (rem.forceWild) { me.forceWild = true; ack = true; }
      if (rem.force500k) { me.force500k = true; ack = true; }
      if (ack) fbReq('/players/' + me.id, 'PATCH', { forceWild: false, force500k: false });
    }
  }
  me.lastSeen = Date.now();
  Reflect.set(playersCache, me.id, Object.assign({}, me));
  fbReq('/players/' + me.id, 'PATCH', { lastSeen: me.lastSeen, name: me.name, avatar: me.avatar, isAdmin: me.isAdmin });
  if (me.isAdmin) renderAdmin();
}

function enterGame() {
  initAudio();
  const n = elById('player-name-input').value.trim();
  const p = elById('admin-pass-input').value.trim();
  if (n) me.name = n;
  me.isAdmin = (adminFieldUnlocked && p === ADMIN_PASS);
  elById('hud-name').textContent = me.name;
  elById('hud-avatar').textContent = me.avatar;
  elById('admin-badge').classList.toggle('hidden', !me.isAdmin);
  elById('admin-panel').classList.toggle('hidden', !me.isAdmin);
  elById('setup-screen').classList.add('hidden');
  elById('game-screen').classList.remove('hidden');
  app.grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => pickCell(true)));
  renderGrid(true, null);
  pushMe();
  pollServer();
}

function openProfile() {
  elById('game-screen').classList.add('hidden');
  elById('setup-screen').classList.remove('hidden');
}

setInterval(pollServer, 2500);

function pickCell(allowSpec) {
  if (allowSpec) {
    const r = Math.random();
    if (r < 0.012) return { type: 'scatter', icon: '🏛️' };
    if (r < 0.025) return { type: 'orb', icon: '🌕', mult: itemAt(ORB_MULTS, Math.floor(Math.random() * ORB_MULTS.length)) };
  }
  const totalW = SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let rnd = Math.random() * totalW;
  for (let i = 0; i < SYMBOLS.length; i++) {
    const sym = itemAt(SYMBOLS, i);
    if (rnd < sym.weight) return { type: 'normal', id: sym.id, icon: sym.icon, mult: sym.mult };
    rnd -= sym.weight;
  }
  return { type: 'normal', id: 'cherry', icon: '🍒', mult: 0.25 };
}

function generateGrid() {
  const luck = me.chance / 100;
  app.grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => pickCell(true)));
  if (Math.random() < luck * 0.18 || me.force500k) {
    const t = me.force500k ? itemAt(SYMBOLS, 0) : itemAt(SYMBOLS, Math.floor(Math.random() * SYMBOLS.length));
    const cnt = me.force500k ? 14 : 8;
    let pl = 0;
    while (pl < cnt) {
      const c = Math.floor(Math.random() * COLS);
      const r = Math.floor(Math.random() * ROWS);
      const colArr = itemAt(app.grid, c);
      if (itemAt(colArr, r).type === 'normal') {
        colArr.splice(r, 1, { type: 'normal', id: t.id, icon: t.icon, mult: t.mult });
        pl++;
      }
    }
  }
  const wCnt = me.force500k ? 3 : ((me.forceWild || Math.random() < (0.02 + luck * 0.03)) ? 1 : 0);
  if (wCnt > 0) {
    const cols = new Array(0, 2, 4, 1, 3, 5);
    for (let i = 0; i < wCnt; i++) {
      const col = itemAt(cols, i);
      const mult = me.force500k ? (15 + i * 5) : itemAt(WILD_MULTS, Math.floor(Math.random() * WILD_MULTS.length));
      const colArr = itemAt(app.grid, col);
      for (let r = 0; r < ROWS; r++) {
        colArr.splice(r, 1, { type: 'wild_col', mult: mult, rowIdx: r });
      }
    }
  }
  me.forceWild = false;
  me.force500k = false;
}

function renderGrid(anim, expl) {
  const gEl = elById('slot-grid');
  gEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = itemAt(itemAt(app.grid, c), r);
      const el = document.createElement('div');
      el.className = 'cell-6x5';
      if (anim) {
        el.classList.add('cell-drop');
        el.style.animationDelay = (c * 0.04 + r * 0.015) + 's';
      }
      if (expl && expl.has(c + ',' + r)) el.classList.add('cell-explode');
      if (cell.type === 'wild_col') {
        el.classList.add('wild-col-cell');
        if (r === 0) el.innerHTML = '<div class="wild-badge-top">WILD</div><div class="wild-mult-big">' + cell.mult + 'x</div>';
        else if (r === ROWS - 1) el.innerHTML = '<div class="wild-badge-top">WILD</div>';
        else el.innerHTML = '<div class="wild-icon-main">' + (r === 2 ? '⚡' : '⚔️') + '</div>';
      } else if (cell.type === 'orb') {
        el.classList.add('orb-cell');
        el.innerHTML = '<div>🌕</div><div class="orb-val">' + cell.mult + 'x</div>';
      } else if (cell.type === 'scatter') {
        el.classList.add('scatter-cell');
        el.innerHTML = '<div>🏛️</div><div class="scat-tag">SCATTER</div>';
      } else {
        el.textContent = cell.icon;
      }
      gEl.appendChild(el);
    }
  }
}

function spawnFloat(amt) {
  const rect = elById('slot-grid').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float-win';
  el.textContent = '+' + fmt(amt);
  el.style.left = (rect.left + rect.width * (0.35 + Math.random() * 0.3)) + 'px';
  el.style.top = (rect.top + rect.height * 0.45) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function triggerWildFX() {
  const card = elById('game-screen');
  const cab = elById('slot-cabinet');
  card.classList.remove('cabinet-shake');
  void card.offsetWidth;
  card.classList.add('cabinet-shake');

  for (let w = 0; w < 2; w++) {
    setTimeout(() => {
      const fl = document.createElement('div');
      fl.className = 'wild-flash-screen';
      document.body.appendChild(fl);
      setTimeout(() => fl.remove(), 750);
      const wv = document.createElement('div');
      wv.className = 'shockwave-ring';
      document.body.appendChild(wv);
      setTimeout(() => wv.remove(), 850);
    }, w * 220);
  }

  cab.classList.add('wild-hyper');
  setTimeout(() => cab.classList.remove('wild-hyper'), 2200);

  const icons = new Array('⚡', '⚔️', '🔥', '💥', '✨', '👑');
  for (let i = 0; i < 26; i++) {
    setTimeout(() => {
      const s = document.createElement('div');
      s.className = 'lightning-bolt-fx';
      s.textContent = itemAt(icons, i % 6);
      s.style.left = (8 + Math.random() * 84) + 'vw';
      s.style.top = (18 + Math.random() * 60) + 'vh';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1050);
    }, i * 30);
  }
}

async function showBigWin(amt) {
  const ov = elById('bigwin-overlay');
  const tEl = elById('bigwin-title');
  const aEl = elById('bigwin-amount');
  tEl.textContent = amt >= 100000 ? '🔥 MAX WIN 500K! 🔥' : '👑 BIG WIN! 👑';
  ov.classList.remove('hidden');
  playBigWin();

  for (let i = 0; i < 36; i++) {
    const c = document.createElement('div');
    c.className = 'coin-particle';
    c.textContent = i % 3 === 0 ? '💎' : '🪙';
    c.style.left = (Math.random() * 96) + 'vw';
    c.style.animationDuration = (1.2 + Math.random() * 1.4) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2700);
  }

  for (let s = 1; s <= 25; s++) {
    aEl.textContent = fmt((amt / 25) * s) + ' 💰';
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 900));
  ov.classList.add('hidden');
}

async function startSpin(isFS) {
  if (app.isSpinning) return;
  const bet = itemAt(BETS, app.betIndex);
  if (!isFS) {
    if (me.balance < bet) {
      setBanner('❌ Недостаточно средств!');
      stopAuto();
      return;
    }
    me.balance -= bet;
    pushMe();
  }
  app.isSpinning = true;
  setBtns(false);
  generateGrid();
  renderGrid(true, null);

  for (let c = 0; c < COLS; c++) {
    setTimeout(() => playTick(c), c * (app.turbo ? 20 : 45));
  }

  let hasW = false;
  let wSum = 0;
  for (let c = 0; c < COLS; c++) {
    const topCell = itemAt(itemAt(app.grid, c), 0);
    if (topCell.type === 'wild_col') {
      hasW = true;
      wSum += topCell.mult;
    }
  }

  if (hasW) {
    playPhonkWild();
    triggerWildFX();
    setBanner('⚔️ МЕЧ ПРОРУБИЛ WILD! Множитель x' + wSum + '!');
  } else {
    setBanner(isFS ? '⚡ FREE SPINS (' + app.freeSpins + ')...' : '🎰 Вращение...');
  }
  await sleep(550);

  let casc = 0;
  let baseWin = 0;
  let orbMult = 0;

  while (true) {
    const cnts = {};
    const coords = {};
    let wCols = 0;

    for (let c = 0; c < COLS; c++) {
      const colArr = itemAt(app.grid, c);
      if (itemAt(colArr, 0).type === 'wild_col') wCols++;
      for (let r = 0; r < ROWS; r++) {
        const cell = itemAt(colArr, r);
        if (cell.type === 'normal') {
          const prevCnt = Reflect.get(cnts, cell.id) || 0;
          Reflect.set(cnts, cell.id, prevCnt + 1);
          let list = Reflect.get(coords, cell.id);
          if (!list) {
            list = new Array();
            Reflect.set(coords, cell.id, list);
          }
          list.push(c + ',' + r);
        }
      }
    }

    const expl = new Set();
    let stepWin = 0;

    for (let i = 0; i < SYMBOLS.length; i++) {
      const sym = itemAt(SYMBOLS, i);
      const symCnt = Reflect.get(cnts, sym.id) || 0;
      const tot = symCnt + wCols;
      if (symCnt > 0 && tot >= 8) {
        Reflect.get(coords, sym.id).forEach(crd => expl.add(crd));
        stepWin += bet * sym.mult * (1 + (tot - 8) * 0.2);
      }
    }

    if (expl.size === 0) break;
    casc++;
    baseWin += stepWin;
    playCascade(casc);
    renderGrid(false, expl);
    spawnFloat(stepWin);
    setBanner('💥 КАСКАД #' + casc + ': +' + fmt(stepWin) + ' 💰');
    await sleep(420);

    for (let c = 0; c < COLS; c++) {
      const colArr = itemAt(app.grid, c);
      if (itemAt(colArr, 0).type === 'wild_col') continue;
      const rem = new Array();
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!expl.has(c + ',' + r)) rem.unshift(itemAt(colArr, r));
      }
      while (rem.length < ROWS) rem.unshift(pickCell(true));
      app.grid.splice(c, 1, rem);
    }
    renderGrid(true, null);
    await sleep(350);
  }

  let scat = 0;
  for (let c = 0; c < COLS; c++) {
    const colArr = itemAt(app.grid, c);
    for (let r = 0; r < ROWS; r++) {
      const cell = itemAt(colArr, r);
      if (cell.type === 'orb') orbMult += cell.mult;
      if (cell.type === 'scatter') scat++;
    }
  }

  let totMult = Math.max(1, wSum + orbMult);
  if (isFS) {
    if (baseWin > 0 && (wSum + orbMult) > 0) app.bonusMult += (wSum + orbMult);
    totMult = app.bonusMult;
  }
  elById('total-mult').textContent = 'x' + totMult;

  let totWin = Math.round(baseWin * totMult);
  if (wSum >= 60 && totWin > 0 && totWin < 500000 && baseWin >= bet * 30) totWin = 500000;

  if (totWin > 0) {
    me.balance += totWin;
    pushMe();
    elById('balance-box').classList.add('balance-pop');
    setTimeout(() => elById('balance-box').classList.remove('balance-pop'), 350);
    setBanner('💥 КАСКАД #' + Math.max(1, casc) + ': +' + fmt(totWin) + ' 💰');
    if (totWin >= bet * 15 || totWin >= 100000) await showBigWin(totWin);
  } else {
    pushMe();
    setBanner('Попробуй ещё раз! Собери 8+ символов или ⚔️ WILD');
  }

  if (scat >= 4 && app.freeSpins === 0) {
    app.freeSpins = 10;
    app.bonusMult = 1;
    setBanner('🏛️ 4+ SCATTER! БОНУС 10 FREE SPINS!');
    playBigWin();
    await sleep(1000);
  }

  app.isSpinning = false;
  setBtns(true);
  if (app.freeSpins > 0) {
    app.freeSpins--;
    setTimeout(() => startSpin(true), 550);
  } else if (app.autoSpins > 0) {
    app.autoSpins--;
    updAutoBtn();
    if (app.autoSpins > 0) setTimeout(() => startSpin(false), 500);
  }
}

function updateHUD() {
  const bet = itemAt(BETS, app.betIndex);
  elById('bet-val').textContent = fmt(bet);
  elById('buy-cost').textContent = fmt(bet * 100);
  elById('balance-val').textContent = fmt(me.balance);
}

function setBanner(t) {
  elById('status-banner').textContent = t;
}

function setBtns(en) {
  new Array('spin-btn', 'bet-up', 'bet-down', 'bet-max', 'buy-bonus-btn').forEach(id => {
    elById(id).disabled = !en;
  });
}

function chgBet(d) {
  const ni = app.betIndex + d;
  if (ni >= 0 && ni < BETS.length) {
    app.betIndex = ni;
    updateHUD();
  }
}

function maxBet() {
  app.betIndex = BETS.length - 1;
  updateHUD();
}

function toggleTurbo(btn) {
  app.turbo = !app.turbo;
  btn.classList.toggle('active-toggle', app.turbo);
}

function buyBonus() {
  const cost = itemAt(BETS, app.betIndex) * 100;
  if (me.balance < cost) return setBanner('❌ Недостаточно средств для BUY BONUS!');
  me.balance -= cost;
  app.freeSpins = 10;
  app.bonusMult = 1;
  pushMe();
  playPhonkWild();
  triggerWildFX();
  startSpin(true);
}

function clickAuto() {
  if (app.autoSpins > 0) stopAuto();
  else elById('auto-modal').classList.remove('hidden');
}

function closeAuto() {
  elById('auto-modal').classList.add('hidden');
}

function runAuto(n) {
  app.autoSpins = n;
  closeAuto();
  updAutoBtn();
  startSpin(false);
}

function stopAuto() {
  app.autoSpins = 0;
  updAutoBtn();
}

function updAutoBtn() {
  const b = elById('auto-btn');
  if (app.autoSpins > 0) {
    b.textContent = '⏹ ' + app.autoSpins;
    b.classList.add('btn-auto-stop');
  } else {
    b.textContent = '🔄 АВТО';
    b.classList.remove('btn-auto-stop');
  }
}

async function clearOld() {
  const now = Date.now();
  for (const id of Object.keys(playersCache)) {
    const p = Reflect.get(playersCache, id);
    if (id !== me.id && now - (p.lastSeen || 0) > 25000) {
      Reflect.deleteProperty(playersCache, id);
      await fbReq('/players/' + id, 'DELETE');
    }
  }
  renderAdmin();
  setBanner('🗑️ Старые игроки удалены!');
}

function renderAdmin() {
  const tb = elById('admin-tbody');
  const now = Date.now();
  if (tb.contains(document.activeElement)) return;
  tb.innerHTML = '';
  Object.values(playersCache).forEach(p => {
    const on = (now - (p.lastSeen || 0)) < 12000;
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (p.avatar || '👑') + ' <b>' + p.name + '</b> ' + (p.isAdmin ? '<span class="badge-admin">ADMIN</span>' : '') + '</td>' +
      '<td><span class="dot ' + (on ? 'online' : 'offline') + '"></span>' + (on ? 'В игре' : 'Офлайн') + '</td>' +
      '<td><input type="number" class="admin-input" id="bal_' + p.id + '" value="' + Math.round(p.balance) + '"></td>' +
      '<td><input type="number" class="admin-input" id="ch_' + p.id + '" min="0" max="100" value="' + p.chance + '"></td>' +
      '<td style="display:flex;gap:4px;flex-wrap:wrap;">' +
        '<button class="btn btn-ok-admin" onclick="admOk(\'' + p.id + '\')">OK</button>' +
        '<button class="btn btn-wild-admin" onclick="admWild(\'' + p.id + '\')">⚔️ WILD</button>' +
        '<button class="btn btn-bigwin-admin" onclick="adm500k(\'' + p.id + '\')">🔥 500K</button></td>';
    tb.appendChild(tr);
  });
}

async function admOk(id) {
  const p = Reflect.get(playersCache, id);
  if (!p) return;
  const nb = Math.max(0, parseInt(elById('bal_' + id).value, 10) || 0);
  const nc = Math.min(100, Math.max(0, parseInt(elById('ch_' + id).value, 10) || 0));
  p.balance = nb;
  p.chance = nc;
  if (id === me.id) {
    me.balance = nb;
    me.chance = nc;
    updateHUD();
  }
  await fbReq('/players/' + id, 'PATCH', { balance: nb, chance: nc });
  setBanner('✅ Игроку ' + p.name + ' обновлены данные!');
}

async function admWild(id) {
  const p = Reflect.get(playersCache, id);
  if (!p) return;
  p.forceWild = true;
  if (id === me.id) me.forceWild = true;
  await fbReq('/players/' + id, 'PATCH', { forceWild: true });
  setBanner('⚔️ Игроку ' + p.name + ' активирован WILD!');
}

async function adm500k(id) {
  const p = Reflect.get(playersCache, id);
  if (!p) return;
  p.force500k = true;
  if (id === me.id) me.force500k = true;
  await fbReq('/players/' + id, 'PATCH', { force500k: true });
  setBanner('🔥 Игроку ' + p.name + ' активирован MAX WIN 500K!');
}
