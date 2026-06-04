import fs from 'node:fs'
import ts from 'typescript'

const recipeFiles = ['src/lib/recipes.ts', 'src/lib/regional-recipes.ts']

function readValue(node) {
  if (!node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false

  if (ts.isArrayLiteralExpression(node)) return node.elements.map(readValue)

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
        recipes.push(readValue(node))
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return recipes
}

function ingredientWeight(ingredient, index) {
  if (ingredient.optional) return 0.35
  if (index <= 2) return 1.5
  if (index <= 4) return 1.05
  return 0.75
}

function pantryMatch(recipe, selected) {
  const required = (recipe.ingredients ?? []).filter((ingredient) => !ingredient.pantry)
  const matched = required.filter((ingredient) => selected.has(ingredient.key))
  const missing = required.filter((ingredient) => !selected.has(ingredient.key))
  const totalWeight = required.reduce((sum, ingredient, index) => sum + ingredientWeight(ingredient, index), 0)
  const matchedWeight = required.reduce((sum, ingredient, index) => {
    return selected.has(ingredient.key) ? sum + ingredientWeight(ingredient, index) : sum
  }, 0)

  return {
    score: totalWeight > 0 ? matchedWeight / totalWeight : 0,
    matched: matched.length,
    total: required.length,
    missing,
    criticalMissing: required.slice(0, 3).filter((ingredient) => !ingredient.optional && !selected.has(ingredient.key)),
  }
}

function rankFor(keys) {
  const selected = new Set(keys)
  return recipes
    .map((recipe) => ({ recipe, match: pantryMatch(recipe, selected) }))
    .filter((entry) => entry.match.total > 0)
    .sort((a, b) =>
      b.match.score - a.match.score ||
      a.match.criticalMissing.length - b.match.criticalMissing.length ||
      a.match.missing.length - b.match.missing.length ||
      a.recipe.minutes - b.recipe.minutes
    )
}

function assertTopFive(keys, expectedSlug) {
  const ranked = rankFor(keys)
  const slugs = ranked.slice(0, 5).map((entry) => entry.recipe.slug)
  if (!slugs.includes(expectedSlug)) {
    findings.push(`expected ${expectedSlug} in top 5 for [${keys.join(', ')}], got: ${slugs.join(', ')}`)
  }
}

function assertCriticalBeatsGarnish() {
  const selected = new Set(['makaron', 'cytryna', 'parmezan'])
  const pasta = rankFor([...selected]).find((entry) => entry.recipe.slug === 'makaron-cytryna')
  if (!pasta) {
    findings.push('expected makaron-cytryna to exist for pantry audit')
    return
  }

  const garnishHeavy = rankFor(['cytryna', 'bazylia', 'mięta']).find((entry) => entry.match.matched >= 3)
  if (garnishHeavy && garnishHeavy.match.score >= pasta.match.score) {
    findings.push(`garnish-heavy match ${garnishHeavy.recipe.slug} outranked core pantry match makaron-cytryna`)
  }
}

const recipes = recipeFiles.flatMap(collectRecipes)
const findings = []

assertTopFive(['makaron', 'cytryna', 'parmezan'], 'makaron-cytryna')
assertTopFive(['ryż', 'sos sojowy', 'jajko'], 'ryz-smazony-jajko-chilli')
assertTopFive(['jajko', 'cukinia', 'feta'], 'frittata-cukinia')
assertCriticalBeatsGarnish()

if (findings.length > 0) {
  console.error(`Pantry flow audit failed: ${findings.length} finding(s)`)
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(`Pantry flow audit passed: ${recipes.length} recipes checked.`)
