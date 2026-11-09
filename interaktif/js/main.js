/* =========================================================================
   CHRONO SWARM · MAIN CONTROLLER (Crystal-Clear 8-String & Swarm Edition)
   -------------------------------------------------------------------------
   Connects pointer movements, clicks, sliders, and keyboard shortcuts to
   the 8 Musical Strings (S1–S8), 3 Time Ghosts (G1–G3), and 10 Sound Orbs.
   ========================================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const memSlider = $('memory-slider');
  const cohSlider = $('cohesion-slider');
  const playBtn = $('play-btn');
  const timeBtn = $('time-btn');
  const muteBtn = $('mute-btn');

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

    $('r-state').textContent = !STATE.soundUnlocked
      ? '🔊 CLICK ANYWHERE TO START SOUND'
      : STATE.running
        ? `▶ PLAYING (${timeScaleLabel()})`
        : `❚❚ PAUSED (${timeScaleLabel()})`;
    $('r-memory').textContent = `⏳ Memory ${memPct}% → Ghost Delay ${stepDelay}ms · Echo ${echoPct}% (${echoSec}s)`;
    $('r-cohesion').textContent = `✦ Grouping ${cohPct}% → Flock Pull ×${wAli} (${STATE.activeWebLinks} web lines)`;
    $('r-boundaries').textContent = `♪ Strings S1–S8 · ${bmpCount}/${CONFIG.boundaries.maxBumpers} Bumpers · ${STATE.totalPlucks} Notes Played`;

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
        activeText: `VISIBLE (Memory ≥${Math.round(CONFIG.signals.ghostTrails * 100)}%)`,
        hiddenText: `HIDDEN (Needs ≥${Math.round(CONFIG.signals.ghostTrails * 100)}% Memory)`,
      },
      alignmentWeb: {
        on: RULES.isAlignmentWebActive(STATE.cohesion),
        activeText: `VISIBLE (Grouping ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}%)`,
        hiddenText: `HIDDEN (Needs ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}% Grouping)`,
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
        `⏳ MEMORY ${memPct}% → Ghost Delay ${delayMs}ms (G1–G3)`,
        `Echo ${echoPct}% · ${RULES.isGhostTrailsActive(STATE.memory) ? 'Ghost Trails VISIBLE' : 'Ghost Trails HIDDEN (<20%)'}`,
      ]);
    } else if (kind === 'cohesion') {
      const wAli = RULES.alignmentWeight(STATE.cohesion).toFixed(2);
      announce(`SWARM GROUPING ${cohPct}% → Flock Pull ×${wAli}`);
      RENDER.showBadge([
        `✦ SWARM GROUPING ${cohPct}% → Flock Pull ×${wAli}`,
        RULES.isAlignmentWebActive(STATE.cohesion)
          ? 'Purple Swarm Web Lines VISIBLE (≥35%)'
          : 'Purple Swarm Web Lines HIDDEN (<35%)',
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

  // ---------------------------------------------------------------------
  // UNLOCK AUDIO ON FIRST CLICK ANYWHERE
  // ---------------------------------------------------------------------
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

    // Always pluck the nearest string immediately on click so every click makes a clear sound!
    const nearestIdx = TEMPORAL.nearestStringIndex(y);
    TEMPORAL.triggerString(nearestIdx, x, 'YOU');

    // Also add or remove a Bounce Bumper at the clicked spot
    const res = TEMPORAL.toggleBumperAt(x, y);
    if (!res.ok && res.waitMs > 0) {
      RENDER.addFlash(x, y, `WAIT ${(res.waitMs / 1000).toFixed(1)}s`, '#f43f5e');
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
