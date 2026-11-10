/* =========================================================================
   CHRONO SWARM · STATE & TEMPORAL ENGINE (Collection 04 · Ghost Chase)
   -------------------------------------------------------------------------
   Manages the 8 Horizontal Musical Strings (S1–S8), records pointer motion,
   replays delayed Time Ghosts (G1, G2, G3...) that pluck strings after a
   delay, and manages user-placed Bounce Bumpers (B1–B6).
   ========================================================================= */
const STATE = {
  stageW: 900,
  stageH: 500,
  running: true,
  soundUnlocked: false,
  memory: CONFIG.temporal.startMemory,
  cohesion: CONFIG.swarm.startCohesion,
  timeScaleIdx: CONFIG.temporal.defaultTimeScaleIdx,
  timeScale: CONFIG.temporal.timeScales[CONFIG.temporal.defaultTimeScaleIdx],
  simTimeMs: 0,

  pointer: {
    x: 450,
    y: 250,
    prevY: 250,
    keyboardMode: false,
    lastInputAt: 0,
  },

  strings: [],
  history: [],
  ghosts: [],
  bumpers: [],
  lastEditAt: -Infinity,

  totalPlucks: 0,
  activeWebLinks: 0,
  maxGhostCluster: 0,
  vortexGhostIdx: -1,
  lastVortexAt: -Infinity,
};

