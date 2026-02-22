import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

function requireArg(name) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1 || !process.argv[idx + 1]) throw new Error(`Missing --${name}`)
  return process.argv[idx + 1]
}

function listFilesRecursive(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFilesRecursive(p))
    else if (entry.isFile()) out.push(p)
  }
  return out
}

function pickFirst(files, patterns) {
  for (const re of patterns) {
    const found = files.find((f) => re.test(f))
    if (found) return found
  }
  return null
}

const tag = requireArg('tag')
const platform = requireArg('platform') // e.g. darwin-aarch64, darwin-x86_64, windows-x86_64

const repoRoot = process.cwd()
const bundleRoot = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'target', 'release', 'bundle')
const outDir = path.join(repoRoot, 'dist', 'tauri-updater')
fs.mkdirSync(outDir, { recursive: true })

if (!fs.existsSync(bundleRoot)) {
  throw new Error(`Bundle directory not found: ${bundleRoot}`)
}

const allFiles = listFilesRecursive(bundleRoot).map((p) => p.replace(/\\/g, '/'))

let payload = null
if (platform.startsWith('darwin-')) {
  payload = pickFirst(allFiles, [
    /\/macos\/.+\.app\.tar\.gz$/i,
    /\/macos\/.+\.tar\.gz$/i
  ])
} else if (platform.startsWith('windows-')) {
  payload = pickFirst(allFiles, [
    /\/msi\/.+\.msi\.zip$/i,
    /\/nsis\/.+\.exe$/i,
    /\/msi\/.+\.msi$/i
  ])
} else {
  throw new Error(`Unsupported platform: ${platform}`)
}

if (!payload) {
  throw new Error(`Updater payload not found for ${platform}. Files:\n${allFiles.join('\n')}`)
}

const sig = `${payload}.sig`
if (!allFiles.includes(sig)) {
  throw new Error(`Signature file not found: ${sig}. Make sure TAURI_PRIVATE_KEY/TAURI_KEY_PASSWORD are set and updater feature is enabled.`)
}

const payloadExt = path.extname(payload)
const doubleExt = payload.toLowerCase().endsWith('.msi.zip') ? '.msi.zip' : payloadExt
const baseName = `workorder-${tag}-${platform}`
const outPayload = path.join(outDir, `${baseName}${doubleExt}`)
const outSig = `${outPayload}.sig`

fs.copyFileSync(payload, outPayload)
fs.copyFileSync(sig, outSig)

const signature = fs.readFileSync(sig, 'utf8').trim()
const version = tag.startsWith('v') ? tag.slice(1) : tag

const meta = {
  platform,
  version,
  asset: path.basename(outPayload),
  signature
}

fs.writeFileSync(path.join(outDir, `${baseName}.json`), `${JSON.stringify(meta, null, 2)}${os.EOL}`)

// Also copy installers for human download (best-effort)
if (platform.startsWith('darwin-')) {
  const dmg = pickFirst(allFiles, [/\/dmg\/.+\.dmg$/i])
  if (dmg) {
    fs.copyFileSync(dmg, path.join(outDir, `workorder-${tag}-macos.dmg`))
  }
}
if (platform.startsWith('windows-')) {
  const msi = pickFirst(allFiles, [/\/msi\/.+\.msi$/i])
  if (msi) {
    fs.copyFileSync(msi, path.join(outDir, `workorder-${tag}-windows.msi`))
  }
  const exe = pickFirst(allFiles, [/\/nsis\/.+\.exe$/i])
  if (exe) {
    fs.copyFileSync(exe, path.join(outDir, `workorder-${tag}-windows-setup.exe`))
  }
}

console.log(`[release] collected updater assets for ${platform}: ${meta.asset}`)
