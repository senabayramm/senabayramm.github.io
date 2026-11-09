# NMED 3203 · Interactive Media Applications (IMA) Lab

**Student:** Sena Bayram (@senabayramm)  
**Submission Date:** 10 November 2026

---

## 🌟 Assignment Submission: Chrono Swarm (Temporality × Emergence)

* **Live GitHub Pages URL:** [https://senabayramm.github.io/interaktif/](https://senabayramm.github.io/interaktif/)
* **Design Rationale (353 words):** [RATIONALE.md](./RATIONALE.md) / [interaktif/RATIONALE.md](./interaktif/RATIONALE.md)
* **Full Documentation & Live Change Cheat Sheet:** [interaktif/README.md](./interaktif/README.md)

### Premise Combination
* **Premise A — Temporality (04 · *Ghost Chase*):** Interaction happens in time. Pointer trajectories across eight musical strings (`S1–S8`) are replayed by three delayed Time Ghosts (`G1–G3`).
* **Premise B — Emergence (07 · *Boundary Lines*):** Experience cannot be fully predetermined. Ten autonomous sound orbs flock dynamically, steer toward delayed ghosts, bounce off user-placed Bumpers (`B1–B6`), and pluck strings into unscripted melodies.

> **Premise Coupling Sentence:**  
> *"Because of **Temporality**, the participant can sweep across musical strings to generate delayed Time Ghosts (`G1–G3`) that physically re-pluck the strings in time, and because of **Emergence**, that changes how ten autonomous sound orbs steer, flock, and bounce off Bumpers (`B1–B6`) to compose unscripted polyrhythmic music."*

---

## AI Usage Statement (Mandatory)
* **Tools Used & Purposes:** I used Gemini (in Google Antigravity) to assist in modularizing the code (`config.js`, `rules.js`, `temporal.js`, `swarm.js`, `audio.js`, `render.js`, `main.js`), tuning the Web Audio dynamics compressor and delay network, and structuring the presentation live change controls.
* **Rejected / Corrected Output:**
  1. *Rejected Silent Geometric Lines:* The original AI output generated silent visual lines without sound. I replaced them with eight tuned pentatonic strings (`S1–S8`) and a 1-click audio unlock banner.
  2. *Coupled Delayed Ghosts to Sound:* The AI only rendered ghosts visually. I updated `TEMPORAL.step` so that ghosts physically trigger delayed string plucks.
  3. *Centralized Settings Object:* The AI code originally scattered hardcoded numbers across event listeners. I organized all parameters into `CONFIG` in `js/config.js` for instant live modification during the presentation.

---

## Alternative Inputs & Accessibility
* Full keyboard navigation: Arrow keys (`↑`, `↓`, `←`, `→`) move the cursor across strings `S1–S8`.
* `Space` / `Enter` places or removes Bumpers (`B1–B6`).
* `[` and `]` control Echo Memory; `Q` and `E` control Swarm Grouping.
* `M` mutes/unmutes, `P` pauses/resumes, `T` changes time scale (`0.5×`, `1.0×`, `1.6×`), `C` clears bumpers, `R` resets state.
* Screen reader live regions (`aria-live="polite"`) announce state changes. Meaning is never carried by color alone (all strings, ghosts, and bumpers carry alphanumeric labels).
