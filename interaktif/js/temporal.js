/* =========================================================================
   CHRONO SWARM · STATE & TEMPORAL ENGINE (Collection 04 · Ghost Chase)
   -------------------------------------------------------------------------
   Records participant trajectories across time, computes delayed Time Ghosts
   (G1, G2, G3), and manages Harmonic Boundary Lines (L1–L8).
   ========================================================================= */
const STATE = {
  stageW: 900,
  stageH: 520,
  running: true,
  memory: CONFIG.temporal.startMemory,
  cohesion: CONFIG.swarm.startCohesion,
  timeScaleIdx: CONFIG.temporal.defaultTimeScaleIdx,
  timeScale: CONFIG.temporal.timeScales[CONFIG.temporal.defaultTimeScaleIdx],
  simTimeMs: 0,

  // Live cursor / pointer state
  pointer: {
    x: 450,
    y: 260,
    vx: 0,
    vy: 0,
    active: false,
    keyboardMode: false,
    lastInputAt: 0,
  },

  // Dragging state for drawing custom Harmonic Boundary Lines
  drag: {
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
  },

  // Recorded temporal history & delayed Time Ghosts (G1, G2, G3)
  history: [],
  ghosts: [],

  // Harmonic Boundary Lines (L1–L8)
  boundaries: [],
  nextLineAngleIndex: 0,
  lastEditAt: -Infinity,

  // Emergent telemetry readouts
  totalChimes: 0,
  activeWebLinks: 0,
  maxGhostCluster: 0,
  vortexGhostIdx: -1,
  lastVortexAt: -Infinity,
};

