import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceFiles = [
  path.join(root, 'src/lib/recipes.ts'),
  path.join(root, 'src/lib/regional-recipes.ts'),
]
const sources = sourceFiles.map((filePath) => readFileSync(filePath, 'utf8'))

const imageRefs = new Set()
const recipesWithStepImages = []

function quotedItems(input) {
  if (!input) return []
  return [...input.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1])
}

for (const source of sources) {
  for (const match of source.matchAll(/['"]\/recipes\/([^'"]+\.(?:png|jpg|jpeg|webp))['"]/g)) {
    imageRefs.add(match[1])
  }

  for (const match of source.matchAll(/\n  \{\n([\s\S]*?)\n  \},/g)) {
    const block = match[1]
    const slug = block.match(/slug: ['"]([^'"]+)['"]/)?.[1]
    const stepImagesBlock = block.match(/stepImages: \[([\s\S]*?)\n    \]/)?.[1]
    const stepImages = quotedItems(stepImagesBlock)
    if (slug && stepImages.length > 1) recipesWithStepImages.push({ slug, stepImages })
  }
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

async function averageHash(filePath) {
  const { data } = await sharp(filePath)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const average = data.reduce((sum, value) => sum + value, 0) / data.length
  return [...data].map((value) => (value > average ? '1' : '0')).join('')
}

function hammingDistance(a, b) {
  let distance = 0
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) distance += 1
  }
  return distance
}

const nearDuplicateStepImages = []
for (const recipe of recipesWithStepImages) {
  const hashes = []
  for (const imagePath of recipe.stepImages) {
    hashes.push({
      imagePath,
      hash: await averageHash(path.join(root, 'public', imagePath)),
    })
  }

  for (let left = 0; left < hashes.length; left += 1) {
    for (let right = left + 1; right < hashes.length; right += 1) {
      const distance = hammingDistance(hashes[left].hash, hashes[right].hash)
      if (distance < 8) {
        nearDuplicateStepImages.push({
          slug: recipe.slug,
          left: hashes[left].imagePath,
          right: hashes[right].imagePath,
          distance,
        })
      }
    }
  }
}

if (nearDuplicateStepImages.length > 0) {
  console.error(`Near-duplicate step images: ${nearDuplicateStepImages.length}`)
  for (const issue of nearDuplicateStepImages) {
    console.error(`- ${issue.slug}: ${issue.left} ~= ${issue.right} (distance ${issue.distance})`)
  }
  process.exit(1)
}

console.log(`Recipe image check passed: ${imageRefs.size} referenced images found.`)
