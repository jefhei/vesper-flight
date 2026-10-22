import { useEffect, useRef } from 'react'

/** Held-key set for the spike controls. */
export function useKeys() {
  const keys = useRef<Set<string>>(new Set())

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code)
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code)
    }
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  return keys
}

export function axis(keys: Set<string>, negative: string, positive: string): number {
  return (keys.has(positive) ? 1 : 0) - (keys.has(negative) ? 1 : 0)
}
