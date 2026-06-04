import fs from 'node:fs'
import ts from 'typescript'

const recipeFiles = ['src/lib/recipes.ts', 'src/lib/regional-recipes.ts']

function readValue(node) {
  if (!node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(readValue)
  }

  if (ts.isObjectLiteralExpression(node)) {
    const value = {}
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue
      const key = property.name.getText().replace(/^['"]|['"]$/g, '')
      value[key] = readValue(property.initializer)
    }
    return value
  }

  if (ts.isCallExpression(node) && node.expression.getText() === 'ing') {
    return readValue(node.arguments[0])
  }

  return node.getText()
}

function collectRecipes(file) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const recipes = []

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Map()

      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue
        properties.set(property.name.getText().replace(/^['"]|['"]$/g, ''), property.initializer)
      }

      if (properties.has('slug') && properties.has('ingredients') && properties.has('steps')) {
        const recipe = readValue(node)
        const line = sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
        recipes.push({ ...recipe, file, line })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return recipes
}

function duplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))]
}

function hasMeatKey(key) {
  return /kurczak|wołow|wolow|indyk|boczek|szynka|mięso|mieso|krewet|ryba|łosoś|losos|tuńczyk|tunczyk|przegrzeb/i.test(key)
}

function hasGlutenKey(key) {
  if (/makaron ryżowy|papier ryżowy|mąka z ciecierzycy/i.test(key)) return false
  return /ciasto|chleb|pita|bulgur|kuskus|mąka pszenna|maka pszenna/i.test(key)
}

const recipes = recipeFiles.flatMap(collectRecipes)
const findings = []
const seenSlugs = new Map()

for (const recipe of recipes) {
  const location = `${recipe.file}:${recipe.line}`
  const ingredientKeys = (recipe.ingredients ?? []).map((ingredient) => ingredient?.key).filter(Boolean)

  if (seenSlugs.has(recipe.slug)) {
    findings.push(`duplicate slug: ${recipe.slug} (${seenSlugs.get(recipe.slug)} and ${location})`)
  }
  seenSlugs.set(recipe.slug, location)

  for (const collection of duplicates(recipe.collections ?? [])) {
    findings.push(`duplicate collection "${collection}" in ${recipe.slug} (${location})`)
  }

  for (const tag of duplicates(recipe.dietTags ?? [])) {
    findings.push(`duplicate diet tag "${tag}" in ${recipe.slug} (${location})`)
  }

  for (const key of duplicates(ingredientKeys)) {
    findings.push(`duplicate ingredient key "${key}" in ${recipe.slug} (${location})`)
  }

  if ((recipe.stepImages?.length ?? 0) > 0 && recipe.stepImages.length !== (recipe.steps ?? []).length) {
    findings.push(`step image count mismatch in ${recipe.slug}: ${recipe.stepImages.length} images for ${(recipe.steps ?? []).length} steps (${location})`)
  }

  if ((recipe.collections ?? []).includes('15-min') && recipe.minutes > 20) {
    findings.push(`15-min collection mismatch in ${recipe.slug}: ${recipe.minutes} min (${location})`)
  }

  if ((recipe.dietTags ?? []).includes('bezmięsne') && ingredientKeys.some(hasMeatKey)) {
    findings.push(`vegetarian tag with meat/fish ingredient in ${recipe.slug} (${location})`)
  }

  if ((recipe.dietTags ?? []).includes('bez glutenu') && ingredientKeys.some(hasGlutenKey)) {
    findings.push(`gluten-free tag with gluten ingredient in ${recipe.slug} (${location})`)
  }
}

if (findings.length > 0) {
  console.error(`Recipe content audit failed: ${findings.length} finding(s)`)
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Recipe content audit passed: ${recipes.length} recipes checked.`)