const TEMPORAL = {
  onStateChange: null,

  init(stageW, stageH) {
    STATE.stageW = stageW || 900;
    STATE.stageH = stageH || 520;
    STATE.pointer.x = STATE.stageW * 0.5;
    STATE.pointer.y = STATE.stageH * 0.5;
    STATE.history = [];
    STATE.ghosts = [];

    for (let i = 0; i < CONFIG.temporal.ghostCount; i++) {
      STATE.ghosts.push({
        index: i,
        label: `G${i + 1}`,
        x: STATE.pointer.x,
        y: STATE.pointer.y,
        vx: 0,
        vy: 0,
        delayMs: RULES.ghostDelayForIndex(i, STATE.memory),
        color: CONFIG.visuals.ghostColors[i % CONFIG.visuals.ghostColors.length],
        clusterCount: 0,
      });
    }
  },

  // Seed 4 resonant Harmonic Boundary Lines (L1–L4) forming an open diamond chamber
  seedBoundaries() {
    STATE.boundaries = [];
    const w = STATE.stageW;
    const h = STATE.stageH;
    const presets = [
      { x1: w * 0.20, y1: h * 0.34, x2: w * 0.36, y2: h * 0.20 },
      { x1: w * 0.64, y1: h * 0.20, x2: w * 0.80, y2: h * 0.34 },
      { x1: w * 0.20, y1: h * 0.66, x2: w * 0.36, y2: h * 0.80 },
      { x1: w * 0.64, y1: h * 0.80, x2: w * 0.80, y2: h * 0.66 },
    ];
    presets.forEach((p) => {
      TEMPORAL.createBoundarySegment(p.x1, p.y1, p.x2, p.y2, true);
    });
  },

  createBoundarySegment(x1, y1, x2, y2, bypassCooldown = false) {
    const now = performance.now();
    const wait = CONFIG.boundaries.editCooldownMs - (now - STATE.lastEditAt);
    if (!bypassCooldown && wait > 0) {
      return { ok: false, waitMs: wait };
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 12) return { ok: false, waitMs: 0 };

    // Keep at most CONFIG.boundaries.maxLines (L1–L8)
    if (STATE.boundaries.length >= CONFIG.boundaries.maxLines) {
      STATE.boundaries.shift();
    }

    const idx = STATE.boundaries.length;
    const line = {
      x1,
      y1,
      x2,
      y2,
      length,
      createdAt: STATE.simTimeMs,
      lastHitAt: -Infinity,
      hitCount: 0,
      color: CONFIG.visuals.lineColors[idx % CONFIG.visuals.lineColors.length],
    };

    STATE.boundaries.push(line);
    // Re-index colors so L1..Ln always match their slot
    STATE.boundaries.forEach((b, i) => {
      b.color = CONFIG.visuals.lineColors[i % CONFIG.visuals.lineColors.length];
    });

    if (!bypassCooldown) STATE.lastEditAt = now;
    return { ok: true, index: STATE.boundaries.length - 1, line };
  },

  // Place a boundary line centered at (cx, cy) when clicking or pressing Space
  placeBoundaryAt(cx, cy) {
    const angles = [-0.65, 0.65, 0.0, 1.57, -0.35, 0.35, -1.1, 1.1];
    const angle = angles[STATE.nextLineAngleIndex % angles.length];
    STATE.nextLineAngleIndex++;
    const half = CONFIG.boundaries.defaultLengthPx * 0.5;
    const pad = 28;
    const x1 = clamp(cx - Math.cos(angle) * half, pad, STATE.stageW - pad);
    const y1 = clamp(cy - Math.sin(angle) * half, pad, STATE.stageH - pad);
    const x2 = clamp(cx + Math.cos(angle) * half, pad, STATE.stageW - pad);
    const y2 = clamp(cy + Math.sin(angle) * half, pad, STATE.stageH - pad);
    return TEMPORAL.createBoundarySegment(x1, y1, x2, y2);
  },

  clearBoundaries() {
    STATE.boundaries = [];
  },

  setPointer(x, y, keyboardMode = false) {
    const nx = clamp(x, 16, STATE.stageW - 16);
    const ny = clamp(y, 16, STATE.stageH - 16);
    STATE.pointer.vx = nx - STATE.pointer.x;
    STATE.pointer.vy = ny - STATE.pointer.y;
    STATE.pointer.x = nx;
    STATE.pointer.y = ny;
    STATE.pointer.active = true;
    STATE.pointer.keyboardMode = keyboardMode;
    STATE.pointer.lastInputAt = performance.now();
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

  // Step the temporal history buffer and update delayed Time Ghosts (G1, G2, G3)
  step(dtMs) {
    const scaledDt = dtMs * STATE.timeScale;
    STATE.simTimeMs += scaledDt;

    // Gentle orbital breathing when pointer has been idle > 2.8s so ghosts stay visible in motion
    const idleMs = performance.now() - STATE.pointer.lastInputAt;
    let recX = STATE.pointer.x;
    let recY = STATE.pointer.y;
    if (idleMs > 2800 && !STATE.pointer.keyboardMode) {
      const t = STATE.simTimeMs * 0.0014;
      recX = clamp(
        STATE.pointer.x + Math.cos(t * 1.7) * 68,
        40,
        STATE.stageW - 40
      );
      recY = clamp(
        STATE.pointer.y + Math.sin(t * 2.3) * 48,
        40,
        STATE.stageH - 40
      );
    }

    STATE.history.push({
      t: STATE.simTimeMs,
      x: recX,
      y: recY,
    });

    // Prune history older than max needed window
    const maxWindowMs = Math.max(
      RULES.trailLifetimeMs(STATE.memory),
      RULES.ghostDelayForIndex(CONFIG.temporal.ghostCount, STATE.memory) + 600
    );
    while (
      STATE.history.length > 2 &&
      STATE.simTimeMs - STATE.history[0].t > maxWindowMs
    ) {
      STATE.history.shift();
    }
    if (STATE.history.length > CONFIG.temporal.maxHistoryPoints) {
      STATE.history.splice(0, STATE.history.length - CONFIG.temporal.maxHistoryPoints);
    }

    // Update each Time Ghost (G1, G2, G3) by sampling history at (simTimeMs - delayMs)
    STATE.ghosts.forEach((g, idx) => {
      g.delayMs = RULES.ghostDelayForIndex(idx, STATE.memory);
      const targetTime = STATE.simTimeMs - g.delayMs;
      const sample = TEMPORAL.sampleHistoryAt(targetTime);
      const prevX = g.x;
      const prevY = g.y;
      g.x = lerp(g.x, sample.x, 0.35);
      g.y = lerp(g.y, sample.y, 0.35);
      g.vx = g.x - prevX;
      g.vy = g.y - prevY;
    });
  },

  sampleHistoryAt(targetTimeMs) {
    const h = STATE.history;
    if (!h.length) return { x: STATE.pointer.x, y: STATE.pointer.y };
    if (targetTimeMs <= h[0].t) return h[0];
    for (let i = h.length - 1; i >= 0; i--) {
      if (h[i].t <= targetTimeMs) {
        return h[i];
      }
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
    STATE.history.forEach((pt) => {
      pt.x *= sx;
      pt.y *= sy;
    });
    STATE.ghosts.forEach((g) => {
      g.x *= sx;
      g.y *= sy;
    });
    STATE.boundaries.forEach((b) => {
      b.x1 *= sx;
      b.y1 *= sy;
      b.x2 *= sx;
      b.y2 *= sy;
      b.length = Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
    });
  },
};
