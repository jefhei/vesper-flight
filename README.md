# Vesper Flight

Fly an original **Hound-class torch corvette** — `BARROW`, HD-441 — through a hand-placed
K-dwarf system, in the browser, from outside the ship. No cockpit, no missions, no combat.

The exterior half of a pair: [`torchship`](https://github.com/jefhei/torchship) built the
inside of this hull. Same universe, same silhouette, same lighting rule.

**Status:** M0 — spikes and fixtures. Four URL-addressable experiments, not a game yet.

## Run it

```bash
npm ci
npm run dev
```

Then open `http://localhost:5173/?spike=feel`.

## The four M0 spikes

| URL | What it answers |
|---|---|
| `?spike=precision` | Does float32 hold a 45 m hull at 1.2M km? Keys `1`–`4` teleport; `&rebase=0` shows the raw world. |
| `?spike=lod&body=halcyon` | Does the quad-sphere planet survive a 12-step approach? `R` restarts, `W` wireframe. Bodies: `halcyon`, `tallow`, `cinder`, `sable`. |
| `?spike=feel` | Is assisted-Newtonian pleasant? `W/S` throttle, `↑↓` pitch, `A/D` yaw, `Q/E` roll, `X` drift, `Shift` fine. |
| `?spike=light` | Does the hull read lit by one star plus its own plume? `←/→` star azimuth, `↑/↓` throttle. |

Measured results and the design changes they forced: [`docs/spikes.md`](docs/spikes.md).

## What is real and what is a stand-in

Real: the ephemeris, the flight integrator and assist, the floating origin, the
quad-sphere LOD, the deterministic surface bake, the invariant tests.

Stand-in: the ship (white boxes), the plume (a scaled cone), the atmosphere (a tinted
shell), rings and the belt (not built), the HUD (a debug panel).

## Architecture rule

`src/lib/` never imports `three`. The simulation is plain TypeScript and runs headless in
vitest; `src/scene/` and `src/spike/` are the only places three.js appears. That is what
lets the closed-world invariants in `PRD.md` §8 be machine gates instead of opinions.

## Verify

```bash
npm run verify    # lint → typecheck → test → build
```

35 tests across 8 files: ephemeris determinism, world-spec validation, frame-rate
independence, assist convergence, 10-minute NaN sweep, 10,000-rebase precision, LOD
monotonicity and hysteresis, bake determinism.

## Docs

- [`PRD.md`](PRD.md) — requirements, contracts, invariants, budget, review loop
- [`BUILD_PLAN.md`](BUILD_PLAN.md) — M0–M6 tasks and gates
- [`docs/spikes.md`](docs/spikes.md) — M0 results
