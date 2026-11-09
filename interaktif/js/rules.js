/* =========================================================================
   CHRONO SWARM · RULES
   -------------------------------------------------------------------------
   Pure functions translating TEMPORALITY and EMERGENCE inputs into concrete
   system behaviors, steering weights, acoustic delay, and visual states.
     INPUTS                   ─────────────►  SYSTEM RULES OUT
     Memory Persistence (0–1)             →   Ghost Delay (ms), Trail Decay, Audio Echo
     Swarm Cohesion (0–1)                 →   Separation / Alignment / Cohesion Weights
     Boundary Line Index (L1–L8) + Length →   Musical Pitch (Hz) & Harmonic Register
     Local Boid Density around Ghosts     →   Emergent Phase Vortex Chord Swell
   ========================================================================= */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

const RULES = {

  // ---- 1. TEMPORALITY RULES (Hallnäs & Redström, 2001) ------------------
  // Higher memory stretches the delay between Time Ghosts (G1, G2, G3)
  // and keeps past trajectory trails alive longer on the stage.
  ghostStepDelayMs(memory) {
    const t = CONFIG.temporal;
    return Math.round(lerp(t.minGhostDelayMs, t.maxGhostDelayMs, clamp(memory, 0, 1)));
  },
  ghostDelayForIndex(ghostIdx, memory) {
    return (ghostIdx + 1) * RULES.ghostStepDelayMs(memory);
  },
  trailLifetimeMs(memory) {
    const t = CONFIG.temporal;
    return Math.round(lerp(t.minTrailMs, t.maxTrailMs, clamp(memory, 0, 1)));
  },

  // ---- 2. TEMPORALITY → ACOUSTIC ECHO RULES -----------------------------
  echoDelaySec(memory) {
    const a = CONFIG.audio;
    return lerp(a.minEchoSec, a.maxEchoSec, clamp(memory, 0, 1));
  },
  echoMix(memory) {
    const a = CONFIG.audio;
    return lerp(a.minEchoMix, a.maxEchoMix, clamp(memory, 0, 1));
  },
  echoFeedback(memory) {
    const a = CONFIG.audio;
    return lerp(a.minEchoFeedback, a.maxEchoFeedback, clamp(memory, 0, 1));
  },

  // ---- 3. EMERGENCE · REYNOLDS STEERING WEIGHTS (Reynolds, 1987) --------
  // As Swarm Cohesion increases from 0% to 100%, boids shift from scattered
  // individual trajectories (high separation) to synchronized flocks.
  separationWeight(cohesion) {
    const c = clamp(cohesion, 0, 1);
    return CONFIG.swarm.baseSeparation * lerp(1.55, 0.72, c);
  },
  alignmentWeight(cohesion) {
    const c = clamp(cohesion, 0, 1);
    return CONFIG.swarm.baseAlignment * lerp(0.25, 1.45, c);
  },
  cohesionWeight(cohesion) {
    const c = clamp(cohesion, 0, 1);
    return CONFIG.swarm.baseCohesion * lerp(0.15, 1.55, c);
  },
  ghostPullWeight(memory, cohesion) {
    // Deeper memory + higher cohesion strengthens the pull of delayed Time Ghosts
    return CONFIG.swarm.ghostAttraction * lerp(0.55, 1.35, (memory + cohesion) * 0.5);
  },

  // ---- 4. EMERGENT SOUND MAPPING (Juul, 2002) ---------------------------
  // Each Boundary Line (L1–L8) has a distinct scale degree, and shorter lines
  // sound higher in pitch while longer lines sound deeper and more resonant.
  lineLabel(index) {
    return `L${index + 1}`;
  },
  midiForBoundary(lineIndex, lengthPx = 130) {
    const scale = CONFIG.audio.scale;
    const degree = scale[lineIndex % scale.length];
    // Shorter line (<90px) shifts +12 semitones; very long line (>220px) shifts -5 semitones
    const lengthRatio = clamp((lengthPx - 50) / 240, 0, 1);
    const registerShift = lengthRatio < 0.28 ? 7 : lengthRatio > 0.72 ? -5 : 0;
    return CONFIG.audio.rootMidi + degree + registerShift;
  },
  frequencyForBoundary(lineIndex, lengthPx = 130, speedRatio = 0.5) {
    const midi = RULES.midiForBoundary(lineIndex, lengthPx);
    const baseHz = 440 * Math.pow(2, (midi - 69) / 12);
    // Faster boid impacts slightly brighten pitch
    const velocityBend = lerp(0.98, 1.03, clamp(speedRatio, 0, 1));
    return baseHz * velocityBend;
  },
  frequencyForGhostPulse(ghostIdx) {
    // G1, G2, G3 form a warm ambient triad (root, fifth, octave+third)
    const intervals = [0, 7, 15];
    const midi = CONFIG.audio.rootMidi + (intervals[ghostIdx % intervals.length] || 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  // ---- 5. LAYER VISIBILITY / EMERGENCE THRESHOLDS -----------------------
  isGhostTrailsActive(memory) {
    if (CONFIG.signals.ghostTrails > 1) return false;
    return memory >= CONFIG.signals.ghostTrails;
  },
  isAlignmentWebActive(cohesion) {
    if (CONFIG.signals.alignmentWeb > 1) return false;
    return cohesion >= CONFIG.signals.alignmentWeb;
  },
  isBoundaryChimesActive(lineCount) {
    if (CONFIG.signals.boundaryChimes > 99) return false;
    return lineCount >= CONFIG.signals.boundaryChimes;
  },
  isVortexActive(maxClusterCount) {
    return maxClusterCount >= CONFIG.signals.phaseVortex;
  },
};
