# Chrono Swarm

**Course:** NMED 3203 – Interactive Media Applications  
**Premises Combined:** **Temporality** (Collection 04 · *Ghost Chase* — Delayed Time Ghosts & Echo Memory) × **Emergence** (Collection 07 · *Boundary Lines* — Autonomous Bouncing Sound Orbs & Musical String Boundaries)  
**One-Sentence Description:** *Chrono Swarm* is a modern dark-glassmorphic 8-string musical harp in which your cursor movements are replayed by three delayed *Time Ghosts* (`G1–G3`), while ten autonomous *Sound Orbs* flock around those ghosts, bounce off user-placed *Bumpers* (`B1–B6`), and pluck the eight strings (`S1–S8`) to compose unscripted melodies.

> **Premise Coupling Formula:**  
> *"Through **Temporality**, the participant's movements across the eight musical strings (`S1–S8`) are recorded and replayed by three delayed Time Ghosts (`G1–G3`), and through **Emergence**, ten autonomous sound orbs steer toward these delayed ghosts and bounce off user-placed Bumpers (`B1–B6`) to pluck unscripted melodies."*

- **Design Rationale (~365 words):** [RATIONALE.md](./RATIONALE.md)

---

## How to Use

1. **Turn On Sound (1 Click):**
   - Click **anywhere on the screen** (or press **Space** / **M**) to unlock browser audio. A welcoming 3-note harp chime plays immediately, and the bouncing orbs begin playing notes across the 8 strings (`S1–S8`).
2. **Sweep Across the 8 Musical Strings (`S1–S8`):**
   - Move your mouse up and down across the stage—or use the **Arrow Keys**—to pluck the 8 horizontal strings (`S1 · A4 High` at top down to `S8 · E3 Bass` at bottom).
   - **Temporality in Action:** Behind your live cursor (`YOU (Now)`), three delayed **Time Ghosts** (`G1`, `G2`, `G3`) follow your exact path after a delay (`0.5s`, `1.0s`, `1.5s`) and **pluck the strings again** as they pass over them!
3. **Click the Stage to Add or Remove Bounce Bumpers (`B1–B6`):**
   - Click anywhere on the stage (or press **Space** / **Enter**) to place a round **Bounce Bumper** (`B1–B6`), or click an existing bumper to remove it.
   - Whenever any of the 10 autonomous **Sound Orbs** hits a Bumper (`B1–B6`) or crosses a String (`S1–S8`), it bounces, vibrates the string, and plays a loud pentatonic harp note.
4. **Adjust Echo Memory (`⏳ ECHO MEMORY` Slider or `[` / `]` Keys):**
   - Controls how far behind the Time Ghosts (`G1–G3`) follow (`280–650 ms`), how long the blue cursor trail stays on screen (`1.2–7.0s`), and how much stereo echo is added (`8%–48%`).
   - Dropping **Echo Memory below `20%`** hides the Time Ghost trails on screen.
5. **Adjust Swarm Grouping (`✦ SWARM GROUPING` Slider or `Q` / `E` Keys):**
   - Controls whether the 10 Sound Orbs scatter apart (`<35%`, hiding the purple web lines) or flock together around your Time Ghosts (`≥35%`, showing the **Purple Swarm Web Lines** and triggering a **Vortex Chord** when `≥4` orbs gather on a Ghost).

---

## Sources & How Each Reading Governs a Design Rule

