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
    fs.rmSync(path.join(dir, name), { recursive: true, force: true })
  }
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const webDist = path.join(repoRoot, 'frontend', 'dist')
const webDir = path.join(repoRoot, 'apps', 'mobile', 'www')

if (!fs.existsSync(webDist)) {
  console.error(`frontend build output not found: ${webDist}`)
  console.error('Run: cd frontend && npm run build')
  process.exit(1)
}

emptyDir(webDir)
copyDir(webDist, webDir)
console.log(`Synced web assets: ${webDist} -> ${webDir}`)

