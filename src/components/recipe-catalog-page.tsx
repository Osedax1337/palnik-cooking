"use client"

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildFridgePalette,
  collectionDefs,
  type Collection,
  cuisineFilters,
  dietTagFilters,
  type DietTag,
  fridgeMatch,
  moodFilters,
  recipes,
  renderIngredient,
  searchRecipe,
} from '@/lib/recipes'
import { RecipeVisual } from '@/components/recipe-visual'
import { EffortDots } from '@/components/effort-dots'
import { DietTags } from '@/components/recipe-meta'
import { PortionSwitcher } from '@/components/portion-switcher'
import {
  getCompare,
  getFridge,
  getRecent,
  setCompare as persistCompare,
  setFridge as persistFridge,
  STORAGE_KEYS,
  toggleCompare as toggleCompareStorage,
} from '@/lib/storage'
import { useStorageValue } from '@/lib/use-storage'

const moodKeys = new Set(moodFilters.map((filter) => filter.key))
const cuisineKeys = new Set(cuisineFilters.map((filter) => filter.key))
const dietKeys = new Set(dietTagFilters.map((filter) => filter.key as DietTag))
const collectionKeys = new Set(collectionDefs.map((c) => c.key as Collection))
const recipeSlugs = new Set(recipes.map((recipe) => recipe.slug))

const fridgePalette = buildFridgePalette()

