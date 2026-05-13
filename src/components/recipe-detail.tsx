"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  type Recipe,
  recipes,
  renderIngredient,
} from '@/lib/recipes'
import { RecipeVisual } from '@/components/recipe-visual'
import { EffortDots } from '@/components/effort-dots'
import { DietTags } from '@/components/recipe-meta'
import { PortionSwitcher } from '@/components/portion-switcher'
import { makeRecipeQualitySignals, makeRecipeSignature, makeRecipeWhy, makeSmartSwaps } from '@/lib/recipe-intelligence'
import {
  bumpTasteSignal,
  getCompare,
  getFavorites,
  getFridge,
  getPortions,
  getShopping,
  pushRecent,
  setCompare as persistCompare,
  setPortionFor,
  setShoppingFor,
  STORAGE_KEYS,
  toggleCompare as toggleCompareStorage,
  toggleFavorite as toggleFavoriteStorage,
} from '@/lib/storage'
import { useStorageValue } from '@/lib/use-storage'
import { track, trackRecipeOpened } from '@/lib/analytics'

const HIGHLIGHT = ['#22a06b', '#e08a36', '#c9572d']

type FlavorProfile = {
  label: string
  value: number
  note: string
}

function clampFlavor(value: number) {
  return Math.max(1, Math.min(5, value))
}

function getFlavorProfile(recipe: Recipe): FlavorProfile[] {
  const keys = new Set(recipe.ingredients.map((ingredient) => ingredient.key.toLowerCase()))
  const hasAny = (items: string[]) => items.some((item) => keys.has(item))

  const acid = clampFlavor(
    1 +
      (hasAny(['cytryna', 'limonka', 'yuzu', 'ocet', 'sumak', 'rabarbar', 'melasa z granatu']) ? 2 : 0) +
      (recipe.collections.includes('atelier') ? 1 : 0),
  )
  const umami = clampFlavor(
    1 +
      (hasAny(['miso', 'sos sojowy', 'parmezan', 'grzyby', 'shiitake', 'kombu', 'bulion']) ? 2 : 0) +
      (['azjatycka', 'włoska'].includes(recipe.cuisine) ? 1 : 0),
  )
  const comfort = clampFlavor(
    1 +
      (recipe.dietTags.includes('comfort') ? 2 : 0) +
      (hasAny(['masło', 'śmietanka', 'ser', 'feta', 'makaron', 'ryż', 'gnocchi']) ? 1 : 0) +
      (recipe.collections.includes('rozgrzewa') ? 1 : 0),
  )
  const heat = clampFlavor(1 + (hasAny(['chilli', 'harissa', 'jalapeño', 'papryka']) ? 2 : 0) + (recipe.cuisine === 'tex-mex' ? 1 : 0))
  const crunch = clampFlavor(1 + (hasAny(['sezam', 'orzech', 'pestki', 'chleb', 'tortilla']) ? 2 : 0) + (recipe.collections.includes('one-pan') ? 1 : 0))

  return [
    { label: 'kwas', value: acid, note: acid >= 4 ? 'tnie tłuszcz' : 'raczej miękko' },
    { label: 'umami', value: umami, note: umami >= 4 ? 'dużo głębi' : 'lekka baza' },
    { label: 'comfort', value: comfort, note: comfort >= 4 ? 'miska szczęścia' : 'lżejszy klimat' },
    { label: 'ogień', value: heat, note: heat >= 4 ? 'jest kopnięcie' : 'bez alarmu' },
    { label: 'chrup', value: crunch, note: crunch >= 4 ? 'tekstura gra' : 'miękka sprawa' },
  ]
}

function getChefNote(recipe: Recipe) {
  const keys = new Set(recipe.ingredients.map((ingredient) => ingredient.key.toLowerCase()))
  const has = (key: string) => keys.has(key)

  if (recipe.collections.includes('atelier')) {
    return 'Tu nie kombinuj z siedmioma dodatkami. Pilnuj jednego kontrastu: kwas ma przeciąć tłuszcz, a tekstura ma wejść na końcu.'
  }
  if (has('cytryna') || has('limonka') || has('ocet')) {
    return 'Kwas dawkuj na końcu. Najpierw zbuduj bazę, potem dopiero podkręć — inaczej danie zrobi się płaskie i krzykliwe.'
  }
  if (has('miso') || has('sos sojowy') || has('parmezan')) {
    return 'Sól dodawaj ostrożnie. Umami już niesie dużo ciężaru, więc lepiej dosolić po spróbowaniu niż ratować przesoloną patelnię.'
  }
  if (recipe.minutes <= 15) {
    return 'Przygotuj składniki przed ogniem. Ten przepis jest szybki, więc lepiej mieć wszystko pokrojone przed rozgrzaniem patelni.'
  }
  return 'Najważniejsze: nie rób wszystkiego naraz. Najpierw baza, potem balans, na końcu tekstura i świeży akcent.'
}

