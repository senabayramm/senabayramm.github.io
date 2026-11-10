# Design Rationale: Chrono Swarm (Temporality × Emergence)

## 1. Idea
I designed *Chrono Swarm* as an interactive 8-string harp where past cursor movements and autonomous bouncing orbs compose unscripted melodies. Instead of playing a fixed loop, the instrument turns time delay and swarm motion into musical rules. Through **Temporality**, the system records pointer movements across eight horizontal strings (`S1–S8`) and replays them via three delayed *Time Ghosts* (`G1–G3`); through **Emergence**, ten autonomous sound orbs flock around those ghosts, bounce off user-placed *Bumpers* (`B1–B6`), and pluck the strings to generate polyrhythmic music.

## 2. Premises: Temporality × Emergence
I coupled **Temporality** (`js/temporal.js`, `js/rules.js`) with **Emergence** (`js/swarm.js`, `js/audio.js`). As a user sweeps their mouse or arrow keys across the eight pentatonic strings (`S1–S8`), three delayed Time Ghosts (`G1–G3`) follow behind at `280–650 ms` intervals controlled by **Echo Memory** and re-pluck each string they cross. Clicking the stage places up to six round Bounce Bumpers (`B1–B6`). Meanwhile, ten autonomous sound orbs steer across the stage (**Swarm Grouping**), bouncing off the bumpers and plucking strings (`S1–S8`) on impact. When four or more orbs cluster around a ghost, a harmonic fifth chord swells. Lowering Echo Memory below `20%` hides ghost trails, while lowering Swarm Grouping below `35%` hides the purple swarm web.

## 3. Theory
Lars Hallnäs and Johan Redström argue that *Slow Technology* shifts interaction from immediate speed to reflection by exposing delay and persistence (Hallnäs & Redström, 2001). I applied this in `RULES.ghostStepDelayMs` and `RULES.trailLifetimeMs`, letting users stretch trail decay from `1.2s` to `7.0s` and stereo echo from `8%` to `48%`. Because raw delay can feel confusing, I labeled each ghost with its live lag (`-0.56s`) so time remains legible.

Craig Reynolds demonstrates that complex flocking arises from three local rules: separation, alignment, and cohesion (Reynolds, 1987). Since Reynolds models agents that react only to present neighbors, I extended his rules by pulling orbs toward time-delayed ghosts. Finally, Jesper Juul contrasts open *systems of emergence* with scripted *progression* (Juul, 2002). To keep emergent rules understandable, my glass telemetry deck explicitly states every input-to-output rule.

## 4. What I Learned
In my first version, triangles flew around abstract lines without clear musical targets, and browser autoplay rules kept audio silent until a hidden gesture occurred. In testing, I replaced abstract lines with eight vibrating musical strings (`S1–S8`), added a clear one-click sound unlock banner with a welcoming chime, and added round Bounce Bumpers (`B1–B6`) so every click and bounce produces an immediate, unmistakable musical note.

---

### Sources & Design Rules
- **Rule 1 – Temporal Delay & Echo Memory (`js/rules.js`, `js/temporal.js`):** Hallnäs, L., & Redström, J. (2001). Slow technology – Designing for reflection. *Personal and Ubiquitous Computing*, 5(3), 201–212. https://www.ida.liu.se/~arzba60/Course/SlowTech.pdf *(Maps Echo Memory `0–100%` to Ghost Lag `280–650ms`, trail lifetime `1.2–7.0s`, and stereo echo `8%–48%`, and hides Ghost Trails below `20%` memory.)*
- **Rule 2 – Decentralized Orb Flocking (`js/swarm.js`, `js/rules.js`):** Reynolds, C. W. (1987). Flocks, herds and schools: A distributed behavioral model. *Computer Graphics (SIGGRAPH '87)*, 21(4), 25–34. https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/ *(Computes local Separation, Alignment, and Cohesion vectors for 10 sound orbs and pulls them toward delayed Time Ghosts `G1–G3`.)*
- **Rule 3 – Open Emergent Melodies (`js/audio.js`, `js/config.js`):** Juul, J. (2002). The open and the closed: Games of emergence and games of progression. In *Computer Games and Digital Cultures Conference Proceedings* (pp. 323–329). Tampere University Press. https://www.jesperjuul.net/text/openandtheclosed.html *(Replaces fixed sequences with rule-driven bounces: orbs crossing Strings `S1–S8`, bouncing off Bumpers `B1–B6`, or clustering `≥4` orbs on a Ghost generate unscripted melodies.)*
- **Rule 4 – Premise Remix Inspiration:** Seven, M. (2026). *Interactive Media Applications lab.* (NMED 3203). https://mertseven.com/ima/lab/bibliography.html *(Combines Collection 04 `Ghost Chase` delayed ghost replay with Collection 07 `Boundary Lines` emergent swarm and boundary bounces.)*
