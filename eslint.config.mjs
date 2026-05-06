import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Palnik reads browser-local state after hydration. The state changes are
      // intentional sync points with localStorage / URL params, not render-time
      // derivations. Keep this rule off until those flows are redesigned around
      // useSyncExternalStore.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores(['.next/**', 'next-env.d.ts', 'node_modules/**']),
])
