import { recipes } from '@/lib/recipes'

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

// Server-side PostHog read access. The public `phc_...` key in analytics.ts can
// only *send* events; reading usage back out needs a personal API key plus the
// numeric project id. Both are secrets, so they live in env, never in the repo.
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY

export type CountRow = { label: string; count: number }

export type DashboardData = {
  rangeDays: number
  overview: CountRow[]
  topRecipes: CountRow[]
  entrySources: CountRow[]
  topSearches: CountRow[]
  fridgeIngredients: CountRow[]
}

export type DashboardResult =
  | { status: 'ok'; data: DashboardData }
  | { status: 'not_configured' }
  | { status: 'error'; message: string }

export const RANGE_DAYS = 30

const slugToTitle = new Map(recipes.map((recipe) => [recipe.slug, recipe.title]))

function prettifyRecipe(slug: string) {
  return slugToTitle.get(slug) ?? slug
}

const SOURCE_LABELS: Record<string, string> = {
  recipe_page: 'Strona przepisu',
  compare_winner: 'Zwycięzca porównania',
  random_recipe: 'Losowy przepis',
  brain_lead: 'Brain — lead',
  brain_card: 'Brain — karta',
  card_image: 'Obrazek karty',
  card_cta: 'CTA karty',
  recent: 'Ostatnio oglądane',
  compare: 'Porównywarka',
  direct: 'Wejście bezpośrednie',
}

function prettifySource(source: string) {
  return SOURCE_LABELS[source] ?? source
}

type HogQLResponse = { results?: Array<Array<string | number | null>> }

async function runHogQL(query: string): Promise<Array<Array<string | number | null>>> {
  const response = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    // Usage numbers do not need to be live to the second; cache for 5 minutes
    // so a busy dashboard does not hammer the PostHog query API.
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`PostHog query failed (${response.status}): ${body.slice(0, 300)}`)
  }

  const json = (await response.json()) as HogQLResponse
  return json.results ?? []
}

function toRows(
  results: Array<Array<string | number | null>>,
  labelFrom: (raw: string) => string,
): CountRow[] {
  return results
    .filter((row) => row[0] !== null && row[0] !== '')
    .map((row) => ({ label: labelFrom(String(row[0])), count: Number(row[1]) || 0 }))
}

const SINCE = `timestamp >= now() - INTERVAL ${RANGE_DAYS} DAY`

export async function getDashboardData(): Promise<DashboardResult> {
  if (!PROJECT_ID || !API_KEY) return { status: 'not_configured' }

  try {
    const [overviewRaw, recipesRaw, sourcesRaw, searchesRaw, fridgeRaw] = await Promise.all([
      runHogQL(`
        SELECT event, count() AS c
        FROM events
        WHERE ${SINCE}
          AND event IN ('$pageview', 'recipe_opened', 'fridge_toggled', 'comparison_viewed', 'search_used')
        GROUP BY event
      `),
      runHogQL(`
        SELECT properties.slug AS slug, count() AS c
        FROM events
        WHERE ${SINCE} AND event = 'recipe_opened'
        GROUP BY slug
        ORDER BY c DESC
        LIMIT 10
      `),
      runHogQL(`
        SELECT properties.source AS source, count() AS c
        FROM events
        WHERE ${SINCE} AND event = 'recipe_opened'
        GROUP BY source
        ORDER BY c DESC
        LIMIT 10
      `),
      runHogQL(`
        SELECT properties.query AS q, count() AS c
        FROM events
        WHERE ${SINCE} AND event = 'search_used'
        GROUP BY q
        ORDER BY c DESC
        LIMIT 10
      `),
      runHogQL(`
        SELECT properties.ingredient AS ingredient, count() AS c
        FROM events
        WHERE ${SINCE} AND event = 'fridge_ingredient_toggled' AND properties.selected = true
        GROUP BY ingredient
        ORDER BY c DESC
        LIMIT 10
      `),
    ])

    const overviewMap = new Map(
      overviewRaw.map((row) => [String(row[0]), Number(row[1]) || 0]),
    )
    const overviewLabels: Array<[string, string]> = [
      ['$pageview', 'Odsłony'],
      ['recipe_opened', 'Otwarte przepisy'],
      ['search_used', 'Wyszukiwania'],
      ['fridge_toggled', 'Tryb lodówki'],
      ['comparison_viewed', 'Porównania'],
    ]

    return {
      status: 'ok',
      data: {
        rangeDays: RANGE_DAYS,
        overview: overviewLabels.map(([event, label]) => ({
          label,
          count: overviewMap.get(event) ?? 0,
        })),
        topRecipes: toRows(recipesRaw, prettifyRecipe),
        entrySources: toRows(sourcesRaw, prettifySource),
        topSearches: toRows(searchesRaw, (raw) => raw),
        fridgeIngredients: toRows(fridgeRaw, (raw) => raw),
      },
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Nieznany błąd zapytania do PostHog.',
    }
  }
}
