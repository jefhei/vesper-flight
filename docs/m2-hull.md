# M2 — The Hound-class exterior

The ship in the demo is now the authored hull, not the white box. This is the review surface
for M2: `?spike=light` (renamed in the panel to **M2 · HULL — SINGLE LIGHT**).

## How to look at it

```
?spike=light                       slow orbit, live
?spike=light&orbit=1.5708&pause=1  dead side-on, no rotation
?spike=light&orbit=0.2&pause=1     aft, drive bell + plume
?spike=light&orbit=3.1416&pause=1  nose-on
```

Keys: `←/→` star azimuth, `↑/↓` plume throttle, `[` `]` zoom (45–170 m).
`?spike=feel` flies the same hull in the system.

## What is built

- **75 parts**, authored as data in `src/lib/ship/hullSpec.ts` — not a GLTF. The spec is the
  source of truth; the mesh is generated from it, so the parts list, the landmarks and the tests
  cannot drift apart.
- **Merged to 6 draw calls** (budget 6): one vertex-coloured plating mesh, one radiator/heat mesh,
  one vertex-coloured running-light mesh, the nameplate plane, two plume cones.
- **Silhouette:** tapered prow wedge (6.2 m face expanding to 12 m) → bridge block with a slanted
  visor and a dark viewport band → 14 × 10 m main body → aft taper → drive collar → open drive bell
  → nozzle lip. Dorsal spine with two cargo hatches and the nameplate; keel fin aft; two dorsal
  tanks; four deployed radiator panels on booms; twelve RCS quads, three per corner.
- **Wear pass:** navy panel bands, five seam lines per flank and dorsal, one mismatched repair
  patch per side, hazard striping on the prow, black service vents, two conduits down the spine.
- **Nameplate:** 1024×210 canvas texture, `BARROW` + `HD-441`, grime streaks, on a dark backing
  plate on the spine. Deterministic — no external asset.
- **Radiators:** dull maroon at 35% throttle, heat accumulates on thrust and decays when coasting
  (`emissiveIntensity = 0.01 + heat × 0.16`), and the nozzle throat rides the same material so the
  drive glows with them.
- **Plume:** additive amber envelope + hot core, length/brightness/opacity scaled by throttle, one
  point light at the throat lighting the skirt and the radiator roots.

## Judgment calls worth knowing

- **Colour comes from vertex colours, one material.** Metalness and roughness are uniform across
  the whole plating merge. That is why the hull is a single draw call — and why the drive bell
  cannot be glossier than the paint without splitting the mesh.
- **The key light is deliberately cool** (`#fff2e0` at 2.5, ambient `#9fc6ff` at 0.03). The first
  pass used a warm key at 3.2 and turned the whole ship cardboard-brown.
- **The bell is open-ended.** A capped cylinder read as a black disc from astern; the open bell
  plus a dark throat reads as a nozzle.
- **Plume cone is a focused jet, not a wide flame** — apex aft, base at the nozzle lip. It reads
  more "torch drive" than "rocket", which is the ship.

## Not done yet (M2 residuals)

- RCS puff VFX on rotation input (positions exist, the effect does not).
- Real grime/streak texturing — the wear is geometry and flat colour only.
- Nameplate legibility at chase distance (it is readable at close orbit, not at 50 m).
- Hull detail beyond ~75 parts; the plan's draw-call headroom allows more, but the seam/panel
  language carries it for now.
- No interior/exterior cross-check against the torchship deck plan yet — that comparison needs the
  interior build's module dimensions, which are not in this repo.
