/* =========================================================================
   CHRONO SWARM · BOUNCING SWARM ORBS (Collection 07 · Boundary Lines)
   -------------------------------------------------------------------------
   Autonomous sound orbs that steer via Craig Reynolds' (1987) local rules,
   chase the user's delayed Time Ghosts (G1–G3...), bounce off user-placed
   Bumpers (B1–B6), and pluck the 8 Musical Strings (S1–S8).
   ========================================================================= */
const SWARM = {
  boids: [],
  links: [],
  onVortexCluster: null,

  init() {
    SWARM.boids = [];
    SWARM.syncCount();
  },

  syncCount() {
    const w = STATE.stageW || 900;
    const h = STATE.stageH || 500;
    const n = clamp(Math.round(CONFIG.swarm.count || 10), 1, 60);
    const gCount = Math.max(1, CONFIG.temporal.ghostCount || 3);

    while (SWARM.boids.length < n) {
      const i = SWARM.boids.length;
      const angle = (i / Math.max(1, n)) * Math.PI * 2 + 0.3;
      const spd = lerp(CONFIG.swarm.minSpeed, CONFIG.swarm.maxSpeed, 0.65);
      const ghostTarget = i % gCount;
      SWARM.boids.push({
        id: i,
        x: w * (0.2 + ((i % 10) / 10) * 0.6),
        y: h * (0.2 + (((i * 3) % 10) / 10) * 0.6),
        prevY: h * 0.5,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        ghostIdx: ghostTarget,
        color: CONFIG.visuals.ghostColors[ghostTarget % CONFIG.visuals.ghostColors.length],
        lastStringHitAt: -Infinity,
        lastBumperHitAt: -Infinity,
        energy: 0,
        trail: [],
      });
    }
    if (SWARM.boids.length > n) {
      SWARM.boids.length = n;
    }
    SWARM.boids.forEach((b, i) => {
      b.ghostIdx = i % gCount;
      b.color = CONFIG.visuals.ghostColors[b.ghostIdx % CONFIG.visuals.ghostColors.length];
    });
  },

  limitVec(vx, vy, maxMag) {
    const mag = Math.hypot(vx, vy);
    if (mag > maxMag && mag > 1e-5) {
      return [(vx / mag) * maxMag, (vy / mag) * maxMag];
    }
    return [vx, vy];
  },

  step() {
    const s = CONFIG.swarm;
    const scale = STATE.timeScale;
    const w = STATE.stageW;
    const h = STATE.stageH;
    const now = performance.now();

    const wSep = RULES.separationWeight(STATE.cohesion);
    const wAli = RULES.alignmentWeight(STATE.cohesion);
    const wCoh = RULES.cohesionWeight(STATE.cohesion);
    const wGhost = RULES.ghostPullWeight(STATE.memory, STATE.cohesion);

    SWARM.links = [];
    const boids = SWARM.boids;
    const count = boids.length;

    STATE.ghosts.forEach((g) => {
      g.clusterCount = 0;
    });

    for (let i = 0; i < count; i++) {
      const b = boids[i];
      b.prevY = b.y;

      let sepX = 0, sepY = 0, sepCount = 0;
      let aliX = 0, aliY = 0, neighborCount = 0;
      let cohX = 0, cohY = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = boids[j];
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < s.perceptionRadius) {
          aliX += other.vx;
          aliY += other.vy;
          cohX += other.x;
          cohY += other.y;
          neighborCount++;

          if (j > i && dist < s.perceptionRadius * 0.85) {
            SWARM.links.push({
              x1: b.x,
              y1: b.y,
              x2: other.x,
              y2: other.y,
              alpha: 1 - dist / (s.perceptionRadius * 0.85),
            });
          }

          if (dist < s.separationRadius) {
            const inv = 1 / Math.max(dist, 4);
            sepX -= (dx / dist) * inv * s.separationRadius;
            sepY -= (dy / dist) * inv * s.separationRadius;
            sepCount++;
          }
        }
      }

      let fx = 0;
      let fy = 0;

      if (sepCount > 0) {
        const [sx, sy] = SWARM.limitVec(sepX / sepCount, sepY / sepCount, s.maxForce * 1.4);
        fx += sx * wSep;
        fy += sy * wSep;
      }

      if (neighborCount > 0) {
        const [ax, ay] = SWARM.limitVec(
          aliX / neighborCount - b.vx,
          aliY / neighborCount - b.vy,
          s.maxForce
        );
        fx += ax * wAli;
        fy += ay * wAli;

        const [cx, cy] = SWARM.limitVec(
          (cohX / neighborCount - b.x) * 0.03,
          (cohY / neighborCount - b.y) * 0.03,
          s.maxForce
        );
        fx += cx * wCoh;
        fy += cy * wCoh;
      }

      const ghost = STATE.ghosts[b.ghostIdx % Math.max(1, STATE.ghosts.length)];
      if (ghost) {
        const gdx = ghost.x - b.x;
        const gdy = ghost.y - b.y;
        const gDist = Math.hypot(gdx, gdy);
        if (gDist < s.vortexRadius) {
          ghost.clusterCount++;
        }
        if (gDist > 18) {
          const tangX = -gdy / gDist;
          const tangY = gdx / gDist;
          const pullX = (gdx / gDist) * 0.72 + tangX * 0.48;
          const pullY = (gdy / gDist) * 0.72 + tangY * 0.48;
          const [gx, gy] = SWARM.limitVec(pullX, pullY, s.maxForce);
          fx += gx * wGhost;
          fy += gy * wGhost;
        }
      }

      b.vx += fx * scale;
      b.vy += fy * scale;

      if (Math.abs(b.vy) < s.minSpeed * 0.35) {
        b.vy += (b.vy >= 0 ? 1 : -1) * 0.25;
      }

      const spd = Math.hypot(b.vx, b.vy);
      if (spd > s.maxSpeed) {
        b.vx = (b.vx / spd) * s.maxSpeed;
        b.vy = (b.vy / spd) * s.maxSpeed;
      } else if (spd < s.minSpeed) {
        const ang = spd > 1e-4 ? Math.atan2(b.vy, b.vx) : 0.7;
        b.vx = Math.cos(ang) * s.minSpeed;
        b.vy = Math.sin(ang) * s.minSpeed;
      }

      b.x += b.vx * scale;
      b.y += b.vy * scale;

      const padX = 24;
      const padY = 22;
      if (b.x < padX) { b.x = padX; b.vx = Math.abs(b.vx); }
      if (b.x > w - padX) { b.x = w - padX; b.vx = -Math.abs(b.vx); }
      if (b.y < padY) { b.y = padY; b.vy = Math.abs(b.vy); }
      if (b.y > h - padY) { b.y = h - padY; b.vy = -Math.abs(b.vy); }

      b.energy = Math.max(0, b.energy - 0.04 * scale);
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 9) b.trail.shift();

      if (now - b.lastBumperHitAt > CONFIG.boundaries.hitCooldownMs) {
        for (let bi = 0; bi < STATE.bumpers.length; bi++) {
          const bmp = STATE.bumpers[bi];
          const dx = b.x - bmp.x;
          const dy = b.y - bmp.y;
          const dist = Math.hypot(dx, dy);
          if (dist < bmp.r + 9 && dist > 1e-4) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dot = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * dot * nx;
            b.vy = b.vy - 2 * dot * ny;
            b.x = bmp.x + nx * (bmp.r + 11);
            b.y = bmp.y + ny * (bmp.r + 11);
            b.lastBumperHitAt = now;
            b.energy = 1;
            bmp.lastHitAt = now;
            const sIdx = TEMPORAL.nearestStringIndex(bmp.y);
            TEMPORAL.triggerString(sIdx, bmp.x, `BUMPER B${bi + 1}`);
            break;
          }
        }
      }

      if (now - b.lastStringHitAt > 240) {
        const minY = Math.min(b.prevY, b.y);
        const maxY = Math.max(b.prevY, b.y);
        for (let si = 0; si < STATE.strings.length; si++) {
          const str = STATE.strings[si];
          if (str.y >= minY && str.y <= maxY && now - str.lastHitAt > 120) {
            b.lastStringHitAt = now;
            b.energy = 1;
            TEMPORAL.triggerString(si, b.x, 'ORB');
            break;
          }
        }
      }
    }

    STATE.activeWebLinks = SWARM.links.length;
    let bestCluster = 0;
    let bestGhostIdx = -1;
    STATE.ghosts.forEach((g, idx) => {
      if (g.clusterCount > bestCluster) {
        bestCluster = g.clusterCount;
        bestGhostIdx = idx;
      }
    });
    STATE.maxGhostCluster = bestCluster;
    STATE.vortexGhostIdx = bestGhostIdx;

    if (
      RULES.isVortexActive(bestCluster) &&
      now - STATE.lastVortexAt >= CONFIG.audio.vortexCooldownMs
    ) {
      STATE.lastVortexAt = now;
      if (SWARM.onVortexCluster && bestGhostIdx >= 0) {
        SWARM.onVortexCluster(STATE.ghosts[bestGhostIdx], bestCluster);
      }
    }
  },
};
