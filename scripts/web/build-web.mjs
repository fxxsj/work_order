import { spawnSync } from 'node:child_process'

const mode = process.argv[2] || 'history'
const routerMode = mode === 'hash' ? 'hash' : 'history'

const env = { ...process.env, VITE_ROUTER_MODE: routerMode }

const result = spawnSync(
  'npm',
  ['-w', 'workorder-web-vnext', 'run', 'build'],
  { stdio: 'inherit', env, shell: process.platform === 'win32' }
)

process.exit(result.status ?? 0)

