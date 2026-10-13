/* ============================================================
   Grammar Runner: Word Switch
   Motor del juego (canvas 2D, 3 carriles)
   Funciona en laptop (teclado) y en iPad / tablets (táctil)
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- Configuración ---------------- */
  var CFG = {
    lanes: 3,
    lives: 3,
    screenMsPerWidth: 3300, // tiempo en cruzar la pantalla (ms)
    gateWidthRatio: 0.155,
    gapMs: 1000,            // pausa entre puertas
    firstGapMs: 1400        // pausa antes de la primera puerta
  };

  /* ---------------- Utilidades ---------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function shuffle(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  var FONT = '"Trebuchet MS", "Segoe UI", system-ui, -apple-system, sans-serif';

  /* Almacenamiento seguro: en Safari con modo privado localStorage puede fallar. */
  var store = {
    get: function (k, def) {
      try { var v = window.localStorage.getItem(k); return v === null ? def : v; }
      catch (e) { return def; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, String(v)); } catch (e) { /* sin persistencia */ }
    }
  };

  /* ---------------- Estado ---------------- */
  var G = {
    screen: 'menu',
    levelIndex: 0,
    round: 0,
    queue: [],
    qIndex: -1,
    current: null,
    practice: false,
    highlight: false,
    score: 0,
    streak: 0,
    best: parseInt(store.get('gr_best', '0'), 10) || 0,
    lives: CFG.lives,
    rightCount: 0,
    wrongCount: 0,
    lane: 1,
    laneY: 0,
    targetY: 0,
    speed: 1,
    gates: [],
    particles: [],
    popups: [],
    spawnTimer: 0,
    pendingSpawn: false,
    dist: 0,
    runPhase: 0,
    lastT: 0,
    shake: 0,
    mute: store.get('gr_mute', '0') === '1',
    W: 0, H: 0, laneH: 0, gateW: 0, playerX: 0
  };

  /* ---------------- Audio (WebAudio, sin archivos) ---------------- */
  var AC = null;
  function actx() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { try { AC = new C(); } catch (e) { AC = null; } }
    }
    if (AC && AC.state === 'suspended' && AC.resume) AC.resume();
    return AC;
  }
  function beep(freq, dur, type, vol, delay) {
    if (G.mute) return;
    var ac = actx();
    if (!ac) return;
    var t0 = ac.currentTime + (delay || 0);
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.14, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function sfx(name) {
    if (G.mute) return;
    if (name === 'move') beep(430, 0.07, 'triangle', 0.07);
    else if (name === 'good') { beep(660, 0.10, 'sine', 0.13); beep(880, 0.12, 'sine', 0.12, 0.08); beep(1180, 0.16, 'sine', 0.11, 0.17); }
    else if (name === 'bad') { beep(180, 0.16, 'sawtooth', 0.10); beep(120, 0.22, 'sawtooth', 0.09, 0.12); }
    else if (name === 'level') { beep(523, 0.13, 'square', 0.09); beep(659, 0.13, 'square', 0.09, 0.13); beep(784, 0.13, 'square', 0.09, 0.26); beep(1046, 0.30, 'square', 0.10, 0.39); }
    else if (name === 'over') { beep(400, 0.18, 'sawtooth', 0.10); beep(300, 0.20, 'sawtooth', 0.09, 0.16); beep(200, 0.35, 'sawtooth', 0.09, 0.34); }
  }

  /* ---------------- DOM ---------------- */
  var cv, ctx, stage;
  var promptEl, elEmoji, elText, elHint, elTag;
  var elLevel, elScore, elLives, elStreak;
  var elFlash, elToast;
  var flashTimer = null, toastTimer = null;

  /* ---------------- Medidas / responsive ---------------- */
  function laneCenter(i) { return G.laneH * (i + 0.5); }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var r = stage.getBoundingClientRect();
    G.W = Math.max(300, Math.round(r.width));
    G.H = Math.max(280, Math.round(r.height));
    cv.width = Math.round(G.W * dpr);
    cv.height = Math.round(G.H * dpr);
    cv.style.width = G.W + 'px';
    cv.style.height = G.H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.laneH = G.H / CFG.lanes;
    G.gateW = clamp(G.W * CFG.gateWidthRatio, 80, 190);
    G.playerX = clamp(G.W * 0.19, 62, 210);
    G.laneY = laneCenter(G.lane);
    G.targetY = G.laneY;
    if (G.screen === 'playing' || G.screen === 'paused') updateSpeed();
  }

  function updateSpeed() {
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];
    var mult = lvl.speed * (1 + G.round * 0.10);
    G.speed = (G.W / CFG.screenMsPerWidth) * mult;
  }

  /* ---------------- Entrada ---------------- */
  function move(dir) {
    if (G.screen !== 'playing') return;
    var nl = clamp(G.lane + dir, 0, CFG.lanes - 1);
    if (nl === G.lane) return;
    G.lane = nl;
    G.targetY = laneCenter(nl);
    sfx('move');
  }

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { move(-1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { move(1); e.preventDefault(); }
    else if (k === ' ' || k === 'Enter') {
      if (G.screen === 'menu') { e.preventDefault(); startGame(); }
      else if (G.screen === 'paused') { e.preventDefault(); togglePause(); }
      else if (G.screen === 'gameOver') { e.preventDefault(); restart(); }
    }
    else if (k === 'p' || k === 'P' || k === 'Escape') { togglePause(); }
    else if (k === 'm' || k === 'M') { toggleMute(); }
  }, { passive: false });

  /* Deslizar el dedo (iPad / tablets) */
  var touchStart = null;
  function onTouchStart(e) {
    if (e.touches.length) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchMove(e) { if (e.cancelable) e.preventDefault(); }
  function onTouchEnd(e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dy) > 26 && Math.abs(dy) > Math.abs(dx)) move(dy < 0 ? -1 : 1);
  }

  /* ---------------- Flujo de preguntas ---------------- */
  function buildQueue(level) {
    return shuffle(level.items).map(function (it) {
      var opts = shuffle(it.options);
      return {
        emoji: it.emoji,
        sentence: it.sentence,
        hint: it.hint,
        pattern: it.pattern,
        explain: it.explain,
        words: opts,
        correct: opts.indexOf(it.options[it.correct])
      };
    });
  }

  function startLevel(idx) {
    G.levelIndex = idx;
    G.queue = buildQueue(LEVELS[idx]);
    G.qIndex = -1;
    G.gates = [];
    G.particles = [];
    G.popups = [];
    G.pendingSpawn = false;
    G.lane = 1;
    G.laneY = laneCenter(1);
    G.targetY = G.laneY;
    updateSpeed();
    elLevel.textContent = 'Nivel ' + LEVELS[idx].id + ' · ' + LEVELS[idx].title;
    hideOverlays();
    setScreen('playing');
    syncHUD();
    nextQuestion(CFG.firstGapMs);
  }

  function nextQuestion(extraDelay) {
    G.qIndex++;
    if (G.qIndex >= G.queue.length) { levelComplete(); return; }
    G.current = G.queue[G.qIndex];
    showPrompt(G.current);
    G.pendingSpawn = true;
    G.spawnTimer = CFG.gapMs + (extraDelay || 0);
  }

  function spawnGate() {
    if (!G.current) return;
    G.gates.push({
      x: G.W + 20,
      words: G.current.words,
      correctLane: G.current.correct,
      q: G.current,
      state: 'active',
      cellState: [0, 0, 0],
      fade: 0
    });
  }

  function resolve(g) {
    var pickedWord = g.words[G.lane];
    var ok = (G.lane === g.correctLane);
    g.cellState[G.lane] = ok ? 1 : 2;

    if (ok) {
      var gain = 10 + Math.min(G.streak, 5) * 2;
      G.score += gain;
      G.streak++;
      G.rightCount++;
      g.state = 'broken';
      burst(G.playerX, laneCenter(G.lane), '#4ade80', 22);
      G.popups.push({ x: G.playerX + 26, y: laneCenter(G.lane) - 24, text: '+' + gain, life: 900, t: 0, color: '#86efac' });
      sfx('good');
      toast('✅ ¡Muy bien!  «' + cap(g.words[g.correctLane]) + '»  ·  ' + g.q.explain, 'good');
      syncHUD();
      if (G.practice) { endPractice(); return; }
      nextQuestion(0);
    } else {
      G.streak = 0;
      G.wrongCount++;
      g.state = 'wrong';
      g.cellState[g.correctLane] = 1;
      G.shake = 320;
      burst(G.playerX, laneCenter(G.lane), '#f87171', 16);
      sfx('bad');
      flash('❌ «' + cap(pickedWord) + '» no es aquí   ·   ✅ La respuesta era «' + cap(g.words[g.correctLane]) + '»\n' + g.q.explain);
      syncHUD();
      if (G.practice) {
        G.current = g.q;
        G.pendingSpawn = true;
        G.spawnTimer = 1700;
        return;
      }
      G.lives--;
      syncHUD();
      if (G.lives <= 0) { gameOver(); return; }
      nextQuestion(0);
    }
  }

  function levelComplete() {
    sfx('level');
    var isLast = (G.levelIndex === LEVELS.length - 1);
    var nextIdx = isLast ? 0 : (G.levelIndex + 1);
    if (isLast) G.round++;
    document.getElementById('done-title').textContent = '¡Nivel completado! 🎉';
    document.getElementById('done-sub').textContent =
      'Terminaste «' + LEVELS[G.levelIndex].title + '».  Aciertos: ' + G.rightCount + '  ·  Errores: ' + G.wrongCount;
    document.getElementById('done-score').textContent = 'Puntos: ' + G.score;
    var btn = document.getElementById('btn-continue');
    btn.textContent = 'Ir al Nivel ' + LEVELS[nextIdx].id + ' ➜';
    btn.dataset.next = String(nextIdx);
    setScreen('levelDone');
    showOverlay('screen-done');
  }

  function gameOver() {
    sfx('over');
    if (G.score > G.best) { G.best = G.score; store.set('gr_best', G.best); }
    document.getElementById('over-score').textContent = G.score;
    document.getElementById('over-best').textContent = G.best;
    document.getElementById('over-detail').textContent = 'Aciertos: ' + G.rightCount + '  ·  Errores: ' + G.wrongCount;
    setScreen('gameOver');
    showOverlay('screen-over');
  }

  /* ---------------- Práctica del tutorial ---------------- */
  function startPractice() {
    var item = LEVELS[0].items[2]; // ejemplo claro: "He"
    var opts = shuffle(item.options);
    G.queue = [{
      emoji: item.emoji, sentence: item.sentence, hint: item.hint,
      pattern: item.pattern, explain: item.explain,
      words: opts, correct: opts.indexOf(item.options[item.correct])
    }];
    G.qIndex = -1;
    G.practice = true;
    G.highlight = true;
    G.gates = []; G.particles = []; G.popups = [];
    G.pendingSpawn = false;
    G.lane = 1; G.laneY = laneCenter(1); G.targetY = G.laneY;
    G.lives = CFG.lives;
    G.score = 0; G.streak = 0; G.rightCount = 0; G.wrongCount = 0;
    updateSpeed();
    elLevel.textContent = 'Práctica guiada';
    hideOverlays();
    setScreen('playing');
    syncHUD();
    nextQuestion(1600);
  }

  function endPractice() {
    G.practice = false;
    G.highlight = false;
    setScreen('practiceDone');
    later(650, function () {
      sfx('level');
      showOverlay('screen-practice-done');
    });
  }

  /* ---------------- Overlays / HUD ---------------- */
  function showOverlay(id) {
    hideOverlays();
    var el = document.getElementById(id);
    if (el) el.classList.add('on');
  }
  function hideOverlays() {
    var all = document.querySelectorAll('.overlay');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
  }
  function setScreen(s) {
    G.screen = s;
    document.body.dataset.screen = s;
    if (promptEl) promptEl.classList.toggle('show', s === 'playing');
  }
  function showPrompt(q) {
    elEmoji.textContent = q.emoji || '❓';
    elText.innerHTML = q.sentence.replace('___', '<span class="blank">___</span>');
    elHint.textContent = q.hint || '';
    elTag.textContent = q.pattern || (LEVELS[G.levelIndex] ? LEVELS[G.levelIndex].tag : '');
  }
  function syncHUD() {
    elScore.textContent = G.score;
    elStreak.textContent = G.streak > 1 ? ('🔥 x' + G.streak) : '';
    var hearts = '';
    for (var i = 0; i < CFG.lives; i++) hearts += (i < G.lives ? '❤️' : '🖤');
    elLives.textContent = hearts;
  }
  function toast(text, kind) {
    elToast.textContent = text;
    elToast.className = 'toast show ' + (kind || '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, 2800);
  }
  function flash(text) {
    elFlash.textContent = text;
    elFlash.classList.add('show');
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { elFlash.classList.remove('show'); }, 3600);
  }
  function later(ms, fn) { setTimeout(fn, ms); }

  /* ---------------- Pausa / reinicio ---------------- */
  function togglePause() {
    if (G.screen === 'playing' && !G.practice) { setScreen('paused'); showOverlay('screen-pause'); }
    else if (G.screen === 'paused') { hideOverlays(); setScreen('playing'); }
  }
  function resetRun() {
    G.round = 0;
    G.score = 0; G.streak = 0; G.lives = CFG.lives;
    G.rightCount = 0; G.wrongCount = 0;
    G.practice = false; G.highlight = false;
    G.particles = []; G.popups = [];
  }
  function restart() { resetRun(); startLevel(0); }
  function startGame() { actx(); resetRun(); startLevel(0); }
  function goMenu() { hideOverlays(); setScreen('menu'); showOverlay('screen-menu'); }
  function toggleMute() {
    G.mute = !G.mute;
    store.set('gr_mute', G.mute ? '1' : '0');
    updateMuteBtn();
    if (!G.mute) sfx('move');
  }
  function updateMuteBtn() {
    var b = document.getElementById('btn-mute');
    if (b) b.textContent = G.mute ? '🔇' : '🔊';
  }

  /* ---------------- Partículas ---------------- */
  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = rnd(0, Math.PI * 2), sp = rnd(0.06, 0.42);
      G.particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.12,
        life: rnd(400, 900), t: 0, size: rnd(3, 8), color: color
      });
    }
  }

  /* ---------------- Actualizar ---------------- */
  function update(dt) {
    var diff = G.targetY - G.laneY;
    if (Math.abs(diff) < 0.5) G.laneY = G.targetY;
    else G.laneY += diff * Math.min(1, dt / 90);

    G.dist += G.speed * dt;
    G.runPhase += dt * 0.012;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt);

    var i, g;
    for (i = G.gates.length - 1; i >= 0; i--) {
      g = G.gates[i];
      g.x -= G.speed * dt;
      if (g.state !== 'active') {
        g.fade += dt;
        g.x -= G.speed * dt * 0.6;
        if (g.fade > 650) { G.gates.splice(i, 1); continue; }
      } else if (g.x <= G.playerX) {
        resolve(g);
        if (G.gates.indexOf(g) === -1) continue; // la partida terminó
      }
      if (g.x + G.gateW < -60) G.gates.splice(i, 1);
    }

    if (G.pendingSpawn) {
      var active = false;
      for (i = 0; i < G.gates.length; i++) if (G.gates[i].state === 'active') { active = true; break; }
      if (!active) {
        G.spawnTimer -= dt;
        if (G.spawnTimer <= 0) { spawnGate(); G.pendingSpawn = false; }
      }
    }

    for (i = G.particles.length - 1; i >= 0; i--) {
      var p = G.particles[i];
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0011 * dt;
      if (p.t >= p.life) G.particles.splice(i, 1);
    }
    for (i = G.popups.length - 1; i >= 0; i--) {
      var q = G.popups[i];
      q.t += dt; q.y -= 0.045 * dt;
      if (q.t >= q.life) G.popups.splice(i, 1);
    }
  }

  /* ---------------- Dibujar ---------------- */
  function drawBackground() {
    var W = G.W, H = G.H, i;
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0f2c');
    grad.addColorStop(0.55, '#140f33');
    grad.addColorStop(1, '#1d0f2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    var rg = ctx.createRadialGradient(W * 0.15, H * 0.5, 10, W * 0.15, H * 0.5, Math.max(W, H) * 0.7);
    rg.addColorStop(0, hexA(lvl.color, 0.16));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < CFG.lanes; i++) {
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.030)' : 'rgba(255,255,255,0.012)';
      ctx.fillRect(0, G.laneH * i, W, G.laneH);
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,255,0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([26, 22]);
    ctx.lineDashOffset = -(G.dist % 48);
    for (i = 1; i < CFG.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(0, G.laneH * i);
      ctx.lineTo(W, G.laneH * i);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    for (i = 0; i < 26; i++) {
      var sx = W - ((G.dist * (0.35 + (i % 5) * 0.14) + i * 173) % (W + 120));
      var sy = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * H;
      ctx.fillStyle = 'rgba(180,200,255,' + (0.10 + (i % 4) * 0.05).toFixed(2) + ')';
      ctx.fillRect(sx, sy, 2 + (i % 3) * 6, 2);
    }
    ctx.restore();

    if (lvl.mode === 'collect') {
      ctx.save();
      ctx.strokeStyle = hexA(lvl.color, 0.20);
      ctx.lineWidth = 3;
      for (i = 0; i < 5; i++) {
        var t = ((G.dist * 0.5 + i * 260) % (W + 300)) / (W + 300);
        var x = W - t * (W + 300);
        var rw = 40 + t * 260;
        roundRect(ctx, x - rw * 0.5, H * 0.5 - rw * 0.35, rw, rw * 1.7, rw * 0.4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function fitText(text, maxW, base) {
    var size = base;
    while (size > 10) {
      ctx.font = '800 ' + size + 'px ' + FONT;
      if (ctx.measureText(text).width <= maxW) break;
      size -= 1;
    }
    return size;
  }

  function drawCellText(text, cx, cy, maxW, base) {
    var size = fitText(text, maxW, base);
    ctx.font = '800 ' + size + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
  }

  function drawDoor(x, y, w, h, word, st, faded, color) {
    var r = Math.min(18, h * 0.22);
    var fill, stroke;
    if (st === 1) { fill = 'rgba(34,197,94,0.95)'; stroke = '#4ade80'; }
    else if (st === 2) { fill = 'rgba(239,68,68,0.95)'; stroke = '#f87171'; }
    else { fill = hexA(color, 0.86); stroke = 'rgba(255,255,255,0.55)'; }

    ctx.save();
    ctx.shadowColor = hexA(color, 0.55);
    ctx.shadowBlur = 16;
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    roundRect(ctx, x, y, w, h, r);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, y, w, h * 0.16);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, y + h * 0.84, w, h * 0.16);
    ctx.restore();

    drawCellText(word, x + w / 2, y + h / 2, w - 16, h * 0.42);
    ctx.restore();
  }

  function drawOrb(x, cellY, h, word, st, color) {
    var cx = x + G.gateW / 2;
    var cy = cellY + h / 2;
    var r = Math.min(G.gateW * 0.46, h * 0.42);
    var c1 = st === 1 ? '#22c55e' : (st === 2 ? '#ef4444' : color);

    ctx.save();
    var grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.15, cx, cy, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.78)');
    grd.addColorStop(0.35, c1);
    grd.addColorStop(1, st === 2 ? '#7f1d1d' : (st === 1 ? '#14532d' : '#831843'));
    ctx.shadowColor = st === 1 ? 'rgba(74,222,128,0.7)' : (st === 2 ? 'rgba(248,113,113,0.7)' : hexA(color, 0.6));
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.stroke();
    drawCellText(word, cx, cy, r * 1.8, r * 0.62);
    ctx.restore();
  }

  function drawGates() {
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];
    var pad = Math.max(6, G.laneH * 0.07);
    for (var gi = 0; gi < G.gates.length; gi++) {
      var g = G.gates[gi];
      var alpha = g.state === 'active' ? 1 : clamp(1 - g.fade / 650, 0, 1);
      var scale = g.state === 'active' ? 1 : (1 + g.fade / 650 * 0.06);
      ctx.save();
      ctx.globalAlpha = alpha;

      for (var i = 0; i < CFG.lanes; i++) {
        var y = G.laneH * i + pad;
        var h = G.laneH - pad * 2;
        var w = G.gateW * scale;
        var x = g.x;
        if (lvl.mode === 'collect') drawOrb(x, y, h, g.words[i], g.cellState[i], lvl.color);
        else drawDoor(x, y, w, h, g.words[i], g.cellState[i], g.state, lvl.color);
      }

      if (G.highlight && g.state === 'active') {
        var hy = G.laneH * g.correctLane + pad;
        var hh = G.laneH - pad * 2;
        ctx.strokeStyle = 'rgba(74,222,128,0.95)';
        ctx.lineWidth = 5;
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -(G.dist * 0.4 % 24);
        roundRect(ctx, g.x + 3, hy + 3, G.gateW - 6, hh - 6, 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '700 26px ' + FONT;
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👉', g.x + G.gateW + 24, G.laneH * g.correctLane + G.laneH / 2);
      }
      ctx.restore();
    }
  }

  function drawPlayer() {
    var x = G.playerX;
    var y = G.laneY;
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];
    var s = clamp(G.laneH * 0.30, 20, 46);
    var ph = G.runPhase * 6;
    var body = lvl.color;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.95, s * 0.72, s * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    var bob = Math.sin(ph) * s * 0.06;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(4, s * 0.15);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.12, y + s * 0.30);
    ctx.lineTo(x - s * 0.12 + Math.sin(ph) * s * 0.42, y + s * 0.92);
    ctx.moveTo(x + s * 0.12, y + s * 0.30);
    ctx.lineTo(x + s * 0.12 + Math.sin(ph + Math.PI) * s * 0.42, y + s * 0.92);
    ctx.stroke();

    var by = y - s * 0.10 + bob;
    ctx.save();
    ctx.shadowColor = hexA(body, 0.6);
    ctx.shadowBlur = 14;
    roundRect(ctx, x - s * 0.34, by - s * 0.30, s * 0.68, s * 0.72, s * 0.26);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = body;
    ctx.lineWidth = Math.max(4, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.28, by + s * 0.02);
    ctx.lineTo(x - s * 0.28 + Math.sin(ph + Math.PI) * s * 0.36, by + s * 0.28);
    ctx.moveTo(x + s * 0.28, by + s * 0.02);
    ctx.lineTo(x + s * 0.28 + Math.sin(ph) * s * 0.36, by + s * 0.28);
    ctx.stroke();

    var hy = by - s * 0.70;
    ctx.beginPath();
    ctx.arc(x, hy, s * 0.40, 0, Math.PI * 2);
    ctx.fillStyle = '#fcd9b6';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x - s * 0.14, hy - s * 0.05, Math.max(1.6, s * 0.055), 0, Math.PI * 2);
    ctx.arc(x + s * 0.14, hy - s * 0.05, Math.max(1.6, s * 0.055), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.6, s * 0.05);
    ctx.beginPath();
    ctx.arc(x, hy + s * 0.06, s * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function drawFX() {
    var i;
    for (i = 0; i < G.particles.length; i++) {
      var p = G.particles[i];
      var a = clamp(1 - p.t / p.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * a), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (i = 0; i < G.popups.length; i++) {
      var q = G.popups[i];
      ctx.globalAlpha = clamp(1 - q.t / q.life, 0, 1);
      ctx.font = '800 22px ' + FONT;
      ctx.fillStyle = q.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(q.text, q.x, q.y);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.save();
    if (G.shake > 0) {
      var m = G.shake / 320 * 7;
      ctx.translate(rnd(-m, m), rnd(-m, m));
    }
    drawBackground();
    drawGates();
    drawPlayer();
    drawFX();
    ctx.restore();
  }

  /* ---------------- Bucle principal ---------------- */
  function loop(t) {
    requestAnimationFrame(loop);
    var dt = t - G.lastT;
    G.lastT = t;
    if (!isFinite(dt) || dt < 0) dt = 16;
    dt = Math.min(dt, 48);

    if (G.screen === 'playing') update(dt);
    else { G.dist += dt * 0.28; if (G.screen === 'menu' || G.screen === 'tutorial') menuDrift(); }
    render();
  }

  /* ---------------- Tutorial ---------------- */
  var tStep = 0;
  function renderTutorial() {
    var s = TUTORIAL_STEPS[tStep];
    document.getElementById('tut-emoji').textContent = s.emoji;
    document.getElementById('tut-title').textContent = s.title;
    document.getElementById('tut-text').textContent = s.text;
    var dots = '';
    for (var i = 0; i < TUTORIAL_STEPS.length; i++) dots += '<span class="dot' + (i === tStep ? ' on' : '') + '"></span>';
    document.getElementById('tut-dots').innerHTML = dots;
    document.getElementById('btn-tut-prev').style.visibility = tStep === 0 ? 'hidden' : 'visible';
    document.getElementById('btn-tut-next').textContent =
      (tStep === TUTORIAL_STEPS.length - 1) ? '¡Empezar la práctica! 🎯' : 'Siguiente ➜';
  }
  function tutNext() {
    if (tStep >= TUTORIAL_STEPS.length - 1) { startPractice(); return; }
    tStep++;
    renderTutorial();
  }
  function tutPrev() { if (tStep > 0) { tStep--; renderTutorial(); } }

  /* ---------------- Anima el fondo mientras no se juega ---------------- */
  function menuDrift() {
    G.runPhase += 0.05;
    G.laneY = laneCenter(1) + Math.sin(Date.now() / 700) * (G.H * 0.10);
  }

  /* ---------------- Conexión de botones ---------------- */
  function wire() {
    document.getElementById('btn-play').addEventListener('click', startGame);
    document.getElementById('btn-tutorial').addEventListener('click', function () {
      tStep = 0; renderTutorial(); showOverlay('screen-tutorial');
    });
    document.getElementById('btn-tut-next').addEventListener('click', tutNext);
    document.getElementById('btn-tut-prev').addEventListener('click', tutPrev);
    document.getElementById('btn-tut-skip').addEventListener('click', startGame);
    document.getElementById('btn-practice-end').addEventListener('click', restart);
    document.getElementById('btn-continue').addEventListener('click', function () {
      hideOverlays();
      startLevel(parseInt(this.dataset.next, 10));
    });
    document.getElementById('btn-retry').addEventListener('click', restart);
    document.getElementById('btn-menu').addEventListener('click', goMenu);
    document.getElementById('btn-menu-2').addEventListener('click', goMenu);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    document.getElementById('btn-restart').addEventListener('click', restart);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-mute').addEventListener('click', toggleMute);

    document.getElementById('best-menu').textContent = G.best;
    updateMuteBtn();

    // Utilidad de desarrollo: permite probar el juego desde la consola.
    // Ejemplo: GRAMMAR_RUNNER.startLevel(2)
    window.GRAMMAR_RUNNER = {
      get state() { return G; },
      levels: LEVELS,
      move: move,
      startGame: startGame,
      startPractice: startPractice,
      startLevel: startLevel,
      goMenu: goMenu
    };
  }

  /* ---------------- Inicio ---------------- */
  function init() {
    cv = document.getElementById('game');
    ctx = cv.getContext('2d');
    stage = document.getElementById('stage');
    promptEl = document.getElementById('prompt');
    elEmoji = document.getElementById('prompt-emoji');
    elText = document.getElementById('prompt-text');
    elHint = document.getElementById('prompt-hint');
    elTag = document.getElementById('prompt-tag');
    elLevel = document.getElementById('hud-level');
    elScore = document.getElementById('hud-score');
    elLives = document.getElementById('hud-lives');
    elStreak = document.getElementById('hud-streak');
    elFlash = document.getElementById('flash');
    elToast = document.getElementById('toast');

    wire();
    resize();
    G.laneY = laneCenter(1);
    G.targetY = G.laneY;
    syncHUD();
    setScreen('menu');
    showOverlay('screen-menu');

    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });
    document.getElementById('btn-up').addEventListener('pointerdown', function (e) { e.preventDefault(); move(-1); });
    document.getElementById('btn-down').addEventListener('pointerdown', function (e) { e.preventDefault(); move(1); });

    window.addEventListener('resize', function () { setTimeout(resize, 60); });
    window.addEventListener('orientationchange', function () { setTimeout(resize, 250); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && G.screen === 'playing' && !G.practice) togglePause();
    });

    requestAnimationFrame(function (t) { G.lastT = t; requestAnimationFrame(loop); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
