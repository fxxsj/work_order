import fs from 'node:fs'
import path from 'node:path'

function normalizeTag(raw) {
  const tag = String(raw || '').trim()
  if (!tag) throw new Error('Missing version/tag')
  const version = tag.startsWith('v') ? tag.slice(1) : tag
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid version: ${version}`)
  }
  return version
}

function updateJsonVersion(filePath, nextVersion) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  if (!json.package?.version) {
    throw new Error(`Missing package.version in ${filePath}`)
  }
  json.package.version = nextVersion

  const pubkey = String(process.env.TAURI_PUBLIC_KEY || '').trim()
  if (pubkey) {
    json.tauri = json.tauri || {}
    json.tauri.updater = json.tauri.updater || {}
    json.tauri.updater.active = true
    json.tauri.updater.pubkey = pubkey
  }
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`)
}

function updateCargoTomlVersion(filePath, nextVersion) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split('\n')
  let inPackage = false
  let changed = false
  const out = lines.map((line) => {
    const trimmed = line.trim()
    if (trimmed === '[package]') {
      inPackage = true
      return line
    }
    if (inPackage && trimmed.startsWith('[') && trimmed.endsWith(']')) {
      inPackage = false
      return line
    }
    if (inPackage && /^\s*version\s*=/.test(line) && !changed) {
      changed = true
      const prefix = line.match(/^\s*/)?.[0] ?? ''
      return `${prefix}version = "${nextVersion}"`
    }
    return line
  })
  if (!changed) throw new Error(`Failed to update version in ${filePath}`)
  fs.writeFileSync(filePath, out.join('\n'))
}

const version = normalizeTag(process.argv[2] || process.env.GITHUB_REF_NAME)
const repoRoot = process.cwd()

const tauriConf = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json')
const cargoToml = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'Cargo.toml')

updateJsonVersion(tauriConf, version)
updateCargoTomlVersion(cargoToml, version)

console.log(`[release] applied version ${version}`)
