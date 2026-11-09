/* =========================================================================
   CHRONO SWARM · CONFIG
   -------------------------------------------------------------------------
   Premise Remix: TEMPORALITY (04 · Ghost Chase) × EMERGENCE (07 · Boundary Lines)
   Every tunable constant lives in this single object for live code edits.
   Change any value → save → reload the page.
   Sections:  1 TEMPORALITY & GHOSTS   2 SWARM & EMERGENCE   3 BOUNDARY LINES
              4 THRESHOLD SIGNALS      5 AUDIO SYNTHESIS     6 MODERN PALETTE
   ========================================================================= */
const CONFIG = {

  // ---------- 1. TEMPORALITY · TIME GHOSTS & MEMORY DECAY ----------------
  temporal: {
    startMemory: 0.70,        // 0 = fleeting memory (1.5s), 1 = deep slow memory (12s)
    memoryStep: 0.10,         // how much [ and ] keys nudge memory persistence
    ghostCount: 3,            // number of delayed Time Ghosts (G1, G2, G3) chasing the cursor
    minGhostDelayMs: 260,     // delay per ghost at 0 % memory (0.26s, 0.52s, 0.78s)
    maxGhostDelayMs: 650,     // delay per ghost at 100 % memory (0.65s, 1.30s, 1.95s)
    minTrailMs: 1400,         // how long cursor echo trail stays alive at 0 % memory
    maxTrailMs: 8500,         // how long cursor echo trail stays alive at 100 % memory
    maxHistoryPoints: 900,    // ring buffer capacity for recorded pointer trajectory
    timeScales: [0.35, 1.0, 1.65], // Slow-Mo (0.35x), Real-Time (1.0x), Overdrive (1.65x)
    defaultTimeScaleIdx: 1,
  },

  // ---------- 2. EMERGENCE · REYNOLDS BOID STEERING RULES ----------------
  swarm: {
    count: 28,                // number of autonomous boid agents on stage
    startCohesion: 0.65,      // 0 = scattered/repelling, 1 = tight emergent flock
    cohesionStep: 0.10,       // how much Q and E keys change swarm cohesion
    perceptionRadius: 115,    // pixel radius within which a boid senses neighbors
    separationRadius: 36,     // minimum personal space before separation force kicks in
    minSpeed: 1.35,           // minimum boid speed (px per frame at 1.0x time scale)
    maxSpeed: 3.60,           // maximum boid speed
    maxForce: 0.095,          // steering agility limit
    // Steering rule weights (scaled dynamically in js/rules.js)
    baseSeparation: 1.65,
    baseAlignment: 1.10,
    baseCohesion: 1.25,
    ghostAttraction: 1.40,    // pull toward delayed Time Ghosts (Temporality → Emergence)
    vortexClusterCount: 5,    // how many synchronized neighbors trigger a Phase Vortex
    vortexRadius: 72,         // radius for detecting an emergent vortex cluster
  },

  // ---------- 3. HARMONIC BOUNDARY LINES (L1–L8) -------------------------
  boundaries: {
    maxLines: 8,              // L1 through L8 (oldest line is replaced if > 8)
    minLengthPx: 36,          // minimum drag length to create a custom line
    defaultLengthPx: 130,     // length of a boundary line placed with a single click
    hitCooldownMs: 140,       // per-boid bounce cooldown so a boid doesn't get stuck
    editCooldownMs: 0,        // rate-limit user line placement (set to 1000 for 1s limit)
  },

  // ---------- 4. EMERGENT LAYER THRESHOLDS (SELF-EXPLANATORY PILLS) ------
  // Set a threshold to 0 to keep always active, or 2 to disable completely.
  signals: {
    ghostTrails: 0.20,        // requires Memory Persistence >= 20%
    alignmentWeb: 0.35,       // requires Swarm Cohesion >= 35%
    boundaryChimes: 1,        // requires at least 1 active Boundary Line (L1–L8)
    phaseVortex: 5,           // requires >= 5 boids clustering near a Time Ghost
  },

  // ---------- 5. WEB AUDIO · POLYPHONIC GLASS SYNTH & DELAY --------------
  audio: {
    rootMidi: 57,             // A3 (220 Hz) modern ambient tonal center
    // Lush 8-note Dorian / Pentatonic scale across Boundary Lines L1 → L8
    scale: [0, 2, 3, 5, 7, 9, 10, 12],
    masterVolume: 0.22,
    minEchoSec: 0.14,         // stereo delay time at 0 % memory
    maxEchoSec: 0.46,         // stereo delay time at 100 % memory
    minEchoMix: 0.08,         // dry studio reflection at 0 % memory
    maxEchoMix: 0.44,         // spacious temporal cathedral echo at 100 % memory
    minEchoFeedback: 0.12,
    maxEchoFeedback: 0.52,
    vortexCooldownMs: 1600,   // minimum interval between emergent vortex chord swells
  },

  // ---------- 6. VISUALS · MODERN DARK GLASSMORPHISM PALETTE -------------
  visuals: {
    flashMs: 420,
    badgeMs: 1800,
    cursorStepPx: 34,         // arrow-key movement step size
    ghostColors: [
      '#38bdf8',              // G1: Sky Cyan (nearest echo)
      '#a855f7',              // G2: Electric Violet (mid echo)
      '#f43f5e',              // G3: Neon Rose (deepest echo)
    ],
    lineColors: [
      '#22d3ee',              // L1: Cyan
      '#38bdf8',              // L2: Azure
      '#818cf8',              // L3: Indigo
      '#a855f7',              // L4: Violet
      '#e879f9',              // L5: Fuchsia
      '#f43f5e',              // L6: Rose
      '#fb923c',              // L7: Coral Amber
      '#34d399',              // L8: Mint Emerald
    ],
  },
};
