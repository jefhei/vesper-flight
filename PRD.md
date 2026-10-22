# Vesper Flight — Fly a Torch Corvette Through an Original Star System

**Product Requirements Document (PRD)**

> Companion to `torchship` (walkable Hound-class interior). Same universe, same hull, same
> lighting philosophy — this is the exterior that project parked as a stretch goal, given a
> system to fly through. Not a replica of any published ship or system: original names, original
> hull, original bodies. Genre position borrowed; the pixels are ours.

| Field | Value |
|---|---|
| Idea ID | `[local-2026-10-22-01]` |
| Category | 3D web / Three.js (R3F) |
| Difficulty | Intermediate |
| Status | Draft — design reviewed 2026-10-22 |
| Generated | 2026-10-22 |
| MVP Timeline | ~3 weeks (24 working days to demo) |
| **Generation paradigm** | **Hybrid** — a hand-authored SystemSpec, procedurally surfaced bodies (see §5) |
| Companion project | `torchship` (`~/code/software-projects/torchship/`) — shared universe, shared hull |

---

## 1. Executive Summary

Vesper Flight is a browser-based spaceship flight simulator viewed from outside the ship. You fly
an original **Hound-class fusion-torch corvette** — the `BARROW`, HD-441 — through a hand-placed
K-dwarf system: a tidally-locked molten rock, an ocean world with a moon, an asteroid belt you can
thread at speed, a fuel depot, an amber gas giant with rings that cast a shadow on its own cloud
tops, and a comet on a long ellipse. There is no cockpit, no mission, no combat. The whole product
is one system done well: **a ship that feels like it has mass, a camera that makes speed readable,
and a continuous world with no loading screens and no pop**.

The flight model is assisted Newtonian. Thrust is real — let go and you keep drifting — but a
flight assist damps you toward where the nose points. One key flips it off for pure Newtonian
drift, which is where the torchship feel lives and what every good-looking pass is flown in. Speed
is not the point; the *illusion of scale* is, and space has no trees to prove it, so the camera
carries that job: a spring arm with lag, FOV that opens with velocity, a torch plume that lengthens
under throttle.

The world is a **scale model, not a simulation**: bodies are ~1:20 true size, distances ~1:300, and
the ship's HUD speed is model-space. Nobody can tell, and it buys the two things that matter — you
can reach every body in the sky in 45–150 seconds, and one continuous scene holds a 45 m hull and a
600,000 km orbit at 60 fps. Precision comes from a floating origin (camera always renders near
zero, world rebases on a grid) plus a logarithmic depth buffer; planets are quad-sphere LOD stacks
with deterministic procedural surfaces baked by a committed generator.

This is the exterior half of a pair. `torchship` built the inside of this hull; Vesper Flight flies
it. The two demos cross-reference each other and share a name, a silhouette and a lighting rule.

## 2. Problem / Motivation

Browser space sims are split into two useless halves. On one side, orbit sims and model viewers:
beautiful static scenes, no ship that feels like anything, no reason to move. On the other,
dogfighters: twitchy arcade planes in a skybox, where the "planet" is a painted sphere you can
never reach and the star is a bloom sprite. Almost nothing in between — nothing that lets you fly
one good-looking ship through one coherent system, from outside, and simply *be there* for five
minutes.

The scale problem is why. A flight sim needs a 45 m hull and a 900,000 km orbit in the same scene;
naive WebGL dies on that in two ways — float32 positions lose ship-sized precision at planetary
distances, and a single depth buffer can't range from centimetres to millions of kilometres. Both
are solved problems (floating origin, log depth) but they're solved *architecturally*, before art,
which is why demos in this genre are either pretty dioramas or jittering tech tests.

And the ship matters as much as the system. The Expanse proved that a small, worn, working
starship reads as a character. `torchship` already built the inside of one. The exterior is the
missing half: the part you can put behind a 60-second clip.

## 3. Target Audience

