import fs from 'node:fs'
import path from 'node:path'

function parseVersion(raw) {
  const tag = String(raw || '').trim()
  if (!tag) throw new Error('Missing version/tag')
  const version = tag.startsWith('v') ? tag.slice(1) : tag
  const match = version.match(/^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<pre>[0-9A-Za-z.-]+))?$/)
  if (!match?.groups) throw new Error(`Invalid version: ${version}`)
  const major = Number(match.groups.major)
  const minor = Number(match.groups.minor)
  const patch = Number(match.groups.patch)
  const pre = match.groups.pre || ''
  return { tag, version, major, minor, patch, pre }
}

function toMsiSafePrereleaseNumber(pre) {
  const trimmed = String(pre || '').trim()
  if (!trimmed) return ''

  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n < 0 || n > 65535) {
      throw new Error(`Invalid numeric prerelease for MSI: ${trimmed} (must be 0..65535)`)
    }
    return String(n)
  }

  const firstIdent = trimmed.split('.')[0] || ''
  const channel = firstIdent.toLowerCase()
  const baseMap = new Map([
    ['alpha', 10000],
    ['beta', 20000],
    ['rc', 30000],
    ['dryrun', 40000],
    ['preview', 50000],
  ])
  const base = baseMap.get(channel) ?? 0

  const lastNumberMatch = trimmed.match(/(\d+)(?!.*\d)/)
  const n = lastNumberMatch ? Number(lastNumberMatch[1]) : 0
  const combined = base + n
  if (!Number.isFinite(combined) || combined < 0 || combined > 65535) {
    throw new Error(
      `Pre-release "${trimmed}" cannot be mapped to MSI-safe numeric prerelease (0..65535). Got ${combined}.`,
    )
  }
  return String(combined)
}

function normalizeTagForTauri(raw) {
  const parsed = parseVersion(raw)
  if (!parsed.pre) return parsed.version

  const numericPre = toMsiSafePrereleaseNumber(parsed.pre)
  const nextVersion = `${parsed.major}.${parsed.minor}.${parsed.patch}-${numericPre}`
  return nextVersion
}

function updateJsonVersion(filePath, nextVersion) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  if (!json.package?.version) {
    throw new Error(`Missing package.version in ${filePath}`)
  }
  json.package.version = nextVersion

  json.tauri = json.tauri || {}
  json.tauri.updater = json.tauri.updater || {}

  const explicitEndpoint = String(process.env.TAURI_UPDATER_ENDPOINT || '').trim()
  const repo = String(process.env.TAURI_UPDATER_REPO || process.env.GITHUB_REPOSITORY || '').trim()
  const nextEndpoint = explicitEndpoint || (repo ? `https://github.com/${repo}/releases/latest/download/latest.json` : '')
  if (nextEndpoint) {
    json.tauri.updater.endpoints = [nextEndpoint]
  }

  const pubkey = String(process.env.TAURI_PUBLIC_KEY || '').trim()
  if (pubkey) {
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

const version = normalizeTagForTauri(process.argv[2] || process.env.GITHUB_REF_NAME)
const repoRoot = process.cwd()

const tauriConf = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json')
const cargoToml = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'Cargo.toml')

updateJsonVersion(tauriConf, version)
updateCargoTomlVersion(cargoToml, version)

console.log(`[release] applied version ${version}`)
