// Turns the production build into something GitHub Pages can serve as a single-page app.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Pages answers an unknown path (an F5 on /itens) with `404.html`, so that file is a copy of `index.html`: the
 * app loads and the router shows the right screen. `.nojekyll` stops Pages from processing the files.
 */
export function preparePages(dist = 'dist') {
  const index = join(dist, 'index.html')
  if (!existsSync(index)) throw new Error(`${index} not found: run the build first.`)
  copyFileSync(index, join(dist, '404.html'))
  writeFileSync(join(dist, '.nojekyll'), '')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preparePages(process.argv[2] ?? 'dist')
  console.log('Pages pronto: 404.html e .nojekyll criados em dist/.')
}
