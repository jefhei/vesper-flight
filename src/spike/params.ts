/** URL-driven spike selection. Everything here is throwaway M0 scaffolding. */

export type SpikeMode = 'precision' | 'lod' | 'feel' | 'light'

export type SpikeParams = {
  mode: SpikeMode
  system: string
  rebase: boolean
  body: string
  debug: boolean
}

const MODES: SpikeMode[] = ['precision', 'lod', 'feel', 'light']

export function readSpikeParams(search = window.location.search): SpikeParams {
  const p = new URLSearchParams(search)
  const raw = p.get('spike') ?? 'feel'
  const mode = (MODES as string[]).includes(raw) ? (raw as SpikeMode) : 'feel'
  return {
    mode,
    system: p.get('system') ?? 'realistic',
    rebase: p.get('rebase') !== '0',
    body: p.get('body') ?? 'halcyon',
    debug: p.get('debug') === '1',
  }
}