**Primary:** Jeff, flying it for pleasure, and the people he sends the link to — sci-fi fans who
want to be in space for five minutes without a tutorial, a login, or a mission marker. Secondary
audience for the published demo: the AI Deep Dive channel's viewers as b-roll and as a build story.

**Secondary:** Three.js/R3F developers looking for a reference implementation of floating-origin
planetary scale in a browser; readers of the torchship build who want to see the hull from outside.

## 4. Art Direction / Theme Brief ★

**Theme: working torchship over an original K-dwarf system — "single light, real vacuum, worn hull"**

- **Reference imagery:** real spacecraft exteriors (ISS truss, Dragon, Apollo SM) for greeble
  density and scale discipline; naval/salvage working vessels for wear; astronomical imagery for
  body colour and terminator behaviour. The Expanse exterior *vibe* only — no published silhouette,
  livery, or name is copied. Reference board checked in at `docs/reference/`.
- **Mood / atmosphere:** quiet, vast, sunlit-on-one-side. Not a game sky; the sky is black and
  full of a real starfield. Everything is either lit by Vesper or by the ship. Time of day: n/a.
- **Palette:** Vesper's K-dwarf light is warm — pale amber-white, not blue-white. Hull is worn
  gunmetal with faded navy patches and one mismatched repair panel; amber hazard striping on the
  prow; radiators dull red under load; screens teal; running lights red port / green starboard /
  white masthead. Planets carry their own authored ramps: Cinder black-to-magma, Halcyon ocean
  blue-white-green, Tallow amber-cream bands, Sable cracked white-blue.
- **Signature landmarks (must be present, absence breaks the theme):**
  - **The hull reads as `BARROW`, HD-441** — same class, same proportions, same wear language as
    the torchship interior. Nameplate legible at chase distance.
  - **Live torch plume** aft, length and brightness tied to throttle, lighting the nozzle skirt and
    the radiator roots. This is the single most important visual in the whole demo.
  - **Four radiator panels** that glow under load and cool visibly when you coast.
  - **Tallow's ring shadow** on the gas giant's cloud tops — the detail that proves the lighting.
  - **Cinder's terminator** — a glowing molten seam with a black night face, visibly moving.
  - **Kettle depot** — a 200 m can and truss with one lit docking arm, your home dock, the scale
    reference that makes Halcyon behind it look impossible.
  - **The Sift** — enough rock in front of you that threading it is a thing you choose to do.
- **Material vocabulary:** scuffed painted steel, panel lines with grime streaks, ceramic heat
  shielding and heat-discoloured metal near the drive, hazard striping, canvas-ish thermal blanket
  patches, brushed radiator fins, matte everything (no chrome, no gloss, no bloom-crusted gem look).
- **Ambient / sound (post-MVP):** drive rumble scaled by throttle, radiator tick when cooling, RCS
  hiss, hull creak, a low ambient bed. MVP is silent.
- **Scale & extent:** one system, playfield radius 1.2M km. Bodies ~1:20 true size, orbits ~1:300.
  Ship 45 m nose-to-drive, 14 m beam. Navigable volume: the whole sphere, minus star and bodies.
- **Anti-goals:** not a dogfighter (no weapons, no enemies, no damage); not an arcade racer (no
  boost pads, no lap timers); not a hard-SF sim (no delta-v accounting, no n-body, no atmospheric
  flight); not a cockpit sim (external view only; cockpit is explicitly out of scope); no
  hyperspace/warp/FTL; no Nebula-class glossy sci-fi; no lens flares; no UI chrome that looks like
  a mobile game.

## 5. Generation Paradigm ★

- [ ] **Procedural** — *dominant risk: edge-case coverage; ugly or broken outputs on unusual parameters.*
- [ ] **Authored** — *dominant risk: tooling ergonomics and asset-pipeline friction.*
- [ ] **AI-generated** — *rejected: nondeterminism across a continuous world you must not see pop in.*
- [ ] **Reconstructed** — *rejected: no source data for an original fictional system.*
- [x] **Hybrid — authored SystemSpec + deterministic procedural surface detail.**

