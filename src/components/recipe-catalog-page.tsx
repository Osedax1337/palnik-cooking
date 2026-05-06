"use client"

import Image from 'next/image'
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
  getFavorites,
  getFridge,
  getRecent,
  setCompare as persistCompare,
  setFridge as persistFridge,
  STORAGE_KEYS,
  toggleCompare as toggleCompareStorage,
  toggleFavorite as toggleFavoriteStorage,
} from '@/lib/storage'
import { useStorageValue } from '@/lib/use-storage'
import { track, trackRecipeOpened, trackSearchUsed } from '@/lib/analytics'

const moodKeys = new Set(moodFilters.map((filter) => filter.key))
const cuisineKeys = new Set(cuisineFilters.map((filter) => filter.key))
const dietKeys = new Set(dietTagFilters.map((filter) => filter.key as DietTag))
const collectionKeys = new Set(collectionDefs.map((c) => c.key as Collection))
const recipeSlugs = new Set(recipes.map((recipe) => recipe.slug))
const INITIAL_VISIBLE_RECIPES = 24
const LOAD_MORE_RECIPES = 24

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
  const isAtelierPage = variant === 'atelier'

  const [moodFilter, setMoodFilter] = useState<(typeof moodFilters)[number]['key']>('all')
  const [cuisineFilter, setCuisineFilter] = useState<(typeof cuisineFilters)[number]['key']>('all')
  const [dietFilters, setDietFilters] = useState<DietTag[]>([])
  const [collectionFilter, setCollectionFilter] = useState<Collection | 'all'>(forcedCollection)
  const [searchQuery, setSearchQuery] = useState('')
  const [openRecipe, setOpenRecipe] = useState(recipes[0].slug)
  const [isShuffling, setIsShuffling] = useState(false)
  const [decisionRecipe, setDecisionRecipe] = useState<(typeof recipes)[number] | null>(null)
  const [fridgeMode, setFridgeMode] = useState(false)
  const [fridgeSelection, setFridgeSelection] = useState<Set<string>>(new Set())
  const [showAllFridgeChips, setShowAllFridgeChips] = useState(false)
  const [previewPortions, setPreviewPortions] = useState<number | null>(null)
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(INITIAL_VISIBLE_RECIPES)

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
  const favoriteSlugs = useStorageValue<string[]>(STORAGE_KEYS.FAVORITES, getFavorites)
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
    setVisibleRecipeCount(INITIAL_VISIBLE_RECIPES)
  }, [collectionFilter, cuisineFilter, dietFilters, fridgeMode, fridgeSelection, moodFilter, searchQuery])

  const visibleFilteredRecipes = useMemo(
    () => filteredRecipes.slice(0, visibleRecipeCount),
    [filteredRecipes, visibleRecipeCount],
  )

  const hiddenRecipeCount = Math.max(0, filteredRecipes.length - visibleFilteredRecipes.length)

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
    setDecisionRecipe(next.recipe)

    window.setTimeout(() => {
      setOpenRecipe(next.recipe.slug)
      setIsShuffling(false)
      trackRecipeOpened(next.recipe.slug, 'random_recipe', { result_count: filteredRecipes.length })
    }, 520)

    window.setTimeout(() => setDecisionRecipe(null), 1350)

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        document.getElementById('przepis')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const toggleFridgeKey = useCallback((key: string) => {
    setFridgeSelection((current) => {
      const next = new Set(current)
      const selected = !next.has(key)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persistFridge([...next])
      track('fridge_ingredient_toggled', { ingredient: key, selected, ingredient_count: next.size })
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
      track('fridge_toggled', { enabled: next, ingredient_count: next ? fridgeSelection.size : 0 })
      return next
    })
  }

  const clearFilters = useCallback(() => {
    setMoodFilter('all')
    setCuisineFilter('all')
    setCollectionFilter(forcedCollection)
    setDietFilters([])
    setSearchQuery('')
  }, [forcedCollection])

  const scrollToSection = useCallback((id: string) => {
    if (typeof window === 'undefined') return

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const runHeroScenario = useCallback(
    (scenario: '15-min' | 'po-pracy' | 'lodowka' | 'meal-prep' | 'atelier') => {
      clearFilters()

      if (scenario === 'atelier') {
        router.push('/atelier')
        return
      }

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

      scrollToSection('katalog')
    },
    [clearFilters, router, scrollToSection],
  )

  const toggleCompare = (slug: string) => {
    const next = toggleCompareStorage(slug)
    persistCompare(next)
    track('compare_toggled', { slug, selected: next.includes(slug), compare_count: next.length })
  }

  const toggleFavorite = (slug: string) => {
    const next = toggleFavoriteStorage(slug)
    track('favorite_toggled', { slug, selected: next.includes(slug), favorite_count: next.length })
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      trackSearchUsed(searchQuery, filteredRecipes.length, isAtelierPage ? 'atelier' : 'catalog')
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [filteredRecipes.length, isAtelierPage, searchQuery])

  const compareCount = compareSlugs.length
  const recentRecipes = recentSlugs
    .map((slug) => recipes.find((recipe) => recipe.slug === slug))
    .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))
  const favoriteRecipes = favoriteSlugs
    .map((slug) => recipes.find((recipe) => recipe.slug === slug))
    .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))

  const visibleFridgeChips = showAllFridgeChips ? fridgePalette : fridgePalette.slice(0, 16)
  const fridgeBestMatches = fridgeMode && fridgeSelection.size > 0
    ? filteredRecipes
        .filter((entry) => entry.match && entry.match.total > 0)
        .slice(0, 3)
    : []
  const fridgeTopMatch = fridgeBestMatches[0]?.match
  const fridgeTopRecipe = fridgeBestMatches[0]?.recipe
  const fridgeSelectedList = [...fridgeSelection].slice(0, 5)
  const fridgeSelectedRest = Math.max(0, fridgeSelection.size - fridgeSelectedList.length)
  const decisionCards = [
    {
      eyebrow: 'głód teraz',
      title: 'Chcę jeść za kwadrans',
      body: 'Bez romantyzowania gotowania. Szybki obiad, mało ruchów, dużo sosu albo chrupnięcia.',
      scenario: '15-min' as const,
      recipe: recipes.find((recipe) => recipe.slug === 'makaron-cytryna') ?? recipes[0],
      accent: 'bg-[#201714] text-[#fff7ee]',
    },
    {
      eyebrow: 'lodówka-chaos',
      title: 'Mam składniki, nie mam planu',
      body: 'Zaznaczasz to, co już leży w kuchni. Palnik nie udaje szefa kuchni, tylko skraca listę.',
      scenario: 'lodowka' as const,
      recipe: recipes.find((recipe) => recipe.slug === 'frittata-cukinia') ?? recipes[1],
      accent: 'bg-[#fff3e7] text-[#201714]',
    },
    {
      eyebrow: 'bez wstydu przy stole',
      title: 'Ma wyglądać jak więcej pracy',
      body: 'Dania, które mają efekt „o kurde”, ale nie wymagają życia w kuchni od rana.',
      scenario: 'atelier' as const,
      recipe: recipes.find((recipe) => recipe.slug === 'baklazan-miso-daktyle') ?? recipes[2],
      accent: 'bg-[linear-gradient(135deg,#6e1f1f_0%,#2f1b27_62%,#171217_100%)] text-[#fff7ee]',
    },
    {
      eyebrow: 'jutro też jesz',
      title: 'Zrób raz, podziękuj jutro',
      body: 'Meal-prep bez pudełkowego smutku. Dania, które dobrze znoszą drugi dzień.',
      scenario: 'meal-prep' as const,
      recipe: recipes.find((recipe) => recipe.slug === 'chili-sin-carne') ?? recipes[3],
      accent: 'bg-white text-[#201714]',
    },
  ]

  const hasActiveFilters =
    moodFilter !== 'all' ||
    cuisineFilter !== 'all' ||
    collectionFilter !== 'all' ||
    dietFilters.length > 0 ||
    searchQuery.trim().length > 0

  const collectionMeta = collectionDefs.find((c) => c.key === collectionFilter)
  const atelierAllRecipes = recipes.filter((recipe) => recipe.collections.includes('atelier'))
  const atelierCount = atelierAllRecipes.length
  const atelierRecipes = atelierAllRecipes.slice(0, 4)
  const atelierEntryPoints = [
    atelierAllRecipes.find((recipe) => recipe.slug === 'baklazan-miso-daktyle'),
    atelierAllRecipes.find((recipe) => recipe.slug === 'przegrzebki-kimchi-beurre-blanc'),
    atelierAllRecipes.find((recipe) => recipe.slug === 'kaczka-hibiskus-burak-sumak'),
  ].filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))
  const atelierSignatureMoves = [
    {
      label: 'kontrast',
      title: 'Słodkie nie znaczy deserowe',
      body: 'Daktyl, śliwka, rabarbar albo brzoskwinia pracują tu jak sos: podbijają tłuszcz, kwas i umami, nie robią cukierni.',
    },
    {
      label: 'precyzja',
      title: 'Kwas tnie, dym zostaje',
      body: 'Yuzu, czarna limonka, ponzu i ferment są od tego, żeby talerz miał napięcie. Bez ciężkiej restauracyjnej pompy.',
    },
    {
      label: 'tekstura',
      title: 'Miękkie potrzebuje chrupnięcia',
      body: 'Sezam, orzech, crispy rice, przypalone brzegi. Mały ruch, który sprawia, że danie nie jest jedną miękką chmurą.',
    },
  ]
  const canUnsetCollection = forcedCollection === 'all'

  return (
    <main className={`min-h-screen text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] ${isAtelierPage ? 'bg-[radial-gradient(circle_at_top,#2a1622_0%,#171317_28%,#fffaf3_72%)]' : 'bg-[#fffaf3]'}`}>
      {isAtelierPage ? (
        <section className="relative overflow-hidden px-4 pb-10 pt-4 text-[#fff7ee] sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
          <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_22%_0%,rgba(216,124,74,0.34),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(140,51,65,0.45),transparent_34%),linear-gradient(180deg,#151016_0%,#21141b_58%,rgba(33,20,27,0)_100%)]" />
          <div className="absolute left-[6%] top-24 h-64 w-64 rounded-full bg-[#8c3341]/28 blur-3xl" />
          <div className="absolute right-[8%] top-56 hidden h-px w-80 rotate-[-18deg] bg-gradient-to-r from-transparent via-[#ffcf9f]/35 to-transparent lg:block" />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between gap-4 lg:mb-9">
              <Link href="/" className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd7b5] backdrop-blur transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/40 sm:text-xs">
                Palnik / Atelier
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/katalog" className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd7b5] backdrop-blur transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/40 sm:text-xs">
                  Katalog
                </Link>
                <span className="hidden text-[11px] uppercase tracking-[0.22em] text-white/45 md:inline">dark dining lane</span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
              <article className="relative min-h-[32rem] overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#181116] p-5 shadow-[0_34px_110px_rgba(8,5,8,0.46)] sm:p-7 lg:min-h-[42rem] lg:rounded-[2.8rem] lg:p-9">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(255,207,159,0.18),transparent_28%),linear-gradient(145deg,rgba(110,31,31,0.58),rgba(24,17,22,0.4)_42%,rgba(13,10,12,0.95))]" />
                <div className="absolute bottom-[-5rem] left-[-4rem] h-56 w-56 rounded-full bg-[#6e1f1f]/70 blur-3xl" />
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-[#ffcf9f]/18 bg-[#ffcf9f]/8 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#ffcf9f]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ffcf9f]" />
                      {atelierCount} talerzy / selekcja
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#ffcf9f]">Atelier Palnika</p>
                    <h1 className="mt-4 max-w-[8.2ch] text-[4rem] font-semibold leading-[0.84] tracking-[-0.08em] sm:text-7xl lg:text-[6.4rem]">
                      Ciemniej.
                      <br />
                      Kwaśniej.
                      <br />
                      Lepiej.
                    </h1>
                  </div>
                  <div>
                    <p className="max-w-[34ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                      Dania z większym ego: ferment, dym, owoce przy mięsie, sosy z napięciem. Nie szybki obiad. Mały spektakl na talerzu.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => scrollToSection('katalog')}
                        className="inline-flex items-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]"
                      >
                        Wejdź w menu
                      </button>
                      <button
                        type="button"
                        onClick={handleRandomRecipe}
                        aria-label="Wylosuj talerz z Atelier"
                        className={`inline-flex items-center rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714] ${isShuffling ? 'animate-shuffle-glow' : ''}`}
                      >
                        Losuj talerz
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-[1.05fr_0.95fr]">
                {atelierEntryPoints.map((recipe, index) => (
                  <button
                    key={recipe.slug}
                    type="button"
                    onClick={() => {
                      setOpenRecipe(recipe.slug)
                      scrollToSection('przepis')
                    }}
                    aria-label={`Podejrzyj danie Atelier: ${recipe.title}`}
                    className={`group sheen-on-hover relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#151016] text-left shadow-[0_24px_70px_rgba(10,6,12,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(10,6,12,0.36)] focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/40 ${index === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''}`}
                  >
                    <RecipeVisual recipe={recipe} large={index === 0} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a0c]/92 via-[#151016]/18 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#ffcf9f] backdrop-blur">
                      {index === 0 ? 'signature' : recipe.time}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-[#fff7ee] sm:p-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#ffcf9f]">{recipe.cuisine} · {recipe.tag}</p>
                      <h2 className="mt-2 max-w-[14ch] text-3xl font-semibold leading-[0.92] tracking-[-0.055em]">{recipe.title}</h2>
                      <p className="mt-3 line-clamp-2 max-w-[34ch] text-sm leading-6 text-[#f3dfcf]">{recipe.intro}</p>
                    </div>
                  </button>
                ))}

                <article className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-[#ffcf9f]/12 bg-[#fff7ee] p-5 text-[#201714] shadow-[0_24px_70px_rgba(10,6,12,0.12)] sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#8c3341]">manifest</p>
                  <h2 className="mt-3 max-w-[10ch] text-3xl font-semibold leading-[0.9] tracking-[-0.06em]">Nie dekoruj. Buduj napięcie.</h2>
                  <p className="mt-4 max-w-[30ch] text-sm leading-6 text-[#201714]/66">Atelier działa, kiedy talerz ma jeden mocny konflikt: tłuszcz kontra kwas, miękkie kontra chrupiące, słodkie kontra dym.</p>
                </article>
              </div>
            </div>

            <section className="mt-5 grid gap-3 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
              <article className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 text-[#fff7ee] backdrop-blur sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#ffcf9f]">degustacja domowa</p>
                <h2 className="mt-3 max-w-[10ch] text-3xl font-semibold leading-[0.92] tracking-[-0.06em]">Wybierz napięcie, nie kategorię.</h2>
                <p className="mt-4 text-sm leading-6 text-[#f3dfcf]">Atelier ma działać jak karta małej restauracji: mniej pozycji, mocniejsze intencje, szybciej wiesz, czy dziś chcesz dym, kwas czy aksamit.</p>
              </article>
              <div className="grid gap-3 sm:grid-cols-3">
                {['kwas przecina tłuszcz', 'dym robi scenę', 'chrup pilnuje rytmu'].map((line, index) => (
                  <article key={line} className="rounded-[1.55rem] border border-[#ffcf9f]/14 bg-[#0f0b0e]/42 p-4 text-[#fff7ee]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffcf9f]">zasada 0{index + 1}</p>
                    <p className="mt-2 text-lg font-semibold leading-tight tracking-[-0.04em]">{line}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:mt-7">
              {atelierSignatureMoves.map((move, index) => (
                <article key={move.label} className={`rounded-[1.7rem] border p-4 transition duration-300 hover:-translate-y-0.5 ${index === 1 ? 'border-[#ffcf9f]/18 bg-[#fff7ee] text-[#201714] shadow-[0_18px_50px_rgba(10,6,12,0.16)]' : 'border-white/10 bg-white/[0.055] text-[#fff7ee] backdrop-blur'}`}>
                  <p className={`text-[10px] uppercase tracking-[0.22em] ${index === 1 ? 'text-[#8c3341]' : 'text-[#ffcf9f]'}`}>{move.label}</p>
                  <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.04em]">{move.title}</h2>
                  <p className={`mt-2 text-sm leading-6 ${index === 1 ? 'text-[#201714]/70' : 'text-[#f3dfcf]'}`}>{move.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : (
      <>
      <section className="px-5 pb-5 pt-5 sm:px-6 lg:px-8 lg:pb-7 lg:pt-7">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link href="/" className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#201714]/15">Palnik</Link>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <Link href="/atelier" className="rounded-full px-3 py-2 text-[#201714]/55 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">Atelier</Link>
              <Link href="/ulubione" className="rounded-full px-3 py-2 text-[#201714]/55 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">Ulubione</Link>
            </div>
          </div>

          <article className="relative overflow-hidden rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_48%,#f6efe8_100%)] p-5 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-6 lg:rounded-[2.35rem] lg:p-8">
            <div className="absolute right-[-5rem] top-[-5rem] h-52 w-52 rounded-full bg-[#ffb36b]/35 blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">katalog Palnika</p>
                <h1 className="mt-2 max-w-[12ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl lg:text-6xl">
                  Wybierz danie bez kopania w ścianie treści.
                </h1>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => runHeroScenario('lodowka')} aria-label="Przejdź do trybu lodówki" className="rounded-[1.35rem] border border-[#201714]/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(32,23,20,0.10)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a4b2a]">mam składniki</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em]">Lodówka</p>
                  <p className="mt-1 text-sm leading-6 text-[#201714]/62">Zacznij od tego, co już masz.</p>
                </button>
                <button type="button" onClick={() => runHeroScenario('15-min')} aria-label="Pokaż przepisy do 15 minut" className="rounded-[1.35rem] border border-[#201714]/10 bg-[#201714] p-4 text-left text-[#fff7ee] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(32,23,20,0.18)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#ffcf9f]">bez czasu</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em]">15 minut</p>
                  <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Najkrótsza droga do talerza.</p>
                </button>
                <button type="button" onClick={() => runHeroScenario('atelier')} aria-label="Przejdź do Atelier" className="rounded-[1.35rem] border border-transparent bg-[linear-gradient(135deg,#6e1f1f_0%,#2f1b27_62%,#171217_100%)] p-4 text-left text-[#fff7ee] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(32,23,20,0.18)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#ffcf9f]">ładniejszy talerz</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.04em]">Atelier</p>
                  <p className="mt-1 text-sm leading-6 text-[#f3dfcf]">Kiedy ma być trochę wow.</p>
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      </>
      )}

      {!isAtelierPage ? (
        <section className="px-5 pb-4 pt-2 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">szybka decyzja</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Nie wybieraj przepisu. Wybierz sytuację.</h2>
              </div>
              <p className="hidden max-w-[32ch] text-right text-sm leading-6 text-[#201714]/55 sm:block">Palnik ma działać jak kumpel przy blacie: najpierw pyta, jaki masz problem, dopiero potem pokazuje dania.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {decisionCards.map((card, index) => (
                <button
                  key={card.eyebrow}
                  type="button"
                  onClick={() => runHeroScenario(card.scenario)}
                  className={`group relative min-h-[315px] overflow-hidden rounded-[1.85rem] border border-[#201714]/10 p-4 text-left shadow-[0_14px_34px_rgba(32,23,20,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(32,23,20,0.14)] focus:outline-none focus:ring-2 focus:ring-[#201714]/20 sm:min-h-[300px] ${card.accent}`}
                >
                  <div className="absolute right-3 top-3 z-10 rounded-full border border-current/10 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur">0{index + 1}</div>
                  <div className="absolute inset-x-3 bottom-3 h-[92px] overflow-hidden rounded-[1.2rem] bg-[#201714]/8 opacity-95 transition duration-300 group-hover:scale-[1.025] sm:h-[88px]">
                    <RecipeVisual recipe={card.recipe} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#201714]/92 via-[#201714]/42 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="line-clamp-1 text-sm font-semibold tracking-[-0.02em] text-white drop-shadow">{card.recipe.title}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-white/78">{card.recipe.time} · {card.recipe.cuisine}</p>
                    </div>
                  </div>
                  <div className="relative z-10 pr-10">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-60">{card.eyebrow}</p>
                    <h3 className="mt-2 max-w-[11ch] text-xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[1.35rem]">{card.title}</h3>
                    <p className="sr-only">{card.body}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isAtelierPage && favoriteRecipes.length > 0 ? (
        <section className="px-5 pb-2 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#c9572d]/15 bg-[#fff3e7] p-5 shadow-sm">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">ulubione</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Twoja szybka półka</h2>
              </div>
              <Link href="/ulubione" className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#201714]/15">Wszystkie · {favoriteRecipes.length}</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {favoriteRecipes.slice(0, 8).map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/przepisy/${recipe.slug}`}
                  className="group flex w-[260px] shrink-0 items-stretch overflow-hidden rounded-[1.4rem] border border-[#201714]/8 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(32,23,20,0.10)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15"
                >
                  <div className="relative h-[96px] w-[106px] shrink-0 overflow-hidden">
                    <RecipeVisual recipe={recipe} />
                  </div>
                  <div className="flex flex-1 flex-col justify-center px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a4b2a]">♥ {recipe.time} · {recipe.cuisine}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight tracking-[-0.02em]">{recipe.title}</p>
                    <p className="mt-1 text-[11px] text-[#201714]/55">Otwórz →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isAtelierPage && recentRecipes.length > 0 ? (
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
                  className="group flex w-[240px] shrink-0 items-stretch overflow-hidden rounded-[1.4rem] border border-[#201714]/8 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(32,23,20,0.10)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15"
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

      {!isAtelierPage ? (
        <>
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
                    aria-label="Wyczyść filtr kolekcji"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
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
                      onClick={() => {
                        if (isAtelier) {
                          router.push('/atelier')
                          return
                        }
                        setCollectionFilter(active && canUnsetCollection ? 'all' : collection.key)
                      }}
                      aria-pressed={active}
                      aria-label={`${active ? 'Aktywna kolekcja' : 'Wybierz kolekcję'}: ${collection.label}`}
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
                    aria-label="Wyczyść zaznaczone składniki lodówki"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
                  >
                    Wyczyść
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={toggleFridgeMode}
                  aria-pressed={fridgeMode}
                  aria-label={fridgeMode ? 'Wyłącz tryb lodówki' : 'Włącz tryb lodówki'}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${
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
                    aria-label={active ? `Usuń składnik z lodówki: ${key}` : `Dodaj składnik do lodówki: ${key}`}
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
                  aria-label={showAllFridgeChips ? 'Pokaż mniej składników lodówki' : `Pokaż wszystkie składniki lodówki: ${fridgePalette.length}`}
                  className="inline-flex items-center rounded-full border border-dashed border-[#201714]/15 px-3 py-1.5 text-sm font-medium text-[#8a4b2a] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
                >
                  {showAllFridgeChips ? 'Pokaż mniej' : `Pokaż wszystkie (${fridgePalette.length})`}
                </button>
              ) : null}
            </div>

            {fridgeMode && fridgeSelection.size > 0 ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.55rem] border border-[#201714]/10 bg-[#fff8ee] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">diagnoza lodówki</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.05em]">
                    {fridgeTopRecipe && fridgeTopMatch
                      ? `${Math.round(fridgeTopMatch.score * 100)}% drogi do: ${fridgeTopRecipe.title}`
                      : 'Jeszcze za mało składników, żeby Palnik był mądry'}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#201714]/68">
                    Masz: <strong className="text-[#201714]">{fridgeSelectedList.join(', ')}</strong>{fridgeSelectedRest > 0 ? ` i jeszcze ${fridgeSelectedRest}` : ''}. Palnik sortuje przepisy po realnym dystansie do obiadu, nie po tym, co wygląda najładniej w katalogu.
                  </p>
                  {fridgeTopMatch && fridgeTopMatch.missing.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#201714] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff7ee]">dokup tylko</span>
                      {fridgeTopMatch.missing.slice(0, 4).map((ingredient) => (
                        <button
                          key={ingredient.key}
                          type="button"
                          onClick={() => toggleFridgeKey(ingredient.key)}
                          aria-label={`Dodaj brakujący składnik do lodówki: ${ingredient.key}`}
                          className="rounded-full border border-[#201714]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15"
                          title="Dodaj do zaznaczonych, jeśli jednak masz"
                        >
                          + {ingredient.key}
                        </button>
                      ))}
                    </div>
                  ) : fridgeTopMatch ? (
                    <p className="mt-3 inline-flex rounded-full bg-[#dff5e8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#18623b]">masz wszystko do najlepszego trafienia</p>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {fridgeBestMatches.map(({ recipe, match }, index) => (
                    <button
                      key={recipe.slug}
                      type="button"
                      onClick={() => {
                        setOpenRecipe(recipe.slug)
                        scrollToSection('przepis')
                      }}
                      aria-label={`Podejrzyj najlepsze dopasowanie z lodówki: ${recipe.title}`}
                      className={`group overflow-hidden rounded-[1.35rem] border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(32,23,20,0.12)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${index === 0 ? 'border-[#201714]/15 bg-[#201714] text-[#fff7ee]' : 'border-[#201714]/10 bg-white text-[#201714]'}`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#201714]/10">
                        <RecipeVisual recipe={recipe} />
                        <div className="absolute left-2 top-2 rounded-full bg-white/94 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#201714]">
                          {match ? Math.round(match.score * 100) : 0}% match
                        </div>
                      </div>
                      <div className="px-1 pb-1 pt-2">
                        <p className="line-clamp-2 text-sm font-semibold leading-tight tracking-[-0.03em]">{recipe.title}</p>
                        <p className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${index === 0 ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>{recipe.time} · {match?.matched}/{match?.total} masz</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.55rem] border border-dashed border-[#201714]/14 bg-[#fffaf3] p-4 text-sm leading-6 text-[#201714]/65">
                Pro tip: zaznacz 3–5 składników, które naprawdę masz. Wtedy Palnik zaczyna działać jak szybki doradca, nie jak kolejny filtr z piekła UX.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_48%,#f7efe7_100%)] p-5 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">jak Palnik wybiera</p>
              <h2 className="mt-2 max-w-[12ch] text-3xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-4xl">Mniej lista. Bardziej decyzja.</h2>
              <p className="mt-3 max-w-[46ch] text-sm leading-6 text-[#201714]/65">
                Ranking nie jest od „najładniejszego zdjęcia”. Palnik patrzy na dystans do talerza: czas, składniki, nastrój, kolekcję i to, czy danie ma sens na dziś.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-[1.45rem] border border-[#201714]/8 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">01 / czas</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em]">Najpierw realność</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#201714]/62">15 minut to nie kategoria estetyczna. To stan człowieka, który chce jeść.</p>
              </article>
              <article className="rounded-[1.45rem] border border-[#201714]/8 bg-[#201714] p-4 text-[#fff7ee]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">02 / lodówka</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em]">Potem dystans</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#f3dfcf]">Jeśli brakuje dwóch rzeczy, to jest plan. Jeśli siedmiu — to inspiracja na zakupy.</p>
              </article>
              <article className="rounded-[1.45rem] border border-[#201714]/8 bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">03 / vibe</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em]">Na końcu ochota</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#201714]/62">Comfort, świeże, brunch, Atelier. Bo obiad ma pasować do dnia, nie do tabelki.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
        </>
      ) : (
        <section className="px-4 pb-3 pt-1 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
              <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#1b1519_0%,#231820_48%,#121116_100%)] p-5 text-[#fff7ee] shadow-[0_22px_70px_rgba(15,10,16,0.24)] lg:p-7">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">jak w to wejść bez spiny</p>
                <h2 className="mt-2 max-w-[14ch] text-3xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-4xl">Nie scrolluj wszystkiego. Wejdź z intencją.</h2>
                <p className="mt-3 max-w-[58ch] text-sm leading-6 text-[#f3dfcf] sm:text-base">
                  Atelier działa najlepiej, kiedy wybierasz intencję, nie tylko składnik. Najpierw lekki flex, morska precyzja albo ciemniejszy, cięższy talerz. Dopiero potem konkretny dish.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {atelierEntryPoints.map((recipe, index) => (
                    <button
                      key={recipe.slug}
                      type="button"
                      onClick={() => {
                        setOpenRecipe(recipe.slug)
                        scrollToSection('przepis')
                      }}
                      className={`rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/20 ${index === 1 ? 'border-[#ffcf9f]/18 bg-white/8' : 'border-white/10 bg-white/[0.03]'}`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#ffcf9f]">{recipe.time} · {recipe.cuisine}</p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#fff7ee]">{recipe.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#f3dfcf]">{recipe.intro}</p>
                    </button>
                  ))}
                </div>
              </article>

              <aside className="grid gap-4">
                <div className="rounded-[1.7rem] border border-[#8c3341]/14 bg-[linear-gradient(145deg,#fff6ef_0%,#fffaf3_52%,#f7edf4_100%)] p-5 text-[#201714] shadow-[0_18px_50px_rgba(32,23,20,0.08)]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8c3341]">smakowy brief</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#201714]/74">
                    <li>— kwaśne cięcie zamiast ciężkiej oczywistości</li>
                    <li>— owoce przy mięsie, ale z dyscypliną</li>
                    <li>— dym, ferment, tłuszcz i mała przesada</li>
                  </ul>
                </div>
                <div className="rounded-[1.7rem] border border-white/10 bg-[#201714] p-5 text-[#fff7ee] shadow-[0_18px_50px_rgba(32,23,20,0.14)]">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#ffcf9f]">dla kogo to jest</p>
                  <p className="mt-3 text-sm leading-6 text-[#f3dfcf]">
                    Dla człowieka, który chce ugotować coś trochę za dobrego na zwykły dzień. Mniej „meal prep”, więcej „mała prywatna degustacja”.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <section id="katalog" className={`px-5 py-10 sm:px-6 lg:px-8 lg:py-14 ${isAtelierPage ? 'bg-[linear-gradient(180deg,#181116_0%,#261821_44%,#fffaf3_100%)] text-[#fff7ee] lg:pt-12' : ''}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`mb-2 text-xs uppercase tracking-[0.22em] ${isAtelierPage ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>{isAtelierPage ? 'menu degustacyjne' : 'katalog'}</p>
              <h2 className="max-w-[14ch] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{isAtelierPage ? 'Wybierz napięcie na talerzu.' : 'Przepisy na dziś.'}</h2>
              {collectionMeta ? (
                <p className={`mt-2 text-sm ${isAtelierPage ? 'text-[#f3dfcf]/72' : 'text-[#201714]/65'}`}>{collectionMeta.emoji} {isAtelierPage ? 'Kolekcja' : 'Filtr'} <strong className={isAtelierPage ? 'text-[#ffcf9f]' : 'text-[#201714]'}>{collectionMeta.label}</strong> · {collectionMeta.description}</p>
              ) : null}
            </div>
            <p className={`max-w-[46ch] text-sm leading-6 sm:text-base ${isAtelierPage ? 'text-[#f3dfcf]/78' : 'text-[#201714]/62'}`}>{isAtelierPage ? 'Tu filtrujesz jak kartę win: składnik, nastrój, kuchnia. Mniej checkboxów, więcej decyzji o tym, jaki ma być wieczór.' : 'Szukaj po składniku, filtruj po nastroju, dopasuj do diety i podeślij komuś gotowy link.'}</p>
          </div>

          <div className={`rounded-[2rem] ${isAtelierPage ? 'border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_70px_rgba(10,6,12,0.22)] backdrop-blur sm:p-5 lg:p-6' : ''}`}>
            <label className="mb-2 block">
              <span className={`mb-2 block text-xs uppercase tracking-[0.22em] ${isAtelierPage ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>szukaj</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={isAtelierPage ? 'np. miso, yuzu, jagnięcina, dashi' : 'np. cytryna, halloumi, makaron, brunch'}
                className={`w-full rounded-[1.3rem] px-4 py-3 text-sm text-[#201714] outline-none transition focus:ring-2 ${isAtelierPage ? 'border border-white/10 bg-[#fff7ee] shadow-[0_10px_30px_rgba(10,6,12,0.16)] focus:border-[#ffcf9f] focus:ring-[#ffcf9f]/20' : 'border border-[#201714]/10 bg-white shadow-sm focus:border-[#8a4b2a] focus:ring-[#8a4b2a]/10'}`}
              />
            </label>

            <p className={`mb-4 text-xs ${isAtelierPage ? 'text-[#f3dfcf]/62' : 'text-[#201714]/45'}`}>{isAtelierPage ? 'Filtry traktuj jak brief smakowy, nie spreadsheet.' : 'Adres strony aktualizuje się sam, więc filtry, lodówka i wyszukiwarka są shareowalne.'}</p>

          <div className="mb-3 flex flex-wrap gap-2">
            {moodFilters.map((filter) => {
              const active = moodFilter === filter.key
              return (
                <button key={filter.key} type="button" onClick={() => setMoodFilter(filter.key)} aria-pressed={active} aria-label={`${active ? 'Aktywny nastrój' : 'Filtruj po nastroju'}: ${filter.label}`} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#201714] text-[#fff7ee]' : 'bg-white text-[#201714] hover:bg-[#fff3e7]'}`}>
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {cuisineFilters.map((filter) => {
              const active = cuisineFilter === filter.key
              return (
                <button key={filter.key} type="button" onClick={() => setCuisineFilter(filter.key)} aria-pressed={active} aria-label={`${active ? 'Aktywna kuchnia' : 'Filtruj po kuchni'}: ${filter.label}`} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#8a4b2a] text-[#fff7ee]' : 'bg-[#fff3e7] text-[#201714] hover:bg-[#ffe8d2]'}`}>
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className={`self-center text-[11px] uppercase tracking-[0.22em] ${isAtelierPage ? 'text-[#8c3341]' : 'text-[#8a4b2a]'}`}>dieta:</span>
            {dietTagFilters.map((tag) => {
              const active = dietFilters.includes(tag.key)
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() =>
                    setDietFilters((current) => (current.includes(tag.key) ? current.filter((entry) => entry !== tag.key) : [...current, tag.key]))
                  }
                  aria-pressed={active}
                  aria-label={active ? `Usuń filtr diety: ${tag.label}` : `Dodaj filtr diety: ${tag.label}`}
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

          </div>

          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 text-sm ${isAtelierPage ? 'text-[#f3dfcf]/70' : 'text-[#201714]/55'}`}>
            <p>
              Pokazuję <strong className={isAtelierPage ? 'text-[#ffcf9f]' : 'text-[#201714]'}>{filteredRecipes.length}</strong> {filteredRecipes.length === 1 ? 'przepis' : 'przepisów'}
              {hasActiveFilters ? ' z aktualnych filtrów' : ''}.
            </p>
            <div className="flex flex-wrap gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  aria-label="Wyczyść aktywne filtry katalogu"
                  className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
                >
                  Wyczyść filtry
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleRandomRecipe}
                disabled={filteredRecipes.length === 0}
                aria-label="Wylosuj przepis z aktualnych filtrów"
                className={`tap-pop inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20 disabled:cursor-not-allowed disabled:opacity-45 ${isShuffling ? 'animate-shuffle-glow' : ''}`}
              >
                Losuj z aktualnych filtrów
              </button>
            </div>
          </div>

          {decisionRecipe ? (
            <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md animate-decision-orbit rounded-[1.7rem] border border-[#ffcf9f]/30 bg-[#201714]/95 p-4 text-[#fff7ee] shadow-[0_26px_90px_rgba(32,23,20,0.34)] backdrop-blur sm:bottom-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffcf9f] text-lg text-[#201714] animate-decision-pulse">🔥</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffcf9f]">Palnik wybrał</p>
                  <p className="truncate text-lg font-semibold tracking-[-0.04em]">{decisionRecipe.title}</p>
                  <p className="text-xs text-[#f3dfcf]/80">{decisionRecipe.time} · {decisionRecipe.cuisine}</p>
                </div>
              </div>
            </div>
          ) : null}

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
              suggestions={fridgeMode && fridgeSelection.size > 0 ? filteredRecipes.slice(0, 3).map((entry) => entry.recipe) : recipes.slice(0, 3)}
              setOpenRecipe={setOpenRecipe}
              scrollToRecipe={() => scrollToSection('przepis')}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {visibleFilteredRecipes.map(({ recipe, match }) => {
                const active = openRecipe === recipe.slug
                const isInCompare = compareSlugs.includes(recipe.slug)
                const isFavorite = favoriteSlugs.includes(recipe.slug)
                const compareDisabled = !isInCompare && compareCount >= 3
                const isAtelier = recipe.collections.includes('atelier')
                return (
                  <article key={recipe.slug} className={`group recipe-card-lift relative flex h-full flex-col overflow-hidden rounded-[1.9rem] transition duration-300 ${isAtelierPage ? 'border border-white/10 bg-[linear-gradient(160deg,#fff8f1_0%,#fffdfa_42%,#f6edf4_100%)] shadow-[0_24px_70px_rgba(10,6,12,0.22)] hover:shadow-[0_32px_90px_rgba(10,6,12,0.32)]' : 'bg-white shadow-sm hover:shadow-[0_22px_60px_rgba(32,23,20,0.14)]'} ${active ? 'ring-2 ring-[#201714]/10 shadow-[0_20px_50px_rgba(32,23,20,0.12)]' : ''}`}>
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
                          {Math.round(match.score * 100)}% · {match.matched}/{match.total}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(recipe.slug)}
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? `Usuń z ulubionych: ${recipe.title}` : `Zapisz w ulubionych: ${recipe.title}`}
                        className={`tap-pop absolute left-3 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition focus:outline-none focus:ring-2 focus:ring-[#fff7ee]/40 ${match && match.total > 0 ? 'top-12' : 'top-3'} ${
                          isFavorite ? 'bg-[#c9572d] text-[#fff7ee]' : 'bg-white/95 text-[#201714] hover:bg-white'
                        }`}
                      >
                        {isFavorite ? '♥ zapisane' : '♡ zapisz'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompare(recipe.slug)}
                        disabled={compareDisabled}
                        aria-pressed={isInCompare}
                        aria-label={isInCompare ? `Usuń z porównania: ${recipe.title}` : compareDisabled ? `Limit porównania osiągnięty, nie można dodać: ${recipe.title}` : `Dodaj do porównania: ${recipe.title}`}
                        className={`tap-pop absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition focus:outline-none focus:ring-2 focus:ring-[#fff7ee]/40 ${
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
                    <div className={`flex flex-1 flex-col p-5 lg:p-6 ${isAtelierPage ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]' : ''}`}>
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
                        <button type="button" onClick={() => {
                          setOpenRecipe(recipe.slug)
                          scrollToSection('przepis')
                        }} aria-pressed={active} aria-label={`Podejrzyj przepis niżej: ${recipe.title}`} className={`tap-pop inline-flex w-fit items-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 ${active ? 'bg-[#201714] text-[#fff7ee] focus:ring-[#201714]/40' : 'border border-[#201714]/12 text-[#201714] hover:bg-[#fff3e7] focus:ring-[#201714]/25'}`}>
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

          {hiddenRecipeCount > 0 ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const nextCount = Math.min(visibleRecipeCount + LOAD_MORE_RECIPES, filteredRecipes.length)
                  setVisibleRecipeCount(nextCount)
                  track('load_more_clicked', { shown_count: nextCount, hidden_count: Math.max(0, filteredRecipes.length - nextCount), total_count: filteredRecipes.length })
                }}
                aria-label={`Pokaż kolejne przepisy: ${Math.min(LOAD_MORE_RECIPES, hiddenRecipeCount)} z ${hiddenRecipeCount} ukrytych`}
                className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-5 py-3 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
              >
                Pokaż kolejne {Math.min(LOAD_MORE_RECIPES, hiddenRecipeCount)} · zostało {hiddenRecipeCount}
              </button>
            </div>
          ) : null}
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
                  {currentRecipe.steps.map((step, index) => {
                    const stepImage = currentRecipe.stepImages?.[index]

                    return (
                      <li key={step} className={`overflow-hidden rounded-[1rem] border border-white/8 bg-white/5 transition hover:border-white/15 ${stepImage ? 'p-0' : 'p-3'}`}>
                        {stepImage ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#120c0a]">
                            <Image
                              src={stepImage}
                              alt={`${currentRecipe.title} — krok ${index + 1}`}
                              fill
                              className="object-cover transition duration-500 hover:scale-[1.025]"
                              sizes="(max-width: 1024px) 100vw, 420px"
                            />
                          </div>
                        ) : null}
                        <div className="flex gap-3 p-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[#ffcf9f]">{index + 1}</span>
                          <span>{step}</span>
                        </div>
                      </li>
                    )
                  })}
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
                    <button type="button" onClick={() => toggleCompare(slug)} aria-label={`Usuń z porównania: ${recipe.title}`} className="text-[#8a4b2a]/60 hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => persistCompare([])}
              aria-label="Wyczyść wszystkie przepisy z porównania"
              className="rounded-full border border-[#201714]/10 px-3 py-1.5 text-xs font-semibold text-[#201714] hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
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
  scrollToRecipe,
}: {
  fridgeMode: boolean
  fridgeSelectionSize: number
  clearFilters: () => void
  clearFridge: () => void
  suggestions: typeof recipes
  setOpenRecipe: (slug: string) => void
  scrollToRecipe: () => void
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/60 p-8 text-center sm:p-12">
      <p className="text-3xl">🍋</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {fridgeMode && fridgeSelectionSize > 0 ? 'Z tego jeszcze nie będzie obiadu. Będzie lista zakupów.' : 'Filtry zrobiły za ciasno'}
      </h3>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-6 text-[#201714]/65">
        {fridgeMode && fridgeSelectionSize > 0
          ? 'To nie porażka lodówki, tylko informacja: masz bazę, ale brakuje mostu. Dodaj jeden składnik białkowy, coś kwaśnego albo wyłącz lodówkę i potraktuj wyniki jako inspirację.'
          : 'Palnik nie znalazł sensownego przecięcia filtrów. Cofnij jeden warunek albo zacznij od popularnego przepisu — lepiej zjeść niż optymalizować do śmierci.'}
      </p>
      {fridgeMode && fridgeSelectionSize > 0 ? (
        <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
          <div className="rounded-[1rem] bg-[#fff3e7] p-3 text-xs leading-5 text-[#201714]/68"><strong className="block text-[#201714]">Dodaj białko</strong> jajko, tofu, kurczak, feta albo fasola często odblokują danie.</div>
          <div className="rounded-[1rem] bg-[#fff3e7] p-3 text-xs leading-5 text-[#201714]/68"><strong className="block text-[#201714]">Dodaj kwas</strong> cytryna, ocet, jogurt albo pomidor spinają resztki w coś sensownego.</div>
          <div className="rounded-[1rem] bg-[#fff3e7] p-3 text-xs leading-5 text-[#201714]/68"><strong className="block text-[#201714]">Dodaj bazę</strong> makaron, ryż, pieczywo albo ziemniak robią z chaosu posiłek.</div>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearFilters}
          aria-label="Wyczyść wszystkie filtry katalogu"
          className="inline-flex items-center rounded-full bg-[#201714] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
        >
          Wyczyść filtry
        </button>
        {fridgeMode ? (
          <button
            type="button"
            onClick={clearFridge}
            aria-label="Wyłącz tryb lodówki i wyczyść składniki"
            className="inline-flex items-center rounded-full border border-[#201714]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
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
              onClick={() => {
                setOpenRecipe(recipe.slug)
                scrollToRecipe()
              }}
              aria-label={`Podejrzyj sugerowany przepis: ${recipe.title}`}
              className="group flex items-center gap-3 rounded-[1.4rem] border border-[#201714]/8 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(32,23,20,0.10)] focus:outline-none focus:ring-2 focus:ring-[#201714]/20"
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
