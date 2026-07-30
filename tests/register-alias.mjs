import { existsSync, statSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(projectRoot, 'src')

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith('~/')) return nextResolve(specifier, context)

    const candidate = path.join(sourceRoot, specifier.slice(2))
    const resolved = [
      candidate,
      `${candidate}.ts`,
      `${candidate}.tsx`,
      path.join(candidate, 'index.ts'),
      path.join(candidate, 'index.tsx'),
    ].find((file) => existsSync(file) && statSync(file).isFile())

    return nextResolve(pathToFileURL(resolved ?? candidate).href, context)
  },
})