function getAtelierWhy(recipe: Recipe) {
  const keys = new Set(recipe.ingredients.map((ingredient) => ingredient.key.toLowerCase()))
  const hasAny = (items: string[]) => items.some((item) => keys.has(item))

  const acid = hasAny(['cytryna', 'limonka', 'yuzu', 'ponzu', 'sumak', 'rabarbar', 'ocet ryżowy', 'czarna limonka'])
  const ferment = hasAny(['miso', 'kimchi', 'kefir', 'shio koji', 'czarny czosnek', 'tamari'])
  const fruit = hasAny(['śliwka', 'morela', 'winogrona', 'granat', 'daktyl', 'figa', 'brzoskwinia', 'wiśnia', 'borówka', 'rabarbar'])
  const crunch = hasAny(['pistacje', 'sezam', 'orzech laskowy', 'dukkah', 'czarny mak'])
  const smoke = hasAny(['wędzone masło', 'wędzony jogurt', 'kawa', 'czarna limonka'])

  if (ferment && fruit) {
    return 'Ferment daje głębię i sól, owoc wpuszcza kwas albo słodycz, a główny składnik nie musi udawać gwiazdy. Cały numer to balans, nie lista dziwnych produktów.'
  }
  if (fruit) {
    return 'Owoc nie jest tu ozdobą. Daje słodycz, kwas albo ciemny sos, który łapie tłuszcz głównego składnika i robi z niego coś bardziej zapamiętywalnego.'
  }
  if (acid && crunch) {
    return 'Kwas najpierw czyści podniebienie, potem chrupnięcie zatrzymuje uwagę. Dzięki temu talerz jest lekki, ale nie znika po dwóch kęsach.'
  }
  if (smoke || recipe.tag.includes('smoke')) {
    return 'Dym daje scenę, ale musi zostać w tle. Najlepiej działa, gdy obok ma coś kwaśnego, kremowego albo soczystego.'
  }
  if (acid) {
    return 'Tu wygrywa precyzyjny kwas: nie przykrywa składników, tylko ustawia je ostrzej i robi miejsce na kolejny kęs.'
  }
  if (crunch) {
    return 'Miękka baza potrzebuje kontrapunktu. Chrupnięcie nie jest dekoracją — trzyma rytm talerza.'
  }

  return 'To danie działa przez jeden czytelny kontrast: miękkie z ostrym, słodkie z gorzkim albo tłuste z kwaśnym. Reszta ma tylko pilnować balansu.'
}

