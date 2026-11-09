# Chrono Swarm

**Course:** NMED 3203 – Interactive Media Applications  
**Premises Combined:** **Temporality** (Collection 04 · *Ghost Chase* — Delayed Time Ghosts & Memory Decay) × **Emergence** (Collection 07 · *Boundary Lines* — Autonomous Boid Flocking & Harmonic Boundary Refraction)  
**One-Sentence Description:** *Chrono Swarm* is a modern dark-glassmorphic audio-visual instrument in which a participant's pointer gestures are replayed across delayed time-layers as decaying *Time Ghosts* (`G1–G3`), guiding an autonomous flock of 28 boids that bounce off user-drawn *Harmonic Boundary Lines* (`L1–L8`) to generate unpredictable polyrhythmic melodies.

> **Premise Coupling Formula:**  
> *"Through **Temporality**, the participant's movements are recorded and replayed across delayed time-layers as decaying 'Time Ghosts' (`G1–G3`), and through **Emergence**, an autonomous flock of steering boids interacts with these temporal ghosts and user-drawn Harmonic Boundary Lines (`L1–L8`) via local neighbor rules to produce unscripted visual constellations and polyrhythmic music."*

- **Design Rationale (~360 words):** [RATIONALE.md](./RATIONALE.md)

---

## How to Use

1. **Guide the Delayed Time Ghosts (`G1–G3`):**
   - Move your pointer across the glass stage—or use the **Arrow Keys**—to steer the live beacon (`NOW 0.0s`).
   - Three delayed **Time Ghosts** (`G1`, `G2`, `G3`) replay your exact path after a configurable temporal lag (`260 ms` to `650 ms` per ghost), pulling subsets of the autonomous boid swarm into orbital paths across time.
2. **Draw Harmonic Boundary Lines (`L1–L8`):**
   - **Click and drag** anywhere on the stage to draw a custom Harmonic Boundary Line (`L1–L8`), or **single-click** / press **Space** / **Enter** to place an angled resonant line at the cursor.
   - Each boundary line `L1–L8` is tuned to a distinct degree of a Dorian/Pentatonic scale, and shorter lines shift higher in pitch while longer lines resonate deeper.
   - Whenever an autonomous boid collides with a boundary line, it reflects across the line's normal vector, flares with energy, and plucks a glass synth note.
3. **Reshape Temporal Memory (`⏳ Memory Persistence`):**
   - Drag the **⏳ MEMORY PERSISTENCE** slider (`0%–100%`) or press **`[`** (Fleeting) / **`]`** (Deep).
   - **Fleeting Memory (`<20%`):** Ghost lag tightens (`260 ms`), trails decay rapidly (`1.4s`), acoustic echo dries out (`8%`), and `Ghost Echo Trails (G1–G3)` hide on screen (`Immediate Mode`).
   - **Deep Memory (`70%–100%`):** Ghost lag stretches up to `650 ms` per layer (`-1.95s` for `G3`), trajectory ribbons persist up to `8.5s`, and a lush stereo echo opens (`44%`).
4. **Reshape Emergent Flocking (`✦ Swarm Cohesion`):**
   - Drag the **✦ SWARM COHESION** slider (`0%–100%`) or press **`Q`** (Scatter) / **`E`** (Flock).
   - **Low Cohesion (`<35%`):** Separation dominates (`×1.55`), scattering boids into independent paths and suppressing the `Flock Alignment Web`.
   - **High Cohesion (`≥35%`):** Alignment and Cohesion synchronize neighbor trajectories, illuminating the `Flock Alignment Web` and causing `≥5` boids to cluster around Time Ghosts to trigger **Emergent Phase Vortex** fifth chords.
5. **Dilate or Freeze Time:**
   - Click **⏱ Time** (or press **`T`**) to cycle between `0.35× Slow-Mo`, `1.00× Real-Time`, and `1.65× Overdrive`, or press **`P`** to freeze the simulation in time.

---

## Sources & How Each Reading Governs a Design Rule

Every academic source in the bottom bar of the interface governs an explicit rule in the codebase:

