/* =========================================================================
   CHRONO SWARM · WEB AUDIO SYNTHESIS ENGINE
   -------------------------------------------------------------------------
   Polyphonic glass chime synthesizer + Temporal Echo Delay network.
   - Boundary Line collisions (L1–L8) trigger tuned Dorian/Pentatonic plucks.
   - Emergent Phase Vortex clusters (>=5 boids near a Ghost) swell a warm pad.
   - Memory Persistence controls acoustic echo delay time and wet mix.
   ========================================================================= */
const AUDIO = {
  ctx: null,
  master: null,
  dryGain: null,
  wetGain: null,
  delayNode: null,
  feedbackGain: null,
  filterNode: null,
  muted: false,
  lastChimeAt: 0,

  init() {
    if (AUDIO.ctx) {
      if (AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    AUDIO.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = CONFIG.audio.masterVolume;

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const delayNode = ctx.createDelay(1.2);
    const feedbackGain = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 2200;
    filterNode.Q.value = 0.7;

    // Signal routing: voice → dryGain → master → destination
    //                 voice → delayNode → filterNode → wetGain → master
    //                                   └→ feedbackGain → delayNode
    dryGain.connect(master);
    delayNode.connect(filterNode);
    filterNode.connect(wetGain);
    filterNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    wetGain.connect(master);
    master.connect(ctx.destination);

    AUDIO.master = master;
    AUDIO.dryGain = dryGain;
    AUDIO.wetGain = wetGain;
    AUDIO.delayNode = delayNode;
    AUDIO.feedbackGain = feedbackGain;
    AUDIO.filterNode = filterNode;

    AUDIO.updateTemporalEcho();
  },

  updateTemporalEcho() {
    if (!AUDIO.ctx) return;
    const now = AUDIO.ctx.currentTime;
    const delaySec = RULES.echoDelaySec(STATE.memory);
    const mix = RULES.echoMix(STATE.memory);
    const fb = RULES.echoFeedback(STATE.memory);

    AUDIO.delayNode.delayTime.setTargetAtTime(delaySec, now, 0.04);
    AUDIO.wetGain.gain.setTargetAtTime(mix, now, 0.04);
    AUDIO.dryGain.gain.setTargetAtTime(1 - mix * 0.35, now, 0.04);
    AUDIO.feedbackGain.gain.setTargetAtTime(fb, now, 0.04);
  },

  setMuted(mute) {
    AUDIO.muted = Boolean(mute);
    if (AUDIO.master && AUDIO.ctx) {
      AUDIO.master.gain.setTargetAtTime(
        AUDIO.muted ? 0 : CONFIG.audio.masterVolume,
        AUDIO.ctx.currentTime,
        0.02
      );
    }
  },

  // Play a resonant glass pluck when a boid reflects off Boundary Line L1–L8
  playBoundaryChime(lineIdx, lengthPx = 130, speedRatio = 0.5) {
    if (AUDIO.muted || !RULES.isBoundaryChimesActive(STATE.boundaries.length)) return;
    if (!AUDIO.ctx) return;

    const nowMs = performance.now();
    // Prevent audio clipping when many boids hit simultaneously
    if (nowMs - AUDIO.lastChimeAt < 42) return;
    AUDIO.lastChimeAt = nowMs;

    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    const freq = RULES.frequencyForBoundary(lineIdx, lengthPx, speedRatio);
    const decay = lerp(0.24, 0.55, STATE.memory);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    // Cohesion shapes harmonic timbre: pure sine at low cohesion, warm triangle+octave at high cohesion
    osc1.type = STATE.cohesion >= 0.5 ? 'triangle' : 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now); // crystalline octave harmonic

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.18 * STATE.cohesion, now);

    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(0.28, now + 0.012);
    voiceGain.gain.exponentialRampToValueAtTime(0.0008, now + decay);

    osc1.connect(voiceGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(voiceGain);

    voiceGain.connect(AUDIO.dryGain);
    voiceGain.connect(AUDIO.delayNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decay + 0.03);
    osc2.stop(now + decay + 0.03);
  },

  // Play a warm emergent chord swell when >= 5 boids form a Phase Vortex around a Ghost
  playVortexChord(ghostIdx = 0) {
    if (AUDIO.muted || !AUDIO.ctx) return;
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    const rootHz = RULES.frequencyForGhostPulse(ghostIdx);
    const fifthHz = rootHz * 1.498; // just fifth
    const dur = 0.85;

    [rootHz, fifthHz].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(hz, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.14 : 0.09, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

      osc.connect(gain);
      gain.connect(AUDIO.dryGain);
      gain.connect(AUDIO.delayNode);

      osc.start(now);
      osc.stop(now + dur + 0.04);
    });
  },
};