**Chosen paradigm & rationale:** the *placement* is authored — body count, radii, orbits, colours,
rings, atmosphere, station position are all hand-tuned constants in a typed `SystemSpec`, because
a hand-placed system is the only way to guarantee the composition works (the hero ocean world
between the molten rock and the gas giant, the belt at a distance that reads as a band from
Halcyon but as rocks up close, the depot where the drive plume can light it). The *surface* is
procedural — noise-derived albedo/height maps per body, generated deterministically from a seed by
`tools/gen`, because hand-painting eight planets is a week of work with nothing to show for it at
chase distance.

**Dominant risk: floating-origin precision and LOD continuity**, not art. If the ship jitters at
1M km, or a planet visibly steps LOD or cracks a seam while you approach it, the product fails its
own premise ("no pop, no shimmer") regardless of how good it looks. Both risks are front-loaded
into M0 (§11) and enforced by `[auto]` invariants (§8).

## 6. Feature Requirements

### 6.1 Must-Have (MVP)

**Source / authoring**
- One authored `SystemSpec` (Vesper), loaded from a typed constant module — no editor, no seed UI.
  A `?system=trivial|realistic|pathological` URL switch loads the M0 fixtures for review.
- Deterministic asset generation: `npm run assets` bakes body maps from seeds into `public/bodies/`
  with hashed manifests; CI asserts the hashes so "the planet looks different on Jeff's machine" is
  impossible.

**World / geometry**
- Star Vesper (K2V) with granulation disc shader, limb darkening, and a corona shell — no flare.
- Three planets (Cinder, Halcyon, Tallow), one comet (Ashfall), four moons — Nell around Halcyon,
  and Sable plus two small rocks around Tallow — one asteroid belt (~2,500 instanced rocks), one
  station (Kettle).
- Quad-sphere LOD planets: 6 faces, 4 levels, skirt geometry at LOD boundaries, displacement from
  the baked height map. Atmosphere shells (rim-lit scattering approximation), ring annulus with
  radial density texture and a shadow band on the planet.
- Analytic ephemeris: every orbit is a closed-form function of sim time (circular, or Kepler-solved
  ellipse for Ashfall), so positions are deterministic and testable without integration.
- Playfield boundary at 1.2M km: soft thrust wall + HUD notice, never a hard crash.

**The ship**
- Original Hound-class exterior, ~45 m: wedge prow with blunt bridge face, drive bell and nozzle
  skirt aft, four radiators, twelve RCS quads with puff VFX, two dorsal cargo hatches, shoulder dock
  ring, running lights, hazard striping, repair patch, `BARROW` / `HD-441` nameplate.
- Torch plume: additive cone with noise flicker, length/brightness driven by throttle, plus a
  point light at the nozzle that lights the skirt, radiators and nearby geometry.
- Radiator glow accumulates with throttle time and decays after — visible heat management, no
  mechanic attached.

**Flight & camera**
- Assisted-Newtonian flight: rate-commanded rotation (22 deg/s pitch/yaw, 45 deg/s roll, 0.15 s
  ramp), throttle with an ~18 s exponential ramp to 1,200 km/s, symmetric reverse.
- Two modes: `CRUISE` (assist on: lateral velocity nulled in <1 s, forward decay 0.4 g at zero
  throttle) and `DRIFT` (pure Newtonian, torque-only). `X` toggles. **Tuned in M0:**
  lateral time constant 0.35 s (400 km/s of drift to under 1 m/s in 5 s), coast decay
  time constant 20 s.
- RCS strafe at 0.3 g for docking; `Shift` scales all rates to 10% for fine work.
- Chase camera: 40 m aft / 12 m up spring arm, critically damped, looks 25 m ahead of the nose,
  roll follow 0.6. Right-drag free-look ±120° yaw / ±60° pitch, 1.5 s ease-back. `C` cycles to a
  slow cinematic auto-orbit.
