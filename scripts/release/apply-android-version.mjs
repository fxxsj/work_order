import fs from 'node:fs'
import path from 'node:path'

function fail(msg) {
  console.error(`[release] ${msg}`)
  process.exit(2)
}

function parseAndroidTag(raw) {
  const tag = String(raw || '').trim()
  if (!tag) fail('missing android tag')
  let version = ''
  if (tag.startsWith('android-v')) version = tag.slice('android-v'.length)
  else if (tag.startsWith('v')) version = tag.slice('v'.length)
  else fail(`invalid tag: ${tag} (expected vX.Y.Z or android-vX.Y.Z)`)
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/)
  if (!m) fail(`invalid version in tag: ${tag}`)
  const major = Number(m[1])
  const minor = Number(m[2])
  const patch = Number(m[3])
  const prerelease = (m[4] || '').toLowerCase()
  const versionName = version

  // versionCode scheme: MMMMMmmmppps (s in 0..9)
  // - stable suffix: 9
  // - prerelease suffix: alpha=1, beta=2, rc=3, other=0
  //
  // versionCode = major*10,000,000 + minor*10,000 + patch*10 + suffix
  // Constraints: major should be <= 209 to keep versionCode < 2.1b
  let suffix = 9
  if (prerelease) {
    if (prerelease.startsWith('-alpha')) suffix = 1
    else if (prerelease.startsWith('-beta')) suffix = 2
    else if (prerelease.startsWith('-rc')) suffix = 3
    else suffix = 0
  }

  const versionCode = major * 10_000_000 + minor * 10_000 + patch * 10 + suffix
  if (!Number.isFinite(versionCode) || versionCode <= 0) fail(`invalid versionCode: ${versionCode}`)
  if (versionCode >= 2_100_000_000) fail(`versionCode too large: ${versionCode}`)
  return { versionName, versionCode }
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function updateBuildGradleGroovy(filePath, versionName, versionCode) {
  let s = fs.readFileSync(filePath, 'utf8')
  const before = s

  s = s.replace(/versionCode\s+\d+/g, `versionCode ${versionCode}`)
  s = s.replace(/versionName\s+\"[^\"]*\"/g, `versionName "${versionName}"`)

  if (s === before) {
    // best-effort injection into defaultConfig block
    s = s.replace(
      /defaultConfig\s*\{([\s\S]*?)\n\s*\}/m,
      (m0, inner) => {
        const hasCode = /versionCode\s+\d+/.test(inner)
        const hasName = /versionName\s+\"/.test(inner)
        let injected = inner
        if (!hasCode) injected += `\n        versionCode ${versionCode}`
        if (!hasName) injected += `\n        versionName "${versionName}"`
        return `defaultConfig {${injected}\n    }`
      }
    )
  }

  fs.writeFileSync(filePath, s)

  const after = fs.readFileSync(filePath, 'utf8')
  if (!new RegExp(`\\bversionCode\\s+${versionCode}\\b`).test(after)) {
    fail(`failed to set versionCode in ${filePath}`)
  }
  if (!new RegExp(`\\bversionName\\s+\"${escapeRegExp(versionName)}\"`).test(after)) {
    fail(`failed to set versionName in ${filePath}`)
  }
}

function updateBuildGradleKts(filePath, versionName, versionCode) {
  let s = fs.readFileSync(filePath, 'utf8')
  const before = s

  s = s.replace(/versionCode\s*=\s*\d+/g, `versionCode = ${versionCode}`)
  s = s.replace(/versionName\s*=\s*\"[^\"]*\"/g, `versionName = "${versionName}"`)

  if (s === before) {
    s = s.replace(
      /defaultConfig\s*\{([\s\S]*?)\n\s*\}/m,
      (m0, inner) => {
        const hasCode = /versionCode\s*=/.test(inner)
        const hasName = /versionName\s*=/.test(inner)
        let injected = inner
        if (!hasCode) injected += `\n        versionCode = ${versionCode}`
        if (!hasName) injected += `\n        versionName = "${versionName}"`
        return `defaultConfig {${injected}\n    }`
      }
    )
  }

  fs.writeFileSync(filePath, s)

  const after = fs.readFileSync(filePath, 'utf8')
  if (!new RegExp(`\\bversionCode\\s*=\\s*${versionCode}\\b`).test(after)) {
    fail(`failed to set versionCode in ${filePath}`)
  }
  if (!new RegExp(`\\bversionName\\s*=\\s*\"${escapeRegExp(versionName)}\"`).test(after)) {
    fail(`failed to set versionName in ${filePath}`)
  }
}

const tag = process.argv[2]
const { versionName, versionCode } = parseAndroidTag(tag)

const repoRoot = process.cwd()
const groovy = path.join(repoRoot, 'apps', 'mobile', 'android', 'app', 'build.gradle')
const kts = path.join(repoRoot, 'apps', 'mobile', 'android', 'app', 'build.gradle.kts')

if (fs.existsSync(groovy)) {
  updateBuildGradleGroovy(groovy, versionName, versionCode)
  console.log(`[release] android version applied: ${versionName} (${versionCode}) -> ${path.relative(repoRoot, groovy)}`)
  process.exit(0)
}

if (fs.existsSync(kts)) {
  updateBuildGradleKts(kts, versionName, versionCode)
  console.log(`[release] android version applied: ${versionName} (${versionCode}) -> ${path.relative(repoRoot, kts)}`)
  process.exit(0)
}

fail('Android build.gradle not found (did you run cap add android?)')
