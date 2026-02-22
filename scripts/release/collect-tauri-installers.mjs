import fs from 'node:fs'
import path from 'node:path'
import { resolveTauriBundleRoot } from './tauri-bundle-root.mjs'

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
const platform = requireArg('platform') // darwin-aarch64, darwin-x86_64, windows-x86_64

const repoRoot = process.cwd()
const bundleRoot = resolveTauriBundleRoot(repoRoot)
const outDir = path.join(repoRoot, 'dist', 'installers')
fs.mkdirSync(outDir, { recursive: true })

const allFiles = listFilesRecursive(bundleRoot).map((p) => p.replace(/\\/g, '/'))

if (platform.startsWith('darwin-')) {
  const dmg = pickFirst(allFiles, [/\/dmg\/.+\.dmg$/i])
  if (dmg) fs.copyFileSync(dmg, path.join(outDir, `WorkOrder-${tag}-macos.dmg`))

  const appTar = pickFirst(allFiles, [/\/macos\/.+\.app\.tar\.gz$/i, /\/macos\/.+\.tar\.gz$/i])
  if (appTar) fs.copyFileSync(appTar, path.join(outDir, `WorkOrder-${tag}-${platform}.tar.gz`))
}

if (platform.startsWith('windows-')) {
  const msi = pickFirst(allFiles, [/\/msi\/.+\.msi$/i])
  if (msi) fs.copyFileSync(msi, path.join(outDir, `WorkOrder-${tag}-windows.msi`))

  const exe = pickFirst(allFiles, [/\/nsis\/.+\.exe$/i])
  if (exe) fs.copyFileSync(exe, path.join(outDir, `WorkOrder-${tag}-windows-setup.exe`))
}

console.log(`[release] collected installers for ${platform} into dist/installers`)
