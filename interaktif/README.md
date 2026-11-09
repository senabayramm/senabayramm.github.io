# Chrono Swarm · Temporality × Emergence

**Course:** NMED 3203 – Interactive Media Applications Lab (2026)  
**Student:** Sena Bayram (@senabayramm)  
**Live Application Link:** [https://senabayramm.github.io/interaktif/](https://senabayramm.github.io/interaktif/)  
**Design Rationale (353 words):** [RATIONALE.md](./RATIONALE.md)

---

## 1. Project Overview & Premise Coupling

*Chrono Swarm* is an interactive web-based 8-string acoustic harp that turns time delay and autonomous flocking dynamics into generative musical rules.

* **Premise A — Temporality (Collection 04 · *Ghost Chase*):** Interaction happens in time. The participant's pointer movements across eight horizontal strings (`S1–S8`) are continuously recorded into temporal memory and replayed by three delayed **Time Ghosts** (`G1–G3`).
* **Premise B — Emergence (Collection 07 · *Boundary Lines*):** Experience cannot be fully predetermined. Ten autonomous **Sound Orbs** flock dynamically using decentralized steering rules, bounce off user-placed **Bumpers** (`B1–B6`), and collide with the eight musical strings (`S1–S8`).

> **Premise Coupling Sentence:**  
> *"Because of **Temporality**, the participant can sweep across the musical strings to generate delayed Time Ghosts (`G1–G3`) that physically re-pluck the strings in time, and because of **Emergence**, that changes how ten autonomous sound orbs steer, flock, and bounce off Bumpers (`B1–B6`) to compose unscripted polyrhythmic music."*

---

## 2. How to Use & Alternative Inputs (Accessibility)

The interface is built to be immediately usable without explanation, while providing full keyboard alternatives for every interaction:

1. **Audio Unlock (1-Click):**
   - Click anywhere on the screen (or press **Space**, **Enter**, or **M**) to unlock Web Audio. A welcoming 3-note pentatonic chime plays immediately.
2. **Plucking the 8 Strings (`S1–S8`):**
   - **Pointer:** Sweep your mouse or finger up and down across the stage to pluck strings `S1 · A4` (top) down to `S8 · E3` (bottom).
   - **Keyboard Alternative:** Use the **Arrow Keys** (`↑`, `↓`, `←`, `→`) to move the keyboard cursor across the strings.
   - **Temporality in Action:** Three delayed Time Ghosts (`G1–G3`) follow behind your trail and re-pluck each string they cross!
3. **Placing Bounce Bumpers (`B1–B6`):**
   - **Pointer:** Click anywhere on the canvas stage to place up to 6 round Bumpers. Click an existing bumper to remove it.
   - **Keyboard Alternative:** Press **Space** or **Enter** at the current keyboard cursor position to place or toggle a bumper.
   - **Clear All:** Press the **✕ Clear Bumpers** button or hit key **C**.
4. **Echo Memory Slider (`⏳ ECHO MEMORY`):**
   - **Pointer:** Drag the slider (`0%` to `100%`).
   - **Keyboard Alternative:** Press **`[`** (decrease memory / shorter lag) or **`]`** (increase memory / longer lag).
   - Controls ghost lag (`280–650 ms`), trail decay (`1.2–7.0s`), and stereo echo (`8%–48%`). Memory below `20%` conceals ghost trails.
5. **Swarm Grouping Slider (`✦ SWARM GROUPING`):**
   - **Pointer:** Drag the slider (`0%` to `100%`).
   - **Keyboard Alternative:** Press **`Q`** (scatter orbs) or **`E`** (group orbs).
   - Controls orb flocking cohesion. Values $\ge 35\%$ reveal purple swarm webs; $\ge 4$ orbs clustering near a Ghost triggers a harmonic Vortex chord.
6. **Playback & Speed Controls:**
   - **Pause/Resume:** Click **❚❚ Pause** or press **`P`**.
   - **Speed (Slow / Normal / Fast):** Click **⏱ Speed** or press **`T`** to toggle time scale (`0.5×`, `1.0×`, `1.6×`).
   - **Reset:** Click **↺ Reset** or press **`R`**.

---

## 3. Academic Sources & Design Rules

1. **Hallnäs, L., & Redström, J. (2001).** *Slow technology – Designing for reflection.* Personal and Ubiquitous Computing, 5(3), 201–212. [PDF Link](https://www.ida.liu.se/~arzba60/Course/SlowTech.pdf)  
   - **Design Rule Governed (`js/rules.js` & `js/temporal.js`):** `RULES.ghostStepDelayMs(memory)` and `RULES.trailLifetimeMs(memory)` translate the Echo Memory slider into ghost lag (`280–650 ms`), trail lifetime (`1.2–7.0s`), and Web Audio stereo echo (`8%–48%`). Below `20%` memory, ghost trails are hidden.
2. **Reynolds, C. W. (1987).** *Flocks, herds and schools: A distributed behavioral model.* Computer Graphics (SIGGRAPH '87), 21(4), 25–34. [Paper Link](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/)  
   - **Design Rule Governed (`js/swarm.js` & `js/rules.js`):** Computes local steering vectors (separation, alignment, cohesion). Pushes beyond Reynolds' present-only model by introducing `CONFIG.swarm.ghostAttraction`, steering orbs toward delayed Time Ghosts.
3. **Juul, J. (2002).** *The open and the closed: Games of emergence and games of progression.* In Computer Games and Digital Cultures Conference Proceedings (pp. 323–329). Tampere University Press. [Article Link](https://www.jesperjuul.net/text/openandtheclosed.html)  
   - **Design Rule Governed (`js/audio.js`):** Generative music is driven by simple mechanical rules (orb-string collisions and bumper deflections) rather than a scripted progression or static audio loop.
4. **Seven, M. (2026).** *Interactive Media Applications lab.* (NMED 3203). [Lab Bibliography](https://mertseven.com/ima/lab/bibliography.html)  
   - **Premise Remix Origin:** Combines Premise 04 (*Ghost Chase*) with Premise 07 (*Boundary Lines*).

---

## 4. AI Usage Statement (Mandatory)

* **Tools Used & Purposes:**  
  I used Gemini (Google Antigravity) to assist with modularizing the JavaScript architecture (`config.js`, `rules.js`, `temporal.js`, `swarm.js`, `audio.js`, `render.js`, `main.js`), designing the CSS glassmorphism layout, and setting up the Web Audio compressor node.
* **Specific Rejections & Corrections of AI Output:**
  1. *Rejected Silent Abstract Lines in Favor of Labeled Musical Strings:* The initial AI-generated canvas created abstract floating geometric lines with no sound, requiring confusing user triggers. I rejected this design and replaced it with eight distinctly tuned pentatonic horizontal strings (`S1–S8`), labeled tactile Bumpers (`B1–B6`), and an immediate 1-click audio unlock banner.
  2. *Fixed Missing Ghost Sound Coupling:* In the first prototype, Time Ghosts were merely visual trailing circles. I corrected this by modifying `TEMPORAL.step` in `js/temporal.js` so that ghosts physically trigger string plucks with real delay when intersecting strings.
  3. *Refactored Scattered Constants into a Central Knobs Object:* The AI code originally scattered numeric values (`280`, `42`, `650`, `1.45`) throughout event listeners. I extracted every rule, delay, threshold, and count into `js/config.js` under the single `CONFIG` object to guarantee instant readiness for the presentation live change.

---

## 5. Live Code Modification Cheat Sheet (For Presentation)

During the in-class live presentation, the instructor will ask for an on-the-spot code change. All rules and numbers live in `js/config.js`:

* **"Make the delay twice as long":**  
  In `js/config.js` $\rightarrow$ `temporal`: change `minGhostDelayMs: 280` to `560` and `maxGhostDelayMs: 650` to `1300`.
* **"Change the number of ghosts or sound orbs":**  
  In `js/config.js` $\rightarrow$ `temporal.ghostCount` (`3 → 5`) or `swarm.count` (`10 → 20`).
* **"Add a rule that limits how often someone can act (rate limit)":**  
  In `js/config.js` $\rightarrow$ `boundaries.editCooldownMs` (`0 → 1000` for a 1-second bumper placement cooldown).
* **"Remove feedback from one mode":**  
  In `js/config.js` $\rightarrow$ `signals.ghostTrails: 2` (disables ghost trail visualization) or `signals.alignmentWeb: 2` (hides swarm web lines).

---

## 6. Credits & License

* **Audio:** Procedural Web Audio API polyphonic synthesizer with Dynamics Compressor and stereo ping-pong feedback delay.
* **Typography:** Inter & JetBrains Mono via Google Fonts.
* **Course:** NMED 3203 Interactive Media Applications, 2026.
