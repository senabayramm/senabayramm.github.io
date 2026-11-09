/* =========================================================================
   CHRONO SWARM · AUTONOMOUS BOID SWARM (Collection 07 · Boundary Lines)
   -------------------------------------------------------------------------
   Implements Craig Reynolds' (1987) local steering rules (Separation,
   Alignment, Cohesion) coupled with delayed Time-Ghost attraction and
   Harmonic Boundary Line reflections (Juul, 2002).
   ========================================================================= */
const SWARM = {
  boids: [],
  links: [],
  onBoundaryHit: null,
  onVortexCluster: null,

  init() {
    SWARM.boids = [];
    const w = STATE.stageW || 900;
    const h = STATE.stageH || 520;
    const n = CONFIG.swarm.count;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const spd = lerp(CONFIG.swarm.minSpeed, CONFIG.swarm.maxSpeed, 0.55);
      const ghostTarget = i % CONFIG.temporal.ghostCount;
      SWARM.boids.push({
        id: i,
        x: w * 0.5 + Math.cos(angle) * (80 + (i % 5) * 28),
        y: h * 0.5 + Math.sin(angle) * (60 + (i % 4) * 24),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        ghostIdx: ghostTarget,
        color: CONFIG.visuals.ghostColors[ghostTarget % CONFIG.visuals.ghostColors.length],
        lastBounceAt: -Infinity,
        energy: 0,
        trail: [],
      });
    }
  },

  // Vector helper: limit magnitude
  limitVec(vx, vy, maxMag) {
    const mag = Math.hypot(vx, vy);
    if (mag > maxMag && mag > 1e-5) {
      return [(vx / mag) * maxMag, (vy / mag) * maxMag];
    }
    return [vx, vy];
  },

  // Shortest vector & projection from point (px, py) to segment (x1, y1)-(x2, y2)
  closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return { cx: x1, cy: y1, dist: Math.hypot(px - x1, py - y1) };
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return { cx, cy, dist: Math.hypot(px - cx, py - cy) };
  },

  step(dtMs) {
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

    // Reset ghost cluster counts
    STATE.ghosts.forEach((g) => {
      g.clusterCount = 0;
    });

    for (let i = 0; i < count; i++) {
      const b = boids[i];

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

          // Record alignment web threads for rendering
          if (j > i && dist < s.perceptionRadius * 0.72 && SWARM.links.length < 95) {
            SWARM.links.push({
              x1: b.x,
              y1: b.y,
              x2: other.x,
              y2: other.y,
              alpha: 1 - dist / (s.perceptionRadius * 0.72),
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

      // 1. Separation force
      if (sepCount > 0) {
        const [sx, sy] = SWARM.limitVec(sepX / sepCount, sepY / sepCount, s.maxForce * 1.4);
        fx += sx * wSep;
        fy += sy * wSep;
      }

      // 2. Alignment & 3. Cohesion forces
      if (neighborCount > 0) {
        const [ax, ay] = SWARM.limitVec(
          aliX / neighborCount - b.vx,
          aliY / neighborCount - b.vy,
          s.maxForce
        );
        fx += ax * wAli;
        fy += ay * wAli;

        const centerDx = cohX / neighborCount - b.x;
        const centerDy = cohY / neighborCount - b.y;
        const [cx, cy] = SWARM.limitVec(centerDx * 0.03, centerDy * 0.03, s.maxForce);
        fx += cx * wCoh;
        fy += cy * wCoh;
      }

      // 4. TEMPORAL ATTRACTION: steer toward delayed Time Ghost (G1, G2, or G3)
      const ghost = STATE.ghosts[b.ghostIdx % STATE.ghosts.length];
      if (ghost) {
        const gdx = ghost.x - b.x;
        const gdy = ghost.y - b.y;
        const gDist = Math.hypot(gdx, gdy);
        if (gDist < s.vortexRadius) {
          ghost.clusterCount++;
        }
        if (gDist > 12) {
          // Gentle orbital swirl + radial pull around the delayed Time Ghost
          const tangX = -gdy / gDist;
          const tangY = gdx / gDist;
          const pullX = (gdx / gDist) * 0.75 + tangX * 0.42;
          const pullY = (gdy / gDist) * 0.75 + tangY * 0.42;
          const [gx, gy] = SWARM.limitVec(pullX, pullY, s.maxForce);
          fx += gx * wGhost;
          fy += gy * wGhost;
        }
      }

      // 5. Soft stage edge containment so boids stay gracefully inside the glass stage
      const margin = 42;
      const turn = s.maxForce * 1.65;
      if (b.x < margin) fx += turn;
      if (b.x > w - margin) fx -= turn;
      if (b.y < margin) fy += turn;
      if (b.y > h - margin) fy -= turn;

      // Integrate velocity & position with Time Scale
      b.vx += fx * scale;
      b.vy += fy * scale;

      const spd = Math.hypot(b.vx, b.vy);
      if (spd > s.maxSpeed) {
        b.vx = (b.vx / spd) * s.maxSpeed;
        b.vy = (b.vy / spd) * s.maxSpeed;
      } else if (spd < s.minSpeed) {
        const ang = spd > 1e-4 ? Math.atan2(b.vy, b.vx) : Math.random() * Math.PI * 2;
        b.vx = Math.cos(ang) * s.minSpeed;
        b.vy = Math.sin(ang) * s.minSpeed;
      }

      b.x = clamp(b.x + b.vx * scale, 8, w - 8);
      b.y = clamp(b.y + b.vy * scale, 8, h - 8);
      b.energy = Math.max(0, b.energy - 0.035 * scale);

      // Short velocity tail for each boid
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 7) b.trail.shift();

      // 6. HARMONIC BOUNDARY LINE COLLISIONS (L1–L8)
      if (now - b.lastBounceAt >= CONFIG.boundaries.hitCooldownMs) {
        for (let li = 0; li < STATE.boundaries.length; li++) {
          const line = STATE.boundaries[li];
          const hit = SWARM.closestPointOnSegment(b.x, b.y, line.x1, line.y1, line.x2, line.y2);
          if (hit.dist < 10.5) {
            // Reflect velocity across boundary normal
            const segDx = line.x2 - line.x1;
            const segDy = line.y2 - line.y1;
            const segLen = Math.max(1, Math.hypot(segDx, segDy));
            let nx = -segDy / segLen;
            let ny = segDx / segLen;
            const dot = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * dot * nx;
            b.vy = b.vy - 2 * dot * ny;
            // Push boid slightly clear of the boundary line
            b.x += (b.x >= hit.cx ? 1 : -1) * 4;
            b.y += (b.y >= hit.cy ? 1 : -1) * 4;

            b.lastBounceAt = now;
            b.energy = 1;
            line.lastHitAt = now;
            line.hitCount++;
            STATE.totalChimes++;

            if (SWARM.onBoundaryHit) {
              const speedRatio = clamp(
                (Math.hypot(b.vx, b.vy) - s.minSpeed) / (s.maxSpeed - s.minSpeed),
                0,
                1
              );
              SWARM.onBoundaryHit(li, line, b, hit.cx, hit.cy, speedRatio);
            }
            break;
          }
        }
      }
    }

    // Track emergent Phase Vortex clusters around Time Ghosts
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
