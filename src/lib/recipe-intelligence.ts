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

function ingredientKeys(recipe: Recipe) {
  return new Set(recipe.ingredients.map((ingredient) => ingredient.key.toLowerCase()))
}

function hasAny(keys: Set<string>, items: string[]) {
  return items.some((item) => keys.has(item))
}

export function makeRecipeWhy(recipe: Recipe) {
  const keys = ingredientKeys(recipe)
  const acid = hasAny(keys, ['cytryna', 'limonka', 'yuzu', 'ocet', 'sumak', 'rabarbar', 'melasa z granatu', 'ponzu', 'ocet ryżowy'])
  const umami = hasAny(keys, ['miso', 'sos sojowy', 'tamari', 'parmezan', 'grzyby', 'pieczarki', 'shiitake', 'kombu', 'bulion'])
  const creamy = hasAny(keys, ['masło', 'śmietanka', 'ricotta', 'feta', 'labneh', 'jogurt', 'mascarpone'])
  const crunch = hasAny(keys, ['sezam', 'orzech', 'pistacje', 'pestki', 'chleb', 'tortilla', 'dukkah'])
  const heat = hasAny(keys, ['chilli', 'harissa', 'jalapeño', 'papryka'])
  const fruit = hasAny(keys, ['śliwka', 'morela', 'winogrona', 'granat', 'daktyl', 'figa', 'brzoskwinia', 'wiśnia', 'borówka', 'rabarbar', 'pomarańcza'])

  if (recipe.collections.includes('atelier')) {
    if (fruit && umami) return 'Słodycz albo kwas owocu łapie umami i robi napięcie, a nie deser. Dlatego talerz wygląda odważnie, ale nadal ma logiczny środek ciężkości.'
    if (acid && crunch) return 'Kwas czyści podniebienie, chrupnięcie zatrzymuje uwagę. Dzięki temu talerz jest lekki, ale nie znika po dwóch kęsach.'
    return 'To danie działa przez jeden czytelny kontrast: miękkie z ostrym, słodkie z gorzkim albo tłuste z kwaśnym. Reszta ma pilnować balansu.'
  }

  if (acid && creamy) return 'Kremowa baza daje komfort, a kwas pilnuje, żeby całość nie zrobiła się ciężka. To jest prosty układ: miękko, jasno, jeszcze jeden kęs.'
  if (umami && crunch) return 'Umami buduje głębię, chrupnięcie robi rytm. Bez tej tekstury danie byłoby płaskie, z nią ma konkretny powód na talerzu.'
  if (umami) return 'Smak nie opiera się na ilości składników, tylko na głębi: sól, tłuszcz i umami robią bazę, którą łatwo doprawić bez kombinowania.'
  if (heat && creamy) return 'Ogień ma tu amortyzator. Kremowość łagodzi pikantność, więc danie ma pazur, ale nie zmienia obiadu w test wytrzymałości.'
  if (recipe.minutes <= 20) return 'Krótki czas działa, bo przepis nie walczy o złożoność. Jedna baza, jeden mocny akcent i finisz zamiast kuchennego projektu.'
  if (recipe.collections.includes('meal-prep')) return 'To jest jedzenie, które dobrze znosi czas: baza zostaje stabilna, sos albo przyprawy trzymają smak, a jutro nie jesz smutnej resztki.'
  if (recipe.collections.includes('one-pan')) return 'Jedna patelnia wymusza porządek: najpierw kolor i baza, potem sos, na końcu świeży akcent. Mało naczyń, ale smak nie jest przypadkowy.'
  return 'Kontrast trzyma danie w ryzach: baza daje komfort, akcent dodaje napięcia, a tekstura pilnuje, żeby talerz nie był nudny.'
}

export function makeRecipeSignature(recipe: Recipe) {
  const keys = ingredientKeys(recipe)
  if (hasAny(keys, ['cytryna', 'limonka', 'yuzu', 'ocet', 'sumak', 'ponzu'])) {
    return { label: 'ruch talerza', title: 'Kwas na końcu, nie na ślepo', body: 'Najpierw zbuduj bazę. Kwas dodaj dopiero po spróbowaniu — ma podnieść smak, nie przykryć całą robotę.' }
  }
  if (hasAny(keys, ['miso', 'sos sojowy', 'tamari', 'parmezan', 'bulion'])) {
    return { label: 'ruch talerza', title: 'Umami już niesie sól', body: 'Dosalaj ostrożnie. Przy mocnej bazie lepiej domknąć pieprzem, ziołami albo kwasem niż dosypać soli z automatu.' }
  }
  if (recipe.steps.some((step) => /piecz|piekarnik/i.test(step))) {
    return { label: 'ruch talerza', title: 'Piekarnik pracuje, ty kończysz', body: 'Nie czekaj bez sensu. Kiedy coś siedzi w piecu, ogarnij sos, zioła, talerze i ostatni kontrast.' }
  }
  if (recipe.steps.some((step) => /smaż|podsmaż|patelni/i.test(step))) {
    return { label: 'ruch talerza', title: 'Kolor przed sosem', body: 'Najpierw daj składnikom złapać rumieniec. Sos albo śmietanka wchodzą dopiero wtedy, gdy baza ma charakter.' }
  }
  if (recipe.minutes <= 20) {
    return { label: 'ruch talerza', title: 'Mise en place albo chaos', body: 'To szybki przepis, więc pokrój i odważ rzeczy przed ogniem. Patelnia nie będzie czekać na romantyczne szukanie pieprzu.' }
  }
  return { label: 'ruch talerza', title: 'Najpierw baza, potem balans', body: 'Nie rób wszystkiego naraz. Zbuduj główny smak, spróbuj, dopiero potem domykaj kwasem, tłuszczem i teksturą.' }
}

export function makeRecipeQualitySignals(recipe: Recipe) {
  const signals = []
  if (recipe.minutes <= 20) signals.push('szybkie wejście')
  if (recipe.effort === 'lekko') signals.push('niski chaos')
  if (recipe.collections.includes('one-pan')) signals.push('jedno naczynie')
  if (recipe.collections.includes('meal-prep')) signals.push('jutro też działa')
  if (recipe.collections.includes('na-gosci')) signals.push('bez wstydu przy stole')
  if (recipe.collections.includes('atelier')) signals.push('efekt Atelier')
  if (recipe.dietTags.includes('budżetowo')) signals.push('budżetowo')
  if (recipe.dietTags.includes('high-protein')) signals.push('więcej białka')
  return signals.slice(0, 3)
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