- Speed readability: FOV 55→68° with velocity, subtle shake above 60% throttle, plume scaling.
- No collision damage: the ship is pushed out of bodies (a visual-hard-stop at the surface shell),
  never destroyed, never bounced into a spin. Fly-through of rocks is a `[review]` cosmetic defect,
  not a crash.

**HUD & navigation**
- Prograde/retrograde reticles bound to the velocity vector; target select by click or `Tab`;
  distance, closing rate and time-to-arrival to target; throttle bar; assist-mode word; Vesper
  compass tick; playfield-boundary warning.
- `F` nav-lock: slerp the nose onto the selected target. Deliberately the most-used key.
- Kettle docking assist: within 200 m, a lit approach corridor and a hold-still prompt; docking is
  visual only (no sim state change in MVP).

### 6.2 Nice-to-Have (Post-MVP)

- Sound design (§4) — drive, radiators, RCS, ambient bed.
- Cockpit / bridge interior view bridged from torchship's interior (the pair payoff; large).
- Photo mode: pause, free camera, hide HUD, exposure controls, screenshot.
- Gamepad support; camera "flyby" mode (fixed point camera tracking the ship as it passes).
- Day/night over Kettle lights; docking actually transfers you into the torchship interior build.
- Time rate control (watch Cinder move, watch Ashfall swing out).
- Multiple systems from the same `SystemSpec` shape (a second authored system, not procedural).

## 7. Data Contracts ★

All of these live in `src/types/` and are frozen before parallel streams start. Streams code
against these interfaces and nothing else.

- **`SystemSpec`** (authored constant → world): the entire system as data.
  ```ts
  type SystemSpec = {
    id: string; name: string; seed: number;
    star: StarSpec;
    bodies: BodySpec[];            // planets, moons, comet; parentId orders the hierarchy
    belt?: BeltSpec; station?: StationSpec;
    playfieldRadiusKm: number;     // 1_200_000
    simClockRate: number;          // sim seconds per real second (1 = real time)
  };
  type StarSpec = { name: string; spectralClass: string; radiusKm: number;
                    colorK: number; luminosity: number; coronaScale: number };
  type OrbitSpec =
    | { kind: 'circular';  radiusKm: number; periodS: number; phaseRad: number; inclinationRad: number }
    | { kind: 'elliptical'; periapsisKm: number; apoapsisKm: number; periodS: number;
        phaseRad: number; inclinationRad: number };
  type BodySpec = {
    id: string; name: string;
    kind: 'rock' | 'ocean' | 'gas' | 'ice' | 'comet';
    radiusKm: number;
    parentId: string | null;       // null = orbits the star
    orbit: OrbitSpec; rotationPeriodS: number; axialTiltRad: number; tidalLock: boolean;
    surface: SurfaceSpec;
    atmosphere?: { heightKm: number; colorK: number; density: number };
    rings?: { innerKm: number; outerKm: number; densityMap: string };
  };
  type SurfaceSpec = {                       // what tools/gen bakes
    mapResolution: [number, number]; noiseSeed: number;
    colorRamp: string[];                     // authored 4–6 stops, low → high elevation
    features: Array<{ kind: 'craters'|'bands'|'continents'|'cracks'|'icecaps'; weight: number }>;
    emissive?: { kind: 'lava' | 'none'; intensity: number };
  };
  ```
- **`BodyInstance`** (ephemeris → renderer): per-frame state, the only way the renderer learns
  where anything is.
  ```ts
  type BodyInstance = { bodyId: string; worldPosKm: Vec3; radiusKm: number;
                        distanceToCameraKm: number; lodLevel: 0|1|2|3; sunAngleRad: number };
  ```
