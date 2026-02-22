import path from 'node:path'
import { resolveTauriBundleRoot } from './tauri-bundle-root.mjs'

const repoRoot = process.cwd()
const root = resolveTauriBundleRoot(repoRoot)
process.stdout.write(path.resolve(root))

