import { spawnSync } from 'node:child_process'

const env = { ...process.env, VITE_ROUTER_MODE: 'hash' }

const result = spawnSync(
  'npm',
  ['-w', 'workorder-web-vnext', 'run', 'build'],
  { stdio: 'inherit', env, shell: process.platform === 'win32' }
)

process.exit(result.status ?? 0)