- **`FlightConfig` + `ShipState`** (feel → integrator → renderer). `FlightConfig` is a single
  exported constant object: maxSpeedKmS 1200, accelRampS 18, pitchYawRateRadS, rollRateRadS,
  rateRampS, assistLateralDampS, assistCoastDampG, rcsStrafeAccelG, fineControlScale. `ShipState`
  = `{ posKm, velKmS, quat, angVelRadS, throttle, assist: 'cruise'|'drift', dock: boolean }`.
- **`CameraRig` + `CameraState`** (camera): mode, armM/heightM/lookAheadM, rollFollow, fov curve,
  free-look offsets, eased-return timer.
- **`TargetInfo`** (hud): `{ bodyId, distanceKm, closingKmS, timeToArrivalS | null, screenVec | null }`.
- **`RenderFrame`** (frame → scene): `{ originKm, rebaseSerial, bodies: BodyInstance[], ship, camera }`.
  Everything the R3F layer draws comes from this one object; nothing in `src/scene/` computes flight
  or orbital state itself.

## 8. Closed-World Invariants ★

- **[auto]** Integrator is frame-rate independent: at 30/60/144 fps the fixed-step count
  over 60 s agrees within 1, and the trajectories agree to within one step of travel
  (10 km at cruise).
- **[auto]** Assist converges: from any lateral velocity ≤ 400 km/s, `CRUISE` reaches |v_lateral| < 1 m/s
  within 5 s.
- **[auto]** No NaN/Infinity in position, velocity or quaternion across a 10-minute simulated flight
  at max throttle with random inputs.
- **[auto]** Floating-origin rebase is exact: after 10,000 updates, world position recovered from
  `originKm + renderPos` equals the integrated position within 1 m; render-space float32 error at
  the hull stays sub-millimetre with rebasing on.
- **[auto]** LOD level is monotonic in distance for every body (never steps back out while approaching)
  and matches the distance table within one step of hysteresis.
- **[auto]** Ephemeris is deterministic and closed-form: `pos(t)` called twice with the same t is
  bit-identical; no integration drift over 10M sim seconds.
- **[auto]** `SystemSpec` validates: every body inside `playfieldRadiusKm`, no two orbits intersect,
  no moon orbits inside its parent's radius, all radii > 0, all colour ramps ≥ 4 stops, comet
  periapsis > star radius.
- **[auto]** No body geometry intersects the ship's spawn: spawn is ≥ 5 body radii from any surface
  and inside the playfield.
- **[auto]** Baked assets match their manifest hashes (deterministic generation).
- **[auto]** Frame budget harness: reference scene under 16.6 ms on the reference box (§10).
- **[review]** No visible LOD popping or seam cracking on a 12-step approach to any body.
- **[review]** Ship cannot be flown through a planet, star or the depot (pushed out, never clipped).
- **[review]** Terminator and night side read correctly — dark, not black, no light leaking through
  the atmosphere shell.
- **[review]** The hull is recognizably the same ship as torchship's interior (silhouette, proportions,
  wear language, nameplate).
- **[review]** Camera never clips into the hull in any mode; no unintended escape past the playfield.
- **[review]** 60 fps at 1080p on the reference box while threading the belt at cruise.

## 9. Technical Architecture (High-Level)

```
[browser / client-only]
  SystemSpec (authored const) ──(SystemSpec)──▶ ephemeris ──(BodyInstance[])──┐
                                                                              │
  tools/gen (seeds) ──(baked maps + manifest)──▶ body meshes / materials ─────┤
                                                                              ▼
  keyboard/mouse ──(InputFrame)──▶ flight integrator ──(ShipState)──▶ frame (floating origin)
                                        ▲                                 │
                                  FlightConfig                            ▼
                                                                   R3F scene graph
                                                                     ├─ star + corona
                                        camera rig ◀──(CameraState)──┤  ├─ planets (LOD)
                                             │                       │  ├─ rings, belt, station
                                             └──────(CameraState)────┤  ├─ ship + plume
                                                                     │  └─ lights (Vesper + ship)
                                        hud ◀──(BodyInstance, ShipState, TargetInfo)
```

