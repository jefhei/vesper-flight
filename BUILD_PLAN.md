# Build Plan: Vesper Flight

A browser flight sim: fly an original Hound-class torch corvette through a hand-authored K-dwarf
system, external view, continuous world. See `PRD.md` for full requirements.

- **Stack:** Vite 8 + TS + React 19 + R3F 9 + drei + three 0.18x (`logarithmicDepthBuffer`), vitest,
  oxlint, prettier
- **Runtime:** client-only, static deploy, no backend
- **Progress trackers:** `.hermes/status.json` (read FIRST) + `.task-progress.json` — update BOTH
  after every task
- **Commit convention:** `feat: <task-id> — <description>`, then a separate
  `chore: <task-id> — tracker update`; push after each task

## Two Acceptance Regimes ★

- **Machine gate** — build/lint/test green; `[auto]` invariants (PRD §8) pass. Checkable in CI,
  per task.
- **Human review** — feel, theme fidelity, popping/jitter, lighting. Fixed test scenes, via the
  Review Loop at milestone boundaries only.

---

## M0 — Spike & Fixtures ★ (day 0–3) — HUMAN SESSIONS REQUIRED

> Do this before scheduling anything else. Four throwaway spikes answer the four questions the
> whole plan rests on. Nothing built here ships; what survives is the numbers and the fixtures.

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [x] M0-T1 | **S1 precision spike.** White-box 45 m box + one 4,200 km sphere. Fly to 1.2M km. Instrument render-space float32 error and record peak jitter; A/B log depth vs a near/far two-pass. Verdict: which frame strategy, and the rebase grid + threshold constants | — | 1 d |
| [x] M0-T2 | **S2 planet spike.** One gas giant (rings) + one ocean world (atmosphere), quad-sphere 4 levels, baked noise maps. 12-step approach per body, screen-recorded. Verdict: popping, seams, and whether one hero look per body is achievable | — | 1 d |
| [x] M0-T3 | **S3 feel spike.** White-box hull, chase camera, integrator + assist. 30 min of flying, tune `FlightConfig`. Verdict: the constant values M3 starts from | — | 0.5 d |
| [x] M0-T4 | **S4 light spike.** Single Vesper light + plume point light on the white-box hull; night-side readability. Verdict: does the ship read without fill light | M0-T1 | 0.5 d |
| [x] M0-T5 | Canonical fixtures checked in as `SystemSpec` constants: (a) `trivial` — star + one rock, (b) `realistic` — the full Vesper system, (c) `pathological` — 30,000 km body grazing the star, a body at the playfield edge, a moon at its parent's surface | M0-T1 | — |
| [x] M0-T6 | Stub the `[auto]` invariant harness (PRD §8) as runnable vitest tests against the fixtures — failing is fine, they are targets | M0-T5 | — |

**M0 machine half: DONE 2026-10-22.** 35 tests green across 8 files. Measured results and
the design changes they forced are in `docs/spikes.md`. The four *human* verdicts (jitter,
popping, feel, night-side readability) still need Jeff in a browser — everything is
addressable by URL (`?spike=precision|lod|feel|light`).

**Machine gate:** spike verdicts recorded in `docs/spikes.md` with numbers; fixtures load and
validate; harness runs. **MET.**
**Human review:** Jeff sits in a browser for each of S1–S4 and signs off on "no jitter", "no pop",
"feels good", "reads at night". **MET 2026-10-22 — clean, zero sev-1, feel accepted as tuned.**
**Exit:** the frame strategy is chosen, the LOD approach is proven or replaced, feel constants are
recorded, and three fixture systems exist in the repo. **ALL MET — M0 CLOSED.**

## M1 — Foundation & Contracts (day 4–5)

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M1-T1 | Scaffold app (Vite/TS/R3F, oxlint, prettier, vitest) using the planwalker scaffold recipe | M0 | 0.5 d |
| [ ] M1-T2 | Freeze the §7 contracts in `src/types/` (`SystemSpec`, `BodySpec`, `BodyInstance`, `ShipState`, `FlightConfig`, `CameraRig`, `TargetInfo`, `RenderFrame`) | M1-T1 | 0.5 d |
| [ ] M1-T3 | `src/lib/world`: ephemeris (circular + Kepler ellipse), `SystemSpec` validator, sim clock | M1-T2 | 0.5 d |
| [ ] M1-T4 | `tools/gen`: deterministic map generator + hashed manifest; `npm run assets` | M1-T1 | 0.5 d |
| [ ] M1-T5 | CI: lint + typecheck + test + build; invariant harness wired (PRD §8 `[auto]` rows) | M1-T3 | — |

