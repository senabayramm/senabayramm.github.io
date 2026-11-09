/* =========================================================================
   CHRONO SWARM · HIGH-DPI GLASSMORPHIC CANVAS RENDERER
   -------------------------------------------------------------------------
   Renders the deep-space harmonic field, delayed Time Ghosts (G1–G3),
   decaying trajectory ribbons, Harmonic Boundary Lines (L1–L8), neural
   flock alignment webs, directional boid agents, and collision shockwaves.
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

  addRipple(x, y, color = '#38bdf8', maxR = 68) {
    RENDER.ripples.push({
      x,
      y,
      r: 6,
      maxR,
      alpha: 0.92,
      color,
    });
    if (RENDER.ripples.length > 40) RENDER.ripples.shift();
  },

  addFlash(x, y, text, color = '#38bdf8') {
    RENDER.flashes.push({
      x,
      y,
      text,
      color,
      born: performance.now(),
    });
  },

  showBadge(lines) {
    RENDER.badge = {
      lines: Array.isArray(lines) ? lines : [lines],
      born: performance.now(),
    };
  },

  drawBackground(ctx, w, h) {
    // Deep space radial gradient modulated by Memory & Cohesion
    const grad = ctx.createRadialGradient(
      STATE.pointer.x,
      STATE.pointer.y,
      20,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.85
    );
    grad.addColorStop(0, 'rgba(30, 41, 82, 0.55)');
    grad.addColorStop(0.5, 'rgba(11, 15, 32, 0.92)');
    grad.addColorStop(1, 'rgba(6, 9, 20, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle spatial coordinate grid
    const step = 56;
    ctx.save();
    ctx.strokeStyle = `rgba(148, 163, 184, ${lerp(0.035, 0.08, STATE.memory)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  },

  drawTemporalRibbonAndGhosts(ctx) {
    const trailsOn = RULES.isGhostTrailsActive(STATE.memory);
    const h = STATE.history;

    // 1. Decaying cursor trajectory ribbon
    if (trailsOn && h.length > 2) {
      const lifeMs = RULES.trailLifetimeMs(STATE.memory);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < h.length; i += 2) {
        const pt0 = h[i - 1];
        const pt1 = h[i];
        const age = STATE.simTimeMs - pt1.t;
        if (age > lifeMs) continue;
        const alpha = Math.pow(clamp(1 - age / lifeMs, 0, 1), 1.5) * 0.42;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = lerp(1, 3.2, 1 - age / lifeMs);
        ctx.beginPath();
        ctx.moveTo(pt0.x, pt0.y);
        ctx.lineTo(pt1.x, pt1.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Delayed Time Ghosts (G1, G2, G3)
    STATE.ghosts.forEach((g, idx) => {
      const isVortex =
        RULES.isVortexActive(g.clusterCount) && STATE.vortexGhostIdx === idx;

      ctx.save();
      // Dashed temporal tether from live pointer or previous ghost
      if (trailsOn) {
        const prev = idx === 0 ? STATE.pointer : STATE.ghosts[idx - 1];
        ctx.strokeStyle = `${g.color}44`;
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(g.x, g.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Phase Vortex emergent halo when >= 5 boids synchronize around this Ghost
      if (isVortex) {
        const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.12;
        const vRad = CONFIG.swarm.vortexRadius * pulse;
        const vGrad = ctx.createRadialGradient(g.x, g.y, 6, g.x, g.y, vRad);
        vGrad.addColorStop(0, `${g.color}44`);
        vGrad.addColorStop(0.65, `${g.color}18`);
        vGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, vRad, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = g.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(g.x, g.y, vRad * 0.78, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer ghost ring
      const radius = trailsOn ? 16 + idx * 3 : 9;
      ctx.strokeStyle = trailsOn ? g.color : `${g.color}66`;
      ctx.lineWidth = trailsOn ? 1.8 : 1;
      ctx.beginPath();
      ctx.arc(g.x, g.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x, g.y, trailsOn ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Self-explanatory Ghost label (e.g. G1 · -0.45s)
      if (trailsOn) {
        const sec = (g.delayMs / 1000).toFixed(2);
        const tag = isVortex
          ? `★ ${g.label} VORTEX (${g.clusterCount} boids)`
          : `${g.label} · −${sec}s`;
        ctx.font = '600 11px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(tag, g.x + radius + 6, g.y + 4);
      }
      ctx.restore();
    });

    // Live cursor / pointer beacon
    const p = STATE.pointer;
    ctx.save();
    ctx.strokeStyle = p.keyboardMode ? '#fbbf24' : 'rgba(248, 250, 252, 0.85)';
    ctx.lineWidth = p.keyboardMode ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 10.5px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(248, 250, 252, 0.8)';
    ctx.fillText(p.keyboardMode ? 'CURSOR [Arrows]' : 'NOW (0.0s)', p.x + 13, p.y - 6);
    ctx.restore();
  },

  drawAlignmentWeb(ctx) {
    if (!RULES.isAlignmentWebActive(STATE.cohesion)) return;
    const links = SWARM.links;
    if (!links.length) return;

    ctx.save();
    ctx.lineWidth = 1;
    for (let i = 0; i < links.length; i++) {
      const ln = links[i];
      const a = ln.alpha * lerp(0.12, 0.42, STATE.cohesion);
      ctx.strokeStyle = `rgba(168, 85, 247, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(ln.x1, ln.y1);
      ctx.lineTo(ln.x2, ln.y2);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawBoundaries(ctx) {
    const now = performance.now();

    STATE.boundaries.forEach((b, idx) => {
      const sinceHit = now - b.lastHitAt;
      const glow = clamp(1 - sinceHit / 360, 0, 1);
      const label = RULES.lineLabel(idx);
      const hz = Math.round(RULES.frequencyForBoundary(idx, b.length));

      ctx.save();
      // Outer neon glow on hit or normal ambient aura
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10 + glow * 18;
      ctx.strokeStyle = glow > 0.15 ? '#ffffff' : b.color;
      ctx.lineWidth = 3 + glow * 3.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // Endpoint anchor nodes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      [
        [b.x1, b.y1],
        [b.x2, b.y2],
      ].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Midpoint glass pill label: "L1 · 220 Hz"
      const mx = (b.x1 + b.x2) * 0.5;
      const my = (b.y1 + b.y2) * 0.5;
      const text = `${label} · ${hz}Hz`;
      ctx.font = '600 10.5px "Inter", system-ui, sans-serif';
      const tw = ctx.measureText(text).width + 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = `${b.color}88`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx - tw * 0.5, my - 19, tw, 17, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(text, mx, my - 7);
      ctx.restore();
    });

    // Live drag preview line when user is drawing a new Harmonic Boundary Line
    if (STATE.drag.active) {
      const d = STATE.drag;
      const len = Math.hypot(d.currX - d.startX, d.currY - d.startY);
      const nextIdx = STATE.boundaries.length % CONFIG.boundaries.maxLines;
      const hz = Math.round(RULES.frequencyForBoundary(nextIdx, Math.max(len, 60)));

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(d.startX, d.startY);
      ctx.lineTo(d.currX, d.currY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 11px "Inter", system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(
        `Drawing L${nextIdx + 1} (${Math.round(len)}px → ${hz} Hz)`,
        d.currX + 10,
        d.currY - 8
      );
      ctx.restore();
    }
  },

  drawBoids(ctx) {
    const boids = SWARM.boids;
    ctx.save();
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      const angle = Math.atan2(b.vy, b.vx);

      // Motion tail
      if (b.trail.length > 1) {
        ctx.strokeStyle = `${b.color}40`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.stroke();
      }

      // Directional sleek dart body
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      const size = 6.8 + b.energy * 3.2;
      ctx.fillStyle = b.energy > 0.25 ? '#ffffff' : b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6 + b.energy * 12;

      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.75, size * 0.58);
      ctx.lineTo(-size * 0.38, 0);
      ctx.lineTo(-size * 0.75, -size * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },

  drawRipplesAndFlashes(ctx) {
    // Expanding acoustic collision ripples
    for (let i = RENDER.ripples.length - 1; i >= 0; i--) {
      const rp = RENDER.ripples[i];
      rp.r += 2.2;
      rp.alpha -= 0.028;
      if (rp.alpha <= 0 || rp.r >= rp.maxR) {
        RENDER.ripples.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = rp.color;
      ctx.globalAlpha = Math.max(0, rp.alpha);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Floating event flashes (+L5, Bounce, etc.)
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
      ctx.font = '600 11.5px "Inter", system-ui, sans-serif';
      ctx.fillStyle = fl.color;
      ctx.textAlign = 'center';
      ctx.fillText(fl.text, fl.x, fl.y - 10 - t * 18);
      ctx.restore();
    }
  },

  drawHUD(ctx, w, h) {
    // Low-memory notice banner when Ghost Trails are intentionally withdrawn (<20% memory)
    if (!RULES.isGhostTrailsActive(STATE.memory)) {
      ctx.save();
      const bw = Math.min(460, w - 32);
      const bx = (w - bw) * 0.5;
      const by = 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 28, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.font = '600 11.5px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '⏳ IMMEDIATE MODE (<20% Memory): Ghost Echo Trails hidden — increase Memory [ ] to restore',
        w * 0.5,
        by + 18
      );
      ctx.restore();
    }

    // Transient Cause → Effect Glass Badge on slider/rule change
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
        const boxW = Math.min(430, w - 28);
        const boxH = lines.length * 18 + 16;
        const bx = w - boxW - 14;
        const by = h - boxH - 14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
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
    RENDER.drawAlignmentWeb(ctx);
    RENDER.drawTemporalRibbonAndGhosts(ctx);
    RENDER.drawBoundaries(ctx);
    RENDER.drawBoids(ctx);
    RENDER.drawRipplesAndFlashes(ctx);
    RENDER.drawHUD(ctx, w, h);

    ctx.restore();
  },
};
