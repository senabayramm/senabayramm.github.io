/* =========================================================================
   CHRONO SWARM · MAIN CONTROLLER (With In-App Live Code Studio)
   -------------------------------------------------------------------------
   Connects pointer movements, clicks, sliders, keyboard shortcuts, and the
   in-app Live Code Studio (Key: L) to the 8 Strings, Ghosts, and Orbs.
   ========================================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const memSlider = $('memory-slider');
  const cohSlider = $('cohesion-slider');
  const playBtn = $('play-btn');
  const timeBtn = $('time-btn');
  const muteBtn = $('mute-btn');
  const codeToggleBtn = $('code-toggle-btn');
  const codeCloseBtn = $('code-close-btn');
  const codeDrawer = $('code-drawer');
  const codeArea = $('live-code-area');
  const applyCodeBtn = $('apply-code-btn');
  const codeStatus = $('code-status');

  function announce(msg) {
    if ($('live')) $('live').textContent = msg;
    if ($('last-event')) $('last-event').textContent = msg;
  }

  function timeScaleLabel() {
    const s = STATE.timeScale;
    if (s < 0.7) return `${s.toFixed(1)}× Slow-Mo`;
    if (s > 1.3) return `${s.toFixed(1)}× Fast`;
    return `${s.toFixed(1)}× Normal`;
  }

  function updateHUD() {
    const memPct = Math.round(STATE.memory * 100);
    const cohPct = Math.round(STATE.cohesion * 100);
    const stepDelay = RULES.ghostStepDelayMs(STATE.memory);
    const echoPct = Math.round(RULES.echoMix(STATE.memory) * 100);
    const echoSec = RULES.echoDelaySec(STATE.memory).toFixed(2);
    const wAli = RULES.alignmentWeight(STATE.cohesion).toFixed(2);
    const bmpCount = STATE.bumpers.length;
    const swapTag = CONFIG.swapInputs ? ' [SWAPPED]' : '';

    $('r-state').textContent = !STATE.soundUnlocked
      ? '🔊 CLICK ANYWHERE TO START SOUND'
      : STATE.running
        ? `▶ PLAYING (${timeScaleLabel()})${swapTag}`
        : `❚❚ PAUSED (${timeScaleLabel()})${swapTag}`;
    $('r-memory').textContent = `⏳ Memory ${memPct}% → Ghost Delay ${stepDelay}ms · Echo ${echoPct}% (${echoSec}s)`;
    $('r-cohesion').textContent = `✦ Grouping ${cohPct}% → Flock Pull ×${wAli} (${STATE.activeWebLinks} web lines)`;
    $('r-boundaries').textContent = `♪ Strings S1–S8 · ${bmpCount}/${CONFIG.boundaries.maxBumpers} Bumpers · ${STATE.totalPlucks} Notes`;

    memSlider.value = memPct;
    $('memory-val').textContent = `${memPct}%`;
    cohSlider.value = cohPct;
    $('cohesion-val').textContent = `${cohPct}%`;
    timeBtn.innerHTML = `⏱ Speed: <b>${timeScaleLabel()}</b> <kbd>T</kbd>`;

    if (muteBtn) {
      muteBtn.innerHTML = !STATE.soundUnlocked
        ? '🔊 Turn On Sound <kbd>M</kbd>'
        : AUDIO.muted
          ? '🔇 Muted <kbd>M</kbd>'
          : '🔊 Sound ON <kbd>M</kbd>';
    }

    const pillStates = {
      ghostTrails: {
        on: RULES.isGhostTrailsActive(STATE.memory),
        activeText:
          CONFIG.signals.ghostTrails <= 0
            ? 'ALWAYS VISIBLE (Config=0)'
            : `VISIBLE (Memory ≥${Math.round(CONFIG.signals.ghostTrails * 100)}%)`,
        hiddenText:
          CONFIG.signals.ghostTrails > 1
            ? 'DISABLED IN LIVE CODE'
            : `HIDDEN (Needs ≥${Math.round(CONFIG.signals.ghostTrails * 100)}% Memory)`,
      },
      alignmentWeb: {
        on: RULES.isAlignmentWebActive(STATE.cohesion),
        activeText:
          CONFIG.signals.alignmentWeb <= 0
            ? 'ALWAYS VISIBLE (Config=0)'
            : `VISIBLE (Grouping ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}%)`,
        hiddenText:
          CONFIG.signals.alignmentWeb > 1
            ? 'DISABLED IN LIVE CODE'
            : `HIDDEN (Needs ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}% Grouping)`,
      },
      boundaryChimes: {
        on: RULES.isBumperLayerActive(bmpCount),
        activeText: `ACTIVE (${bmpCount} Bounce Bumper${bmpCount === 1 ? '' : 's'})`,
        hiddenText: 'NONE (Click Stage to Add Bumper)',
      },
      phaseVortex: {
        on: RULES.isVortexActive(STATE.maxGhostCluster),
        activeText: `CHORD ACTIVE (${STATE.maxGhostCluster} Orbs on G${STATE.vortexGhostIdx + 1})`,
        hiddenText: `WAITING (${STATE.maxGhostCluster}/${CONFIG.signals.phaseVortex} Orbs on Ghost)`,
      },
    };

    document.querySelectorAll('[data-layer]').forEach((el) => {
      const key = el.dataset.layer;
      const info = pillStates[key];
      if (!info) return;
      el.classList.toggle('off', !info.on);
      const badge = el.querySelector('.pill-state');
      const icon = el.querySelector('.pill-check');
      if (icon) icon.textContent = info.on ? '✓' : '✕';
      if (badge) badge.textContent = info.on ? info.activeText : info.hiddenText;
    });
  }

  // ---------------------------------------------------------------------
  // IN-APP LIVE CODE STUDIO (js/config.js & js/rules.js)
  // ---------------------------------------------------------------------
  function generateLiveCodeText() {
    return [
      '// === 1. HIZ VE SÜRÜ AYARLARI (js/config.js) ===',
      `CONFIG.swarm.minSpeed = ${CONFIG.swarm.minSpeed};       // En düşük hız (yavaş: 0.9, hızlı: 4.5)`,
      `CONFIG.swarm.maxSpeed = ${CONFIG.swarm.maxSpeed};       // En yüksek hız (yavaş: 1.8, hızlı: 8.5)`,
      `CONFIG.swarm.count = ${CONFIG.swarm.count};          // Ekrandaki ses topu sayısı (örn: 24)`,
      '',
      '// === 2. ZAMAN HAYALETLERİ VE YANKI (ECHO) ===',
      `CONFIG.temporal.ghostCount = ${CONFIG.temporal.ghostCount};   // Hayalet sayısı G1..Gn (örn: 5)`,
      `CONFIG.temporal.maxGhostDelayMs = ${CONFIG.temporal.maxGhostDelayMs}; // Hayalet gecikmesi ms`,
      `CONFIG.audio.maxEchoSec = ${CONFIG.audio.maxEchoSec};   // Yankı (echo) süresi sn (2x: 0.84)`,
      `CONFIG.audio.maxEchoMix = ${CONFIG.audio.maxEchoMix};   // Yankı yüksekliği (0.0 - 0.85)`,
      '',
      '// === 3. TIKLAMA SINIRI / COOLDOWN KURALI ===',
      `CONFIG.boundaries.editCooldownMs = ${CONFIG.boundaries.editCooldownMs}; // 1sn sınır için 1000 yap`,
      `CONFIG.boundaries.maxBumpers = ${CONFIG.boundaries.maxBumpers};     // Maksimum yuvarlak engel`,
      '',
      '// === 4. KATMAN GÖRÜNÜRLÜĞÜ (Gizlemek için 2, hep açık için 0) ===',
      `CONFIG.signals.ghostTrails = ${CONFIG.signals.ghostTrails};  // Hayalet izi eşiği`,
      `CONFIG.signals.alignmentWeb = ${CONFIG.signals.alignmentWeb}; // Mor ağ çizgisi eşiği`,
      `CONFIG.signals.phaseVortex = ${CONFIG.signals.phaseVortex};     // Akor için gereken top sayısı`,
      '',
      '// === 5. GİRDİ-ÇIKTI TAKASI (js/rules.js) ===',
      `CONFIG.swapInputs = ${CONFIG.swapInputs};        // true yaparsan 2 slider görev değiştirir`,
    ].join('\n');
  }

  function applyLiveCode(customLabel = 'LIVE CODE APPLIED') {
    AUDIO.init();
    try {
      const src = codeArea.value;
      const runner = new Function('CONFIG', 'RULES', 'STATE', src);
      runner(CONFIG, RULES, STATE);

      TEMPORAL.syncGhostCount();
      SWARM.syncCount();
      AUDIO.updateTemporalEcho();

      // Rescale existing orb velocities immediately to match new minSpeed/maxSpeed
      SWARM.boids.forEach((b) => {
        const ang = Math.atan2(b.vy, b.vx);
        const targetSpd = (CONFIG.swarm.minSpeed + CONFIG.swarm.maxSpeed) * 0.5;
        b.vx = Math.cos(ang) * targetSpd;
        b.vy = Math.sin(ang) * targetSpd;
      });

      if (codeStatus) {
        codeStatus.textContent = `✓ Uygulandı (${new Date().toLocaleTimeString().slice(0, 8)})`;
        codeStatus.style.color = '#34d399';
      }
      RENDER.showBadge([
        `⚡ ${customLabel}`,
        `Orbs: ${CONFIG.swarm.count} · Speed: ${CONFIG.swarm.minSpeed}–${CONFIG.swarm.maxSpeed} · Ghosts: ${CONFIG.temporal.ghostCount}`,
      ]);
      announce(
        `⚡ ${customLabel}: Orbs=${CONFIG.swarm.count}, Speed=${CONFIG.swarm.minSpeed}-${CONFIG.swarm.maxSpeed}, Ghosts=${CONFIG.temporal.ghostCount}, Cooldown=${CONFIG.boundaries.editCooldownMs}ms`
      );
      AUDIO.playWelcomeChord();
      updateHUD();
    } catch (err) {
      if (codeStatus) {
        codeStatus.textContent = `✕ Yazım Hatası: ${err.message}`;
        codeStatus.style.color = '#f43f5e';
      }
    }
  }

  function applyPreset(name) {
    if (name === 'slow') {
      CONFIG.swarm.minSpeed = 0.9;
      CONFIG.swarm.maxSpeed = 1.8;
    } else if (name === 'fast') {
      CONFIG.swarm.minSpeed = 4.5;
      CONFIG.swarm.maxSpeed = 8.5;
    } else if (name === 'echo2x') {
      CONFIG.audio.maxEchoSec = 0.84;
      CONFIG.audio.maxEchoMix = 0.75;
      CONFIG.audio.maxEchoFeedback = 0.72;
    } else if (name === 'orbs24') {
      CONFIG.swarm.count = 24;
    } else if (name === 'ghosts5') {
      CONFIG.temporal.ghostCount = 5;
    } else if (name === 'cooldown') {
      CONFIG.boundaries.editCooldownMs = 1000;
    } else if (name === 'hideGhosts') {
      CONFIG.signals.ghostTrails = CONFIG.signals.ghostTrails > 1 ? 0.20 : 2;
    } else if (name === 'swap') {
      CONFIG.swapInputs = !CONFIG.swapInputs;
    } else if (name === 'reset') {
      CONFIG.swarm.minSpeed = 2.2;
      CONFIG.swarm.maxSpeed = 4.4;
      CONFIG.swarm.count = 10;
      CONFIG.temporal.ghostCount = 3;
      CONFIG.temporal.maxGhostDelayMs = 650;
      CONFIG.audio.maxEchoSec = 0.42;
      CONFIG.audio.maxEchoMix = 0.48;
      CONFIG.audio.maxEchoFeedback = 0.50;
      CONFIG.boundaries.editCooldownMs = 0;
      CONFIG.boundaries.maxBumpers = 6;
      CONFIG.signals.ghostTrails = 0.20;
      CONFIG.signals.alignmentWeb = 0.35;
      CONFIG.signals.phaseVortex = 4;
      CONFIG.swapInputs = false;
    }
    codeArea.value = generateLiveCodeText();
    applyLiveCode(`PRESET: ${name.toUpperCase()}`);
  }

  function toggleCodeDrawer() {
    const isHidden = codeDrawer.hasAttribute('hidden');
    if (isHidden) {
      codeArea.value = generateLiveCodeText();
      codeDrawer.removeAttribute('hidden');
      codeToggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      codeDrawer.setAttribute('hidden', '');
      codeToggleBtn.setAttribute('aria-expanded', 'false');
    }
    setTimeout(() => RENDER.resize(), 30);
  }

  if (codeToggleBtn) codeToggleBtn.addEventListener('click', toggleCodeDrawer);
  if (codeCloseBtn) codeCloseBtn.addEventListener('click', toggleCodeDrawer);
  if (applyCodeBtn) applyCodeBtn.addEventListener('click', () => applyLiveCode('LIVE CODE EDITED'));

  if (codeArea) {
    codeArea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        applyLiveCode('LIVE CODE EDITED');
      }
    });
  }

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  // ---------------------------------------------------------------------
  // HOOKS FROM TEMPORAL & SWARM ENGINES
  // ---------------------------------------------------------------------
  TEMPORAL.onStringPluck = (stringIdx, strObj, hitX, sourceTag) => {
    const xRatio = clamp(hitX / Math.max(1, STATE.stageW), 0, 1);
    AUDIO.playStringPluck(stringIdx, xRatio, sourceTag);
    RENDER.addRipple(hitX, strObj.y, strObj.color, 58);
    const hz = Math.round(RULES.frequencyForString(stringIdx, xRatio));
    const shortName = strObj.label.split('(')[0].trim();
    RENDER.addFlash(hitX, strObj.y, `♪ ${shortName} (${hz}Hz) [${sourceTag}]`, strObj.color);

    if (sourceTag === 'YOU' || sourceTag.startsWith('G') || sourceTag.startsWith('BUMPER')) {
      announce(`♪ ${sourceTag} PLUCKED ${strObj.label} (${hz} Hz)`);
    }
  };

  TEMPORAL.onStateChange = (kind) => {
    AUDIO.updateTemporalEcho();
    const memPct = Math.round(STATE.memory * 100);
    const cohPct = Math.round(STATE.cohesion * 100);

    if (kind === 'memory') {
      const delayMs = RULES.ghostStepDelayMs(STATE.memory);
      const echoPct = Math.round(RULES.echoMix(STATE.memory) * 100);
      announce(`MEMORY ${memPct}% → Ghost Delay ${delayMs}ms · Echo ${echoPct}%`);
      RENDER.showBadge([
        `⏳ MEMORY ${memPct}% → Ghost Delay ${delayMs}ms (G1–G${STATE.ghosts.length})`,
        `Echo ${echoPct}% · ${RULES.isGhostTrailsActive(STATE.memory) ? 'Ghost Trails VISIBLE' : 'Ghost Trails HIDDEN'}`,
      ]);
    } else if (kind === 'cohesion') {
      const wAli = RULES.alignmentWeight(STATE.cohesion).toFixed(2);
      announce(`SWARM GROUPING ${cohPct}% → Flock Pull ×${wAli}`);
      RENDER.showBadge([
        `✦ SWARM GROUPING ${cohPct}% → Flock Pull ×${wAli}`,
        RULES.isAlignmentWebActive(STATE.cohesion)
          ? 'Purple Swarm Web Lines VISIBLE'
          : 'Purple Swarm Web Lines HIDDEN',
      ]);
    } else if (kind === 'timeScale') {
      announce(`SPEED CHANGED TO ${timeScaleLabel()}`);
      RENDER.showBadge([`⏱ SPEED → ${timeScaleLabel()}`]);
    }
    updateHUD();
  };

  SWARM.onVortexCluster = (ghost, clusterCount) => {
    AUDIO.playVortexChord(ghost.index);
    RENDER.addRipple(ghost.x, ghost.y, ghost.color, 95);
    RENDER.addFlash(ghost.x, ghost.y - 16, `★ CHORD (${clusterCount} Orbs on ${ghost.label})`, ghost.color);
    announce(`★ VORTEX CHORD: ${clusterCount} Orbs gathered around Ghost ${ghost.label}!`);
  };

  window.addEventListener(
    'pointerdown',
    () => {
      if (AUDIO.init()) {
        announce('🔊 SOUND ON! Move mouse across Strings S1–S8 or click stage to place Bumpers!');
        updateHUD();
      }
    },
    { passive: true }
  );

  // ---------------------------------------------------------------------
  // STAGE POINTER & KEYBOARD INTERACTION
  // ---------------------------------------------------------------------
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    TEMPORAL.setPointer(e.clientX - r.left, e.clientY - r.top, false);
  });

  canvas.addEventListener('pointerdown', (e) => {
    AUDIO.init();
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    TEMPORAL.setPointer(x, y, false);

    const nearestIdx = TEMPORAL.nearestStringIndex(y);
    TEMPORAL.triggerString(nearestIdx, x, 'YOU');

    const res = TEMPORAL.toggleBumperAt(x, y);
    if (!res.ok && res.waitMs > 0) {
      RENDER.addFlash(x, y, `✕ WAIT ${(res.waitMs / 1000).toFixed(1)}s (Cooldown)`, '#f43f5e');
      announce(`⏱ COOLDOWN ACTIVE: Wait ${(res.waitMs / 1000).toFixed(1)}s before next click!`);
      return;
    }
    if (res.ok) {
      const sLabel = RULES.stringLabel(nearestIdx);
      announce(
        res.action === 'added'
          ? `+ ADDED BOUNCE BUMPER B${STATE.bumpers.length} & PLUCKED ${sLabel}`
          : `− REMOVED BOUNCE BUMPER & PLUCKED ${sLabel}`
      );
      updateHUD();
    }
  });

  function moveKeyboardCursor(dx, dy) {
    AUDIO.init();
    const step = CONFIG.visuals.cursorStepPx;
    TEMPORAL.setPointer(STATE.pointer.x + dx * step, STATE.pointer.y + dy * step, true);
    updateHUD();
  }

  function clickAtCursor() {
    AUDIO.init();
    const x = STATE.pointer.x;
    const y = STATE.pointer.y;
    const nearestIdx = TEMPORAL.nearestStringIndex(y);
    TEMPORAL.triggerString(nearestIdx, x, 'YOU');
    TEMPORAL.toggleBumperAt(x, y);
    updateHUD();
  }

  function toggleRunning() {
    AUDIO.init();
    STATE.running = !STATE.running;
    playBtn.setAttribute('aria-pressed', String(!STATE.running));
    playBtn.innerHTML = STATE.running ? '❚❚ Pause <kbd>P</kbd>' : '▶ Play <kbd>P</kbd>';
    announce(STATE.running ? '▶ SIMULATION PLAYING' : '❚❚ SIMULATION PAUSED');
    updateHUD();
  }

  function toggleMute() {
    const justUnlocked = AUDIO.init();
    if (!justUnlocked) {
      AUDIO.setMuted(!AUDIO.muted);
      if (!AUDIO.muted) AUDIO.playWelcomeChord();
    }
    muteBtn.setAttribute('aria-pressed', String(AUDIO.muted));
    announce(AUDIO.muted ? '🔇 SOUND MUTED' : '🔊 SOUND ON');
    updateHUD();
  }

  function resetDemo() {
    AUDIO.init();
    TEMPORAL.setMemory(CONFIG.temporal.startMemory);
    TEMPORAL.setCohesion(CONFIG.swarm.startCohesion);
    TEMPORAL.cycleTimeScale(CONFIG.temporal.defaultTimeScaleIdx);
    TEMPORAL.seedBumpers();
    SWARM.init();
    AUDIO.playWelcomeChord();
    announce('↺ RESET TO DEFAULT: 8 Strings (S1–S8), 3 Bumpers (B1–B3), 10 Sound Orbs');
    updateHUD();
  }

  const KEYMAP = {
    arrowleft: () => moveKeyboardCursor(-1, 0),
    arrowright: () => moveKeyboardCursor(1, 0),
    arrowup: () => moveKeyboardCursor(0, -1),
    arrowdown: () => moveKeyboardCursor(0, 1),
    ' ': clickAtCursor,
    enter: clickAtCursor,
    p: toggleRunning,
    l: toggleCodeDrawer,
    '[': () => { AUDIO.init(); TEMPORAL.setMemory(STATE.memory - CONFIG.temporal.memoryStep); },
    ']': () => { AUDIO.init(); TEMPORAL.setMemory(STATE.memory + CONFIG.temporal.memoryStep); },
    q: () => { AUDIO.init(); TEMPORAL.setCohesion(STATE.cohesion - CONFIG.swarm.cohesionStep); },
    e: () => { AUDIO.init(); TEMPORAL.setCohesion(STATE.cohesion + CONFIG.swarm.cohesionStep); },
    t: () => { AUDIO.init(); TEMPORAL.cycleTimeScale(); },
    m: toggleMute,
    c: () => {
      AUDIO.init();
      STATE.bumpers = [];
      announce('✕ ALL BOUNCE BUMPERS CLEARED');
      updateHUD();
    },
    r: resetDemo,
  };

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'TEXTAREA') return; // let user type freely inside Live Code Editor!
    const key = e.key.toLowerCase();
    if (tag === 'INPUT' && key.startsWith('arrow')) return;
    if ((tag === 'BUTTON' || tag === 'A') && (key === ' ' || key === 'enter')) return;
    const fn = KEYMAP[key];
    if (!fn) return;
    e.preventDefault();
    fn();
  });

  playBtn.addEventListener('click', toggleRunning);
  timeBtn.addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.cycleTimeScale();
  });
  muteBtn.addEventListener('click', toggleMute);

  $('clear-btn').addEventListener('click', () => {
    AUDIO.init();
    STATE.bumpers = [];
    announce('✕ ALL BOUNCE BUMPERS CLEARED');
    updateHUD();
  });
  $('reset-btn').addEventListener('click', resetDemo);

  memSlider.addEventListener('input', () => {
    AUDIO.init();
    TEMPORAL.setMemory(Number(memSlider.value) / 100);
  });
  cohSlider.addEventListener('input', () => {
    AUDIO.init();
    TEMPORAL.setCohesion(Number(cohSlider.value) / 100);
  });

  $('mem-down').addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.setMemory(STATE.memory - CONFIG.temporal.memoryStep);
  });
  $('mem-up').addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.setMemory(STATE.memory + CONFIG.temporal.memoryStep);
  });
  $('coh-down').addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.setCohesion(STATE.cohesion - CONFIG.swarm.cohesionStep);
  });
  $('coh-up').addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.setCohesion(STATE.cohesion + CONFIG.swarm.cohesionStep);
  });

  new ResizeObserver(() => {
    RENDER.resize();
  }).observe(canvas);

  // ---------------------------------------------------------------------
  // START
  // ---------------------------------------------------------------------
  RENDER.setup(canvas);
  TEMPORAL.init(STATE.stageW, STATE.stageH);
  TEMPORAL.seedBumpers();
  SWARM.init();
  if (codeArea) codeArea.value = generateLiveCodeText();
  updateHUD();

  let lastFrame = performance.now();
  let hudTick = 0;

  function loop(now) {
    const dt = Math.min(40, Math.max(8, now - lastFrame));
    lastFrame = now;

    if (STATE.running) {
      TEMPORAL.step(dt);
      SWARM.step(dt);
    }
    RENDER.drawFrame();

    hudTick++;
    if (hudTick % 12 === 0) {
      updateHUD();
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