function parseCheckedKeys(raw: string | null) {
  if (!raw) return new Set<string>()
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function parseFridgeKeys(raw: string | null) {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getFirstMove(recipe: Recipe) {
  const first = recipe.steps[0] ?? 'Przygotuj blat, składniki i garnek/patelnię.'
  if (recipe.minutes <= 15) return `Najpierw mise en place: ${first}`
  if (recipe.steps.some((step) => /piekarnik|piecz/i.test(step))) return `Odpal piekarnik i zacznij od: ${first}`
  if (recipe.steps.some((step) => /ugotuj|makaron|ryż/i.test(step))) return `Wstaw wodę albo bazę od razu: ${first}`
  return `Pierwszy ruch: ${first}`
}

function getParallelTiming(recipe: Recipe) {
  if (recipe.steps.some((step) => /piecz/i.test(step))) return 'Gdy piekarnik pracuje, przygotuj sos, zioła i talerze. Nie zostawiaj wszystkiego na koniec.'
  if (recipe.steps.some((step) => /ugotuj|makaron|ryż/i.test(step))) return 'W czasie gotowania bazy rób sos i krojenie. Końcówka ma się spotkać na patelni, nie w kolejce.'
  if (recipe.steps.some((step) => /smaż|podsmaż|patelni/i.test(step))) return 'Patelnia jest osią czasu: najpierw składniki wymagające koloru, świeże i kwaśne rzeczy dopiero na końcu.'
  return 'Czytaj kroki jak sekwencję przy blacie: przygotuj, zbuduj bazę, dopiero potem dopraw i wykończ.'
}

function getStepCoach(step: string, index: number, total: number) {
  if (/piekarnik|piecz/i.test(step)) return 'To jest moment na sos, zioła i ogarnięcie blatu. Piekarnik pracuje, więc wykorzystaj ten czas.'
  if (/ugotuj|makaron|ryż|wod/i.test(step)) return 'Wstaw bazę i równolegle szykuj resztę. Czekanie nad garnkiem nie dodaje smaku.'
  if (/smaż|podsmaż|patelni|zarumien/i.test(step)) return 'Patelnia lubi spokój. Daj składnikom złapać kolor, nie mieszaj jak DJ na panice.'
  if (/dopraw|sok|skórk|cytryn|ocet/i.test(step)) return 'Doprawiaj po trochu i próbuj. Kwas ma podnieść danie, nie zrobić alarm.'
  if (index === 0) return 'Pierwszy ruch ustawia tempo. Wyciągnij sprzęt i składniki zanim odpalisz chaos.'
  if (index === total - 1) return 'Finisz. Teraz tekstura, świeży akcent i talerz — nie rozgotuj zwycięstwa.'
  return 'Zrób ten krok do końca, dopiero potem następny. W kuchni za dużo rzeczy naraz szybko kończy się chaosem.'
}

function estimateStepMinutes(recipe: Recipe) {
  return Math.max(2, Math.round(recipe.minutes / Math.max(1, recipe.steps.length)))
}

function recipeTasteSignals(recipe: Recipe) {
  return [
    `mood:${recipe.mood}`,
    `cuisine:${recipe.cuisine}`,
    recipe.minutes <= 20 ? 'tempo:szybko' : 'tempo:wolniej',
    recipe.collections.includes('atelier') ? 'tryb:atelier' : 'tryb:codziennie',
    ...recipe.dietTags.slice(0, 2).map((tag) => `diet:${tag}`),
  ]
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const searchParams = useSearchParams()
  const [portions, setPortions] = useState<number>(recipe.servings)
  const [shopping, setShopping] = useState<Record<string, boolean>>({})
  const [shoppingMode, setShoppingMode] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [compareContext, setCompareContext] = useState(false)
  const [fridgeKeys, setFridgeKeys] = useState<Set<string>>(new Set())
  const [activeStep, setActiveStep] = useState(0)

  // Hydrate persisted portions + shopping list once on client.
  useEffect(() => {
    const storedPortions = getPortions()[recipe.slug]
    if (storedPortions && [1, 2, 4].includes(storedPortions)) setPortions(storedPortions)
    const storedShopping = getShopping()[recipe.slug] ?? {}
    setShopping(storedShopping)
    pushRecent(recipe.slug)
    recipeTasteSignals(recipe).forEach((signal) => bumpTasteSignal(signal))
    trackRecipeOpened(recipe.slug, searchParams.get('zestaw') === '1' ? 'compare_winner' : 'recipe_page', {
      cuisine: recipe.cuisine,
      collection_atelier: recipe.collections.includes('atelier'),
    })
    setHydrated(true)
  }, [recipe, recipe.collections, recipe.cuisine, recipe.slug, searchParams])

  useEffect(() => {
    const incomingPortions = Number(searchParams.get('porcje'))
    const shoppingModeParam = searchParams.get('lista')
    const fromCompare = searchParams.get('zestaw') === '1'
    const checkedKeys = parseCheckedKeys(searchParams.get('odhaczone'))
    const incomingFridge = parseFridgeKeys(searchParams.get('fridge'))

    setFridgeKeys(new Set(incomingFridge.length > 0 ? incomingFridge : getFridge()))

    if ([1, 2, 4].includes(incomingPortions)) {
      setPortions(incomingPortions)
    }

    if (shoppingModeParam === '1') {
      setShoppingMode(true)
    }

    if (fromCompare) {
      setCompareContext(true)
    }

    if (checkedKeys.size > 0) {
      setShopping(() => {
        const next: Record<string, boolean> = {}
        recipe.ingredients.forEach((ingredient, index) => {
          if (checkedKeys.has(ingredient.key)) {
            next[`${ingredient.key}-${index}`] = true
          }
        })
        return next
      })
    }
  }, [recipe.ingredients, searchParams])

  useEffect(() => {
    if (hydrated) setPortionFor(recipe.slug, portions)
  }, [hydrated, portions, recipe.slug])

  useEffect(() => {
    if (hydrated) setShoppingFor(recipe.slug, shopping)
  }, [hydrated, shopping, recipe.slug])

  useEffect(() => {
    setActiveStep(0)
  }, [recipe.slug])

  const ratio = portions / recipe.servings
  const compareSlugs = useStorageValue<string[]>(STORAGE_KEYS.COMPARE, getCompare)
  const favoriteSlugs = useStorageValue<string[]>(STORAGE_KEYS.FAVORITES, getFavorites)
  const isInCompare = compareSlugs.includes(recipe.slug)
  const isFavorite = favoriteSlugs.includes(recipe.slug)

  const ingredientLines = useMemo(
    () =>
      recipe.ingredients.map((ingredient, index) => ({
        id: `${ingredient.key}-${index}`,
        text: renderIngredient(ingredient, ratio),
        pantry: !!ingredient.pantry,
        ingredient,
      })),
    [recipe.ingredients, ratio],
  )
  const pantryLines = ingredientLines.filter((line) => line.pantry)
  const freshLines = ingredientLines.filter((line) => !line.pantry)
  const stockedLines = ingredientLines.filter((line) => !line.pantry && !line.ingredient.optional && fridgeKeys.has(line.ingredient.key))
  const missingLines = ingredientLines.filter((line) => !line.pantry && !line.ingredient.optional && !fridgeKeys.has(line.ingredient.key))
  const optionalLines = ingredientLines.filter((line) => line.ingredient.optional)
  const cockpitHasFridgeContext = fridgeKeys.size > 0

  const checked = ingredientLines.filter((line) => shopping[line.id]).length
  const total = ingredientLines.length
  const progress = total === 0 ? 0 : checked / total
  const remaining = Math.max(0, total - checked)
  const allDone = checked === total && total > 0
  const flavorProfile = useMemo(() => getFlavorProfile(recipe), [recipe])
  const chefNote = useMemo(() => getChefNote(recipe), [recipe])
  const atelierWhy = useMemo(() => getAtelierWhy(recipe), [recipe])
  const recipeWhy = useMemo(() => makeRecipeWhy(recipe), [recipe])
  const recipeSignature = useMemo(() => makeRecipeSignature(recipe), [recipe])
  const qualitySignals = useMemo(() => makeRecipeQualitySignals(recipe), [recipe])
  const firstMove = useMemo(() => getFirstMove(recipe), [recipe])
  const parallelTiming = useMemo(() => getParallelTiming(recipe), [recipe])
  const smartSwaps = useMemo(() => makeSmartSwaps((cockpitHasFridgeContext ? missingLines : freshLines).map((line) => line.ingredient)), [cockpitHasFridgeContext, freshLines, missingLines])
  const shoppingGapLines = cockpitHasFridgeContext ? missingLines : freshLines.filter((line) => !line.ingredient.optional)
  const shoppingGapPreview = shoppingGapLines.slice(0, 4).map((line) => line.ingredient.key)
  const shoppingGapRest = Math.max(0, shoppingGapLines.length - shoppingGapPreview.length)
  const ownedCount = cockpitHasFridgeContext ? stockedLines.length : pantryLines.length
  const neededCount = cockpitHasFridgeContext ? stockedLines.length + missingLines.length : freshLines.filter((line) => !line.ingredient.optional).length
  const activeStepText = recipe.steps[activeStep] ?? recipe.steps[0] ?? 'Gotuj spokojnie.'
  const activeStepCoach = useMemo(() => getStepCoach(activeStepText, activeStep, recipe.steps.length), [activeStep, activeStepText, recipe.steps.length])
  const activeStepIngredients = useMemo(() => {
    const normalized = activeStepText.toLowerCase()
    const direct = ingredientLines.filter((line) => normalized.includes(line.ingredient.key.toLowerCase()) || normalized.includes(line.ingredient.name.toLowerCase().split(' ')[0]))
    return (direct.length > 0 ? direct : freshLines.slice(0, 3)).slice(0, 4)
  }, [activeStepText, freshLines, ingredientLines])
  const nextStepText = recipe.steps[activeStep + 1]
  const stepMinutes = useMemo(() => estimateStepMinutes(recipe), [recipe])
  const stepPercent = recipe.steps.length === 0 ? 0 : Math.round(((activeStep + 1) / recipe.steps.length) * 100)

  const relatedRecipes = recipes.filter((item) => item.slug !== recipe.slug && item.cuisine === recipe.cuisine).slice(0, 3)
  const isAtelierRecipe = recipe.collections.includes('atelier')

  const toggleItem = (id: string) => {
    setShopping((current) => {
      const selected = !current[id]
      track('shopping_item_toggled', { slug: recipe.slug, item_id: id, selected })
      return { ...current, [id]: selected }
    })
  }

  const resetShopping = () => {
    setShopping({})
    track('shopping_reset', { slug: recipe.slug })
  }

  const openShoppingGap = () => {
    const gapIds = new Set(shoppingGapLines.map((line) => line.id))
    const next: Record<string, boolean> = {}
    ingredientLines.forEach((line) => {
      next[line.id] = !gapIds.has(line.id)
    })
    setShopping(next)
    setShoppingMode(true)
    track('shopping_gap_opened', { slug: recipe.slug, missing_count: shoppingGapLines.length, fridge_context: cockpitHasFridgeContext })
  }

  const toggleCompare = () => {
    const next = toggleCompareStorage(recipe.slug)
    persistCompare(next)
    track('compare_toggled', { slug: recipe.slug, selected: next.includes(recipe.slug), compare_count: next.length, source: 'recipe_detail' })
  }

  const toggleFavorite = () => {
    const next = toggleFavoriteStorage(recipe.slug)
    track('favorite_toggled', { slug: recipe.slug, selected: next.includes(recipe.slug), favorite_count: next.length, source: 'recipe_detail' })
  }

  return (
    <main id="main-content" className={`min-h-screen overflow-x-hidden px-4 py-4 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:px-6 lg:px-8 lg:py-8 ${isAtelierRecipe ? 'bg-[radial-gradient(circle_at_top,#25131d_0%,#171317_24%,#fffaf3_62%)]' : 'bg-[#fffaf3]'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={isAtelierRecipe ? '/atelier' : '/katalog'} className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 print:hidden ${isAtelierRecipe ? 'border border-white/10 bg-white/8 text-[#fff7ee] hover:bg-white/12 focus:ring-[#ffcf9f]/35' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7] focus:ring-[#201714]/15'}`}>
            ← {isAtelierRecipe ? 'Wróć do Atelier' : 'Wróć do katalogu'}
          </Link>
          <div className="flex max-w-full flex-wrap items-center gap-2 print:hidden sm:justify-end">
            <Link
              href="#gotowanie"
              className="inline-flex items-center rounded-full bg-[#201714] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff7ee] transition hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
            >
              Gotuj teraz
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label={`Drukuj lub zapisz PDF przepisu: ${recipe.title}`}
              className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15"
            >
              Druk / PDF
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? `Usuń z ulubionych: ${recipe.title}` : `Zapisz w ulubionych: ${recipe.title}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                isFavorite ? 'bg-[#c9572d] text-[#fff7ee]' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7]'
              }`}
            >
              {isFavorite ? '♥ zapisane' : '♡ zapisz'}
            </button>
            <button
              type="button"
              onClick={toggleCompare}
              aria-pressed={isInCompare}
              aria-label={isInCompare ? `Usuń z porównania: ${recipe.title}` : `Dodaj do porównania: ${recipe.title}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                isInCompare ? 'bg-[#201714] text-[#fff7ee]' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7]'
              }`}
            >
              {isInCompare ? '✓ w porównaniu' : '+ porównaj'}
            </button>
            <span className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur sm:inline-flex ${isAtelierRecipe ? 'border-[#ffcf9f]/18 bg-[#ffcf9f]/8 text-[#ffcf9f]' : 'border-[#201714]/10 bg-white/85 text-[#8a4b2a]'}`}>{isAtelierRecipe ? 'Palnik / Atelier' : 'Palnik / przepis'}</span>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className={`overflow-hidden rounded-[2rem] shadow-[0_22px_70px_rgba(32,23,20,0.10)] sm:rounded-[2.4rem] ${isAtelierRecipe ? 'border border-[#8c3341]/10 bg-[linear-gradient(180deg,#fff8f1_0%,#fffdfa_54%,#f7edf4_100%)]' : 'palnik-detail-surface'}`}>
            <div className="palnik-image-glow relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[5/4]">
              <RecipeVisual recipe={recipe} large />
              {isAtelierRecipe ? (
                <div className="absolute left-4 top-4 rounded-full border border-[#ffcf9f]/25 bg-[#201714]/82 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f] backdrop-blur">
                  Atelier selection
                </div>
              ) : null}
            </div>
            <div className="p-6 lg:p-8">
              {compareContext ? (
                <p className="mb-4 rounded-[1rem] bg-[#201714] px-4 py-3 text-sm leading-6 text-[#f8eee5]">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffcf9f]">one-click z compare</span>
                  <span className="mt-1 block">Wpadłeś tu ze zwycięzcy porównania — porcja i kontekst zakupowy już siedzą.</span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#201714]/60">
                <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.time}</span>
                <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.cuisine}</span>
                <span className="inline-flex items-center rounded-full border border-current/10 px-3 py-1.5">
                  <EffortDots effort={recipe.effort} />
                </span>
              </div>
              <h1 className="mt-4 max-w-[14ch] text-[2.85rem] font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">{recipe.title}</h1>
              <p className="mt-4 max-w-[48ch] text-base leading-7 text-[#201714]/72">{recipe.intro}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {isAtelierRecipe ? (
                  <p className="rounded-[1.15rem] border border-[#8c3341]/10 bg-white/70 px-4 py-4 text-sm leading-6 text-[#201714]/82 shadow-[0_12px_34px_rgba(32,23,20,0.06)] sm:col-span-2">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c3341]">chef note</span>
                    <span className="mt-1 block">Tu chodzi o balans: słodycz ma podbić umami, kwas ma przeciąć tłuszcz, a chrupnięcie ma zamknąć talerz. Nie dekoruj na siłę — lepiej zostawić jedną mocną decyzję niż pięć ozdobników.</span>
                  </p>
                ) : null}
                <p className="palnik-warm-panel rounded-[1rem] border border-[#201714]/6 px-4 py-3.5 text-sm leading-6 text-[#201714]/85 shadow-[0_10px_28px_rgba(32,23,20,0.045)]">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">kiedy to robić</span>
                  <span className="mt-1 block">{recipe.whenToMake}</span>
                </p>
                <p className="rounded-[1rem] border border-[#c9572d]/10 bg-[#fff3e7] px-4 py-3.5 text-sm leading-6 text-[#201714]/80 shadow-[0_10px_28px_rgba(32,23,20,0.045)]">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">dlaczego działa</span>
                  <span className="mt-1 block">{isAtelierRecipe ? atelierWhy : recipeWhy}</span>
                </p>
              </div>
              <div className="mt-4">
                <DietTags tags={recipe.dietTags} />
              </div>
              {qualitySignals.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {qualitySignals.map((signal) => (
                    <span key={signal} className="rounded-full border border-[#201714]/10 bg-[#fffaf3] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a4b2a]">{signal}</span>
                  ))}
                </div>
              ) : null}
              <p className="mt-5 rounded-[1rem] border border-[#201714]/8 bg-white px-4 py-4 text-sm leading-6 text-[#201714]/80"><strong className="text-[#201714]">Tip:</strong> {recipe.tip}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[#201714] px-4 py-4 text-[#fff7ee] shadow-[0_14px_36px_rgba(32,23,20,0.12)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffcf9f]">notatka szefa</p>
                  <p className="mt-2 text-sm leading-6 text-[#f3dfcf]">{chefNote}</p>
                </div>
                <div className="palnik-warm-panel rounded-[1.25rem] border border-[#201714]/8 px-4 py-4 text-[#201714] shadow-[0_12px_34px_rgba(32,23,20,0.06)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">{recipeSignature.label}</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em]">{recipeSignature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#201714]/72">{recipeSignature.body}</p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.35rem] border border-[#201714]/8 bg-[#fffaf3] p-4 shadow-[0_12px_34px_rgba(32,23,20,0.05)]">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">profil talerza</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-[#201714]">Jak to uderza w smak</h2>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">1–5</span>
                </div>
                <div className="space-y-2.5">
                  {flavorProfile.map((item) => (
                    <div key={item.label} className="grid grid-cols-[4.8rem_1fr] items-center gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#201714]">{item.label}</p>
                        <p className="text-[11px] text-[#201714]/48">{item.note}</p>
                      </div>
                      <div className="flex gap-1.5" aria-label={`${item.label}: ${item.value} z 5`}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const active = index < item.value
                          return (
                            <span
                              key={index}
                              className={`h-2.5 flex-1 rounded-full transition ${active ? 'bg-[#201714]' : 'bg-[#201714]/10'}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div id="gotowanie" className={`scroll-mt-4 rounded-[2rem] p-5 text-[#fff7ee] shadow-[0_26px_80px_rgba(32,23,20,0.20)] sm:rounded-[2.35rem] sm:p-6 lg:sticky lg:top-6 lg:p-8 ${isAtelierRecipe ? 'border border-[#ffcf9f]/10 bg-[linear-gradient(145deg,#201714_0%,#2c1620_52%,#121116_100%)]' : 'bg-[#201714]'}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-[-0.03em]">Tryb gotowania</h2>
                <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f] sm:inline-block">{portions === 1 ? '1 porcja' : portions === 2 ? '2 porcje' : '4 porcje'}</span>
              </div>
              <PortionSwitcher value={portions} onChange={setPortions} tone="light" />
            </div>

            <div className="mb-5 overflow-hidden rounded-[1.55rem] border border-[#ffcf9f]/14 bg-[radial-gradient(circle_at_12%_0%,rgba(255,207,159,0.16),transparent_32%),rgba(255,255,255,0.055)] shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
              <div className="border-b border-white/8 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffcf9f]">Cook Mode 2.0</p>
                    <h3 className="mt-1 text-2xl font-semibold leading-none tracking-[-0.055em] text-[#fff7ee]">Jeden krok naraz.</h3>
                  </div>
                  <span className="rounded-full bg-[#ffcf9f]/12 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">
                    {cockpitHasFridgeContext ? `${stockedLines.length}/${stockedLines.length + missingLines.length} masz` : 'bez lodówki'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#f3dfcf]/82">{firstMove}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[1rem] border border-[#ffcf9f]/14 bg-[#ffcf9f]/8 px-3 py-2 text-xs leading-5 text-[#f3dfcf]">
                  <strong className="text-[#ffcf9f]">Masz {ownedCount}/{neededCount || total}</strong>
                  <span>kup: {shoppingGapPreview.length > 0 ? `${shoppingGapPreview.join(', ')}${shoppingGapRest > 0 ? `, +${shoppingGapRest}` : ''}` : 'nic pilnego'}</span>
                  {shoppingGapLines.length > 0 ? (
                    <button type="button" onClick={openShoppingGap} className="ml-auto rounded-full bg-[#fff7ee] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#201714] transition hover:bg-[#ffe0c0] focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/35">lista braków</button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-px bg-white/8 sm:grid-cols-3">
                <div className="bg-[#201714]/92 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87d7a1]">masz</p>
                  {cockpitHasFridgeContext && stockedLines.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm leading-5 text-[#dff5e8]">
                      {stockedLines.slice(0, 5).map((line) => <li key={line.id}>✓ {line.text}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#f3dfcf]/62">Brak kontekstu lodówki. Palnik zakłada tylko spiżarnię.</p>
                  )}
                </div>
                <div className="bg-[#201714]/92 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">brakuje / sprawdź</p>
                  <ul className="mt-3 space-y-2 text-sm leading-5 text-[#f3dfcf]">
                    {(cockpitHasFridgeContext ? missingLines : freshLines).slice(0, 6).map((line) => <li key={line.id}>• {line.text}</li>)}
                  </ul>
                </div>
                <div className="bg-[#201714]/92 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]/80">opcjonalne / spiżarnia</p>
                  <ul className="mt-3 space-y-2 text-sm leading-5 text-[#f3dfcf]/74">
                    {[...optionalLines, ...pantryLines].slice(0, 6).map((line) => <li key={line.id}>· {line.text}</li>)}
                  </ul>
                </div>
              </div>

              {smartSwaps.length > 0 ? (
                <div className="border-t border-white/8 bg-[#ffcf9f]/[0.075] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">zamienniki bez wycieczki do sklepu</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {smartSwaps.map((entry) => (
                      <div key={entry.key} className="rounded-[1rem] border border-white/10 bg-[#201714]/45 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffcf9f]">{entry.key}</p>
                        <p className="mt-1 text-sm leading-5 text-[#f3dfcf]/82">{entry.swaps.length > 0 ? entry.swaps.slice(0, 3).join(' / ') : 'możesz pominąć'}</p>
                        <p className="mt-2 text-xs leading-5 text-[#f3dfcf]/62">{entry.advice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-px bg-white/8 sm:grid-cols-2">
                <div className="bg-white/[0.045] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">timing równoległy</p>
                  <p className="mt-2 text-sm leading-6 text-[#f3dfcf]/78">{parallelTiming}</p>
                </div>
                <div className="bg-white/[0.045] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">zasada tego przepisu</p>
                  <p className="mt-2 text-sm leading-6 text-[#f3dfcf]/78">{chefNote}</p>
                </div>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShoppingMode((current) => !current)}
                aria-pressed={shoppingMode}
                aria-label={shoppingMode ? 'Wyłącz tryb listy zakupów' : 'Włącz tryb listy zakupów'}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 ${
                  shoppingMode
                    ? 'border-transparent bg-[#fff7ee] text-[#201714]'
                    : 'border-white/15 bg-white/5 text-[#fff7ee] hover:bg-white/10'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${shoppingMode ? 'bg-[#22a06b]' : 'bg-[#ffcf9f]'}`} />
                {shoppingMode ? 'Tryb listy zakupów' : 'Włącz tryb listy'}
              </button>
              {shoppingMode ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#ffcf9f]">{checked}/{total}</span>
                  <button type="button" onClick={resetShopping} aria-label="Wyczyść odhaczone składniki" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffcf9f] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30">
                    Wyzeruj
                  </button>
                </div>
              ) : null}
            </div>

            {shoppingMode ? (
              <div className="mb-4 rounded-[1.15rem] border border-white/8 bg-white/[0.045] p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">{checked}/{total} gotowe</span>
                  <span className="text-[#f3dfcf]/70">{remaining === 0 ? 'lista domknięta' : `jeszcze ${remaining}`}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${allDone ? 'animate-progress-glow' : ''}`}
                    style={{ width: `${Math.round(progress * 100)}%`, background: HIGHLIGHT[Math.min(2, Math.floor(progress * 3))] }}
                  />
                </div>
              </div>
            ) : null}

            {allDone && shoppingMode ? (
              <div className="mb-4 animate-success-rise rounded-[1.15rem] border border-[#ffcf9f]/20 bg-[#ffcf9f]/10 px-4 py-3 text-sm text-[#ffcf9f] shadow-[0_18px_50px_rgba(255,207,159,0.10)]">
                <p className="font-semibold">🎉 Masz wszystko. Czas na patelnię.</p>
                <p className="mt-1 text-xs leading-5 text-[#f3dfcf]/72">Lista zakupów zamknięta — teraz już tylko ogień, patelnia i zero scrollowania.</p>
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcf9f]/75">mise en place</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#fff7ee]">Składniki</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">{total} pozycji</span>
                </div>
                {[
                  ['świeże / główne', freshLines],
                  ['spiżarnia', pantryLines],
                ].map(([label, lines]) =>
                  Array.isArray(lines) && lines.length > 0 ? (
                    <div key={label as string} className="mt-4 rounded-[1.2rem] border border-white/8 bg-white/[0.045] p-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]/80">{label as string}</p>
                      <ul className="space-y-2 text-sm leading-6 text-[#f3dfcf]">
                        {lines.map((line) => {
                          const isChecked = !!shopping[line.id]
                          if (shoppingMode) {
                            return (
                              <li key={line.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleItem(line.id)}
                                  aria-pressed={isChecked}
                                  aria-label={isChecked ? `Oznacz jako niekupione: ${line.text}` : `Oznacz jako kupione: ${line.text}`}
                                  className={`group flex w-full items-start gap-3 rounded-[0.9rem] border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 ${isChecked ? 'ingredient-chip-selected border-[#22a06b]/25 bg-[#22a06b]/10' : 'border-white/8 bg-white/5 hover:bg-white/10'}`}
                                >
                                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${isChecked ? 'animate-check-pop border-[#22a06b] bg-[#22a06b] text-[#0a1f15]' : 'border-white/25 bg-transparent text-transparent group-hover:border-white/55'}`}>
                                    ✓
                                  </span>
                                  <span className={`flex-1 ${isChecked ? 'text-[#ffcf9f]/55 line-through' : 'text-[#f3dfcf]'}`}>{line.text}</span>
                                </button>
                              </li>
                            )
                          }
                          return (
                            <li key={line.id} className="flex gap-3 rounded-[0.85rem] px-2 py-1.5">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffcf9f]" />
                              <span>{line.text}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
              <div className="min-w-0">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#ffcf9f]/75 sm:tracking-[0.22em]">prowadzenie</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#fff7ee]">Aktywny Cook Mode</h3>
                </div>
                <div className="mt-3 min-w-0 overflow-hidden rounded-[1.35rem] border border-[#ffcf9f]/16 bg-[radial-gradient(circle_at_12%_0%,rgba(255,207,159,0.16),transparent_32%),rgba(255,255,255,0.06)] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <div key={activeStep} aria-live="polite" className="cook-step-swap p-4 sm:p-5">
                    <div className="flex flex-col gap-1.5 text-xs min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between min-[430px]:gap-3">
                      <span className="font-semibold uppercase tracking-[0.12em] text-[#ffcf9f] sm:tracking-[0.18em]">krok {activeStep + 1}/{recipe.steps.length}</span>
                      <span className="text-[#f3dfcf]/68">~{stepMinutes} min na ten ruch</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#ffcf9f]/90 transition-[width] duration-500 animate-progress-glow" style={{ width: `${stepPercent}%` }} />
                    </div>
                    <p className="mt-5 text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.045em] text-[#fff7ee] sm:text-3xl sm:leading-10">{activeStepText}</p>
                    <p className="mt-3 text-sm leading-6 text-[#f3dfcf]/76">{activeStepCoach}</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="min-w-0 rounded-[1rem] border border-white/8 bg-white/[0.055] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#ffcf9f] sm:tracking-[0.18em]">pod ręką</p>
                        <p className="mt-2 text-sm leading-6 text-[#f3dfcf] break-words">{activeStepIngredients.map((line) => line.text).join(' · ')}</p>
                      </div>
                      <div className="min-w-0 rounded-[1rem] border border-white/8 bg-white/[0.055] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#ffcf9f] sm:tracking-[0.18em]">następny ruch</p>
                        <p className="mt-2 text-sm leading-6 text-[#f3dfcf]/72 break-words">{nextStepText ?? 'Finisz — podaj, zanim danie zacznie stygnąć.'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-px bg-white/8 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
                      disabled={activeStep === 0}
                      className="min-w-0 bg-[#201714]/55 px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#ffcf9f] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 disabled:cursor-not-allowed disabled:text-[#f3dfcf]/30 disabled:hover:bg-[#201714]/55 sm:tracking-[0.14em]"
                    >
                      ← poprzedni
                    </button>
                    <button
                      type="button"
                      onClick={() => setShoppingMode(true)}
                      className="min-w-0 bg-[#201714]/55 px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#f3dfcf] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 sm:tracking-[0.14em]"
                    >
                      lista zakupów
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep((current) => Math.min(recipe.steps.length - 1, current + 1))}
                      disabled={activeStep >= recipe.steps.length - 1}
                      className="min-w-0 bg-[#ffcf9f] px-3 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#201714] transition hover:bg-[#ffe0c0] focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#f3dfcf]/30 sm:tracking-[0.14em]"
                    >
                      następny →
                    </button>
                  </div>
                </div>
                <p className="mt-4 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]/72 md:block">pełna sekwencja</p>
                <ol className="mt-3 hidden space-y-4 text-sm leading-6 text-[#f3dfcf] md:block">
                  {recipe.steps.map((step, index) => {
                    const stepImage = recipe.stepImages?.[index]
                    const stepProgress = Math.round(((index + 1) / recipe.steps.length) * 100)

                    return (
                      <li key={step} className={`step-progress-card group overflow-hidden rounded-[1.45rem] border transition duration-300 hover:-translate-y-0.5 focus-within:border-white/18 ${activeStep === index ? 'cook-step-active border-[#ffcf9f]/35 bg-[#ffcf9f]/10' : 'border-white/8 bg-white/[0.055] hover:border-white/18 hover:bg-white/[0.075]'}`}>
                        {stepImage ? (
                          <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#120c0a] sm:aspect-[16/10] xl:aspect-[5/4]">
                            <Image
                              src={stepImage}
                              alt={`${recipe.title} — krok ${index + 1}`}
                              fill
                              className="object-cover transition duration-700 group-hover:scale-[1.025]"
                              sizes="(max-width: 1024px) 100vw, 520px"
                            />
                            <div className="absolute left-3 top-3 rounded-full bg-[#201714]/82 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffcf9f] backdrop-blur">
                              krok {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-[#ffcf9f] transition-[width] duration-500" style={{ width: `${stepProgress}%` }} />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setActiveStep(index)}
                          aria-current={activeStep === index ? 'step' : undefined}
                          className="flex w-full gap-3 p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30"
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition group-hover:scale-105 ${activeStep === index || stepImage ? 'bg-[#ffcf9f] text-[#201714]' : 'bg-white/10 text-[#ffcf9f]'}`}>{String(index + 1).padStart(2, '0')}</span>
                          <span className="text-[15px] leading-7">{step}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {relatedRecipes.length > 0 ? (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">dalej</p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em]">Więcej z tej kuchni</h2>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {relatedRecipes.map((item) => (
                <Link key={item.slug} href={`/przepisy/${item.slug}`} className="group overflow-hidden rounded-[1.7rem] border border-[#201714]/6 bg-[#fffaf3] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(32,23,20,0.10)]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <RecipeVisual recipe={item} />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#201714]/60">
                      <span className="rounded-full border border-current/10 px-3 py-1.5">{item.time}</span>
                      <span className="rounded-full border border-current/10 px-3 py-1.5">{item.tag}</span>
                    </div>
                    <h3 className="text-2xl font-semibold tracking-[-0.05em]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#201714]/70">{item.intro}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
