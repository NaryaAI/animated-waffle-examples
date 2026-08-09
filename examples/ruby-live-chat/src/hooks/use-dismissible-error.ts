import { useCallback, useState } from 'react'

/**
 * The SDK keeps the last error until the next one replaces it, which is right
 * for a hook and wrong for a banner. Comparing against the dismissed instance
 * hides the current failure while still surfacing the next one.
 */
export function useDismissibleError(error: Error | null): {
  visible: Error | null
  dismiss: () => void
} {
  const [dismissed, setDismissed] = useState<Error | null>(null)
  const dismiss = useCallback(() => setDismissed(error), [error])
  return { visible: error && error !== dismissed ? error : null, dismiss }
}
