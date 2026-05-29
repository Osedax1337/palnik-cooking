import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const recipesDir = path.join(root, 'public/recipes')
const maxKb = Number.parseInt(process.env.IMAGE_BUDGET_MAX_KB ?? '220', 10)
const maxBytes = maxKb * 1024
const limit = Number.parseInt(process.env.IMAGE_BUDGET_LIMIT ?? '30', 10)

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(filePath))
      continue
    }
    if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      const size = statSync(filePath).size
      files.push({ path: filePath, size })
    }
  }
  return files
}

function formatKb(bytes) {
  return `${Math.round(bytes / 1024)}KB`
}

const files = walk(recipesDir)
const oversized = files
  .filter((file) => file.size > maxBytes)
  .sort((a, b) => b.size - a.size)

const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
const stepFiles = files.filter((file) => file.path.includes(`${path.sep}steps${path.sep}`))
const stepBytes = stepFiles.reduce((sum, file) => sum + file.size, 0)

console.log('Recipe image budget')
console.log(`Images: ${files.length} (${formatKb(totalBytes)})`)
console.log(`Step images: ${stepFiles.length} (${formatKb(stepBytes)})`)
console.log(`Budget: ${maxKb}KB per image`)
console.log(`Oversized: ${oversized.length}`)

for (const file of oversized.slice(0, limit)) {
  console.log(`- ${formatKb(file.size)} ${path.relative(root, file.path)}`)
}

if (oversized.length > limit) {
  console.log(`... ${oversized.length - limit} more above budget`)
}

if (oversized.length > 0) {
  process.exitCode = 1
}
