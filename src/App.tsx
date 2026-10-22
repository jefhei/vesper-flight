import { useMemo } from 'react'
import { detectWebGL } from './lib/perf/webgl'
import { FIXTURES, VESPER_SYSTEM } from './lib/world/systems'
import { FeelSpike } from './spike/FeelSpike'
import { LightSpike } from './spike/LightSpike'
import { LodSpike } from './spike/LodSpike'
import { PrecisionSpike } from './spike/PrecisionSpike'
import { readSpikeParams, type SpikeMode } from './spike/params'

const LINKS: Array<{ mode: SpikeMode; label: string }> = [
  { mode: 'precision', label: 'S1 precision' },
  { mode: 'lod', label: 'S2 planet LOD' },
  { mode: 'feel', label: 'S3 flight feel' },
  { mode: 'light', label: 'S4 lighting' },
]

function Nav({ current }: { current: SpikeMode }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 14,
        right: 14,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        font: '12px ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      {LINKS.map((l) => (
        <a
          key={l.mode}
          href={`?spike=${l.mode}`}
          style={{
            padding: '5px 10px',
            borderRadius: 4,
            textDecoration: 'none',
            color: l.mode === current ? '#0b0d11' : '#cfd6de',
            background: l.mode === current ? '#ffcf8a' : 'rgba(10,13,18,0.85)',
            border: '1px solid #2a2f36',
          }}
        >
          {l.label}
        </a>
      ))}
    </div>
  )
}

function NoWebGL({ reason }: { reason: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        background: '#04060a',
        color: '#e9e4d8',
        font: '14px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <div style={{ color: '#ffcf8a', letterSpacing: 1, marginBottom: 12 }}>
          VESPER FLIGHT — CANNOT START
        </div>
        <p style={{ margin: '0 0 12px' }}>
          This browser could not create a WebGL context ({reason}), so the 3D view cannot run.
        </p>
        <p style={{ margin: 0, color: '#8d9aa8' }}>
          Usually that means hardware acceleration is switched off, or this is a headless/remote
          browser. Try a current Chrome, Edge, Firefox or Safari with GPU acceleration enabled.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const params = useMemo(() => readSpikeParams(), [])
  const gl = useMemo(() => detectWebGL(), [])
  const system = FIXTURES[params.system] ?? VESPER_SYSTEM

  if (!gl.ok) return <NoWebGL reason={gl.reason ?? 'unknown'} />

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {params.mode === 'precision' ? <PrecisionSpike rebase={params.rebase} /> : null}
      {params.mode === 'lod' ? <LodSpike bodyId={params.body} /> : null}
      {params.mode === 'feel' ? <FeelSpike system={system} /> : null}
      {params.mode === 'light' ? <LightSpike /> : null}
      <Nav current={params.mode} />
    </div>
  )
}
