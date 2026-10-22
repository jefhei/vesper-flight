import type { ReactNode } from 'react'

/** Spike instrument panel. Deliberately ugly: numbers, not chrome. */
export function Panel({
  title,
  rows,
  children,
}: {
  title: string
  rows: Array<[string, string]>
  children?: ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 10,
        minWidth: 300,
        padding: '10px 14px',
        background: 'rgba(8,10,14,0.82)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 6,
        color: '#e9e4d8',
        font: '12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'pre',
      }}
    >
      <div style={{ color: '#ffcf8a', marginBottom: 6, letterSpacing: 1 }}>{title}</div>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span style={{ color: '#8d9aa8' }}>{k.padEnd(18, ' ')}</span>
          <span>{v}</span>
        </div>
      ))}
      {children ? <div style={{ marginTop: 8, borderTop: '1px solid #2a2f36', paddingTop: 8 }}>{children}</div> : null}
    </div>
  )
}

export function fmt(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}