export function RecipeCatalogPage({
  forcedCollection = 'all',
  variant = 'default',
}: {
  forcedCollection?: Collection | 'all'
  variant?: 'default' | 'atelier'
} = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [moodFilter, setMoodFilter] = useState<(typeof moodFilters)[number]['key']>('all')
  const [cuisineFilter, setCuisineFilter] = useState<(typeof cuisineFilters)[number]['key']>('all')
  const [dietFilters, setDietFilters] = useState<DietTag[]>([])
  const [collectionFilter, setCollectionFilter] = useState<Collection | 'all'>(forcedCollection)
  const [searchQuery, setSearchQuery] = useState('')
  const [openRecipe, setOpenRecipe] = useState(recipes[0].slug)
  const [isShuffling, setIsShuffling] = useState(false)
  const [fridgeMode, setFridgeMode] = useState(false)
  const [fridgeSelection, setFridgeSelection] = useState<Set<string>>(new Set())
  const [showAllFridgeChips, setShowAllFridgeChips] = useState(false)
  const [previewPortions, setPreviewPortions] = useState<number | null>(null)

  // Load persistent fridge selection on mount.
  useEffect(() => {
    const stored = getFridge()
    if (stored.length > 0) {
      setFridgeSelection(new Set(stored))
      setFridgeMode(true)
    }
  }, [])

  // Hydrated client state for compare + recent.
  const compareSlugs = useStorageValue<string[]>(STORAGE_KEYS.COMPARE, getCompare)
  const recentSlugs = useStorageValue<string[]>(STORAGE_KEYS.RECENT, getRecent)

  useEffect(() => {
    const moodParam = searchParams.get('mood')
    const cuisineParam = searchParams.get('cuisine')
    const queryParam = searchParams.get('q')
    const recipeParam = searchParams.get('recipe')
    const collectionParam = searchParams.get('zbior')
    const dietParam = searchParams.get('diet')
    const fridgeParam = searchParams.get('fridge')

    const nextMood = moodParam && moodKeys.has(moodParam as (typeof moodFilters)[number]['key']) ? (moodParam as (typeof moodFilters)[number]['key']) : 'all'
    const nextCuisine = cuisineParam && cuisineKeys.has(cuisineParam as (typeof cuisineFilters)[number]['key']) ? (cuisineParam as (typeof cuisineFilters)[number]['key']) : 'all'
    const nextQuery = queryParam ?? ''
    const nextRecipe = recipeParam && recipeSlugs.has(recipeParam) ? recipeParam : recipes[0].slug
    const nextCollection = forcedCollection !== 'all'
      ? forcedCollection
      : collectionParam && collectionKeys.has(collectionParam as Collection)
        ? (collectionParam as Collection)
        : 'all'
    const nextDiet = (dietParam ?? '')
      .split(',')
      .filter((tag) => tag && dietKeys.has(tag as DietTag)) as DietTag[]

    setMoodFilter((current) => (current === nextMood ? current : nextMood))
    setCuisineFilter((current) => (current === nextCuisine ? current : nextCuisine))
    setSearchQuery((current) => (current === nextQuery ? current : nextQuery))
    setOpenRecipe((current) => (current === nextRecipe ? current : nextRecipe))
    setCollectionFilter((current) => (current === nextCollection ? current : nextCollection))
    setDietFilters((current) => (current.join(',') === nextDiet.join(',') ? current : nextDiet))

    if (fridgeParam) {
      const keys = fridgeParam.split(',').filter(Boolean)
      if (keys.length > 0) {
        setFridgeMode(true)
        setFridgeSelection((current) => {
          const next = new Set(keys)
          const same = current.size === next.size && [...current].every((k) => next.has(k))
          return same ? current : next
        })
      }
    }
  }, [forcedCollection, searchParams])

  const baseFiltered = useMemo(() => {
    return recipes
      .filter((recipe) => (moodFilter === 'all' ? true : recipe.mood === moodFilter))
      .filter((recipe) => (cuisineFilter === 'all' ? true : recipe.cuisine === cuisineFilter))
      .filter((recipe) => (collectionFilter === 'all' ? true : recipe.collections.includes(collectionFilter)))
      .filter((recipe) => (dietFilters.length === 0 ? true : dietFilters.every((tag) => recipe.dietTags.includes(tag))))
      .filter((recipe) => searchRecipe(recipe, searchQuery))
  }, [collectionFilter, cuisineFilter, dietFilters, moodFilter, searchQuery])

  const filteredRecipes = useMemo(() => {
    if (fridgeMode && fridgeSelection.size > 0) {
      return baseFiltered
        .map((recipe) => ({ recipe, match: fridgeMatch(recipe, fridgeSelection) }))
        .sort((a, b) => b.match.score - a.match.score || a.recipe.minutes - b.recipe.minutes)
    }
    return baseFiltered
      .map((recipe) => ({ recipe, match: null as ReturnType<typeof fridgeMatch> | null }))
      .sort((a, b) => a.recipe.minutes - b.recipe.minutes)
  }, [baseFiltered, fridgeMode, fridgeSelection])

  useEffect(() => {
    if (!filteredRecipes.some((entry) => entry.recipe.slug === openRecipe)) {
      setOpenRecipe(filteredRecipes[0]?.recipe.slug ?? recipes[0].slug)
    }
  }, [filteredRecipes, openRecipe])

  const currentEntry = useMemo(
    () => filteredRecipes.find((entry) => entry.recipe.slug === openRecipe) ?? filteredRecipes[0],
    [filteredRecipes, openRecipe],
  )
  const currentRecipe = currentEntry?.recipe ?? recipes[0]

  const portions = previewPortions ?? currentRecipe.servings
  const ratio = portions / currentRecipe.servings

  useEffect(() => {
    setPreviewPortions(null)
  }, [openRecipe])

  // Sync URL with current state.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (moodFilter === 'all') params.delete('mood')
    else params.set('mood', moodFilter)

    if (cuisineFilter === 'all') params.delete('cuisine')
    else params.set('cuisine', cuisineFilter)

    if (forcedCollection !== 'all') {
      params.delete('zbior')
    } else if (collectionFilter === 'all') params.delete('zbior')
    else params.set('zbior', collectionFilter)

    if (dietFilters.length === 0) params.delete('diet')
    else params.set('diet', dietFilters.join(','))

    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    else params.delete('q')

    if (openRecipe === recipes[0].slug) params.delete('recipe')
    else params.set('recipe', openRecipe)

    if (fridgeMode && fridgeSelection.size > 0) params.set('fridge', [...fridgeSelection].join(','))
    else params.delete('fridge')

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    }
  }, [collectionFilter, cuisineFilter, dietFilters, forcedCollection, fridgeMode, fridgeSelection, moodFilter, openRecipe, pathname, router, searchParams, searchQuery])

  const handleRandomRecipe = () => {
    if (filteredRecipes.length === 0) return

    setIsShuffling(true)

    const pool = filteredRecipes.length > 1 ? filteredRecipes.filter((entry) => entry.recipe.slug !== openRecipe) : filteredRecipes
    const next = pool[Math.floor(Math.random() * pool.length)] ?? filteredRecipes[0]

    window.setTimeout(() => {
      setOpenRecipe(next.recipe.slug)
      setIsShuffling(false)
    }, 180)

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById('przepis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const toggleFridgeKey = useCallback((key: string) => {
    setFridgeSelection((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persistFridge([...next])
      return next
    })
  }, [])

  const toggleFridgeMode = () => {
    setFridgeMode((current) => {
      const next = !current
      if (!next) {
        setFridgeSelection(new Set())
        persistFridge([])
      }
      return next
    })
  }

  const clearFilters = () => {
    setMoodFilter('all')
    setCuisineFilter('all')
    setCollectionFilter(forcedCollection)
    setDietFilters([])
    setSearchQuery('')
  }

  const scrollToSection = useCallback((id: string) => {
    if (typeof window === 'undefined') return

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const runHeroScenario = useCallback(
    (scenario: '15-min' | 'po-pracy' | 'lodowka' | 'meal-prep' | 'atelier') => {
      clearFilters()

      if (scenario === 'lodowka') {
        setFridgeMode(true)
        scrollToSection('lodowka')
        return
      }

      setFridgeMode(false)
      setFridgeSelection(new Set())
      persistFridge([])

      if (scenario === '15-min') {
        setCollectionFilter('15-min')
      }

      if (scenario === 'po-pracy') {
        setCollectionFilter('po-pracy')
      }

      if (scenario === 'meal-prep') {
        setCollectionFilter('meal-prep')
      }

      if (scenario === 'atelier') {
        setCollectionFilter('atelier')
      }

      scrollToSection('katalog')
    },
    [scrollToSection],
  )

  const toggleCompare = (slug: string) => {
    persistCompare(toggleCompareStorage(slug))
  }

  const compareCount = compareSlugs.length
  const recentRecipes = recentSlugs
    .map((slug) => recipes.find((recipe) => recipe.slug === slug))
    .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))

  const visibleFridgeChips = showAllFridgeChips ? fridgePalette : fridgePalette.slice(0, 16)

  const hasActiveFilters =
    moodFilter !== 'all' ||
    cuisineFilter !== 'all' ||
    collectionFilter !== 'all' ||
    dietFilters.length > 0 ||
    searchQuery.trim().length > 0

  const collectionMeta = collectionDefs.find((c) => c.key === collectionFilter)
  const atelierCount = recipes.filter((recipe) => recipe.collections.includes('atelier')).length
  const atelierRecipes = recipes.filter((recipe) => recipe.collections.includes('atelier')).slice(0, 4)
  const isAtelierPage = variant === 'atelier'
  const canUnsetCollection = forcedCollection === 'all'

  return (
    <main className={`min-h-screen text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] ${isAtelierPage ? 'bg-[radial-gradient(circle_at_top,#2a1622_0%,#171317_28%,#fffaf3_72%)]' : 'bg-[#fffaf3]'}`}>
      {isAtelierPage ? (
        <section className="relative overflow-hidden px-5 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="absolute left-[8%] top-8 h-48 w-48 rounded-full bg-[#8c3341]/35 blur-3xl" />
          <div className="absolute right-[6%] top-16 h-56 w-56 rounded-full bg-[#d87c4a]/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between gap-4 lg:mb-10">
              <Link href="/" className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#ffd7b5] backdrop-blur transition hover:bg-white/10">
                Palnik / Atelier
              </Link>
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">oriental fine dining lane</span>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
              <article className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,#21141b_0%,#2c1620_44%,#151217_100%)] px-6 pb-7 pt-7 text-[#fff7ee] shadow-[0_28px_90px_rgba(10,6,12,0.34)] sm:px-7 lg:px-10 lg:pb-10 lg:pt-10">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#8c3341]/45 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#d87c4a]/18 blur-3xl" />
                <div className="relative max-w-3xl">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">curated lane / oriental / chaos kontrolowany</p>
                  <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                    Atelier.
                    <br />
                    Rzeczy trochę zbyt dobre
                    <br />
                    na zwykły dzień.
                  </h1>
                  <p className="mt-5 max-w-[42ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                    Tu Palnik przestaje być tylko praktyczny. Wchodzą fermenty, owoce przy mięsie, palone nuty, kwaśne cięcia i małe talerze z ego. Nadal do ugotowania w domu — tylko już bardziej jak prywatny stunt niż zwykły obiad.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#ffcf9f]">
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">{atelierCount} dań</span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">fine dining energy</span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">ferment / dym / kwas</span>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('katalog')}
                      className="inline-flex items-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]"
                    >
                      Wejdź do kolekcji
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomRecipe}
                      className={`inline-flex items-center rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714] ${isShuffling ? 'animate-shuffle-glow' : ''}`}
                    >
                      Wylosuj coś chorego
                    </button>
                  </div>
                </div>
              </article>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
                {atelierRecipes.map((recipe, index) => (
                  <button
                    key={recipe.slug}
                    type="button"
                    onClick={() => {
                      setOpenRecipe(recipe.slug)
                      scrollToSection('przepis')
                    }}
                    className={`rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,10,16,0.18)] focus:outline-none focus:ring-2 focus:ring-white/20 ${index === 0 ? 'border-white/10 bg-white/8 text-[#fff7ee]' : 'border-[#201714]/10 bg-white/88 text-[#201714]'}`}
                  >
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${index === 0 ? 'text-[#ffcf9f]' : 'text-[#8c3341]'}`}>{recipe.cuisine} · {recipe.time}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{recipe.title}</p>
                    <p className={`mt-2 text-sm leading-6 ${index === 0 ? 'text-[#f3dfcf]' : 'text-[#201714]/65'}`}>{recipe.intro}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
      <>
      <section className="relative overflow-hidden px-5 pb-10 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ffd7b5]/70 blur-3xl lg:left-[22%] lg:top-12 lg:h-96 lg:w-96" />
        <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-[#e66a3d]/20 blur-3xl lg:h-80 lg:w-80" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between gap-4 lg:mb-12">
            <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">Palnik</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#201714]/45">co dziś realnie ugotować</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
            <article className="relative overflow-hidden rounded-[2rem] bg-[#201714] px-6 pb-6 pt-7 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.18)] sm:px-7 sm:pb-7 sm:pt-8 lg:rounded-[2.75rem] lg:px-10 lg:pb-10 lg:pt-10">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffb36b] blur-2xl lg:h-40 lg:w-40" />
              <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-[#e66a3d]/50 blur-2xl lg:h-36 lg:w-36" />

              <div className="relative max-w-2xl space-y-6">
                <p className="max-w-[34ch] text-sm uppercase tracking-[0.24em] text-[#ffcf9f]">najpierw decyzja, potem przepis — wybierz sytuację i wejdź od razu w sensowny shortlist</p>
                <div className="space-y-4">
                  <h1 className="max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:max-w-[12ch] lg:text-7xl">
                    Co dziś
                    <br />
                    realnie ugotować?
                  </h1>
                  <p className="max-w-[38ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                    Nie kolejny katalog do scrollowania. Wybierasz scenariusz, dostajesz krótszą listę i szybciej domykasz decyzję: z lodówki, w 15 minut, po pracy albo na jutro.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => runHeroScenario('lodowka')}
                    className="group rounded-[1.5rem] border border-white/12 bg-white/8 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffcf9f]">mam składniki</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#fff7ee]">Start z lodówki</p>
                    <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Zaznaczasz, co masz. Palnik układa shortlistę od najlepszego dopasowania.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => runHeroScenario('15-min')}
                    className="group rounded-[1.5rem] border border-white/12 bg-white/8 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffcf9f]">mam mało czasu</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#fff7ee]">Pokaż 15 minut</p>
                    <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Odcinamy wszystko, co za długie. Zostaje szybki obiad bez negocjacji z życiem.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => runHeroScenario('po-pracy')}
                    className="group rounded-[1.5rem] border border-white/12 bg-white/8 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffcf9f]">jestem padnięty</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#fff7ee]">Coś po pracy</p>
                    <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Maksymalnie mało tarcia: krótsze przepisy, mniej ruchów, szybciej do jedzenia.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => runHeroScenario('meal-prep')}
                    className="group rounded-[1.5rem] border border-white/12 bg-white/8 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffcf9f]">chcę spokój jutro</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#fff7ee]">Na dziś i na jutro</p>
                    <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Przepisy, które działają też z lodówki następnego dnia. Mniej gotowania, więcej odzyskanego czasu.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => runHeroScenario('atelier')}
                    className="group rounded-[1.5rem] border border-[#ffcf9f]/18 bg-gradient-to-br from-[#6e1f1f] via-[#2e1a26] to-[#161317] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714] sm:col-span-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#ffd7b5]">mam ochotę na flex</p>
                        <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#fff7ee]">Atelier — orientalne sztosy</p>
                        <p className="mt-1 max-w-[50ch] text-sm leading-6 text-[#f3dfcf]">Dziwne kontrasty, fine dining energy, małe dania z ego. Nie na “coś szybkiego”, tylko na “coś chorego, ale w dobry sposób”.</p>
                      </div>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#ffcf9f]">{atelierCount} dań</span>
                    </div>
                  </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a href="#katalog" className="inline-flex items-center justify-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]">
                    Zobacz wszystkie przepisy
                  </a>
                  <button type="button" onClick={handleRandomRecipe} className={`inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714] ${isShuffling ? 'animate-shuffle-glow' : ''}`}>
                    Zaskocz mnie
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#ffcf9f]">
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">{recipes.length} przepisów</span>
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">lodówka → shortlist</span>
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">porównaj 2–3 opcje</span>
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5">1 / 2 / 4 porcje</span>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-3 text-[#201714] lg:gap-4">
              <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm lg:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">jak to działa</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">Najpierw zawężenie, potem wybór.</p>
                <p className="mt-1 text-sm leading-6 text-[#201714]/62">Hero nie pyta „czy chcesz oglądać przepisy?”, tylko „w jakiej jesteś sytuacji?”. To jest właściwy pierwszy krok.</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#ffd9b7] px-4 py-4 shadow-sm lg:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">dla człowieka po pracy</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">Mniej myślenia, mniej pustych klików.</p>
                <p className="mt-1 text-sm leading-6 text-[#201714]/62">Scenariusze robią za skrót poznawczy: nie musisz znać systemu, żeby wejść w sensowny flow.</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#f2eee8] px-4 py-4 shadow-sm lg:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">dalej w lejku</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">Potem compare, shopping i przepis.</p>
                <p className="mt-1 text-sm leading-6 text-[#201714]/62">Najpierw decyzja. Dopiero potem dokładanie kolejnych narzędzi — w tej kolejności to ma sens.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-2 pt-1 sm:px-6 lg:px-8 lg:pb-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff4ea_0%,#fffaf3_42%,#f2e6ef_100%)] p-5 shadow-[0_20px_60px_rgba(32,23,20,0.08)] lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8c3341]">wyróżniony zbiór</p>
              <h2 className="mt-2 max-w-[14ch] text-3xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-4xl">Atelier nie udaje grzecznego katalogu.</h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[#201714]/72 sm:text-base">
                To jest warstwa “mam dziś ochotę na coś za dobrego jak na zwykły wtorek”: ferment, kwas, owoc z mięsem, dym, tłuszcz i dziwne rzeczy, które zaskakują, ale nadal mają sens.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runHeroScenario('atelier')}
                  className="inline-flex items-center rounded-full bg-[#201714] px-5 py-3 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:-translate-y-0.5 hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
                >
                  Otwórz Atelier
                </button>
                <span className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white/75 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c3341]">
                  fine dining / oriental / chaos kontrolowany
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {atelierRecipes.map((recipe, index) => (
                <button
                  key={recipe.slug}
                  type="button"
                  onClick={() => {
                    setCollectionFilter('atelier')
                    setOpenRecipe(recipe.slug)
                    scrollToSection('przepis')
                  }}
                  className={`group rounded-[1.5rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(32,23,20,0.12)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${index === 0 ? 'border-[#8c3341]/18 bg-[#201714] text-[#fff7ee] sm:col-span-2' : 'border-[#201714]/8 bg-white/78 text-[#201714]'}`}
                >
                  <p className={`text-[10px] uppercase tracking-[0.2em] ${index === 0 ? 'text-[#ffcf9f]' : 'text-[#8c3341]'}`}>{recipe.cuisine} · {recipe.time}</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{recipe.title}</p>
                  <p className={`mt-2 text-sm leading-6 ${index === 0 ? 'text-[#f3dfcf]' : 'text-[#201714]/65'}`}>{recipe.intro}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {recentRecipes.length > 0 ? (
        <section className="px-5 pb-2 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">ostatnio oglądane</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Wróć do tego, co zaczęte</h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentRecipes.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/przepisy/${recipe.slug}`}
                  className="group flex w-[240px] shrink-0 items-stretch overflow-hidden rounded-[1.4rem] border border-[#201714]/8 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(32,23,20,0.10)]"
                >
                  <div className="relative h-[88px] w-[100px] shrink-0 overflow-hidden">
                    <RecipeVisual recipe={recipe} />
                  </div>
                  <div className="flex flex-1 flex-col justify-center px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a4b2a]">{recipe.time} · {recipe.cuisine}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight tracking-[-0.02em]">{recipe.title}</p>
                    <p className="mt-1 text-[11px] text-[#201714]/55">Wróć →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">zbiory</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Co dziś gotujemy?</h2>
            </div>
            {canUnsetCollection && collectionFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setCollectionFilter('all')}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] underline-offset-4 hover:underline"
              >
                Wyczyść
              </button>
            ) : null}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {collectionDefs.map((collection) => {
              const active = collectionFilter === collection.key
              const count = recipes.filter((r) => r.collections.includes(collection.key)).length
              const isAtelier = collection.key === 'atelier'
              return (
                <button
                  key={collection.key}
                  type="button"
                  onClick={() => setCollectionFilter(active && canUnsetCollection ? 'all' : collection.key)}
                  className={`flex w-[230px] shrink-0 flex-col items-start rounded-[1.6rem] border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                    active
                      ? isAtelier
                        ? 'border-transparent bg-[linear-gradient(135deg,#6e1f1f_0%,#2f1b27_55%,#171217_100%)] text-[#fff7ee] shadow-[0_18px_40px_rgba(32,23,20,0.24)]'
                        : 'border-transparent bg-[#201714] text-[#fff7ee] shadow-[0_18px_40px_rgba(32,23,20,0.18)]'
                      : isAtelier
                        ? 'border-[#8c3341]/12 bg-[linear-gradient(135deg,#fff3eb_0%,#fffaf3_55%,#f7edf4_100%)] text-[#201714] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(32,23,20,0.12)]'
                        : 'border-[#201714]/10 bg-white text-[#201714] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(32,23,20,0.10)]'
                  }`}
                >
                  <span className="text-2xl leading-none">{collection.emoji}</span>
                  <span className="mt-3 text-base font-semibold tracking-[-0.02em]">{collection.label}</span>
                  <span className={`mt-1 text-xs leading-snug ${active ? 'text-[#ffcf9f]' : isAtelier ? 'text-[#5e2b35]' : 'text-[#201714]/60'}`}>{collection.description}</span>
                  <span className={`mt-3 text-[10px] uppercase tracking-[0.2em] ${active ? 'text-[#ffcf9f]' : isAtelier ? 'text-[#8c3341]' : 'text-[#8a4b2a]'}`}>{count} przepisów</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section id="lodowka" className="px-5 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-[#201714]/8 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">co mam w lodówce</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Wybierz, co masz pod ręką</h2>
                <p className="mt-1.5 max-w-[52ch] text-sm leading-6 text-[#201714]/65">
                  Sól, pieprz, oliwa i olej zakładamy, że masz. Zaznacz resztę — przepisy poukładają się od najbliższych temu, co naprawdę masz w lodówce.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {fridgeSelection.size > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFridgeSelection(new Set())
                      persistFridge([])
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] underline-offset-4 hover:underline"
                  >
                    Wyczyść
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={toggleFridgeMode}
                  aria-pressed={fridgeMode}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    fridgeMode
                      ? 'border-transparent bg-[#201714] text-[#fff7ee]'
                      : 'border-[#201714]/15 bg-white text-[#201714] hover:bg-[#fff3e7]'
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${fridgeMode ? 'bg-[#ffcf9f]' : 'bg-[#201714]/30'}`} />
                  {fridgeMode ? 'Tryb lodówki on' : 'Włącz tryb'}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {visibleFridgeChips.map(({ key, count }) => {
                const active = fridgeSelection.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (!fridgeMode) setFridgeMode(true)
                      toggleFridgeKey(key)
                    }}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                      active
                        ? 'bg-[#201714] text-[#fff7ee]'
                        : 'border border-[#201714]/12 bg-[#fffaf3] text-[#201714] hover:bg-[#fff3e7]'
                    }`}
                  >
                    <span className={`text-[10px] ${active ? 'text-[#ffcf9f]' : 'text-[#201714]/40'}`}>{active ? '✓' : '+'}</span>
                    <span className="font-medium">{key}</span>
                    <span className={`text-[10px] uppercase tracking-[0.18em] ${active ? 'text-[#ffcf9f]' : 'text-[#201714]/45'}`}>{count}</span>
                  </button>
                )
              })}
              {fridgePalette.length > 16 ? (
                <button
                  type="button"
                  onClick={() => setShowAllFridgeChips((value) => !value)}
                  className="inline-flex items-center rounded-full border border-dashed border-[#201714]/15 px-3 py-1.5 text-sm font-medium text-[#8a4b2a] transition hover:bg-[#fff3e7]"
                >
                  {showAllFridgeChips ? 'Pokaż mniej' : `Pokaż wszystkie (${fridgePalette.length})`}
                </button>
              ) : null}
            </div>

            {fridgeMode && fridgeSelection.size > 0 ? (
              <p className="mt-4 text-sm text-[#201714]/70">
                Zaznaczono <strong className="text-[#201714]">{fridgeSelection.size}</strong> składników. Przepisy poniżej są posortowane od najlepiej dopasowanych.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section id="katalog" className="px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">katalog</p>
              <h2 className="max-w-[12ch] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Przepisy na dziś.</h2>
              {collectionMeta ? (
                <p className="mt-2 text-sm text-[#201714]/65">{collectionMeta.emoji} Filtr <strong className="text-[#201714]">{collectionMeta.label}</strong> · {collectionMeta.description}</p>
              ) : null}
            </div>
            <p className="max-w-[40ch] text-sm leading-6 text-[#201714]/62 sm:text-base">Szukaj po składniku, filtruj po nastroju, dopasuj do diety i podeślij komuś gotowy link.</p>
          </div>

          <label className="mb-2 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">szukaj</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="np. cytryna, halloumi, makaron, brunch"
              className="w-full rounded-[1.3rem] border border-[#201714]/10 bg-white px-4 py-3 text-sm text-[#201714] shadow-sm outline-none transition focus:border-[#8a4b2a] focus:ring-2 focus:ring-[#8a4b2a]/10"
            />
          </label>

          <p className="mb-4 text-xs text-[#201714]/45">Adres strony aktualizuje się sam, więc filtry, lodówka i wyszukiwarka są shareowalne.</p>

          <div className="mb-3 flex flex-wrap gap-2">
            {moodFilters.map((filter) => {
              const active = moodFilter === filter.key
              return (
                <button key={filter.key} type="button" onClick={() => setMoodFilter(filter.key)} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#201714] text-[#fff7ee]' : 'bg-white text-[#201714] hover:bg-[#fff3e7]'}`}>
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {cuisineFilters.map((filter) => {
              const active = cuisineFilter === filter.key
              return (
                <button key={filter.key} type="button" onClick={() => setCuisineFilter(filter.key)} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#8a4b2a] text-[#fff7ee]' : 'bg-[#fff3e7] text-[#201714] hover:bg-[#ffe8d2]'}`}>
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className="self-center text-[11px] uppercase tracking-[0.22em] text-[#8a4b2a]">dieta:</span>
            {dietTagFilters.map((tag) => {
              const active = dietFilters.includes(tag.key)
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() =>
                    setDietFilters((current) => (current.includes(tag.key) ? current.filter((entry) => entry !== tag.key) : [...current, tag.key]))
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                    active
                      ? 'bg-[#8a4b2a] text-[#fff7ee]'
                      : 'border border-[#201714]/10 bg-white text-[#8a4b2a] hover:bg-[#fff3e7]'
                  }`}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#201714]/55">
            <p>
              Pokazuję <strong className="text-[#201714]">{filteredRecipes.length}</strong> {filteredRecipes.length === 1 ? 'przepis' : 'przepisów'}
              {hasActiveFilters ? ' z aktualnych filtrów' : ''}.
            </p>
            <div className="flex flex-wrap gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7]"
                >
                  Wyczyść filtry
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleRandomRecipe}
                disabled={filteredRecipes.length === 0}
                className={`inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7] disabled:cursor-not-allowed disabled:opacity-45 ${isShuffling ? 'animate-shuffle-glow' : ''}`}
              >
                Losuj z aktualnych filtrów
              </button>
            </div>
          </div>

          {filteredRecipes.length === 0 ? (
            <EmptyState
              fridgeMode={fridgeMode}
              fridgeSelectionSize={fridgeSelection.size}
              clearFilters={clearFilters}
              clearFridge={() => {
                setFridgeSelection(new Set())
                persistFridge([])
                setFridgeMode(false)
              }}
              suggestions={recipes.slice(0, 3)}
              setOpenRecipe={setOpenRecipe}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {filteredRecipes.map(({ recipe, match }) => {
                const active = openRecipe === recipe.slug
                const isInCompare = compareSlugs.includes(recipe.slug)
                const compareDisabled = !isInCompare && compareCount >= 3
                const isAtelier = recipe.collections.includes('atelier')
                return (
                  <article key={recipe.slug} className={`group relative flex h-full flex-col overflow-hidden rounded-[1.9rem] bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_60px_rgba(32,23,20,0.14)] ${active ? 'ring-2 ring-[#201714]/10 shadow-[0_20px_50px_rgba(32,23,20,0.12)]' : ''}`}>
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Link
                        href={`/przepisy/${recipe.slug}`}
                        aria-label={`Otwórz przepis: ${recipe.title}`}
                        className="absolute inset-0 z-10 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fff7ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#201714]"
                      >
                        <RecipeVisual recipe={recipe} />
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#201714]/14 via-transparent to-transparent opacity-70 transition duration-300 group-hover:opacity-100" />
                      </Link>
                      {match && match.total > 0 ? (
                        <div className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#201714] backdrop-blur">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${match.score === 1 ? 'bg-[#22a06b]' : match.score >= 0.5 ? 'bg-[#e08a36]' : 'bg-[#c9572d]'}`} />
                          {match.matched}/{match.total} masz
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleCompare(recipe.slug)}
                        disabled={compareDisabled}
                        aria-pressed={isInCompare}
                        className={`absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition focus:outline-none focus:ring-2 focus:ring-[#fff7ee]/40 ${
                          isInCompare
                            ? 'bg-[#201714] text-[#fff7ee]'
                            : 'bg-white/95 text-[#201714] hover:bg-white disabled:opacity-50'
                        }`}
                      >
                        {isInCompare ? '✓ porównaj' : '+ porównaj'}
                      </button>
                      {isAtelier ? (
                        <div className="pointer-events-none absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#201714]/88 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffcf9f] backdrop-blur">
                          <span className="text-xs">🦂</span>
                          Atelier
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5 lg:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#201714]/60">
                        <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.time}</span>
                        <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.cuisine}</span>
                        <span className="inline-flex items-center rounded-full border border-current/10 px-3 py-1.5">
                          <EffortDots effort={recipe.effort} />
                        </span>
                      </div>
                      <h3 className="max-w-[13ch] text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-[2rem]">{recipe.title}</h3>
                      <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#201714]/78 sm:text-[15px]">{recipe.intro}</p>
                      <div className="mt-3">
                        <DietTags tags={recipe.dietTags.slice(0, 3)} />
                      </div>
                      {isAtelier ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8c3341]">fine dining energy · nieoczywiste połączenia</p>
                      ) : null}
                      {match && match.total > 0 && match.missing.length > 0 ? (
                        <p className="mt-3 text-xs text-[#201714]/55">
                          {match.score === 1
                            ? '🎯 masz wszystko'
                            : `Dokup: ${match.missing.slice(0, 3).map((m) => m.key).join(', ')}${match.missing.length > 3 ? `, +${match.missing.length - 3}` : ''}`}
                        </p>
                      ) : null}
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <button type="button" onClick={() => setOpenRecipe(recipe.slug)} aria-pressed={active} className={`inline-flex w-fit items-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 ${active ? 'bg-[#201714] text-[#fff7ee] focus:ring-[#201714]/40' : 'border border-[#201714]/12 text-[#201714] hover:bg-[#fff3e7] focus:ring-[#201714]/25'}`}>
                          {active ? 'Przepis otwarty ↓' : 'Podejrzyj niżej'}
                        </button>
                        <Link href={`/przepisy/${recipe.slug}`} className="inline-flex items-center rounded-full bg-[#8a4b2a] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:bg-[#724022] focus:outline-none focus:ring-2 focus:ring-[#8a4b2a]/30">
                          Otwórz stronę
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section id="przepis" className="px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div key={currentRecipe.slug} className="mx-auto grid max-w-6xl gap-5 animate-fade-up-soft lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-[2.2rem] bg-white shadow-[0_18px_60px_rgba(32,23,20,0.08)]">
            <div className="group relative aspect-[4/3] w-full">
              <Link
                href={`/przepisy/${currentRecipe.slug}`}
                aria-label={`Otwórz przepis: ${currentRecipe.title}`}
                className="absolute inset-0 z-10 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#201714]/40"
              >
                <RecipeVisual recipe={currentRecipe} large />
              </Link>
            </div>
            <div className="p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#201714]/60">
                <span className="rounded-full border border-current/10 px-3 py-1.5">{currentRecipe.time}</span>
                <span className="rounded-full border border-current/10 px-3 py-1.5">{currentRecipe.cuisine}</span>
                <span className="inline-flex items-center rounded-full border border-current/10 px-3 py-1.5">
                  <EffortDots effort={currentRecipe.effort} />
                </span>
              </div>
              <h2 className="mt-4 max-w-[13ch] text-3xl font-semibold leading-[1] tracking-[-0.05em] sm:text-4xl">{currentRecipe.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#201714]/72 sm:text-base">{currentRecipe.intro}</p>
              <p className="mt-4 rounded-[1rem] bg-[#fffaf3] px-4 py-3.5 text-sm leading-6 text-[#201714]/85">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">kiedy to robić</span>
                <span className="mt-1 block">{currentRecipe.whenToMake}</span>
              </p>
              <div className="mt-4">
                <DietTags tags={currentRecipe.dietTags} />
              </div>
              <p className="mt-5 rounded-[1rem] bg-[#fff3e7] px-4 py-4 text-sm leading-6 text-[#201714]/80"><strong className="text-[#201714]">Tip:</strong> {currentRecipe.tip}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/przepisy/${currentRecipe.slug}`} className="inline-flex items-center rounded-full bg-[#201714] px-4 py-3 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
                  Otwórz osobną stronę przepisu
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-[#201714] p-6 text-[#fff7ee] shadow-[0_22px_70px_rgba(32,23,20,0.18)] lg:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-[-0.03em]">Składniki i kroki</h3>
              <PortionSwitcher
                value={portions}
                onChange={(value) => setPreviewPortions(value)}
                tone="light"
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">Składniki</h4>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#f3dfcf]">
                  {currentRecipe.ingredients.map((ingredient, index) => (
                    <li key={`${ingredient.key}-${index}`} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffcf9f]" />
                      <span>{renderIngredient(ingredient, ratio)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">Kroki</h4>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-[#f3dfcf]">
                  {currentRecipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-[1rem] border border-white/8 bg-white/5 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[#ffcf9f]">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky compare tray */}
      {compareCount > 0 ? (
        <div className="fixed bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-3 rounded-full border border-[#201714]/10 bg-white/95 p-2 pl-4 shadow-[0_18px_40px_rgba(32,23,20,0.18)] backdrop-blur">
            <p className="text-sm">
              <strong className="text-[#201714]">{compareCount}</strong>
              <span className="text-[#201714]/60"> {compareCount === 1 ? 'przepis' : 'przepisy'} do porównania</span>
            </p>
            <div className="hidden flex-1 items-center gap-1 sm:flex">
              {compareSlugs.map((slug) => {
                const recipe = recipes.find((r) => r.slug === slug)
                if (!recipe) return null
                return (
                  <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-[#fff3e7] px-2 py-1 text-[11px] font-semibold text-[#8a4b2a]">
                    {recipe.title.split(' ').slice(0, 2).join(' ')}
                    <button type="button" onClick={() => toggleCompare(slug)} className="text-[#8a4b2a]/60 hover:text-[#201714]">
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => persistCompare([])}
              className="rounded-full border border-[#201714]/10 px-3 py-1.5 text-xs font-semibold text-[#201714] hover:bg-[#fff3e7]"
            >
              Wyczyść
            </button>
            <Link
              href={`/porownaj?ids=${compareSlugs.join(',')}`}
              className={`inline-flex items-center rounded-full bg-[#201714] px-4 py-2 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] ${compareCount < 2 ? 'pointer-events-none opacity-60' : ''}`}
            >
              Porównaj →
            </Link>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 lg:hidden">
        <div className="flex items-center justify-between gap-2 rounded-full border border-[#201714]/10 bg-white/92 p-2 shadow-[0_18px_40px_rgba(32,23,20,0.12)] backdrop-blur">
          <a href="#katalog" className="inline-flex flex-1 items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7]">
            Filtry
          </a>
          <button type="button" onClick={handleRandomRecipe} className={`inline-flex flex-1 items-center justify-center rounded-full bg-[#201714] px-3 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] ${isShuffling ? 'animate-shuffle-glow' : ''}`}>
            Losuj
          </button>
          <a href="#przepis" className="inline-flex flex-1 items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7]">
            Przepis
          </a>
        </div>
      </div>
    </main>
  )
}

function EmptyState({
  fridgeMode,
  fridgeSelectionSize,
  clearFilters,
  clearFridge,
  suggestions,
  setOpenRecipe,
}: {
  fridgeMode: boolean
  fridgeSelectionSize: number
  clearFilters: () => void
  clearFridge: () => void
  suggestions: typeof recipes
  setOpenRecipe: (slug: string) => void
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/60 p-8 text-center sm:p-12">
      <p className="text-3xl">🍋</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {fridgeMode && fridgeSelectionSize > 0 ? 'Z tego nic się nie złoży' : 'Nic nie pasuje do tych filtrów'}
      </h3>
      <p className="mt-2 max-w-[40ch] text-sm leading-6 text-[#201714]/65 mx-auto">
        {fridgeMode && fridgeSelectionSize > 0
          ? 'Spróbuj dodać jeszcze jeden lub dwa składniki, albo wyłącz tryb lodówki, żeby zobaczyć inspiracje na zakupy.'
          : 'Zluzuj filtry albo zacznij od czegoś popularnego — to dobre punkty startu.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center rounded-full bg-[#201714] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924]"
        >
          Wyczyść filtry
        </button>
        {fridgeMode ? (
          <button
            type="button"
            onClick={clearFridge}
            className="inline-flex items-center rounded-full border border-[#201714]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7]"
          >
            Wyłącz tryb lodówki
          </button>
        ) : null}
      </div>

      <div className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a4b2a]">spróbuj zamiast tego</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {suggestions.map((recipe) => (
            <button
              key={recipe.slug}
              type="button"
              onClick={() => setOpenRecipe(recipe.slug)}
              className="group flex items-center gap-3 rounded-[1.4rem] border border-[#201714]/8 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(32,23,20,0.10)]"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <RecipeVisual recipe={recipe} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.02em]">{recipe.title}</p>
                <p className="truncate text-xs text-[#201714]/55">{recipe.time} · {recipe.cuisine}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