- **Stack:** Vite 8 + TypeScript + React 19 + `@react-three/fiber` 9 + `@react-three/drei` +
  `three` 0.18x with the depth strategy chosen by M0-S1 (log depth by default, near/far two-pass if
  it fails), vitest for headless tests, oxlint + prettier.
- **Runtime:** client-only, no backend, no network at runtime. Static deploy.
- **Hard rule:** `src/lib/` never imports `three`. The simulation is pure TS and testable in node;
  `src/scene/` is the only place three.js appears.
- **Frame strategy (settled in M0-S1):** floating origin with an **8 km threshold and a 1 km
  grid** — ship-scale on purpose. Measured at the playfield edge: **57.3 m** of float32 error
  with no rebase (1.3× the hull length) versus **0.000 mm** with it. `logarithmicDepthBuffer`
  is on; the near/far two-pass fallback is not needed at the measured numbers.
- **Integrator:** fixed 120 Hz `stepShip`, driven by `advanceAccumulated`, which carries the
  sub-step remainder across frames. Fixed steps alone are not enough — 30 fps and 144 fps
  drifted ~10 km apart over a minute of cruise until the remainder was carried.

## 10. Fidelity / Performance Budget ★

**Target: 60 fps → 16.6 ms/frame** at 1920×1080 on the reference box (i7-6700K + RTX 3070, the
debian1-class desktop; also verified on a laptop iGPU at 30 fps with the ladder applied), reference
scene = chase camera 40 m off the hull with Halcyon in frame and the belt behind it.

| Budget line | Allocation (ms) | Notes |
|---|---|---|
| Planets + atmospheres | 6.0 | ≤ 3 bodies in frame at once; `lodLevel` from a distance table |
| Ship (hull + plume + radiators) | 1.0 | One merged hull mesh, ≤ 6 draw calls |
| Belt / belt-shadow instance pass | 2.0 | 2,500 rocks, 1 instanced draw call |
| Star + corona + starfield | 2.0 | Disc shader, one corona shell, one point cloud |
| Post-processing | 3.0 | Tone map + light bloom only; no SSAO, no DoF |
| JS (flight + camera + HUD) | 1.0 | Budget for one 60 Hz tick, excluding render |
| Slack | 1.6 | |

**Degradation ladder (drop top-first when over budget):**
1. Post-processing off (tone map only)
2. Belt instances 2,500 → 600, rock poly count halved
3. Atmosphere shells → flat fresnel rim (no scattering term)
4. Planet LOD table shifted one level closer (world loads 4 levels instead of 5)
5. Ring shadow band → none
6. Ship greebles → merged silhouette, radiators stop glowing

LOD, instancing and frustum culling are **MVP concerns here**, not post-MVP: the belt and the
planets both blow the budget without them.

## 11. Risks & Spikes ★

| Risk | Why it's scary | De-risking spike (M0) | Fallback if it fails |
|---|---|---|---|
| **Float32 precision at planetary distance** | If the hull jitters or the nameplate swims at 600,000 km, the entire premise (a continuous honest world) is dead | S1: white-box hull + one body, fly to 1.2M km, instrument peak render-space error and any visible jitter; try log depth and a near/far two-pass. **DONE: 57.3 m without rebase, 0.000 mm with 8 km/1 km rebasing** | Near/far two-pass always (separate far scene with its own camera); coarser rebase grid |
| **Planet LOD continuity** | Popping or cracked seams break the "no pop" promise exactly when the camera is closest to a planet | S2: one gas giant + one ocean world, 12 approach steps, screen-recorded, look for step/shimmer | Add skirts + geomorph (blend two LODs in the vertex shader); or drop to 3 LOD levels and accept a higher base poly count |
| **Flight feel** | Assisted Newtonian is easy to make floaty, mushy or twitchy; it is the difference between flying and fighting | S3: white-box ship, chase cam, tune `FlightConfig` by hand for 30 minutes of flying | Fall back toward heavier damping (assist always on) with drift as a bonus mode |
| **Procedural surfaces look like mud** | Noise-based planets read as grey mush; the demo's whole beauty is body colour | S2 includes one hero look per body judged before M4 | Authored colour ramps become authored albedo maps for the two hero bodies only |
| **Post-FX + log depth incompatibility** | three.js post passes can behave badly with log depth (ghosted depth, bloom bleed) | S1/S4 both render with post on | Render post without depth-dependent effects (tone map + bloom only, no DoF/SSAO — already the plan) |

