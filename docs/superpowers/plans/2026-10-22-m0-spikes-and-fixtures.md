# M0 Implementation Plan — Spikes & Fixtures

> **For agentic workers:** this plan is already executed. It is kept as the record of
> what M0 built and why, and as the template for M1's task-level plan.

**Goal:** answer the four questions the flight-sim premise rests on (precision, planet
LOD, flight feel, single-light hull) and check in three fixture systems plus an
invariant harness, before any art is commissioned.

**Architecture:** the simulation is pure TypeScript in `src/lib/` and never imports
three; `src/scene/` and `src/spike/` are the only three.js consumers. Every spike reads
its mode from the URL, so each is a linkable, repeatable experiment.

**Tech Stack:** Vite 8, React 19, R3F 9, three 0.185, vitest, oxlint, prettier.

**Spec:** `PRD.md` §8 (invariants), §11 (risks), §12 (milestones); `BUILD_PLAN.md` M0.

## Global Constraints

- `src/lib/` must not import `three`.
- All positions in `src/lib/` are km (float64); the scene converts to metres at its edge.
- Assets/bakes are deterministic from a seed — no `Math.random`, no canvas.
- `npm run verify` (lint → typecheck → test → build) is the machine gate.

## Review Focus

- A ship at 1.2M km from the origin (the playfield edge) must not jitter — S1.
- A planet on a 12-step approach must not pop, crack or swim — S2.
- 400 km/s of lateral drift must be gone in seconds, not trickle — S3.
- A hull lit by one source must still read as a shape — S4.
- A ship must never be dropped into the night side on load — the opening frame is the demo.

---

### Task 1: Contracts (files: `src/types/{math,world,flight,camera}.ts`)

Produces: `Vec3`, `Quat`, `SystemSpec`, `BodySpec`, `OrbitSpec`, `SurfaceSpec`,
`BodyState`, `BodyInstance`, `ShipState`, `InputFrame`, `FlightConfig`, `CameraRig`,
`CameraState`, `RenderFrame`.

- [x] Types only; no runtime code. `OrbitSpec` is a discriminated union (circular |
      elliptical) so the ephemeris compiles against both.

### Task 2: Ephemeris + validation (files: `src/lib/world/{ephemeris,validate,systems}.ts`)

Produces: `orbitalPositionKm(orbit, tS) -> Vec3`, `bodyPositionKm(id, spec, t, byId?)`,
`bodyStatesAt(spec, t)`, `stationPositionKm(spec, t)`, `validateSystemSpec(spec) -> string[]`.

- [x] Circular orbits are phase + 2πt/P; ellipses solve Kepler by Newton (12 iters).
- [x] Parent chains resolve recursively (moons get parent position + local orbit).
- [x] Fixtures: `TRIVIAL_SYSTEM`, `VESPER_SYSTEM`, `PATHOLOGICAL_SYSTEM` in `FIXTURES`.
- [x] Validator rejects: body intersecting the star, moon inside its parent, body past the
      playfield, short colour ramps, duplicate ids, sibling orbit rings closer than 2%.

Tests (`ephemeris.test.ts`, `validate.test.ts`): determinism, periodicity, parent chain,
comet bounds, 10M-second finiteness; validator accepts trivial/realistic and rejects
pathological for the right reasons.

### Task 3: Flight integrator (files: `src/lib/flight/{config,integrator}.ts`)

Produces: `DEFAULT_FLIGHT_CONFIG`, `FIXED_DT_S`, `stepShip`, `advance`,
`advanceAccumulated(acc, input, config, dt) -> {state, carryS}`, `shipForward`,
`speedKmS`, `velocityLateralKmS`.

- [x] Rate-commanded rotation with exponential ramp; quaternion integration (local frame).
- [x] Throttle governor: target speed along forward, τ = accelRamp/3; coast uses
      `assistCoastDecayS` in cruise.
- [x] Cruise assist damps lateral velocity exponentially; drift mode passes it through.
- [x] Non-finite guard returns the last good state.

Tests (`integrator.test.ts`): frame-rate step agreement, assist convergence, drift
preservation, 18 s speed ramp, rate ramp, assist toggle, 600 s random-input NaN sweep.

### Task 4: Floating origin (file: `src/lib/frame/origin.ts`)

Produces: `createOrigin`, `updateOrigin(cameraKm, origin, threshold=8, grid=1)`,
`toRenderKm`, `fromRenderKm`, `float32ErrorM`.

Tests (`origin.test.ts`): no rebase inside threshold, grid snap past it, 10,000 updates
with < 1 m drift, sub-millimetre near-field error, tens-of-metres error at 1e6 km.

### Task 5: Quad-sphere + LOD + surface bake (`src/lib/bodies/*`)

Produces: `quadSphere(level, radiusM, displace?, skirtDepth?) -> MeshData`,
`outwardFraction`, `radialErrorM`, `lodLevelFor(distanceKm, radiusKm, previous?)`,
`altitudeRadii`, `generateSurfaceMap(spec, w, h) -> {rgba, heights}`, `hashSurface`,
`displacementSampler`, `fbm3`, `ridged3`, `mulberry32`.

Tests: vertex/triangle counts, outward winding, on-sphere error, displacement, skirt
growth; LOD monotonicity + hysteresis; bake determinism, seed sensitivity, range, contrast.

### Task 6: Spike scenes (`src/spike/*`, `src/App.tsx`)

Produces: `?spike=precision|lod|feel|light`, each a self-contained experiment with a
numeric HUD panel.

- [x] `PrecisionSpike` — teleport presets, origin serial, float32 error in mm, `&rebase=0`
      contrast, 1 m rungs for the shimmer check.
- [x] `LodSpike` — automatic 12-step approach, live LOD/triangle readout, wireframe.
- [x] `FeelSpike` — keyboard flight on the real integrator, spring-arm chase camera,
      HUD (speed/throttle/assist/lateral/altitude/fps).
- [x] `LightSpike` — orbiting camera, star azimuth, plume throttle, single-light rig.

Gate: `npm run dev`, all four modes render, HUD numbers move, `npm run verify` green
(35 tests, 8 files).

## Results

See `docs/spikes.md` for the measured numbers and the design changes they forced
(rebase threshold, accumulator, assist tolerance, skirt radius, sun direction).