1. **Hallnäs, L., & Redström, J. (2001).** *Slow technology – Designing for reflection.* Personal and Ubiquitous Computing, 5(3), 201–212. [PDF ↗](https://www.ida.liu.se/~arzba60/Course/SlowTech.pdf)
   - **Concept:** Technology should not only optimize immediate task speed; exposing time, delay, and slow persistence invites reflection on how actions unfold temporally.
   - **Design Rule Controlled (`js/rules.js` & `js/temporal.js`):** `RULES.ghostStepDelayMs(memory)` and `RULES.trailLifetimeMs(memory)` scale the temporal lag between `G1–G3` (`260–650 ms`), the decay window of past cursor ribbons (`1.4–8.5s`), and the Web Audio stereo delay (`0.14–0.46s`, `8%–44%` wet mix).
   - **Limitation / How This Project Challenges the Reading:** Hallnäs and Redström suggest that ambiguity and slowness alone foster reflection, yet unacknowledged delay often feels like broken interface lag. *Chrono Swarm* counters this by rendering explicit temporal tethers and live delay labels (`G1 · -0.53s`) and deliberately withdrawing ghost trails below `20%` memory (`RULES.isGhostTrailsActive`) so the contrast between immediate and reflective time is unmistakable.

2. **Reynolds, C. W. (1987).** *Flocks, herds and schools: A distributed behavioral model.* Computer Graphics (SIGGRAPH '87), 21(4), 25–34. [Paper ↗](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/)
   - **Concept:** Complex collective motion emerges without a central coordinator when individual agents combine three local steering behaviors: *Separation*, *Alignment*, and *Cohesion*.
   - **Design Rule Controlled (`js/swarm.js` & `js/rules.js`):** `RULES.separationWeight(cohesion)`, `RULES.alignmentWeight(cohesion)`, and `RULES.cohesionWeight(cohesion)` compute real-time steering vectors for all 28 autonomous boids.
   - **Limitation / How This Project Challenges the Reading:** Reynolds models flocking purely in the present instant—boids have no memory of past states. *Chrono Swarm* couples Reynolds' spatial rules with **Temporality** (`RULES.ghostPullWeight`): boids steer toward the delayed *Time Ghosts* (`G1–G3`) of the participant's past gestures rather than only the live cursor.

3. **Juul, J. (2002).** *The open and the closed: Games of emergence and games of progression.* In Computer Games and Digital Cultures Conference Proceedings (pp. 323–329). Tampere University Press. [Article ↗](https://www.jesperjuul.net/text/openandtheclosed.html)
   - **Concept:** *Emergence* structures combine a small set of local interaction rules to generate an open space of unscripted outcomes, in contrast to predetermined step-by-step *progression*.
   - **Design Rule Controlled (`js/audio.js` & `js/config.js`):** Rather than stepping through a fixed loop, musical events fire only when autonomous boids reflect off user-placed **Harmonic Boundary Lines (`L1–L8`)** (`RULES.frequencyForBoundary`) or when `≥5` boids self-organize into a **Phase Vortex** (`RULES.isVortexActive`).
   - **Limitation / How This Project Challenges the Reading:** Juul observes that emergent systems can feel arbitrary when participants cannot see which rule produced an outcome. We address this by pairing emergent interactions with live **Cause → Effect Glass Readout Cards** and 4 threshold status pills.

4. **Seven, M. (2026).** *Interactive Media Applications lab.* (NMED 3203). [IMA Lab Bibliography ↗](https://mertseven.com/ima/lab/bibliography.html)
   - **Design Rule Controlled:** Combines the delayed ghost-following mechanic of **Collection 04 (*Ghost Chase*)** with the local agent steering and boundary collision rules of **Collection 07 (*Boundary Lines*)**.

---

## Project Files

| File | Purpose |
| :--- | :--- |
| [`index.html`](./index.html) | Modern Dark Glassmorphism shell, single-line instruction bar, Cause→Effect telemetry deck, 4 emergent threshold pills, control dock, and 4-column Sources & Design Rules footer. |
| [`style.css`](./style.css) | Deep-space ambient gradient orbs, frosted glass panels (`backdrop-filter: blur(24px)`), neon-pastel chips, custom range sliders, and responsive layout. |
| [`js/config.js`](./js/config.js) | **Single source of truth for live code edits:** ghost count & delay bounds, boid count & steering weights, boundary limits, threshold cutoffs, and synth scale. |
| [`js/rules.js`](./js/rules.js) | Pure mapping functions translating Temporality (`memory`) and Emergence (`cohesion`, `boundaries`) into system rules. |
| [`js/temporal.js`](./js/temporal.js) | `STATE` store and `TEMPORAL` trajectory recorder, delayed Time Ghost (`G1–G3`) sampler, Time Scale controller, and Harmonic Boundary Line manager. |
| [`js/swarm.js`](./js/swarm.js) | `SWARM` autonomous boid simulation (Reynolds Separation, Alignment, Cohesion + Time-Ghost orbital pull + Boundary Line reflection physics). |
| [`js/audio.js`](./js/audio.js) | Polyphonic Web Audio glass synthesizer, stereo low-pass delay network, boundary pluck chimes, and emergent Phase Vortex fifth chords. |
| [`js/render.js`](./js/render.js) | High-DPI HTML5 Canvas renderer drawing the alignment web, decaying temporal ribbon, Time Ghosts, Harmonic Boundary Lines (`L1–L8`), directional boids, and glass HUD badges. |
| [`js/main.js`](./js/main.js) | Pointer, drag, keyboard, and slider event wiring plus real-time telemetry updates. |
| [`RATIONALE.md`](./RATIONALE.md) | 360-word design rationale connecting design choices to Hallnäs & Redström (2001), Reynolds (1987), and Juul (2002). |

---

## Live Code Modification Quick Reference

All tunable parameters are grouped in [`js/config.js`](./js/config.js) and all input-to-output rules live in [`js/rules.js`](./js/rules.js):

- **Double the autonomous boid swarm size or add more Time Ghosts:** In `js/config.js` → change `CONFIG.swarm.count` (`28 → 56`) or `CONFIG.temporal.ghostCount` (`3 → 5`).
- **Rate-limit how often a participant can draw Boundary Lines:** In `js/config.js` → change `CONFIG.boundaries.editCooldownMs` (`0 → 1000` for a 1-second cooldown; blocked clicks flash `WAIT 1.0s`).
- **Disable an emergent visual/sonic layer or keep it always on:** In `js/config.js` → `CONFIG.signals` (set `ghostTrails: 2` or `alignmentWeb: 2` to disable that channel completely, or `0` to keep it always active).
- **Swap which parameter controls which rule:** In `js/rules.js` → swap `STATE.memory` and `STATE.cohesion` inside `echoMix()` and `alignmentWeight()` so Swarm Cohesion controls acoustic echo and Memory controls flock alignment.

---

## AI Usage Statement

- **Tools Used & Purpose:** I used Gemini (in Google Antigravity) while developing this project to structure the modular JavaScript architecture (`config.js`, `rules.js`, `temporal.js`, `swarm.js`, `audio.js`, `render.js`, `main.js`), refine the line-segment reflection math in `SWARM.closestPointOnSegment`, and style the dark glassmorphism interface.
- **What I Rejected or Corrected from AI Output:**
  1. **Rejected Direct Cursor Attraction in Favor of Delayed Time-Ghost Coupling:** An early AI-generated boid loop pulled all boids directly toward the live cursor `(pointer.x, pointer.y)`, which made the delayed Time Ghosts purely decorative. I corrected `SWARM.step` in `js/swarm.js` so each boid steers toward its assigned delayed Time Ghost (`G1`, `G2`, or `G3`), genuinely coupling *Temporality* with *Emergence*.
  2. **Fixed Boundary Line Trapping & Audio Clipping:** In the initial prototype, boids colliding with a boundary line could re-trigger collisions on consecutive frames, getting stuck vibrating inside the line and overloading the Web Audio gain bus. I fixed this by adding normal-vector velocity reflection with a `4 px` clearance push, a `140 ms` per-boid bounce cooldown (`CONFIG.boundaries.hitCooldownMs`), and a `42 ms` voice limiter in `AUDIO.playBoundaryChime`.
  3. **Replaced Passive Telemetry Numbers with Self-Explanatory Cause → Effect Readouts:** Early status chips only showed raw numbers (`Memory 70%`, `Cohesion 65%`) without explaining what rules they governed. I rewrote the telemetry deck in `index.html` and `js/main.js` so every chip and threshold pill explicitly states its input-to-output rule (`⏳ Memory 70% → Ghost Lag 533ms · Echo 33%`, `● Flock Alignment Web · ACTIVE (Cohesion ≥35%)`).
