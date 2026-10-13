/* ============================================================
   Grammar Runner · Word Switch
   Motor del juego (canvas 2D, 3 carriles)
   Funciona en laptop (teclado) y en iPad / tablets (táctil)
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- Configuración ---------------- */
  var CFG = {
    lanes: 3,
    lives: 3,
    screenMsPerWidth: 3400, // tiempo en cruzar la pantalla (ms)
    gateWidthRatio: 0.175,
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
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
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

  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
    hideHint: store.get('gr_hint', '0') === '1',
    afterVocab: null,   // qué hacer al cerrar el vocabulario
    W: 0, H: 0, laneH: 0, gateW: 0, playerX: 0
  };

  /* ---------------- Audio ---------------- */
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
    if (name === 'move') beep(430, 0.07, 'triangle', 0.06);
    else if (name === 'good') { beep(660, 0.10, 'sine', 0.12); beep(880, 0.12, 'sine', 0.11, 0.08); beep(1180, 0.16, 'sine', 0.10, 0.17); }
    else if (name === 'bad') { beep(180, 0.16, 'sawtooth', 0.09); beep(120, 0.22, 'sawtooth', 0.08, 0.12); }
    else if (name === 'level') { beep(523, 0.13, 'square', 0.08); beep(659, 0.13, 'square', 0.08, 0.13); beep(784, 0.13, 'square', 0.08, 0.26); beep(1046, 0.30, 'square', 0.09, 0.39); }
    else if (name === 'over') { beep(400, 0.18, 'sawtooth', 0.09); beep(300, 0.20, 'sawtooth', 0.08, 0.16); beep(200, 0.35, 'sawtooth', 0.08, 0.34); }
  }

  /* ---------------- DOM ---------------- */
  var cv, ctx, stage;
  var promptEl, elIcon, elEs, elEn, elTag, elCue;
  var elLevel, elProgress, elScore, elLives, elStreak;
  var elFlash, elToast;
  var flashTimer = null, toastTimer = null;

  /* ---------------- Medidas / responsive ---------------- */
  function laneCenter(i) { return G.laneH * (i + 0.5); }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var r = stage.getBoundingClientRect();
    G.W = Math.max(300, Math.round(r.width));
    G.H = Math.max(260, Math.round(r.height));
    cv.width = Math.round(G.W * dpr);
    cv.height = Math.round(G.H * dpr);
    cv.style.width = G.W + 'px';
    cv.style.height = G.H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.laneH = G.H / CFG.lanes;
    G.gateW = clamp(G.W * CFG.gateWidthRatio, 96, 230);
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
      else if (G.screen === 'vocab') { e.preventDefault(); closeVocab(); }
      else if (G.screen === 'paused') { e.preventDefault(); togglePause(); }
      else if (G.screen === 'gameOver') { e.preventDefault(); restart(); }
    }
    else if (k === 'p' || k === 'P' || k === 'Escape') { togglePause(); }
    else if (k === 'm' || k === 'M') { toggleMute(); }
    else if (k === 'h' || k === 'H') { toggleHint(); }
  }, { passive: false });

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
        icon: it.icon,
        es: it.es,
        en: it.en,
        cue: it.cue,
        pattern: it.pattern,
        explain: it.explain,
        meaning: it.meaning,
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
    syncHUD();
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
      burst(G.playerX, laneCenter(G.lane), '#2fa96b', 22);
      G.popups.push({ x: G.playerX + 26, y: laneCenter(G.lane) - 24, text: '+' + gain, life: 900, t: 0, color: '#7ee2b0' });
      sfx('good');
      toast('Correcto · ' + esc(g.q.meaning) + '\n' + esc(g.q.explain), 'good');
      syncHUD();
      if (G.practice) { endPractice(); return; }
      nextQuestion(0);
    } else {
      G.streak = 0;
      G.wrongCount++;
      g.state = 'wrong';
      g.cellState[g.correctLane] = 1;
      G.shake = 320;
      burst(G.playerX, laneCenter(G.lane), '#e5484d', 16);
      sfx('bad');
      flash('Fallaste · elegiste «' + cap(pickedWord) + '»\n' +
            'La respuesta era «' + cap(g.words[g.correctLane]) + '» (' + esc(g.q.meaning) + ')\n' +
            esc(g.q.explain));
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
    document.getElementById('done-title').textContent = 'Nivel completado: ' + LEVELS[G.levelIndex].title;
    document.getElementById('done-sub').textContent =
      'Muy bien. Sigue con el siguiente nivel para aprender palabras nuevas.';
    document.getElementById('done-score').textContent = G.score;
    document.getElementById('done-right').textContent = G.rightCount;
    document.getElementById('done-wrong').textContent = G.wrongCount;
    var btn = document.getElementById('btn-continue');
    btn.innerHTML = '<span class="btn-icon">' + icon('chevron-right', 18) + '</span> ' +
      (isLast ? 'Repetir el nivel 1' : 'Ir al nivel ' + LEVELS[nextIdx].id);
    btn.dataset.next = String(nextIdx);
    setScreen('levelDone');
    showOverlay('screen-done');
  }

  function gameOver() {
    sfx('over');
    if (G.score > G.best) { G.best = G.score; store.set('gr_best', G.best); }
    document.getElementById('over-score').textContent = G.score;
    document.getElementById('over-best').textContent = G.best;
    document.getElementById('over-detail').textContent =
      'Acertaste ' + G.rightCount + ' palabras y fallaste ' + G.wrongCount + '.';
    setScreen('gameOver');
    showOverlay('screen-over');
  }

  /* ---------------- Práctica del tutorial ---------------- */
  function startPractice() {
    var item = LEVELS[0].items[2]; // ejemplo claro
    var opts = shuffle(item.options);
    G.queue = [{
      icon: item.icon, es: item.es, en: item.en, cue: item.cue,
      pattern: item.pattern, explain: item.explain, meaning: item.meaning,
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

  /* ---------------- Vocabulario ---------------- */
  function openVocab(levelIndex, thenPlay) {
    var lvl = LEVELS[levelIndex];
    G.afterVocab = thenPlay ? levelIndex : null;
    document.getElementById('vocab-eyebrow').textContent =
      'Nivel ' + lvl.id + ' de ' + LEVELS.length + ' · antes de jugar';
    document.getElementById('vocab-title').textContent = lvl.title;
    document.getElementById('vocab-lead').textContent =
      lvl.subtitle + '. Lee estas palabras con calma: son las respuestas que van a aparecer en las puertas.';
    document.getElementById('vocab-play-label').textContent =
      thenPlay ? 'Empezar el nivel' : 'Continuar';

    var list = document.getElementById('vocab-list');
    var html = '';
    for (var i = 0; i < lvl.vocab.length; i++) {
      var v = lvl.vocab[i];
      html += '<li class="vocab-row">' +
        '<span class="vocab-en notranslate" translate="no">' + esc(v.en) + '</span>' +
        '<span class="vocab-es"><b>' + esc(v.es) + '</b>' +
        (v.tip ? '<span class="tip">' + esc(v.tip) + '</span>' : '') + '</span>' +
        '</li>';
    }
    list.innerHTML = html;

    document.getElementById('btn-vocab-back').style.display = thenPlay ? 'none' : 'flex';
    setScreen('vocab');
    showOverlay('screen-vocab');
  }

  function closeVocab() {
    var idx = G.afterVocab;
    G.afterVocab = null;
    if (idx !== null && idx !== undefined) {
      G.lives = CFG.lives;
      startLevel(idx);
    } else {
      setScreen('paused');
      showOverlay('screen-pause');
    }
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
    elIcon.innerHTML = icon(q.icon || 'sparkles', 26);
    elEs.innerHTML = esc(q.es).replace('___', '<span class="blank">___</span>');
    elEn.innerHTML = esc(q.en).replace('___', '<span class="blank">___</span>');
    elTag.textContent = q.pattern || (LEVELS[G.levelIndex] ? LEVELS[G.levelIndex].tag : '');
    elCue.textContent = q.cue ? 'Pista: ' + q.cue : '';
  }
  function syncHUD() {
    elScore.textContent = G.score;
    elStreak.textContent = G.streak > 1 ? 'Racha ×' + G.streak : '';
    if (G.queue.length) elProgress.textContent = 'Pregunta ' + Math.max(1, G.qIndex + 1) + ' de ' + G.queue.length;
    else elProgress.textContent = '';
    var h = '';
    for (var i = 0; i < CFG.lives; i++) {
      h += i < G.lives ? icon('heart', 16) : icon('heart', 16, 'off');
    }
    elLives.innerHTML = h;
  }
  function toast(text, kind) {
    elToast.innerHTML = text;
    elToast.className = 'toast show ' + (kind || '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, 3000);
  }
  function flash(text) {
    elFlash.innerHTML = text;
    elFlash.classList.add('show');
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { elFlash.classList.remove('show'); }, 4200);
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
  function restart() { resetRun(); openVocab(0, true); }
  function startGame() { actx(); resetRun(); openVocab(0, true); }
  function goMenu() { hideOverlays(); setScreen('menu'); showOverlay('screen-menu'); }
  function toggleMute() {
    G.mute = !G.mute;
    store.set('gr_mute', G.mute ? '1' : '0');
    updateMuteBtn();
    if (!G.mute) sfx('move');
  }
  function updateMuteBtn() {
    var b = document.getElementById('btn-mute');
    if (!b) return;
    b.innerHTML = icon(G.mute ? 'volume-x' : 'volume-2', 18);
    var label = G.mute ? 'Activar el sonido' : 'Silenciar el sonido';
    b.setAttribute('aria-label', label);
    b.title = label + ' (M)';
  }

  /* Mostrar u ocultar la pista con el significado */
  function toggleHint() {
    G.hideHint = !G.hideHint;
    store.set('gr_hint', G.hideHint ? '1' : '0');
    applyHint();
    updateHintBtn();
    sfx('move');
  }
  function applyHint() {
    if (elCue) elCue.style.display = G.hideHint ? 'none' : '';
  }
  function updateHintBtn() {
    var b = document.getElementById('btn-hint');
    if (!b) return;
    b.innerHTML = icon(G.hideHint ? 'eye-off' : 'eye', 18);
    var label = G.hideHint ? 'Mostrar la pista' : 'Ocultar la pista';
    b.setAttribute('aria-label', label);
    b.title = label + ' (H)';
    b.classList.toggle('is-off', G.hideHint);
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

    ctx.fillStyle = '#0a0d13';
    ctx.fillRect(0, 0, W, H);

    // resplandor suave del color del nivel, solo abajo a la izquierda
    var rg = ctx.createRadialGradient(G.playerX, H * 0.5, 8, G.playerX, H * 0.5, Math.max(W, H) * 0.62);
    rg.addColorStop(0, hexA(lvl.color, 0.10));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // carriles
    for (i = 0; i < CFG.lanes; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.016)';
        ctx.fillRect(0, G.laneH * i, W, G.laneH);
      }
    }

    // divisorias
    ctx.save();
    ctx.strokeStyle = 'rgba(120,140,180,0.20)';
    ctx.lineWidth = 1;
    ctx.setLineDash([18, 16]);
    ctx.lineDashOffset = -(G.dist % 34);
    for (i = 1; i < CFG.lanes; i++) {
      ctx.beginPath();
      ctx.moveTo(0, G.laneH * i);
      ctx.lineTo(W, G.laneH * i);
      ctx.stroke();
    }
    ctx.restore();

    // marcas de velocidad
    ctx.save();
    for (i = 0; i < 22; i++) {
      var sx = W - ((G.dist * (0.32 + (i % 5) * 0.13) + i * 191) % (W + 120));
      var sy = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * H;
      ctx.fillStyle = 'rgba(150,170,210,' + (0.07 + (i % 4) * 0.035).toFixed(3) + ')';
      ctx.fillRect(sx, sy, 1 + (i % 3) * 5, 1);
    }
    ctx.restore();

    // laboratorio de verbos: tubo de velocidad
    if (lvl.mode === 'collect') {
      ctx.save();
      ctx.strokeStyle = hexA(lvl.color, 0.14);
      ctx.lineWidth = 2;
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
    while (size > 12) {
      ctx.font = '700 ' + size + 'px ' + FONT;
      if (ctx.measureText(text).width <= maxW) break;
      size -= 1;
    }
    return size;
  }

  function drawCellText(text, cx, cy, maxW, base) {
    var size = fitText(text, maxW, base);
    ctx.font = '700 ' + size + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);
  }

  function drawDoor(x, y, w, h, word, st, color) {
    var r = Math.min(12, h * 0.16);
    var fill, stroke;
    if (st === 1) { fill = '#248a58'; stroke = '#4ede9a'; }
    else if (st === 2) { fill = '#b73036'; stroke = '#ff8b8f'; }
    else { fill = hexA(color, 0.90); stroke = hexA(color, 1.0); }

    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    // banda superior sutil para dar volumen
    roundRect(ctx, x, y, w, h, r);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(x, y, w, h * 0.42);
    ctx.restore();

    drawCellText(word, x + w / 2, y + h / 2, w - 20, h * 0.52);
  }

  function drawOrb(x, cellY, h, word, st, color) {
    var cx = x + G.gateW / 2;
    var cy = cellY + h / 2;
    var r = Math.min(G.gateW * 0.47, h * 0.44);
    var c1 = st === 1 ? '#248a58' : (st === 2 ? '#b73036' : color);

    ctx.save();
    var grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(0.4, c1);
    grd.addColorStop(1, st === 1 ? '#0f3d28' : (st === 2 ? '#4a1416' : hexA(color, 0.45)));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.stroke();
    drawCellText(word, cx, cy, r * 1.8, r * 0.62);
    ctx.restore();
  }

  function drawGates() {
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];
    var pad = Math.max(7, G.laneH * 0.06);
    for (var gi = 0; gi < G.gates.length; gi++) {
      var g = G.gates[gi];
      var alpha = g.state === 'active' ? 1 : clamp(1 - g.fade / 650, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;

      for (var i = 0; i < CFG.lanes; i++) {
        var y = G.laneH * i + pad;
        var h = G.laneH - pad * 2;
        if (lvl.mode === 'collect') drawOrb(g.x, y, h, g.words[i], g.cellState[i], lvl.color);
        else drawDoor(g.x, y, G.gateW, h, g.words[i], g.cellState[i], lvl.color);
      }

      if (G.highlight && g.state === 'active') {
        var hy = G.laneH * g.correctLane + pad;
        var hh = G.laneH - pad * 2;
        ctx.strokeStyle = 'rgba(78,222,154,0.95)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 9]);
        ctx.lineDashOffset = -(G.dist * 0.4 % 21);
        roundRect(ctx, g.x + 4, hy + 4, G.gateW - 8, hh - 8, 10);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.font = '700 15px ' + FONT;
        ctx.fillStyle = '#4ede9a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¡aquí!', g.x + G.gateW / 2, hy - 12);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawPlayer() {
    var x = G.playerX;
    var y = G.laneY;
    var lvl = LEVELS[G.levelIndex] || LEVELS[0];
    var s = clamp(G.laneH * 0.28, 20, 44);
    var ph = G.runPhase * 6;
    var body = lvl.color;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.95, s * 0.72, s * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();

    var bob = Math.sin(ph) * s * 0.06;
    ctx.strokeStyle = '#2b3444';
    ctx.lineWidth = Math.max(4, s * 0.15);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.12, y + s * 0.30);
    ctx.lineTo(x - s * 0.12 + Math.sin(ph) * s * 0.42, y + s * 0.92);
    ctx.moveTo(x + s * 0.12, y + s * 0.30);
    ctx.lineTo(x + s * 0.12 + Math.sin(ph + Math.PI) * s * 0.42, y + s * 0.92);
    ctx.stroke();

    var by = y - s * 0.10 + bob;
    roundRect(ctx, x - s * 0.33, by - s * 0.30, s * 0.66, s * 0.70, s * 0.22);
    ctx.fillStyle = body;
    ctx.fill();

    ctx.strokeStyle = body;
    ctx.lineWidth = Math.max(4, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.27, by + s * 0.02);
    ctx.lineTo(x - s * 0.27 + Math.sin(ph + Math.PI) * s * 0.34, by + s * 0.28);
    ctx.moveTo(x + s * 0.27, by + s * 0.02);
    ctx.lineTo(x + s * 0.27 + Math.sin(ph) * s * 0.34, by + s * 0.28);
    ctx.stroke();

    var hy = by - s * 0.70;
    ctx.beginPath();
    ctx.arc(x, hy, s * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#f2d3b3';
    ctx.fill();

    ctx.fillStyle = '#141922';
    ctx.beginPath();
    ctx.arc(x - s * 0.13, hy - s * 0.05, Math.max(1.5, s * 0.052), 0, Math.PI * 2);
    ctx.arc(x + s * 0.13, hy - s * 0.05, Math.max(1.5, s * 0.052), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#141922';
    ctx.lineWidth = Math.max(1.5, s * 0.048);
    ctx.beginPath();
    ctx.arc(x, hy + s * 0.05, s * 0.15, 0.15 * Math.PI, 0.85 * Math.PI);
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
      ctx.font = '700 22px ' + FONT;
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
      var m = G.shake / 320 * 6;
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
    else {
      G.dist += dt * 0.22;
      if (G.screen === 'menu' || G.screen === 'vocab' || G.screen === 'tutorial') menuDrift();
    }
    render();
  }

  /* ---------------- Tutorial ---------------- */
  var tStep = 0;
  function renderTutorial() {
    var s = TUTORIAL_STEPS[tStep];
    document.getElementById('tut-icon').innerHTML = icon(s.icon, 26);
    document.getElementById('tut-title').textContent = s.title;
    document.getElementById('tut-text').textContent = s.text;
    var dots = '';
    for (var i = 0; i < TUTORIAL_STEPS.length; i++) dots += '<span class="dot' + (i === tStep ? ' on' : '') + '"></span>';
    document.getElementById('tut-dots').innerHTML = dots;
    document.getElementById('btn-tut-prev').style.visibility = tStep === 0 ? 'hidden' : 'visible';
    document.getElementById('btn-tut-next').textContent =
      (tStep === TUTORIAL_STEPS.length - 1) ? 'Empezar la práctica' : 'Siguiente';
  }
  function tutNext() {
    if (tStep >= TUTORIAL_STEPS.length - 1) { startPractice(); return; }
    tStep++;
    renderTutorial();
  }
  function tutPrev() { if (tStep > 0) { tStep--; renderTutorial(); } }

  function menuDrift() {
    G.runPhase += 0.05;
    G.laneY = laneCenter(1) + Math.sin(Date.now() / 700) * (G.H * 0.10);
  }

  /* ---------------- Conexión de la interfaz ---------------- */
  function wire() {
    // iconos dentro de los botones y de las teclas
    var slots = document.querySelectorAll('[data-icon]');
    for (var i = 0; i < slots.length; i++) {
      var size = parseInt(slots[i].dataset.iconSize || '18', 10);
      slots[i].innerHTML = icon(slots[i].dataset.icon, size);
    }
    document.getElementById('btn-up').innerHTML = icon('chevron-up', 30);
    document.getElementById('btn-down').innerHTML = icon('chevron-down', 30);
    document.getElementById('practice-icon').innerHTML = icon('circle-check', 26);
    document.getElementById('done-icon').innerHTML = icon('award', 26);
    document.getElementById('over-icon').innerHTML = icon('triangle-alert', 26);
    document.getElementById('pause-icon').innerHTML = icon('pause', 26);

    document.getElementById('btn-play').addEventListener('click', startGame);
    document.getElementById('btn-tutorial').addEventListener('click', function () {
      tStep = 0; renderTutorial(); showOverlay('screen-tutorial'); setScreen('tutorial');
    });
    document.getElementById('btn-tut-next').addEventListener('click', tutNext);
    document.getElementById('btn-tut-prev').addEventListener('click', tutPrev);
    document.getElementById('btn-tut-skip').addEventListener('click', startGame);
    document.getElementById('btn-practice-end').addEventListener('click', restart);

    document.getElementById('btn-vocab-play').addEventListener('click', closeVocab);
    document.getElementById('btn-vocab-back').addEventListener('click', function () {
      G.afterVocab = null; goMenu();
    });
    document.getElementById('btn-vocab-again').addEventListener('click', function () {
      openVocab(G.levelIndex, false);
    });

    document.getElementById('btn-continue').addEventListener('click', function () {
      openVocab(parseInt(this.dataset.next, 10), true);
    });
    document.getElementById('btn-retry').addEventListener('click', restart);
    document.getElementById('btn-menu').addEventListener('click', goMenu);
    document.getElementById('btn-menu-2').addEventListener('click', goMenu);
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    document.getElementById('btn-restart').addEventListener('click', restart);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-mute').addEventListener('click', toggleMute);
    document.getElementById('btn-hint').addEventListener('click', toggleHint);

    document.getElementById('best-menu').textContent = G.best;
    updateMuteBtn();
    updateHintBtn();

    // Utilidad de desarrollo: permite probar el juego desde la consola.
    window.GRAMMAR_RUNNER = {
      get state() { return G; },
      levels: LEVELS,
      move: move,
      startGame: startGame,
      startLevel: startLevel,
      startPractice: startPractice,
      openVocab: openVocab,
      goMenu: goMenu
    };
  }

  /* ---------------- Inicio ---------------- */
  function init() {
    cv = document.getElementById('game');
    ctx = cv.getContext('2d');
    stage = document.getElementById('stage');
    promptEl = document.getElementById('prompt');
    elIcon = document.getElementById('prompt-icon');
    elEs = document.getElementById('prompt-es');
    elEn = document.getElementById('prompt-en');
    elTag = document.getElementById('prompt-tag');
    elCue = document.getElementById('prompt-cue');
    elLevel = document.getElementById('hud-level');
    elProgress = document.getElementById('hud-progress');
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
    applyHint();

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
