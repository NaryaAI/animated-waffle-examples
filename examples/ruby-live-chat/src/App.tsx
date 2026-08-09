import { useMemo } from 'react'

import { ConfigNotice } from './components/config-notice'
import { LiveChat } from './components/live-chat'
import { readWaffleConfig } from './config'

export function App() {
  const config = useMemo(readWaffleConfig, [])
  return config ? <LiveChat config={config} /> : <ConfigNotice />
}