const TEMPORAL = {
  onStateChange: null,
  onStringPluck: null,

  init(stageW, stageH) {
    STATE.stageW = stageW || 900;
    STATE.stageH = stageH || 500;
    STATE.pointer.x = STATE.stageW * 0.5;
    STATE.pointer.y = STATE.stageH * 0.5;
    STATE.pointer.prevY = STATE.pointer.y;
    STATE.history = [];
    STATE.ghosts = [];

    TEMPORAL.layoutStrings();
    TEMPORAL.syncGhostCount();
  },

  syncGhostCount() {
    const target = clamp(Math.round(CONFIG.temporal.ghostCount || 3), 1, 8);
    while (STATE.ghosts.length < target) {
      const i = STATE.ghosts.length;
      STATE.ghosts.push({
        index: i,
        label: `G${i + 1}`,
        x: STATE.pointer.x,
        y: STATE.pointer.y,
        prevY: STATE.pointer.y,
        delayMs: RULES.ghostDelayForIndex(i, STATE.memory),
        color: CONFIG.visuals.ghostColors[i % CONFIG.visuals.ghostColors.length],
        clusterCount: 0,
        lastPluckAt: -Infinity,
      });
    }
    if (STATE.ghosts.length > target) {
      STATE.ghosts.length = target;
    }
  },

  layoutStrings() {
    const count = CONFIG.strings.count;
    const topPad = 48;
    const botPad = 44;
    const usableH = Math.max(160, STATE.stageH - topPad - botPad);

    if (STATE.strings.length !== count) {
      STATE.strings = [];
      for (let i = 0; i < count; i++) {
        STATE.strings.push({
          index: i,
          y: topPad + (i / (count - 1)) * usableH,
          label: RULES.stringLabel(i),
          color: CONFIG.strings.colors[i % CONFIG.strings.colors.length],
          vib: 0,
          lastHitAt: -Infinity,
          lastHitX: STATE.stageW * 0.5,
        });
      }
    } else {
      for (let i = 0; i < count; i++) {
        STATE.strings[i].y = topPad + (i / (count - 1)) * usableH;
        STATE.strings[i].label = RULES.stringLabel(i);
      }
    }
  },

  seedBumpers() {
    STATE.bumpers = [];
    const w = STATE.stageW;
    const h = STATE.stageH;
    const defaults = [
      { x: w * 0.28, y: h * 0.34 },
      { x: w * 0.50, y: h * 0.56 },
      { x: w * 0.72, y: h * 0.34 },
    ];
    defaults.forEach((pt, i) => {
      STATE.bumpers.push({
        x: pt.x,
        y: pt.y,
        r: CONFIG.boundaries.bumperRadius,
        color: CONFIG.strings.colors[(i * 2) % CONFIG.strings.colors.length],
        lastHitAt: -Infinity,
      });
    });
  },

  toggleBumperAt(x, y) {
    const now = performance.now();
    const wait = CONFIG.boundaries.editCooldownMs - (now - STATE.lastEditAt);
    if (wait > 0) return { ok: false, waitMs: wait };
    STATE.lastEditAt = now;

    for (let i = 0; i < STATE.bumpers.length; i++) {
      const b = STATE.bumpers[i];
      if (Math.hypot(x - b.x, y - b.y) <= b.r + 10) {
        STATE.bumpers.splice(i, 1);
        return { ok: true, action: 'removed', index: i };
      }
    }

    if (STATE.bumpers.length >= CONFIG.boundaries.maxBumpers) {
      STATE.bumpers.shift();
    }
    const idx = STATE.bumpers.length;
    const bumper = {
      x: clamp(x, 60, STATE.stageW - 40),
      y: clamp(y, 40, STATE.stageH - 40),
      r: CONFIG.boundaries.bumperRadius,
      color: CONFIG.strings.colors[(idx * 2) % CONFIG.strings.colors.length],
      lastHitAt: now,
    };
    STATE.bumpers.push(bumper);
    return { ok: true, action: 'added', index: idx, bumper };
  },

  nearestStringIndex(y) {
    let bestIdx = 0;
    let bestDist = Infinity;
    STATE.strings.forEach((s, i) => {
      const d = Math.abs(y - s.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  },

  triggerString(stringIdx, hitX, sourceTag = 'ORB') {
    const s = STATE.strings[stringIdx];
    if (!s) return;
    s.vib = 1.0;
    s.lastHitAt = performance.now();
    s.lastHitX = hitX;
    STATE.totalPlucks++;
    if (TEMPORAL.onStringPluck) {
      TEMPORAL.onStringPluck(stringIdx, s, hitX, sourceTag);
    }
  },

  checkStringCrossing(prevY, currY, currX, sourceTag) {
    if (Math.abs(currY - prevY) < 1.5) return;
    const minY = Math.min(prevY, currY);
    const maxY = Math.max(prevY, currY);
    for (let i = 0; i < STATE.strings.length; i++) {
      const sy = STATE.strings[i].y;
      if (sy >= minY && sy <= maxY) {
        const now = performance.now();
        if (now - STATE.strings[i].lastHitAt > 90) {
          TEMPORAL.triggerString(i, currX, sourceTag);
        }
        break;
      }
    }
  },

  setPointer(x, y, keyboardMode = false) {
    const nx = clamp(x, 20, STATE.stageW - 20);
    const ny = clamp(y, 20, STATE.stageH - 20);
    const prevY = STATE.pointer.y;
    STATE.pointer.x = nx;
    STATE.pointer.y = ny;
    STATE.pointer.keyboardMode = keyboardMode;
    STATE.pointer.lastInputAt = performance.now();

    TEMPORAL.checkStringCrossing(prevY, ny, nx, 'YOU');
  },

  setMemory(val) {
    const prev = STATE.memory;
    STATE.memory = clamp(val, 0, 1);
    if (TEMPORAL.onStateChange) TEMPORAL.onStateChange('memory', prev);
  },

  setCohesion(val) {
    const prev = STATE.cohesion;
    STATE.cohesion = clamp(val, 0, 1);
    if (TEMPORAL.onStateChange) TEMPORAL.onStateChange('cohesion', prev);
  },

  cycleTimeScale(targetIdx = null) {
    const scales = CONFIG.temporal.timeScales;
    STATE.timeScaleIdx = targetIdx != null
      ? clamp(targetIdx, 0, scales.length - 1)
      : (STATE.timeScaleIdx + 1) % scales.length;
    STATE.timeScale = scales[STATE.timeScaleIdx];
    if (TEMPORAL.onStateChange) TEMPORAL.onStateChange('timeScale', STATE.timeScale);
  },

  step(dtMs) {
    const scaledDt = dtMs * STATE.timeScale;
    STATE.simTimeMs += scaledDt;

    for (let i = 0; i < STATE.strings.length; i++) {
      STATE.strings[i].vib *= 0.88;
    }

    STATE.history.push({
      t: STATE.simTimeMs,
      x: STATE.pointer.x,
      y: STATE.pointer.y,
    });

    const maxWindowMs = Math.max(
      RULES.trailLifetimeMs(STATE.memory),
      RULES.ghostDelayForIndex(STATE.ghosts.length, STATE.memory) + 600
    );
    while (
      STATE.history.length > 2 &&
      STATE.simTimeMs - STATE.history[0].t > maxWindowMs
    ) {
      STATE.history.shift();
    }

    const trailsOn = RULES.isGhostTrailsActive(STATE.memory);
    STATE.ghosts.forEach((g, idx) => {
      g.delayMs = RULES.ghostDelayForIndex(idx, STATE.memory);
      const sample = TEMPORAL.sampleHistoryAt(STATE.simTimeMs - g.delayMs);
      g.prevY = g.y;
      g.x = lerp(g.x, sample.x, 0.38);
      g.y = lerp(g.y, sample.y, 0.38);

      if (trailsOn) {
        TEMPORAL.checkStringCrossing(g.prevY, g.y, g.x, g.label);
      }
    });
  },

  sampleHistoryAt(targetTimeMs) {
    const h = STATE.history;
    if (!h.length) return { x: STATE.pointer.x, y: STATE.pointer.y };
    if (targetTimeMs <= h[0].t) return h[0];
    for (let i = h.length - 1; i >= 0; i--) {
      if (h[i].t <= targetTimeMs) return h[i];
    }
    return h[h.length - 1];
  },

  rescaleStage(newW, newH) {
    if (!newW || !newH) return;
    const sx = newW / (STATE.stageW || newW);
    const sy = newH / (STATE.stageH || newH);
    STATE.stageW = newW;
    STATE.stageH = newH;
    STATE.pointer.x = clamp(STATE.pointer.x * sx, 20, newW - 20);
    STATE.pointer.y = clamp(STATE.pointer.y * sy, 20, newH - 20);
    TEMPORAL.layoutStrings();
    STATE.history.forEach((pt) => {
      pt.x *= sx;
      pt.y *= sy;
    });
    STATE.ghosts.forEach((g) => {
      g.x *= sx;
      g.y *= sy;
    });
    STATE.bumpers.forEach((b) => {
      b.x *= sx;
      b.y *= sy;
    });
  },
};
