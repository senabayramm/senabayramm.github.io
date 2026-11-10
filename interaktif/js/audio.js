/* =========================================================================
   CHRONO SWARM · LOUD & CLEAR WEB AUDIO HARP SYNTHESIZER
   -------------------------------------------------------------------------
   - Every String (S1–S8) plays a loud, warm pentatonic harp/marimba note.
   - Memory Persistence controls the stereo acoustic echo delay & wet mix.
   - Unlocking sound plays an instant welcoming chord so you hear it right away!
   ========================================================================= */
const AUDIO = {
  ctx: null,
  master: null,
  compressor: null,
  dryGain: null,
  wetGain: null,
  delayNode: null,
  feedbackGain: null,
  filterNode: null,
  muted: false,
  lastPluckAt: 0,

  init() {
    if (!AUDIO.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      const ctx = new AudioCtx();
      AUDIO.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.15;

      const master = ctx.createGain();
      master.gain.value = CONFIG.audio.masterVolume;

      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const delayNode = ctx.createDelay(1.2);
      const feedbackGain = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 2400;

      dryGain.connect(compressor);
      delayNode.connect(filterNode);
      filterNode.connect(wetGain);
      filterNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      wetGain.connect(compressor);
      compressor.connect(master);
      master.connect(ctx.destination);

      AUDIO.compressor = compressor;
      AUDIO.master = master;
      AUDIO.dryGain = dryGain;
      AUDIO.wetGain = wetGain;
      AUDIO.delayNode = delayNode;
      AUDIO.feedbackGain = feedbackGain;
      AUDIO.filterNode = filterNode;

      AUDIO.updateTemporalEcho();
    }

    if (AUDIO.ctx.state === 'suspended') {
      AUDIO.ctx.resume();
    }

    if (!STATE.soundUnlocked && AUDIO.ctx) {
      STATE.soundUnlocked = true;
      AUDIO.playWelcomeChord();
      return true;
    }
    return false;
  },

  updateTemporalEcho() {
    if (!AUDIO.ctx) return;
    const now = AUDIO.ctx.currentTime;
    const delaySec = RULES.echoDelaySec(STATE.memory);
    const mix = RULES.echoMix(STATE.memory);
    const fb = RULES.echoFeedback(STATE.memory);

    AUDIO.delayNode.delayTime.setTargetAtTime(delaySec, now, 0.03);
    AUDIO.wetGain.gain.setTargetAtTime(mix, now, 0.03);
    AUDIO.dryGain.gain.setTargetAtTime(0.95, now, 0.03);
    AUDIO.feedbackGain.gain.setTargetAtTime(fb, now, 0.03);
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

  // Plays an instant 3-note harp chime when sound turns on
  playWelcomeChord() {
    if (AUDIO.muted || !AUDIO.ctx) return;
    [5, 3, 0].forEach((sIdx, i) => {
      setTimeout(() => {
        AUDIO.playStringPluck(sIdx, 0.5, 'YOU', true);
      }, i * 95);
    });
  },

  // Pluck one of the 8 Musical Strings (S1–S8)
  playStringPluck(stringIdx, xRatio = 0.5, sourceTag = 'ORB', force = false) {
    if (AUDIO.muted || !AUDIO.ctx || !STATE.soundUnlocked) return;

    const nowMs = performance.now();
    if (!force && nowMs - AUDIO.lastPluckAt < 55) return;
    AUDIO.lastPluckAt = nowMs;

    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    const freq = RULES.frequencyForString(stringIdx, xRatio);
    const isDirect = sourceTag === 'YOU' || sourceTag.startsWith('BUMPER');
    const peakGain = isDirect ? 0.48 : 0.34;
    const decay = lerp(0.32, 0.68, STATE.memory);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22 * STATE.cohesion, now);

    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
    voiceGain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc1.connect(voiceGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(voiceGain);

    voiceGain.connect(AUDIO.dryGain);
    voiceGain.connect(AUDIO.delayNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decay + 0.04);
    osc2.stop(now + decay + 0.04);
  },

  // Play a warm emergent chord swell when >= 4 orbs cluster around a Time Ghost
  playVortexChord(ghostIdx = 0) {
    if (AUDIO.muted || !AUDIO.ctx || !STATE.soundUnlocked) return;
    const ctx = AUDIO.ctx;
    const now = ctx.currentTime;
    const rootHz = RULES.frequencyForGhostChord(ghostIdx);
    const fifthHz = rootHz * 1.498;
    const dur = 0.9;

    [rootHz, fifthHz].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(hz, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.24 : 0.16, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(AUDIO.dryGain);
      gain.connect(AUDIO.delayNode);

      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  },
};
