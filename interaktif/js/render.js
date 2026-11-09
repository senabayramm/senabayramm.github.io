/* =========================================================================
   CHRONO SWARM · HIGH-DPI GLASSMORPHIC CANVAS RENDERER
   -------------------------------------------------------------------------
   Draws:
   1. 8 Horizontal Vibrating Musical Strings (S1–S8) with note labels
   2. User-placed Round Bounce Bumpers (B1–B6)
   3. 10 Bouncing Sound Orbs + Alignment Web threads
   4. Your Live Cursor ("YOU") + 3 Delayed Time Ghosts (G1, G2, G3)
   5. One-click "TURN ON SOUND" prompt if browser audio is locked
   ========================================================================= */
const RENDER = {
  canvas: null,
  ctx: null,
  dpr: 1,
  ripples: [],
  flashes: [],
  badge: null,

  setup(canvas) {
    RENDER.canvas = canvas;
    RENDER.ctx = canvas.getContext('2d');
    RENDER.resize();
  },

  resize() {
    if (!RENDER.canvas) return;
    const rect = RENDER.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(260, Math.round(rect.height));
    RENDER.dpr = Math.min(window.devicePixelRatio || 1, 2);
    RENDER.canvas.width = w * RENDER.dpr;
    RENDER.canvas.height = h * RENDER.dpr;
    TEMPORAL.rescaleStage(w, h);
  },

  addRipple(x, y, color = '#38bdf8', maxR = 64) {
    RENDER.ripples.push({ x, y, r: 8, maxR, alpha: 0.95, color });
    if (RENDER.ripples.length > 40) RENDER.ripples.shift();
  },

  addFlash(x, y, text, color = '#38bdf8') {
    RENDER.flashes.push({ x, y, text, color, born: performance.now() });
  },

  showBadge(lines) {
    RENDER.badge = {
      lines: Array.isArray(lines) ? lines : [lines],
      born: performance.now(),
    };
  },

  drawBackground(ctx, w, h) {
    const grad = ctx.createRadialGradient(
      STATE.pointer.x,
      STATE.pointer.y,
      20,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.85
    );
    grad.addColorStop(0, 'rgba(30, 41, 82, 0.55)');
    grad.addColorStop(0.55, 'rgba(11, 15, 32, 0.94)');
    grad.addColorStop(1, 'rgba(6, 9, 20, 0.99)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },

  // 1. Draw the 8 Horizontal Vibrating Musical Strings (S1–S8)
  drawStrings(ctx, w) {
    const now = performance.now();
    const phase = now * 0.045;

    STATE.strings.forEach((s, i) => {
      const hz = Math.round(RULES.frequencyForString(i, 0.5));
      const vibAmp = s.vib * 11;
      const isLit = s.vib > 0.08;

      ctx.save();
      ctx.strokeStyle = isLit ? '#ffffff' : `${s.color}88`;
      ctx.lineWidth = isLit ? 3.2 : 1.8;
      if (isLit) {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 16;
      }

      // Draw vibrating string curve from left to right
      ctx.beginPath();
      const leftX = 132;
      const rightX = w - 20;
      ctx.moveTo(leftX, s.y);
      if (vibAmp > 0.3) {
        const segments = 24;
        for (let step = 1; step <= segments; step++) {
          const t = step / segments;
          const px = lerp(leftX, rightX, t);
          const env = Math.sin(t * Math.PI);
          const py = s.y + Math.sin(t * Math.PI * 3 + phase) * vibAmp * env;
          ctx.lineTo(px, py);
        }
      } else {
        ctx.lineTo(rightX, s.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Left-side String Note Label Pill (e.g., "S1 · A4 (440Hz)")
      const pillW = 114;
      const pillH = 22;
      const px = 10;
      const py = s.y - pillH * 0.5;
      ctx.fillStyle = isLit ? s.color : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = isLit ? 2 : 1.2;
      ctx.beginPath();
      ctx.roundRect(px, py, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 10.5px "Inter", system-ui, sans-serif';
      ctx.fillStyle = isLit ? '#050711' : '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(`${s.label.split(' ')[0]} · ${hz}Hz`, px + 8, s.y + 4);
      ctx.restore();
    });
  },

  // 2. Draw User-Placed Round Bounce Bumpers (B1–B6)
  drawBumpers(ctx) {
    const now = performance.now();
    STATE.bumpers.forEach((b, i) => {
      const glow = clamp(1 - (now - b.lastHitAt) / 380, 0, 1);
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10 + glow * 18;
      ctx.fillStyle = glow > 0.2 ? `${b.color}66` : 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = glow > 0.2 ? '#ffffff' : b.color;
      ctx.lineWidth = 2.4 + glow * 2;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.font = '700 11px "Inter", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`B${i + 1}`, b.x, b.y + 4);
      ctx.restore();
    });
  },

  // 3. Draw Swarm Alignment Web
  drawAlignmentWeb(ctx) {
    if (!RULES.isAlignmentWebActive(STATE.cohesion)) return;
    const links = SWARM.links;
    if (!links.length) return;

    ctx.save();
    ctx.lineWidth = 1.3;
    for (let i = 0; i < links.length; i++) {
      const ln = links[i];
      const a = ln.alpha * lerp(0.18, 0.55, STATE.cohesion);
      ctx.strokeStyle = `rgba(168, 85, 247, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(ln.x1, ln.y1);
      ctx.lineTo(ln.x2, ln.y2);
      ctx.stroke();
    }
    ctx.restore();
  },

  // 4. Draw Delayed Time Ghosts (G1, G2, G3) & Live Cursor
  drawTemporalGhosts(ctx) {
    const trailsOn = RULES.isGhostTrailsActive(STATE.memory);
    const h = STATE.history;

    if (trailsOn && h.length > 2) {
      const lifeMs = RULES.trailLifetimeMs(STATE.memory);
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 1; i < h.length; i += 2) {
        const pt0 = h[i - 1];
        const pt1 = h[i];
        const age = STATE.simTimeMs - pt1.t;
        if (age > lifeMs) continue;
        const alpha = Math.pow(clamp(1 - age / lifeMs, 0, 1), 1.4) * 0.48;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = lerp(1.2, 3.8, 1 - age / lifeMs);
        ctx.beginPath();
        ctx.moveTo(pt0.x, pt0.y);
        ctx.lineTo(pt1.x, pt1.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    STATE.ghosts.forEach((g, idx) => {
      const isVortex =
        RULES.isVortexActive(g.clusterCount) && STATE.vortexGhostIdx === idx;

      ctx.save();
      if (trailsOn) {
        const prev = idx === 0 ? STATE.pointer : STATE.ghosts[idx - 1];
        ctx.strokeStyle = `${g.color}66`;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(g.x, g.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (isVortex) {
        const vRad = CONFIG.swarm.vortexRadius;
        ctx.fillStyle = `${g.color}28`;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(g.x, g.y, vRad * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      const radius = trailsOn ? 15 + idx * 3 : 8;
      ctx.strokeStyle = trailsOn ? g.color : `${g.color}55`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(g.x, g.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (trailsOn) {
        const sec = (g.delayMs / 1000).toFixed(2);
        ctx.font = '700 11px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Ghost ${g.label} (−${sec}s)`, g.x + radius + 6, g.y + 4);
      }
      ctx.restore();
    });

    // Live Pointer ("YOU")
    const p = STATE.pointer;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 11px "Inter", system-ui, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('YOU (Now)', p.x + 15, p.y - 4);
    ctx.restore();
  },

  // 5. Draw the 10 Bouncing Sound Orbs
  drawOrbs(ctx) {
    const boids = SWARM.boids;
    ctx.save();
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];

      if (b.trail.length > 1) {
        ctx.strokeStyle = `${b.color}55`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.stroke();
      }

      const r = 7 + b.energy * 4;
      ctx.fillStyle = b.energy > 0.25 ? '#ffffff' : b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10 + b.energy * 14;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  },

  drawRipplesAndFlashes(ctx) {
    for (let i = RENDER.ripples.length - 1; i >= 0; i--) {
      const rp = RENDER.ripples[i];
      rp.r += 2.6;
      rp.alpha -= 0.032;
      if (rp.alpha <= 0 || rp.r >= rp.maxR) {
        RENDER.ripples.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = rp.color;
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const now = performance.now();
    for (let i = RENDER.flashes.length - 1; i >= 0; i--) {
      const fl = RENDER.flashes[i];
      const age = now - fl.born;
      if (age > CONFIG.visuals.flashMs) {
        RENDER.flashes.splice(i, 1);
        continue;
      }
      const t = age / CONFIG.visuals.flashMs;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.font = '700 12px "Inter", system-ui, sans-serif';
      ctx.fillStyle = fl.color;
      ctx.textAlign = 'center';
      ctx.fillText(fl.text, fl.x, fl.y - 12 - t * 20);
      ctx.restore();
    }
  },

  drawHUD(ctx, w, h) {
    // Big friendly banner if sound hasn't been unlocked by a click yet
    if (!STATE.soundUnlocked) {
      ctx.save();
      const bw = Math.min(500, w - 32);
      const bh = 44;
      const bx = (w - bw) * 0.5;
      const by = 12;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.92)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 12);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#050711';
      ctx.font = '700 13px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '🔊 CLICK ANYWHERE OR PRESS [SPACE] TO TURN ON SOUND!',
        w * 0.5,
        by + 27
      );
      ctx.restore();
    } else if (!RULES.isGhostTrailsActive(STATE.memory)) {
      ctx.save();
      const bw = Math.min(460, w - 32);
      const bx = (w - bw) * 0.5;
      const by = 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 28, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.font = '600 11.5px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '⏳ MEMORY < 20%: Ghost Echo Trails Hidden — Increase Memory Slider to Restore',
        w * 0.5,
        by + 18
      );
      ctx.restore();
    }

    if (RENDER.badge) {
      const age = performance.now() - RENDER.badge.born;
      if (age > CONFIG.visuals.badgeMs) {
        RENDER.badge = null;
      } else {
        const alpha = age > CONFIG.visuals.badgeMs - 350
          ? (CONFIG.visuals.badgeMs - age) / 350
          : 1;
        ctx.save();
        ctx.globalAlpha = clamp(alpha, 0, 1);
        const lines = RENDER.badge.lines;
        const boxW = Math.min(420, w - 28);
        const boxH = lines.length * 18 + 16;
        const bx = w - boxW - 14;
        const by = h - boxH - 14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11.5px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'left';
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx + 12, by + 20 + idx * 18);
        });
        ctx.restore();
      }
    }
  },

  drawFrame() {
    if (!RENDER.ctx) return;
    const ctx = RENDER.ctx;
    const w = STATE.stageW;
    const h = STATE.stageH;

    ctx.save();
    ctx.scale(RENDER.dpr, RENDER.dpr);

    RENDER.drawBackground(ctx, w, h);
    RENDER.drawStrings(ctx, w);
    RENDER.drawAlignmentWeb(ctx);
    RENDER.drawTemporalGhosts(ctx);
    RENDER.drawBumpers(ctx);
    RENDER.drawOrbs(ctx);
    RENDER.drawRipplesAndFlashes(ctx);
    RENDER.drawHUD(ctx, w, h);

    ctx.restore();
  },
};
