"use client"

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
import {
  getCompare,
  getFavorites,
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

const HIGHLIGHT = ['#22a06b', '#e08a36', '#c9572d']

function parseCheckedKeys(raw: string | null) {
  if (!raw) return new Set<string>()
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const searchParams = useSearchParams()
  const [portions, setPortions] = useState<number>(recipe.servings)
  const [shopping, setShopping] = useState<Record<string, boolean>>({})
  const [shoppingMode, setShoppingMode] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [compareContext, setCompareContext] = useState(false)

  // Hydrate persisted portions + shopping list once on client.
  useEffect(() => {
    const storedPortions = getPortions()[recipe.slug]
    if (storedPortions && [1, 2, 4].includes(storedPortions)) setPortions(storedPortions)
    const storedShopping = getShopping()[recipe.slug] ?? {}
    setShopping(storedShopping)
    pushRecent(recipe.slug)
    setHydrated(true)
  }, [recipe.slug])

  useEffect(() => {
    const incomingPortions = Number(searchParams.get('porcje'))
    const shoppingModeParam = searchParams.get('lista')
    const fromCompare = searchParams.get('zestaw') === '1'
    const checkedKeys = parseCheckedKeys(searchParams.get('odhaczone'))

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

  const checked = ingredientLines.filter((line) => shopping[line.id]).length
  const total = ingredientLines.length
  const progress = total === 0 ? 0 : checked / total
  const allDone = checked === total && total > 0

  const relatedRecipes = recipes.filter((item) => item.slug !== recipe.slug && item.cuisine === recipe.cuisine).slice(0, 3)

  const toggleItem = (id: string) => {
    setShopping((current) => ({ ...current, [id]: !current[id] }))
  }

  const resetShopping = () => {
    setShopping({})
  }

  const toggleCompare = () => {
    persistCompare(toggleCompareStorage(recipe.slug))
  }

  const toggleFavorite = () => {
    toggleFavoriteStorage(recipe.slug)
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 print:hidden">
            ← Wróć do katalogu
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15"
            >
              Druk / PDF
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
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
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-[#201714]/15 ${
                isInCompare ? 'bg-[#201714] text-[#fff7ee]' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7]'
              }`}
            >
              {isInCompare ? '✓ w porównaniu' : '+ porównaj'}
            </button>
            <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">Palnik / przepis</span>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-[2.2rem] bg-white shadow-[0_18px_60px_rgba(32,23,20,0.08)]">
            <div className="relative aspect-[4/3] w-full">
              <RecipeVisual recipe={recipe} large />
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
              <h1 className="mt-4 max-w-[14ch] text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl">{recipe.title}</h1>
              <p className="mt-4 max-w-[48ch] text-sm leading-6 text-[#201714]/72 sm:text-base">{recipe.intro}</p>
              <p className="mt-5 rounded-[1rem] bg-[#fffaf3] px-4 py-3.5 text-sm leading-6 text-[#201714]/85">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">kiedy to robić</span>
                <span className="mt-1 block">{recipe.whenToMake}</span>
              </p>
              <div className="mt-4">
                <DietTags tags={recipe.dietTags} />
              </div>
              <p className="mt-5 rounded-[1rem] bg-[#fff3e7] px-4 py-4 text-sm leading-6 text-[#201714]/80"><strong className="text-[#201714]">Tip:</strong> {recipe.tip}</p>
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-[#201714] p-6 text-[#fff7ee] shadow-[0_22px_70px_rgba(32,23,20,0.18)] lg:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-[-0.03em]">Tryb gotowania</h2>
                <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f] sm:inline-block">{portions === 1 ? '1 porcja' : portions === 2 ? '2 porcje' : '4 porcje'}</span>
              </div>
              <PortionSwitcher value={portions} onChange={setPortions} tone="light" />
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShoppingMode((current) => !current)}
                aria-pressed={shoppingMode}
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
                  <button type="button" onClick={resetShopping} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffcf9f] underline-offset-4 hover:underline">
                    Wyzeruj
                  </button>
                </div>
              ) : null}
            </div>

            {shoppingMode ? (
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.round(progress * 100)}%`, background: HIGHLIGHT[Math.min(2, Math.floor(progress * 3))] }}
                />
              </div>
            ) : null}

            {allDone && shoppingMode ? (
              <p className="mb-4 rounded-[1rem] bg-white/10 px-4 py-3 text-sm text-[#ffcf9f]">🎉 Masz wszystko. Czas na patelnię.</p>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">Składniki</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#f3dfcf]">
                  {ingredientLines.map((line) => {
                    const isChecked = !!shopping[line.id]
                    if (shoppingMode) {
                      return (
                        <li key={line.id}>
                          <button
                            type="button"
                            onClick={() => toggleItem(line.id)}
                            className="group flex w-full items-start gap-3 rounded-[0.9rem] border border-white/8 bg-white/5 p-3 text-left transition hover:bg-white/10"
                          >
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${isChecked ? 'border-[#22a06b] bg-[#22a06b] text-[#0a1f15]' : 'border-white/25 bg-transparent text-transparent group-hover:border-white/55'}`}>
                              ✓
                            </span>
                            <span className={`flex-1 ${isChecked ? 'text-[#ffcf9f]/55 line-through' : 'text-[#f3dfcf]'}`}>{line.text}</span>
                            {line.pantry ? (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">spiżarnia</span>
                            ) : null}
                          </button>
                        </li>
                      )
                    }
                    return (
                      <li key={line.id} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffcf9f]" />
                        <span>{line.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffcf9f]">Kroki</h3>
                <ol className="mt-3 space-y-3 text-sm leading-6 text-[#f3dfcf]">
                  {recipe.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 rounded-[1rem] border border-white/8 bg-white/5 p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[#ffcf9f]">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
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
