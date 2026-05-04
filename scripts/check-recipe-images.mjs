import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const recipesPath = path.join(root, 'src/lib/recipes.ts')
const source = readFileSync(recipesPath, 'utf8')

const imageRefs = new Set()
for (const match of source.matchAll(/['"]\/recipes\/([^'"]+\.(?:png|jpg|jpeg|webp))['"]/g)) {
  imageRefs.add(match[1])
}

const missing = []
for (const ref of [...imageRefs].sort()) {
  const filePath = path.join(root, 'public/recipes', ref)
  if (!existsSync(filePath)) missing.push(ref)
}

if (missing.length > 0) {
  console.error(`Missing recipe images: ${missing.length}`)
  for (const ref of missing) console.error(`- public/recipes/${ref}`)
  process.exit(1)
}

console.log(`Recipe image check passed: ${imageRefs.size} referenced images found.`)
