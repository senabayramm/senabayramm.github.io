/* =========================================================================
   CHRONO SWARM · MAIN CONTROLLER (Modern Dark Glassmorphism Edition)
   -------------------------------------------------------------------------
   Connects pointer gestures, keyboard controls, sliders, and preset buttons
   to the Temporal Engine, Boid Swarm, Web Audio Synth, and Glass HUD.
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
    if (s < 0.6) return `${s.toFixed(2)}× Slow-Mo`;
    if (s > 1.3) return `${s.toFixed(2)}× Overdrive`;
    return `${s.toFixed(2)}× Real-Time`;
  }

  function updateHUD() {
    const memPct = Math.round(STATE.memory * 100);
    const cohPct = Math.round(STATE.cohesion * 100);
    const stepDelay = RULES.ghostStepDelayMs(STATE.memory);
    const echoPct = Math.round(RULES.echoMix(STATE.memory) * 100);
    const echoSec = RULES.echoDelaySec(STATE.memory).toFixed(2);
    const wAli = RULES.alignmentWeight(STATE.cohesion).toFixed(2);
    const wSep = RULES.separationWeight(STATE.cohesion).toFixed(2);
    const lineCount = STATE.boundaries.length;

    // Update Cause → Effect Glass Readout Chips
    $('r-state').textContent = STATE.running
      ? `▶ ACTIVE · ${timeScaleLabel()}`
      : `❚❚ PAUSED · ${timeScaleLabel()}`;
    $('r-memory').textContent = `⏳ Memory ${memPct}% → Ghost Lag ${stepDelay}ms · Echo ${echoPct}% (${echoSec}s)`;
    $('r-cohesion').textContent = `✦ Cohesion ${cohPct}% → Align ×${wAli} / Sep ×${wSep} (${STATE.activeWebLinks} links)`;
    $('r-boundaries').textContent = `⟋ Boundaries: ${lineCount}/${CONFIG.boundaries.maxLines} Lines · ${STATE.totalChimes} Chimes`;

    // Update Slider Labels
    memSlider.value = memPct;
    $('memory-val').textContent = `${memPct}%`;
    cohSlider.value = cohPct;
    $('cohesion-val').textContent = `${cohPct}%`;
    timeBtn.innerHTML = `⏱ Time: <b>${timeScaleLabel()}</b> <kbd>T</kbd>`;

    // Update 4 Self-Explanatory Emergent Layer Status Pills
    const pillStates = {
      ghostTrails: {
        on: RULES.isGhostTrailsActive(STATE.memory),
        activeText: `ACTIVE (Memory ≥${Math.round(CONFIG.signals.ghostTrails * 100)}%)`,
        hiddenText: `HIDDEN (Needs ≥${Math.round(CONFIG.signals.ghostTrails * 100)}% Memory)`,
      },
      alignmentWeb: {
        on: RULES.isAlignmentWebActive(STATE.cohesion),
        activeText: `ACTIVE (Cohesion ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}%)`,
        hiddenText: `SUPPRESSED (Needs ≥${Math.round(CONFIG.signals.alignmentWeb * 100)}% Cohesion)`,
      },
      boundaryChimes: {
        on: RULES.isBoundaryChimesActive(lineCount),
        activeText: `ACTIVE (${lineCount} Resonant Line${lineCount === 1 ? '' : 's'})`,
        hiddenText: 'INACTIVE (Click/Drag Stage to Add Line)',
      },
      phaseVortex: {
        on: RULES.isVortexActive(STATE.maxGhostCluster),
        activeText: `EMERGING (${STATE.maxGhostCluster} Boids on G${STATE.vortexGhostIdx + 1})`,
        hiddenText: `WAITING (${STATE.maxGhostCluster}/${CONFIG.signals.phaseVortex} Boids Clustered)`,
      },
    };

    document.querySelectorAll('[data-layer]').forEach((el) => {
      const key = el.dataset.layer;
      const info = pillStates[key];
      if (!info) return;
      el.classList.toggle('off', !info.on);
      const badge = el.querySelector('.pill-state');
      const icon = el.querySelector('.pill-check');
      if (icon) icon.textContent = info.on ? '●' : '○';
      if (badge) badge.textContent = info.on ? info.activeText : info.hiddenText;
    });
  }

  // ---------------------------------------------------------------------
  // HOOKS FROM TEMPORAL & SWARM ENGINES
  // ---------------------------------------------------------------------
  TEMPORAL.onStateChange = (kind) => {
    AUDIO.updateTemporalEcho();
    const memPct = Math.round(STATE.memory * 100);
    const cohPct = Math.round(STATE.cohesion * 100);

    if (kind === 'memory') {
      const delayMs = RULES.ghostStepDelayMs(STATE.memory);
      const echoPct = Math.round(RULES.echoMix(STATE.memory) * 100);
      const msg = `MEMORY PERSISTENCE ${memPct}% → Ghost Delay ${delayMs}ms · Acoustic Echo ${echoPct}%`;
      announce(msg);
      RENDER.showBadge([
        `⏳ MEMORY ${memPct}% → Ghost Lag ${delayMs}ms (G1–G3)`,
        `Trail Decay ${(RULES.trailLifetimeMs(STATE.memory) / 1000).toFixed(1)}s · Echo ${echoPct}% [Hallnäs & Redström 2001]`,
      ]);
    } else if (kind === 'cohesion') {
      const wAli = RULES.alignmentWeight(STATE.cohesion).toFixed(2);
      const wSep = RULES.separationWeight(STATE.cohesion).toFixed(2);
      const msg = `SWARM COHESION ${cohPct}% → Alignment ×${wAli} · Separation ×${wSep}`;
      announce(msg);
      RENDER.showBadge([
        `✦ SWARM COHESION ${cohPct}% → Align ×${wAli} · Sep ×${wSep}`,
        `${RULES.isAlignmentWebActive(STATE.cohesion) ? 'Alignment Web ACTIVE' : 'Alignment Web SUPPRESSED (<35%)'} [Reynolds 1987]`,
      ]);
    } else if (kind === 'timeScale') {
      const msg = `TIME SCALE → ${timeScaleLabel()}`;
      announce(msg);
      RENDER.showBadge([
        `⏱ TEMPORAL PACING → ${timeScaleLabel()}`,
        'Scales boid velocity and ghost replay speed simultaneously',
      ]);
    }
    updateHUD();
  };

  SWARM.onBoundaryHit = (lineIdx, line, boid, hitX, hitY, speedRatio) => {
    AUDIO.playBoundaryChime(lineIdx, line.length, speedRatio);
    RENDER.addRipple(hitX, hitY, line.color, 58 + speedRatio * 34);
    const hz = Math.round(RULES.frequencyForBoundary(lineIdx, line.length, speedRatio));
    RENDER.addFlash(hitX, hitY, `${RULES.lineLabel(lineIdx)} · ${hz}Hz`, line.color);
  };

  SWARM.onVortexCluster = (ghost, clusterCount) => {
    AUDIO.playVortexChord(ghost.index);
    RENDER.addRipple(ghost.x, ghost.y, ghost.color, 96);
    RENDER.addFlash(ghost.x, ghost.y - 14, `★ VORTEX (${clusterCount} Boids)`, ghost.color);
    announce(
      `EMERGENT PHASE VORTEX around ${ghost.label} (${clusterCount} synchronized boids → ambient fifth chord)`
    );
  };

  // ---------------------------------------------------------------------
  // USER INTERACTIONS (POINTER & KEYBOARD)
  // ---------------------------------------------------------------------
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    TEMPORAL.setPointer(x, y, false);
    if (STATE.drag.active) {
      STATE.drag.currX = x;
      STATE.drag.currY = y;
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    AUDIO.init();
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    TEMPORAL.setPointer(x, y, false);
    STATE.drag.active = true;
    STATE.drag.startX = x;
    STATE.drag.startY = y;
    STATE.drag.currX = x;
    STATE.drag.currY = y;
  });

  window.addEventListener('pointerup', () => {
    if (!STATE.drag.active) return;
    const d = STATE.drag;
    STATE.drag.active = false;
    const dist = Math.hypot(d.currX - d.startX, d.currY - d.startY);

    let res;
    if (dist >= CONFIG.boundaries.minLengthPx) {
      res = TEMPORAL.createBoundarySegment(d.startX, d.startY, d.currX, d.currY);
    } else {
      res = TEMPORAL.placeBoundaryAt(d.currX, d.currY);
    }

    if (!res.ok && res.waitMs > 0) {
      RENDER.addFlash(d.currX, d.currY, `WAIT ${(res.waitMs / 1000).toFixed(1)}s`, '#f43f5e');
      announce(`EDIT COOLDOWN: WAIT ${(res.waitMs / 1000).toFixed(1)}s BEFORE PLACING NEXT LINE`);
      return;
    }

    if (res.ok) {
      const idx = res.index;
      const line = res.line;
      const mx = (line.x1 + line.x2) * 0.5;
      const my = (line.y1 + line.y2) * 0.5;
      const hz = Math.round(RULES.frequencyForBoundary(idx, line.length));
      AUDIO.playBoundaryChime(idx, line.length, 0.65);
      RENDER.addRipple(mx, my, line.color, 76);
      RENDER.addFlash(mx, my, `+ ${RULES.lineLabel(idx)} (${hz} Hz)`, line.color);
      announce(
        `ADDED HARMONIC BOUNDARY ${RULES.lineLabel(idx)} (${Math.round(line.length)}px → ${hz} Hz) · Boids will reflect & chime`
      );
      updateHUD();
    }
  });

  function moveKeyboardCursor(dx, dy) {
    AUDIO.init();
    const step = CONFIG.visuals.cursorStepPx;
    TEMPORAL.setPointer(STATE.pointer.x + dx * step, STATE.pointer.y + dy * step, true);
    announce(
      `CURSOR MOVED TO (${Math.round(STATE.pointer.x)}, ${Math.round(STATE.pointer.y)}) · Time Ghosts G1–G3 following`
    );
  }

  function placeLineFromKeyboard() {
    AUDIO.init();
    const res = TEMPORAL.placeBoundaryAt(STATE.pointer.x, STATE.pointer.y);
    if (!res.ok) return;
    const idx = res.index;
    const line = res.line;
    const hz = Math.round(RULES.frequencyForBoundary(idx, line.length));
    AUDIO.playBoundaryChime(idx, line.length, 0.65);
    RENDER.addRipple(STATE.pointer.x, STATE.pointer.y, line.color, 76);
    RENDER.addFlash(STATE.pointer.x, STATE.pointer.y, `+ ${RULES.lineLabel(idx)} (${hz} Hz)`, line.color);
    announce(`ADDED BOUNDARY ${RULES.lineLabel(idx)} AT CURSOR (${hz} Hz)`);
    updateHUD();
  }

  function toggleRunning() {
    AUDIO.init();
    STATE.running = !STATE.running;
    playBtn.setAttribute('aria-pressed', String(!STATE.running));
    playBtn.innerHTML = STATE.running
      ? '❚❚ Freeze <kbd>P</kbd>'
      : '▶ Resume <kbd>P</kbd>';
    announce(STATE.running ? 'SIMULATION RESUMED' : 'SIMULATION FROZEN IN TIME');
    updateHUD();
  }

  function toggleMute() {
    AUDIO.init();
    AUDIO.setMuted(!AUDIO.muted);
    muteBtn.setAttribute('aria-pressed', String(AUDIO.muted));
    muteBtn.innerHTML = AUDIO.muted
      ? '🔇 Muted <kbd>M</kbd>'
      : '🔊 Audio On <kbd>M</kbd>';
    announce(AUDIO.muted ? 'SYNTH AUDIO MUTED' : 'SYNTH AUDIO ACTIVE');
  }

  function resetDemo() {
    AUDIO.init();
    TEMPORAL.setMemory(CONFIG.temporal.startMemory);
    TEMPORAL.setCohesion(CONFIG.swarm.startCohesion);
    TEMPORAL.cycleTimeScale(CONFIG.temporal.defaultTimeScaleIdx);
    TEMPORAL.seedBoundaries();
    SWARM.init();
    announce('DEMO CHAMBER RESTORED: 4 Harmonic Boundary Lines (L1–L4) & 28 Autonomous Boids');
    updateHUD();
  }

  const KEYMAP = {
    arrowleft: () => moveKeyboardCursor(-1, 0),
    arrowright: () => moveKeyboardCursor(1, 0),
    arrowup: () => moveKeyboardCursor(0, -1),
    arrowdown: () => moveKeyboardCursor(0, 1),
    ' ': placeLineFromKeyboard,
    enter: placeLineFromKeyboard,
    p: toggleRunning,
    '[': () => TEMPORAL.setMemory(STATE.memory - CONFIG.temporal.memoryStep),
    ']': () => TEMPORAL.setMemory(STATE.memory + CONFIG.temporal.memoryStep),
    q: () => TEMPORAL.setCohesion(STATE.cohesion - CONFIG.swarm.cohesionStep),
    e: () => TEMPORAL.setCohesion(STATE.cohesion + CONFIG.swarm.cohesionStep),
    t: () => TEMPORAL.cycleTimeScale(),
    m: toggleMute,
    c: () => {
      TEMPORAL.clearBoundaries();
      announce('ALL HARMONIC BOUNDARY LINES CLEARED');
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

  // UI Control Bindings
  playBtn.addEventListener('click', toggleRunning);
  timeBtn.addEventListener('click', () => {
    AUDIO.init();
    TEMPORAL.cycleTimeScale();
  });
  muteBtn.addEventListener('click', toggleMute);

  $('clear-btn').addEventListener('click', () => {
    TEMPORAL.clearBoundaries();
    announce('ALL HARMONIC BOUNDARY LINES CLEARED');
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

  $('mem-down').addEventListener('click', () =>
    TEMPORAL.setMemory(STATE.memory - CONFIG.temporal.memoryStep)
  );
  $('mem-up').addEventListener('click', () =>
    TEMPORAL.setMemory(STATE.memory + CONFIG.temporal.memoryStep)
  );
  $('coh-down').addEventListener('click', () =>
    TEMPORAL.setCohesion(STATE.cohesion - CONFIG.swarm.cohesionStep)
  );
  $('coh-up').addEventListener('click', () =>
    TEMPORAL.setCohesion(STATE.cohesion + CONFIG.swarm.cohesionStep)
  );

  new ResizeObserver(() => {
    RENDER.resize();
  }).observe(canvas);

  // ---------------------------------------------------------------------
  // INITIALIZE & START LOOP
  // ---------------------------------------------------------------------
  RENDER.setup(canvas);
  TEMPORAL.init(STATE.stageW, STATE.stageH);
  TEMPORAL.seedBoundaries();
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
