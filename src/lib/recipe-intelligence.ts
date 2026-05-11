import type { Ingredient, Recipe } from './recipes'

type MatchLike = {
  matched: number
  total: number
  missing: Ingredient[]
} | null

const SWAPS: Record<string, string[]> = {
  feta: ['twaróg półtłusty + sól', 'halloumi', 'parmezan + jogurt'],
  mięta: ['bazylia', 'koperek', 'natka pietruszki + cytryna'],
  cytryna: ['limonka', 'ocet jabłkowy', 'biały ocet winny'],
  parmezan: ['grana padano', 'pecorino', 'dojrzały bursztyn'],
  śmietanka: ['jogurt grecki', 'mascarpone rozluźnione wodą', 'mleko + odrobina masła'],
  masło: ['oliwa', 'ghee', 'olej + szczypta soli'],
  ricotta: ['twaróg sernikowy', 'serek śmietankowy', 'jogurt grecki odsączony'],
  bazylia: ['natka pietruszki', 'mięta', 'rukola posiekana na końcu'],
  pomidor: ['passata', 'pomidory z puszki', 'pieczona papryka jako inny kierunek'],
  bulion: ['woda + sos sojowy', 'woda + miso', 'woda + sól + oliwa'],
  makaron: ['gnocchi', 'ryż', 'chleb na grzanki'],
  ryż: ['kasza', 'makaron ryżowy', 'pieczywo do miski'],
  jajko: ['tofu jedwabiste', 'ciecierzyca', 'więcej sera i śmietanki — inny efekt'],
  cukinia: ['bakłażan', 'papryka', 'brokuł pokrojony drobno'],
  czosnek: ['szalotka', 'szczypiorek', 'czosnek granulowany'],
  cebula: ['szalotka', 'por', 'dymka'],
  szpinak: ['jarmuż', 'rukola', 'mrożony szpinak dobrze odciśnięty'],
  grzyby: ['pieczarki', 'boczniaki', 'cukinia mocno podsmażona'],
  pieczarki: ['boczniaki', 'grzyby mrożone', 'cukinia mocno podsmażona'],
  chilli: ['harissa', 'płatki chilli', 'ostra papryka'],
  sos_sojowy: ['tamari', 'miso rozrobione z wodą', 'sól + odrobina miodu'],
  'sos sojowy': ['tamari', 'miso rozrobione z wodą', 'sól + odrobina miodu'],
}

function cleanSignal(signal: string) {
  const [, value = signal] = signal.split(':')
  return value.replaceAll('-', ' ')
}

export function makeSmartSwaps(missing: Ingredient[], limit = 3) {
  return missing
    .filter((ingredient) => !ingredient.pantry && !ingredient.optional)
    .map((ingredient) => ({
      key: ingredient.key,
      label: ingredient.name,
      swaps: SWAPS[ingredient.key] ?? SWAPS[ingredient.name.toLowerCase()] ?? [],
    }))
    .filter((entry) => entry.swaps.length > 0)
    .slice(0, limit)
}

export function makeBrainExplanation({
  recipe,
  mode,
  match,
  usedPantryMemory,
  pantryKeys,
  tasteSignals,
  isFavorite,
  isRecent,
}: {
  recipe: Recipe
  mode: string
  match: MatchLike
  usedPantryMemory: boolean
  pantryKeys: string[]
  tasteSignals: string[]
  isFavorite: boolean
  isRecent: boolean
}) {
  const reasons: string[] = []

  if (match && match.total > 0) {
    if (match.matched === match.total) reasons.push(`masz komplet składników — ${match.matched}/${match.total}`)
    else if (match.matched > 0) reasons.push(`lodówka już pokrywa ${match.matched}/${match.total}`)
  }

  if (usedPantryMemory && pantryKeys.length > 0) {
    reasons.push(`biorę z pamięci: ${pantryKeys.slice(0, 3).join(', ')}`)
  }

  if (recipe.minutes <= 20) reasons.push(`${recipe.time}, więc głód nie robi zamachu stanu`)
  else if (mode === 'spokojnie') reasons.push(`${recipe.time}, ale bez nerwowego sprintu`)

  if (recipe.effort === 'lekko') reasons.push('mało ruchów przy blacie')
  if (recipe.collections.includes('atelier')) reasons.push('efekt większy niż robota')
  if (recipe.collections.includes('meal-prep')) reasons.push('jutro też ma sens')
  if (isFavorite) reasons.push('masz to w ulubionych')
  else if (isRecent) reasons.push('ostatnio już krążyło blisko twoich wyborów')

  const taste = tasteSignals.map(cleanSignal).filter(Boolean).slice(0, 2)
  if (taste.length > 0) reasons.push(`Taste DNA ciągnie w stronę: ${taste.join(' / ')}`)

  if (reasons.length === 0) reasons.push('najmniej tarcia między tym, co masz, a sensownym talerzem')

  return reasons.slice(0, 4)
}