1. **Hallnäs, L., & Redström, J. (2001).** *Slow technology – Designing for reflection.* Personal and Ubiquitous Computing, 5(3), 201–212. [PDF ↗](https://www.ida.liu.se/~arzba60/Course/SlowTech.pdf)
   - **Design Rule Controlled (`js/rules.js` & `js/temporal.js`):** `RULES.ghostStepDelayMs(memory)` and `RULES.trailLifetimeMs(memory)` map the **⏳ Echo Memory** slider to Time-Ghost lag (`280–650 ms`), trail persistence (`1.2–7.0s`), and Web Audio stereo echo (`8%–48%`), and hide Ghost Trails below `20%` memory.
2. **Reynolds, C. W. (1987).** *Flocks, herds and schools: A distributed behavioral model.* Computer Graphics (SIGGRAPH '87), 21(4), 25–34. [Paper ↗](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/)
   - **Design Rule Controlled (`js/swarm.js` & `js/rules.js`):** `RULES.separationWeight(cohesion)`, `RULES.alignmentWeight(cohesion)`, and `RULES.cohesionWeight(cohesion)` steer the 10 autonomous Sound Orbs and extend Reynolds' present-only model by pulling orbs toward the delayed Time Ghosts (`G1–G3`).
3. **Juul, J. (2002).** *The open and the closed: Games of emergence and games of progression.* In Computer Games and Digital Cultures Conference Proceedings (pp. 323–329). Tampere University Press. [Article ↗](https://www.jesperjuul.net/text/openandtheclosed.html)
   - **Design Rule Controlled (`js/audio.js` & `js/config.js`):** Instead of stepping through a fixed score, melodies emerge dynamically as orbs cross **Strings (`S1–S8`)**, bounce off **Bumpers (`B1–B6`)**, or gather `≥4` orbs on a Time Ghost (`RULES.isVortexActive`).
4. **Seven, M. (2026).** *Interactive Media Applications lab.* (NMED 3203). [IMA Lab Bibliography ↗](https://mertseven.com/ima/lab/bibliography.html)
   - **Design Rule Controlled:** Combines Collection 04 (*Ghost Chase*) delayed cursor ghosts with Collection 07 (*Boundary Lines*) emergent swarm and boundary bounces.

---

## Live Code Modification Quick Reference

- **Change the number of Bouncing Sound Orbs or Time Ghosts:** In `js/config.js` → `CONFIG.swarm.count` (`10 → 20`) or `CONFIG.temporal.ghostCount` (`3 → 5`).
- **Rate-limit how often a user can place Bumpers:** In `js/config.js` → `CONFIG.boundaries.editCooldownMs` (`0 → 1000` for a 1-second cooldown).
- **Hide a visual feedback channel:** In `js/config.js` → `CONFIG.signals` (set `ghostTrails: 2` or `alignmentWeb: 2` to disable that layer completely).

---

## AI Usage Statement

- **Tools Used & Purpose:** I used Gemini (in Google Antigravity) while building this project to organize the modular files (`config.js`, `rules.js`, `temporal.js`, `swarm.js`, `audio.js`, `render.js`, `main.js`), tune the Web Audio compressor and delay network, and style the dark glassmorphism interface.
- **What I Rejected or Corrected from AI Output:**
  1. **Replaced Abstract Lines & Silent Autoplay with 8 Vibrating Musical Strings (`S1–S8`) and 1-Click Sound Unlock:** The first AI prototype used abstract floating lines and triangles that produced no sound until several hidden conditions were met, making the interface confusing. I redesigned the stage around 8 clearly labeled horizontal musical strings (`S1–S8`), added round clickable Bounce Bumpers (`B1–B6`), and added a prominent one-click sound unlock banner with a welcoming 3-note chime.
  2. **Coupled Delayed Time Ghosts Directly to String Plucks:** Originally, the delayed Time Ghosts (`G1–G3`) only floated visually behind the cursor without making sound. I updated `TEMPORAL.step` in `js/temporal.js` so that whenever `G1`, `G2`, or `G3` crosses a string `S1–S8`, it physically vibrates and plucks that string after a delay.
  3. **Boosted Synth Gain & Added a Dynamics Compressor:** The initial Web Audio gain was too quiet on laptop speakers (`0.06` effective gain). I added a `DynamicsCompressorNode` in `js/audio.js` and raised `masterVolume` to `0.65` so every pluck and bounce is clear and audible.
