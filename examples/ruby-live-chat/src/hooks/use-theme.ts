import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ruby-live-chat:theme'

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * The theme is already resolved and stamped on `<html>` by the inline script in
 * `index.html`, so this hook only reads it and writes changes back. Until the
 * reader makes a choice the system preference stays in charge, including when it
 * changes mid-session.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(current)

  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      let stored: string | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY)
      } catch {
        stored = null
      }
      if (stored === 'light' || stored === 'dark') return
      const next: Theme = system.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    system.addEventListener('change', follow)
    return () => system.removeEventListener('change', follow)
  }, [])

  const toggle = useCallback(() => {
    setTheme((previous) => {
      const next: Theme = previous === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Blocked storage only costs the choice its persistence.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