**Machine gate:** app boots to an empty starfield; contracts compile; validator rejects a bad spec;
ephemeris determinism + closed-form tests pass; asset hashes match; CI green.

## M2 — Ship Exterior (day 6–9)

> Needs M0-S4's lighting to be judged. Split-commit per sub-part so the Review Loop can diff.

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M2-T1 | Hull: wedge prow, blunt bridge face, main body, drive bell + nozzle skirt — merged to ≤ 6 draw calls | M1-T2 | 1.5 d |
| [ ] M2-T2 | Greebles and wear: panel lines, hatches, dock ring, hazard striping, repair patch, nameplate `BARROW`/`HD-441` (canvas texture) | M2-T1 | 1 d |
| [ ] M2-T3 | Radiators (4): deployment pose, heat-driven emissive ramp with accumulate/decay | M2-T1 | 0.5 d |
| [ ] M2-T4 | Torch plume + nozzle point light; running lights; 12 RCS quad positions + puff VFX | M2-T1 | 1 d |

**Machine gate:** hull under draw-call ceiling; no NaN in plume/heat curves; nameplate texture
generated deterministically.
**Human review:** silhouette signed off against the torchship interior — same class, same wear; the
plume is the best-looking thing on screen.

## M3 — Flight & Camera (day 10–13)

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M3-T1 | `src/lib/flight`: fixed-step integrator (accumulator), throttle governor, rate-commanded rotation with ramp | M1-T2 | 1 d |
| [ ] M3-T2 | Assist controller: `CRUISE` lateral damping + coast decay; `DRIFT` pass-through; `X` toggle; `Shift` fine control | M3-T1 | 1 d |
| [ ] M3-T3 | Collision: push-out against body shells + playfield soft wall (no damage, no bounce) | M3-T1 | 0.5 d |
| [ ] M3-T4 | `src/lib/camera`: spring arm, critically damped lag, roll follow, free-look + ease-back, mode cycle, FOV kick | M1-T2 | 1 d |
| [ ] M3-T5 | Input mapping + `?script=<name>` deterministic input scripts for the invariant tests | M3-T2 | 0.5 d |

**Machine gate:** frame-rate independence (30/60/144 within 1 m/60 s), assist convergence < 1 m/s
in 3 s, 10-minute no-NaN run, push-out never leaves the ship inside a shell — all on all three
fixtures.
**Human review:** 30 unbroken minutes of flying; drift mode usable; chase camera never clips the
hull.

## M4 — System Bodies (day 14–18)

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M4-T1 | `src/lib/bodies`: quad-sphere generation, 4 LOD levels, skirts, distance table with hysteresis | M1-T4 | 1.5 d |
| [ ] M4-T2 | Surface materials from baked maps: colour ramps, emissive lava (Cinder), ice (Sable), ocean/icecap (Halcyon) | M4-T1 | 1 d |
| [ ] M4-T3 | Atmosphere shells + ring annulus with density texture + ring shadow band on Tallow | M4-T1 | 1 d |
| [ ] M4-T4 | Star: disc shader with granulation + limb darkening, corona shell, starfield point cloud | M1-T2 | 0.5 d |
| [ ] M4-T5 | Belt: 2,500 instanced rocks; Kettle station (can, truss, docking arm, approach lights) | M1-T2 | 1 d |
| [ ] M4-T6 | Ephemeris binding: `BodyInstance[]` per frame at the sim clock rate; Ashfall's Kepler ellipse | M1-T3 | — |

**Machine gate:** LOD monotonicity, spec validation, budget harness ≤ 16.6 ms, draw calls ≤ 60 on
the reference frame; degradation ladder switches actually fire.
**Human review:** 12-step approaches to Cinder/Halcyon/Tallow/Kettle with zero popping; terminator
and ring shadow read correctly.

