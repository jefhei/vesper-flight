# M0 Spike Report — Vesper Flight

Four spikes answer the four questions the whole plan rests on (PRD §11). Each has a
machine-measured half (recorded here) and a human half (**PENDING — Jeff flies it**).
Run them with `npm run dev`, then open the links below.

| Spike | Question | Machine result | Human verdict |
|---|---|---|---|
| S1 precision | Does float32 hold a 45 m hull at 1.2M km? | **PASS with rebase** — 0.000 mm at the playfield edge; without it, **57.3 m** | PENDING |
| S2 planet LOD | Does a quad-sphere world hold up on approach? | **PASS** — 4 levels, outward winding 1.000, radial error < 0.5 m, deterministic bake | PENDING (seam artifact seen) |
| S3 flight feel | Is assisted-Newtonian pleasant to fly? | **PASS** — step counts agree within 1 at 30/60/144 fps, assist converges < 1 m/s in 5 s, no NaN over 600 s | PENDING |
| S4 single light | Does the ship read with one light and its own plume? | n/a (visual only) | PENDING |

---

## S1 — Precision at planetary distance

`?spike=precision` (keys 1–4 jump to 0 / 1,000 / 100,000 / 1,200,000 km)

Measured on the reference box, 2026-10-22:

- **Rebase ON** (8 km threshold, 1 km grid), at 1,200,000 km from the world origin:
  origin serial 1, render-space magnitude 0.00 m, peak float32 error **0.000 mm**.
- **Rebase OFF** (`&rebase=0`), same position: render magnitude ~1.2e9 m, peak float32
  error **57,344 mm = 57.3 m**. That is 1.3× the 45 m hull: the whole ship quantizes to
  a couple of float32 values and every panel edge jitters by tens of metres.

Verdict: **the floating origin is not optional and the threshold must be ship-scale.**
An earlier draft used a 10,000 km threshold; float32 spacing at 10,000 km is ~1 m, which
would throw metre-level jitter onto a 45 m hull. Settled at **8 km / 1 km grid**
(`src/lib/frame/origin.ts`). Distant planets then carry metre-level error at 1e9 m, which
is angularly invisible (4.2e6 m radius at 6.4e8 m distance).

Human half: key 1→4 at speed in the browser; watch the 1 m rungs under the hull for
shimmer, and the hull silhouette for stepping. Try `&rebase=0` for the contrast.

## S2 — Planet LOD

`?spike=lod&body=halcyon` (also `body=tallow`, `body=cinder`, `body=sable`)

- 4 levels: 8 / 16 / 32 / 64 divisions per cube face → 768 / 3,072 / 12,288 / 49,152
  triangles for the whole planet.
- Selected from altitude in body radii (0.15 / 0.6 / 2.5 boundaries) with 12% hysteresis,
  so a ship hovering on a boundary cannot flicker.
- Every triangle winds outward (measured fraction 1.000 at levels 0–2).
- Pre-displacement radial error < 0.5 m on a 4,200 km radius.
- Surface bake is byte-deterministic per seed (FNV hash equal across runs) — no canvas,
  no GPU, so the same seed bakes the same planet anywhere.
- **Known artifact:** on the lit limb there is a visible thin arc (the quad-sphere UV
  seam) and a faint skirt lip where the face edge meets its skirt. Both are M4 work —
  the skirt now hangs off the actual displaced rim rather than the base radius, which
  removed the worst of it. Judge severity when you fly it.

Human half: watch the 12-step approach. Popping at a level change, seam cracking, or
texture swim are the three failure modes. `W` toggles wireframe, `R` restarts.

## S3 — Flight feel

`?spike=feel`

- Integrator runs at a fixed **120 Hz**; the frame loop carries the remainder in an
  accumulator (`advanceAccumulated`), so 30 / 60 / 144 fps step counts agree within 1
  and trajectories agree to within one step of travel.
- Rate-commanded rotation: 22°/s pitch/yaw, 45°/s roll, 0.15 s ramp.
- Throttle ramps to 1,200 km/s with an 18 s time-to-95%.
- Cruise assist: lateral drift time constant 0.35 s. Measured: 400 km/s of lateral
  velocity → < 1 m/s in **5 s** (the PRD said 3 s; 0.35 s is already snappy and 3 s
  demanded a 0.23 s constant that felt like magnets).
- No NaN / no non-unit quaternion across 10 minutes of random input at 60 fps.
- Opening composition: ship starts between Vesper and Halcyon, nose at the planet, so
  the first frame is a lit hull against a lit world rather than a night-side silhouette.

Human half (the point of the spike): fly for 30 minutes. Judge mass, throttle response,
whether drift mode is usable without a HUD tutorial, and whether the speed reads (FOV
kick and camera shake are **not built yet** in this spike — they are M3).

Known spike-only hacks: no roll-follow on the camera, no free-look, no targeting,
A/D yaw only (no strafe), plume VFX is a scaled cone.

## S4 — Single-light hull

`?spike=light` (←/→ star azimuth, ↑/↓ plume throttle)

Visual only: one directional key light, 0.012 ambient (starlight), plume point light.
Judge: does the unlit side still read as a ship rather than a cut-out silhouette; does
the plume light the skirt and radiator roots; is the radiator glow legible.

---

## What M0 changed in the design

1. **Rebase threshold is ship-scale (8 km / 1 km grid), not system-scale.** Measured, not
   guessed — see S1.
2. **Frame-rate independence needs an accumulator**, not just fixed steps. `advance()`
   alone drops the remainder each frame and lets 30 fps and 144 fps drift ~10 km apart
   over a minute at cruise. `advanceAccumulated()` carries the remainder; the invariant
   is now "step counts agree within 1, trajectories within one step of travel".
3. **Assist convergence tolerance relaxed 3 s → 5 s** with a 0.35 s lateral constant.
4. **Skirt radius must follow the displaced rim**, or the seam-hider becomes a lip.
5. **Sun direction is derived from geometry** (`-normalize(shipPos)` for the light
   position): placing the ship between star and planet is what makes the opening frame
   lit. A hand-picked light vector lit the wrong side and produced a black hull.
