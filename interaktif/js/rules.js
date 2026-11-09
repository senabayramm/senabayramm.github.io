/* =========================================================================
   CHRONO SWARM · RULES
   -------------------------------------------------------------------------
   Pure functions translating TEMPORALITY (Memory) and EMERGENCE (Cohesion)
   into string frequencies, ghost delays, echo levels, and swarm forces.
   ========================================================================= */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

const RULES = {

  // ---- 1. TEMPORALITY RULES (Hallnäs & Redström, 2001) ------------------
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
  separationWeight(cohesion) {
    const c = clamp(cohesion, 0, 1);
    return CONFIG.swarm.baseSeparation * lerp(1.55, 0.70, c);
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
    return CONFIG.swarm.ghostAttraction * lerp(0.60, 1.40, (memory + cohesion) * 0.5);
  },

  // ---- 4. MUSICAL STRING PITCH RULES (Juul, 2002) -----------------------
  stringLabel(index) {
    return CONFIG.strings.labels[index] || `S${index + 1}`;
  },
  midiForString(stringIdx) {
    const notes = CONFIG.strings.midiNotes;
    return notes[clamp(stringIdx, 0, notes.length - 1)];
  },
  frequencyForString(stringIdx, xRatio = 0.5) {
    const midi = RULES.midiForString(stringIdx);
    const baseHz = 440 * Math.pow(2, (midi - 69) / 12);
    // Plucking further right on a string adds a subtle harmonic shimmer
    return baseHz * lerp(0.99, 1.02, clamp(xRatio, 0, 1));
  },
  frequencyForGhostChord(ghostIdx) {
    const chordMidis = [57, 64, 69]; // A3, E4, A4
    const midi = chordMidis[ghostIdx % chordMidis.length];
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  // ---- 5. LAYER VISIBILITY THRESHOLDS -----------------------------------
  isGhostTrailsActive(memory) {
    if (CONFIG.signals.ghostTrails > 1) return false;
    return memory >= CONFIG.signals.ghostTrails;
  },
  isAlignmentWebActive(cohesion) {
    if (CONFIG.signals.alignmentWeb > 1) return false;
    return cohesion >= CONFIG.signals.alignmentWeb;
  },
  isBumperLayerActive(bumperCount) {
    return bumperCount >= 1;
  },
  isVortexActive(maxClusterCount) {
    return maxClusterCount >= CONFIG.signals.phaseVortex;
  },
};
