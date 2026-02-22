import fs from 'node:fs'
import path from 'node:path'

function fail(msg) {
  console.error(`[release] ${msg}`)
  process.exit(2)
}

function readText(p) {
  if (!fs.existsSync(p)) fail(`file not found: ${p}`)
  return fs.readFileSync(p, 'utf8')
}

const repoRoot = process.cwd()
const capacitorConfig = path.join(repoRoot, 'apps', 'mobile', 'capacitor.config.ts')
const groovy = path.join(repoRoot, 'apps', 'mobile', 'android', 'app', 'build.gradle')
const kts = path.join(repoRoot, 'apps', 'mobile', 'android', 'app', 'build.gradle.kts')

const capRaw = readText(capacitorConfig)
const appIdMatch = capRaw.match(/appId:\s*['"]([^'"]+)['"]/)
if (!appIdMatch) fail('failed to read appId from capacitor.config.ts')
const appId = appIdMatch[1]

let gradleRaw = ''
let applicationId = ''

if (fs.existsSync(groovy)) {
  gradleRaw = readText(groovy)
  const m = gradleRaw.match(/applicationId\s+['"]([^'"]+)['"]/)
  if (m) applicationId = m[1]
} else if (fs.existsSync(kts)) {
  gradleRaw = readText(kts)
  const m = gradleRaw.match(/applicationId\s*=\s*["']([^"']+)["']/)
  if (m) applicationId = m[1]
} else {
  fail('Android build.gradle not found')
}

if (!applicationId) {
  fail('failed to read applicationId from Android build.gradle')
}

if (applicationId !== appId) {
  fail(`applicationId mismatch: capacitor.appId=${appId}, android.applicationId=${applicationId}`)
}

console.log(`[release] android packageName OK: ${applicationId}`)

