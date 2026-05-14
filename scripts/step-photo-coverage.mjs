import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'src/lib/recipes.ts'), 'utf8')

function findRecipesArray(src) {
  const marker = 'export const recipes: Recipe[] = ['
  const start = src.indexOf(marker)
  if (start < 0) throw new Error('Could not find recipes array')
  const equals = src.indexOf('=', start)
  const arrayStart = src.indexOf('[', equals)
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = arrayStart; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '[') depth++
    if (ch === ']') {
      depth--
      if (depth === 0) return src.slice(arrayStart + 1, i)
    }
  }
  throw new Error('Could not close recipes array')
}

function splitRecipeObjects(arraySource) {
  const blocks = []
  let start = -1
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = 0; i < arraySource.length; i++) {
    const ch = arraySource[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    }
    if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        blocks.push(arraySource.slice(start, i + 1))
        start = -1
      }
    }
  }
  return blocks
}

function extractArray(block, key) {
  const keyIndex = block.indexOf(`${key}: [`)
  if (keyIndex < 0) return ''
  const start = block.indexOf('[', keyIndex)
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = start; i < block.length; i++) {
    const ch = block[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '[') depth++
    if (ch === ']') {
      depth--
      if (depth === 0) return block.slice(start + 1, i)
    }
  }
  return ''
}

function quotedItems(src) {
  return [...src.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1])
}

const recipes = splitRecipeObjects(findRecipesArray(source)).map((block) => {
  const slug = block.match(/slug: ['"]([^'"]+)['"]/)?.[1] ?? 'unknown'
  const title = block.match(/title: ['"]([^'"]+)['"]/)?.[1] ?? slug
  const collections = quotedItems(extractArray(block, 'collections'))
  const steps = quotedItems(extractArray(block, 'steps'))
  const stepImages = quotedItems(extractArray(block, 'stepImages'))
  return { slug, title, collections, steps, stepImages }
})

const full = recipes.filter((recipe) => recipe.steps.length > 0 && recipe.stepImages.length >= recipe.steps.length)
const partial = recipes.filter((recipe) => recipe.stepImages.length > 0 && recipe.stepImages.length < recipe.steps.length)
const none = recipes.filter((recipe) => recipe.stepImages.length === 0)
const atelier = recipes.filter((recipe) => recipe.collections.includes('atelier'))
const atelierFull = atelier.filter((recipe) => recipe.stepImages.length >= recipe.steps.length)
const quickCandidates = recipes
  .filter((recipe) => recipe.stepImages.length === 0 && (recipe.collections.includes('15-min') || recipe.collections.includes('po-pracy') || recipe.collections.includes('one-pan')))
  .slice(0, 30)

console.log('Step-photo coverage')
console.log(`Recipes: ${recipes.length}`)
console.log(`Full coverage: ${full.length}`)
console.log(`Partial coverage: ${partial.length}`)
console.log(`No step photos: ${none.length}`)
console.log(`Atelier full coverage: ${atelierFull.length}/${atelier.length}`)
console.log('')
console.log('Next non-Atelier candidates:')
for (const recipe of quickCandidates) {
  console.log(`- ${recipe.slug}: ${recipe.steps.length} steps — ${recipe.title}`)
}

if (partial.length > 0) {
  console.log('')
  console.log('Partial coverage to fix:')
  for (const recipe of partial) {
    console.log(`- ${recipe.slug}: ${recipe.stepImages.length}/${recipe.steps.length}`)
  }
}
