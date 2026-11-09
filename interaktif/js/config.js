/* =========================================================================
   CHRONO SWARM · CONFIG (Crystal-Clear 8-String & Bouncing Swarm Edition)
   -------------------------------------------------------------------------
   Premise Remix: TEMPORALITY (04 · Ghost Chase) × EMERGENCE (07 · Boundary Lines)
   Every tunable constant lives in this single object for live code edits.
   Change any value → save → reload the page.
   ========================================================================= */
const CONFIG = {

  // ---------- 1. THE 8 HARMONIC STRINGS (S1–S8 BOUNDARY LINES) -----------
  strings: {
    count: 8,
    labels: [
      'S1 · A4 (High)',
      'S2 · G4',
      'S3 · E4',
      'S4 · D4',
      'S5 · C4',
      'S6 · A3',
      'S7 · G3',
      'S8 · E3 (Bass)',
    ],
    // Pentatonic frequencies (Hz) from top string (S1) to bottom string (S8)
    // Guarantees every combination of string hits sounds musical and harmonious!
    midiNotes: [69, 67, 64, 62, 60, 57, 55, 52],
    colors: [
      '#38bdf8', // S1: Sky Cyan
      '#60a5fa', // S2: Blue
      '#818cf8', // S3: Indigo
      '#a855f7', // S4: Violet
      '#e879f9', // S5: Fuchsia
      '#f43f5e', // S6: Rose
      '#fb923c', // S7: Amber
      '#34d399', // S8: Emerald
    ],
  },

  // ---------- 2. TEMPORALITY · TIME GHOSTS & MEMORY (04 · Ghost Chase) ---
  temporal: {
    startMemory: 0.75,        // 0 = short memory, 1 = long memory & deep echo
    memoryStep: 0.10,         // [ and ] keys change memory by 10%
    ghostCount: 3,            // 3 delayed Time Ghosts (G1, G2, G3) following your cursor
    minGhostDelayMs: 280,     // delay per ghost at 0% memory
    maxGhostDelayMs: 650,     // delay per ghost at 100% memory
    minTrailMs: 1200,         // cursor trail duration at 0% memory
    maxTrailMs: 7000,         // cursor trail duration at 100% memory
    maxHistoryPoints: 600,
    timeScales: [0.5, 1.0, 1.6], // Slow (0.5x), Normal (1.0x), Fast (1.6x)
    defaultTimeScaleIdx: 1,
  },

  // ---------- 3. EMERGENCE · BOUNCING SWARM ORBS (07 · Boundary Lines) ---
  swarm: {
    count: 10,                // 10 clear, visible bouncing sound orbs
    startCohesion: 0.65,      // 0 = orbs scatter apart, 1 = orbs group & chase ghosts
    cohesionStep: 0.10,       // Q and E keys change grouping by 10%
    perceptionRadius: 140,
    separationRadius: 42,
    minSpeed: 2.2,
    maxSpeed: 4.4,
    maxForce: 0.12,
    baseSeparation: 1.5,
    baseAlignment: 1.1,
    baseCohesion: 1.2,
    ghostAttraction: 1.45,    // how strongly orbs are pulled toward your Time Ghosts
    vortexClusterCount: 4,    // >= 4 orbs near a Ghost triggers a Vortex Chord
    vortexRadius: 85,
  },

  // ---------- 4. USER-PLACED BOUNCE BUMPERS (B1–B6) ----------------------
  boundaries: {
    maxBumpers: 6,            // user can click on the stage to place up to 6 round bumpers
    bumperRadius: 24,         // radius in px of each user-placed bounce bumper
    hitCooldownMs: 160,       // prevents an orb from getting stuck on a string/bumper
    editCooldownMs: 0,        // rate-limit user edits (set to 1000 for 1s cooldown)
  },

  // ---------- 5. 4 SELF-EXPLANATORY LAYER THRESHOLDS ---------------------
  signals: {
    ghostTrails: 0.20,        // Ghost Echo Trails visible when Memory >= 20%
    alignmentWeb: 0.35,       // Swarm Connection Lines visible when Cohesion >= 35%
    stringGlow: 1,            // Strings S1–S8 always active (set to 2 to hide)
    phaseVortex: 4,           // Chord triggers when >= 4 orbs cluster around a Ghost
  },

  // ---------- 6. WEB AUDIO · LOUD, CLEAR HARP SYNTH & ECHO ---------------
  audio: {
    masterVolume: 0.65,       // loud, clear output for laptop speakers
    minEchoSec: 0.14,
    maxEchoSec: 0.42,
    minEchoMix: 0.08,
    maxEchoMix: 0.48,
    minEchoFeedback: 0.12,
    maxEchoFeedback: 0.50,
    vortexCooldownMs: 1800,
  },

  // ---------- 7. VISUALS -------------------------------------------------
  visuals: {
    flashMs: 550,
    badgeMs: 1800,
    cursorStepPx: 38,
    ghostColors: ['#38bdf8', '#a855f7', '#f43f5e'],
  },
};
