# Design Rationale: Chrono Swarm (Temporality × Emergence)

## 1. Idea
I designed *Chrono Swarm* as an interactive audio-visual instrument where past movements and local flocking rules generate unscripted music. Instead of triggering notes immediately on click, the stage treats time and autonomous motion as partner instruments. Through **Temporality**, the system records pointer gestures and replays them as delayed *Time Ghosts*; through **Emergence**, an autonomous flock of boids steers around those ghosts and reflects off user-drawn *Harmonic Boundary Lines* to compose polyrhythmic melodies.

## 2. Premises: Temporality × Emergence
I coupled **Temporality** (`js/temporal.js`, `js/rules.js`) with **Emergence** (`js/swarm.js`, `js/audio.js`). As a user moves across the canvas or presses the arrow keys, three delayed Time Ghosts (`G1–G3`) follow at `260–650 ms` intervals controlled by **Memory Persistence**. Clicking or dragging draws up to eight Harmonic Boundary Lines (`L1–L8`), each tuned to a Dorian scale degree. Meanwhile, 28 boids navigate the stage using local steering forces (**Swarm Cohesion**) while chasing the delayed Time Ghosts. Whenever a boid bounces off a boundary line or five boids cluster around a ghost, Web Audio plays glass plucks or an ambient fifth chord. Lowering Memory below `20%` hides ghost trails, while lowering Cohesion below `35%` hides the flock alignment web.

## 3. Theory
Lars Hallnäs and Johan Redström argue that *Slow Technology* shifts interaction from immediate efficiency to reflection by exposing delay and persistence (Hallnäs & Redström, 2001). I applied this in `RULES.ghostStepDelayMs` and `RULES.trailLifetimeMs`, letting users stretch trail decay from `1.4s` to `8.5s` and acoustic echo from `8%` to `44%`. Because raw delay can feel unresponsive, I labeled each ghost with its live lag (`-0.53s`) to keep time legible.

Craig Reynolds shows that complex flocking arises from three local rules: separation, alignment, and cohesion (Reynolds, 1987). Since Reynolds models agents that react only to present neighbors, I extended his rules by pulling boids toward time-delayed ghosts. Finally, Jesper Juul distinguishes open *systems of emergence* from scripted *progression* (Juul, 2002). While Juul notes emergent rules can feel opaque, my glass telemetry deck explicitly shows how every threshold shapes sound.

## 4. What I Learned
In my first prototype, boids chased the live cursor and got trapped vibrating inside boundary lines, causing audio clipping. In testing, I redirected boids toward the delayed Time Ghosts (`G1–G3`), added a `140 ms` bounce cooldown with normal reflection, and capped simultaneous voice triggers so rhythms stay clear.

---

### Sources & Design Rules
- **Rule 1 – Temporal Delay & Memory Decay (`js/rules.js`, `js/temporal.js`):** Hallnäs, L., & Redström, J. (2001). Slow technology – Designing for reflection. *Personal and Ubiquitous Computing*, 5(3), 201–212. https://www.ida.liu.se/~arzba60/Course/SlowTech.pdf *(Maps Memory Persistence `0–100%` to Ghost Lag `260–650ms`, trail lifetime `1.4–8.5s`, and stereo echo `8%–44%`, and hides Ghost Trails below `20%` memory.)*
- **Rule 2 – Decentralized Boid Flocking (`js/swarm.js`, `js/rules.js`):** Reynolds, C. W. (1987). Flocks, herds and schools: A distributed behavioral model. *Computer Graphics (SIGGRAPH '87)*, 21(4), 25–34. https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/ *(Computes local Separation, Alignment, and Cohesion vectors for 28 autonomous boids and extends them with orbital pull toward delayed Time Ghosts.)*
- **Rule 3 – Open Emergent Polyrhythms (`js/audio.js`, `js/config.js`):** Juul, J. (2002). The open and the closed: Games of emergence and games of progression. In *Computer Games and Digital Cultures Conference Proceedings* (pp. 323–329). Tampere University Press. https://www.jesperjuul.net/text/openandtheclosed.html *(Replaces fixed sequences with rule-driven collisions: boids reflecting off Boundary Lines `L1–L8` trigger Dorian chimes, while `≥5` clustered boids trigger a Phase Vortex chord swell.)*
- **Rule 4 – Premise Remix Inspiration:** Seven, M. (2026). *Interactive Media Applications lab.* (NMED 3203). https://mertseven.com/ima/lab/bibliography.html *(Combines Collection 04 `Ghost Chase` temporal trail replay with Collection 07 `Boundary Lines` emergent steering and boundary reflections.)*
