function fail(msg) {
  console.error(`[release] ${msg}`)
  process.exit(2)
}

const kind = String(process.argv[2] || '').trim()
const tag = String(process.argv[3] || '').trim()

if (!kind) fail('missing kind (desktop|android)')
if (!tag) fail('missing tag')

const semver = '(\\d+)\\.(\\d+)\\.(\\d+)(-[0-9A-Za-z.-]+)?'

if (kind === 'desktop') {
  const re = new RegExp(`^v${semver}$`)
  if (!re.test(tag)) fail(`invalid desktop tag: ${tag} (expected vX.Y.Z)`)
  process.exit(0)
}

if (kind === 'android') {
  const reAndroid = new RegExp(`^android-v${semver}$`)
  const reRelease = new RegExp(`^v${semver}$`)
  if (!reAndroid.test(tag) && !reRelease.test(tag)) {
    fail(`invalid android tag: ${tag} (expected vX.Y.Z or android-vX.Y.Z)`)
  }
  process.exit(0)
}

fail(`unknown kind: ${kind}`)
