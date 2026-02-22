const fs = require('fs')
const path = require('path')

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name)
    const destPath = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (name === '.gitkeep') continue
    fs.rmSync(path.join(dir, name), { recursive: true, force: true })
  }
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const preferredDist = path.join(repoRoot, 'apps', 'web', 'dist')
const fallbackDist = path.join(repoRoot, 'frontend', 'dist')
const webDist = fs.existsSync(preferredDist) ? preferredDist : fallbackDist
const webDir = path.join(repoRoot, 'apps', 'mobile', 'www')

const devServerUrl = process.env.CAP_SERVER_URL
if (devServerUrl) {
  fs.mkdirSync(webDir, { recursive: true })
  console.log(`CAP_SERVER_URL is set (${devServerUrl}); skipping web asset sync.`)
  process.exit(0)
}

if (!fs.existsSync(webDist)) {
  console.error(`web build output not found: ${webDist}`)
  console.error('Run: npm run web:build (recommended) OR cd frontend && npm run build')
  console.error('Tip: For Live Reload, set CAP_SERVER_URL and re-run sync.')
  process.exit(1)
}

emptyDir(webDir)
copyDir(webDist, webDir)
console.log(`Synced web assets: ${webDist} -> ${webDir}`)
