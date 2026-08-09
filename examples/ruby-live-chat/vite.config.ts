import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

import { sessionTokenEndpoint } from './server/session-token-endpoint.ts'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // `loadEnv(mode, dir, '')` reads every variable, including the workspace
    // API key. It is handed to a dev-server plugin only; `envPrefix` below
    // decides what the browser bundle may see.
    sessionTokenEndpoint(loadEnv(mode, import.meta.dirname, '')),
  ],

  // Only `ANIMATED_WAFFLE_PUBLIC_*` reaches browser code. The workspace key is
  // deliberately named outside that prefix — `ANIMATED_WAFFLE_API_KEY` matches
  // nothing here, so it cannot be inlined into the bundle by accident.
  envPrefix: ['VITE_', 'ANIMATED_WAFFLE_PUBLIC_'],

  // Let the SDK pre-bundle normally. It resolves its HeadAudio worklet and
  // viseme model relative to its own module URL, and Vite rewrites that during
  // optimization — excluding it from `optimizeDeps` instead breaks the CommonJS
  // interop its realtime transport needs.

  server: { host: '127.0.0.1', port: 5273, strictPort: true },

  build: {
    // A realtime transport plus a VRM renderer is simply a large payload; the
    // renderer already loads as its own chunk. This raises the warning to the
    // size this integration actually is instead of hiding it.
    chunkSizeWarningLimit: 900,
  },
}))