## 12. Milestones & Timeline

| Milestone | Name | Days | Exit Criteria (machine + human) |
|---|---|---|---|
| M0 | Spike & Fixtures | 3 | **DONE (machine half)** — S1 PASS (0.000 mm at 1.2M km with rebasing vs 57.3 m without), S2 PASS (LOD winding 1.000, deterministic bake, seam artifact logged), S3 PASS (step agreement, 5 s assist convergence, 600 s NaN-free); S1–S4 human verdicts pending |
| M1 | Foundation & Contracts | 2 | App boots, contracts compile, CI green, ephemeris + spec validation tests pass |
| M2 | Ship Exterior | 4 | Hull renders with plume + radiators; hull silhouette signed off against torchship |
| M3 | Flight & Camera | 4 | Frame-rate independence, assist convergence, no-NaN invariants pass; human "feels good" |
| M4 | System Bodies | 5 | All bodies + belt + station render; LOD/no-pop invariants pass; budget met |
| M5 | HUD & Navigation | 3 | Targeting, nav-lock, compass, boundary wall tested; docking assist works |
| M6 | Integration, Perf & Review Loop | 3 | Review Loop exit rule met; static build deployed |

Total ≈ 24 working days. Visual milestones (M0, M2, M4) require human browser sessions and cannot
be cron-gated; the build cron starts at M1 and runs the non-visual work.

## 13. Success Metrics

**Machine-verifiable**
- `npm run verify` green (lint + typecheck + test + build) on every commit.
- All `[auto]` invariants (§8) pass on all three fixture systems.
- Budget harness: reference scene ≤ 16.6 ms; ≤ 60 draw calls in the reference frame.
- Baked-asset manifest hashes match on a clean checkout.

**Human-verifiable (via the review loop, §14)**
- Theme fidelity: every §4 signature landmark present and recognizable; hull reads as the same
  ship as torchship.
- Flight feel: 30 unbroken minutes of flying, no "why did it do that" moment; drift mode is usable
  without a HUD tutorial.
- No visible popping, shimmer, jitter or clipping on any 12-step approach.
- Onboarding: a stranger reaches the first planet within 90 seconds of page load, with no text
  beyond the key legend.

## 14. Review Loop Definition ★

- **Test scenes:** the three M0 fixtures (`trivial`, `realistic`, `pathological`), loaded by URL
  switch, plus the canonical approach scripts — 12 steps into each body: Cinder (terminator),
  Halcyon (atmosphere limb), Tallow (ring shadow), Kettle (docking), the belt (threading at cruise).
- **Checklist:** every `[review]` invariant (§8) + every §4 signature landmark + the frame budget
  readout displayed in the debug overlay (`?debug=1`).
- **Defect log:** `{ severity: sev-1 (breaks the world / the promise) | sev-2 (cosmetic), fixture,
  location, repro }`, recorded in `.task-progress.json` and mirrored to `QA.md`.
- **Exit rule (honest):** zero sev-1; ≤ 8 sev-2. Procedural surfaces at chase distance will always
  have cosmetic defects; an unreachable "zero defects" gate just gets waived.

---

*Template v1 (3D-world projects) — §4, §5, §7, §8, §10, §11 filled first, per its own guidance.
Name `BARROW` / HD-441 is shared with the torchship build and can be changed in one place
(`src/lib/world/vesper.ts` + the nameplate texture).*
