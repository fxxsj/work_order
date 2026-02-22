import http from 'node:http'
import { spawn } from 'node:child_process'

const DEV_URL = process.env.WORKORDER_WEB_DEV_URL || 'http://127.0.0.1:5173'

function checkUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(800, () => {
      req.destroy()
      resolve(false)
    })
  })
}

if (await checkUp(DEV_URL)) {
  console.log(`[desktop] web dev server already running: ${DEV_URL}`)
  process.exit(0)
}

console.log(`[desktop] starting web dev server: ${DEV_URL}`)

const env = { ...process.env, VITE_ROUTER_MODE: 'hash' }

const child = spawn('npm', ['-w', 'workorder-web-vnext', 'run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env
})

child.on('exit', (code) => process.exit(code ?? 0))
