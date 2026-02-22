import fs from 'node:fs'
import path from 'node:path'

function listDirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

function listBundleCandidates(targetDir) {
  const candidates = []

  const releaseBundle = path.join(targetDir, 'release', 'bundle')
  if (fs.existsSync(releaseBundle)) candidates.push(releaseBundle)

  for (const name of listDirs(targetDir)) {
    const p = path.join(targetDir, name, 'release', 'bundle')
    if (fs.existsSync(p)) candidates.push(p)
  }

  const debugBundle = path.join(targetDir, 'debug', 'bundle')
  if (fs.existsSync(debugBundle)) candidates.push(debugBundle)

  for (const name of listDirs(targetDir)) {
    const p = path.join(targetDir, name, 'debug', 'bundle')
    if (fs.existsSync(p)) candidates.push(p)
  }

  return [...new Set(candidates)]
}

function newestByMtime(paths) {
  return paths
    .map((p) => {
      try {
        return { p, mtimeMs: fs.statSync(p).mtimeMs }
      } catch {
        return { p, mtimeMs: 0 }
      }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((x) => x.p)
}

export function resolveTauriBundleRoot(repoRoot) {
  const targetDir = path.join(repoRoot, 'apps', 'desktop', 'src-tauri', 'target')
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Tauri target directory not found: ${targetDir}`)
  }

  const candidates = listBundleCandidates(targetDir)
  if (candidates.length === 0) {
    const top = listDirs(targetDir)
    throw new Error(
      [
        `Tauri bundle directory not found under: ${targetDir}`,
        `Searched: release/bundle, */release/bundle, debug/bundle, */debug/bundle`,
        `Top-level target entries: ${top.length ? top.join(', ') : '(none)'}`
      ].join('\n')
    )
  }

  const ordered = newestByMtime(candidates)
  const preferred = ordered.find((p) => p.endsWith(`${path.sep}release${path.sep}bundle`)) || ordered[0]
  return preferred
}

