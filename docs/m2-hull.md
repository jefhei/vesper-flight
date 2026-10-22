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

- **137 parts**, authored as data in `src/lib/ship/hullSpec.ts` — not a GLTF. The spec is the
  source of truth; the mesh is generated from it, so the parts list, the landmarks and the tests
  cannot drift apart.
- **Extruded octagonal profiles, not boxes.** `prismGeometry(profile, length, frontScale,
  backScale)` extrudes a chamfered cross-section; the hull meets its faces at a bevel, which is
  what gives the silhouette edges instead of corners. The nose is a three-segment taper (tip →
  shoulder → body) with a raised bridge cap, not one slab.
- **Merged to 6 draw calls** (budget 6): one vertex-coloured plating mesh, one radiator/heat mesh,
  one vertex-coloured running-light mesh, the nameplate plane, two plume cones.
- **Radiators are arrays, not blades.** Each of the four wings is a broad plate split into three
  segments along the ship axis with two frame ribs, a header pipe at the inboard edge and a tip
  rail outboard, standing off the hull on a boom and canted 17°.
- **Silhouette:** tapered prow (three segments) → bridge cap with slanted visor and viewport band
  → 14 × 10 m octagonal body → aft taper → drive collar → ribbed open bell → nozzle lip. Dorsal
  spine, two cargo hatches, nameplate, keel fin, two dorsal tanks, service housings, masts, sensor
  domes, a winch and a crane arm. Twelve RCS quads, three per corner, four with modelled nozzles.
- **Wear pass:** navy panel bands, five seam lines per flank and dorsal, mismatched repair patches,
  hazard striping on the nose, black service vents, three conduit runs.
- **Nameplate:** 1024×210 canvas texture, `BARROW` + `HD-441`, grime streaks, framed on the spine.
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
- **Wings are segmented ALONG the ship, not across the wing.** The first attempt put three panels
  side by side across a 4.5 m span and produced a stack of blades; a 1.45 m panel with a 10 m
  length is a blade no matter how it is coloured.
- **A wing face-on will always hide part of the hull.** At full span it read as a cargo door over
  the flank; the wings are now 3.2 m tall, 8.4 m long, canted 17° and mounted aft, so they read as
  fins and the hull still shows between them.

## Not done yet (M2 residuals)

- RCS puff VFX on rotation input (positions exist, the effect does not).
- Real grime/streak texturing — the wear is geometry and flat colour only.
- Nameplate legibility at chase distance (it is readable at close orbit, not at 50 m).
- Hull detail beyond ~75 parts; the plan's draw-call headroom allows more, but the seam/panel
  language carries it for now.
- No interior/exterior cross-check against the torchship deck plan yet — that comparison needs the
  interior build's module dimensions, which are not in this repo.