## M5 — HUD & Navigation (day 19–21)

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M5-T1 | Prograde/retrograde reticles from the velocity vector; throttle bar; assist word; Vesper compass | M3-T2 | 1 d |
| [ ] M5-T2 | Target select (click + `Tab`), distance/closing/time-to-arrival math, off-screen indicator | M5-T1 | 0.5 d |
| [ ] M5-T3 | `F` nav-lock slerp; boundary warning; Kettle docking corridor + hold prompt | M5-T2 | 1 d |
| [ ] M5-T4 | Key legend, `?debug=1` overlay (fps, ms breakdown, origin, rebase serial, LOD levels) | M5-T1 | 0.5 d |

**Machine gate:** time-to-arrival monotonic as distance shrinks; targeting deterministic; HUD math
unit-tested headless.
**Human review:** a stranger reaches the first planet in 90 s with only the key legend.

## M6 — Integration, Perf & Review Loop (day 22–24)

| Task | Description | Depends On | Est. |
|------|-------------|------------|------|
| [ ] M6-T1 | Integration pass: everything bound to `RenderFrame`, no stream reaching into another's internals | all | 0.5 d |
| [ ] M6-T2 | Perf: hit the budget on the reference box; apply and verify the ladder | M6-T1 | 1 d |
| [ ] M6-T3 | Full Review Loop on all three fixtures + five canonical approaches | M6-T2 | 0.5 d |
| [ ] M6-T4 | Fix loop until exit rule met (zero sev-1; ≤ 8 sev-2) | M6-T3 | 1 d |
| [ ] M6-T5 | Deploy static build + README with screenshots and the key legend; cross-link torchship | M6-T4 | — |

**Machine gate:** all `[auto]` invariants green on all fixtures; verify green; deploy artifact
serves.
**Human review:** Review Loop exit rule met; the demo is something Jeff would send to someone.

---

## Parallel Streams (execution decomposition)

After the contracts freeze (M1-T2), five streams can run concurrently, one sub-agent each. Each
codes only against `src/types/`:

| Stream | Owns | Degradation target |
|---|---|---|
| world / ephemeris | `src/lib/world` | sim clock rate drops; orbits go circular |
| bodies / shading | `src/lib/bodies`, `src/scene/bodies` | LOD minus one; atmosphere → flat fresnel |
| ship model | `src/scene/ship` | greebles merged; radiators stop glowing |
| flight / camera | `src/lib/flight`, `src/lib/camera` | shake off; free-look ease-back instant |
| hud / nav + perf | `src/lib/hud`, `src/lib/frame` | reticles simplified; post FX off |

Integration is its own task (M6-T1), after which the loop begins.

## Execution Rules

1. Read `.hermes/status.json` AND this file at session start.
2. Resolve the next task by **dependency order**, not visual order.
3. Read ALL existing source in `src/` before writing new code.
4. `src/lib/` must never import `three` — that rule is what makes the invariants checkable in CI.
5. Implement properly — working code, not stubs. Extend tests: contracts, invariants, orbital
   determinism, assist convergence.
6. Run every stage against the M0 fixtures, never an ad-hoc scene.
7. Update both trackers after every task; commit trackers as their own `chore:` commit.
8. M0 and the human halves of M2/M4/M6 need Jeff in a browser; do not cron-gate visual judgement.

## Verification Gate — per task ★

**Machine gate (every task, blocks commit):**
- [ ] Code implemented + tests added/updated
- [ ] Relevant `[auto]` invariants pass on all three fixtures
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm run test` green
- [ ] `npm run build` green
- [ ] Trackers updated, committed, pushed

**Human review (milestone boundaries only):** run the Review Loop below.

## Review Loop — the artifact ★

1. **Load** each fixture by URL (`?system=trivial|realistic|pathological`) with `?debug=1`.
2. **Fly** the five canonical approaches: Cinder terminator, Halcyon limb, Tallow ring shadow,
   Kettle docking, the belt at cruise. 12 steps in, each.
3. **Check:** every `[review]` invariant (PRD §8); every §4 landmark; `?debug=1` frame budget;
   no popping, jitter, shimmer or clipping.
4. **Log** each defect: `{ severity: sev-1 | sev-2, fixture, location, repro }` into
   `.task-progress.json`, mirrored to `QA.md`.
5. **Fix**, then re-walk only the affected fixture and approach.
6. **Exit rule:** zero sev-1; ≤ 8 sev-2. Record the final log in `QA.md`.
