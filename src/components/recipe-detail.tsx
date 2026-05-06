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
import { track, trackRecipeOpened } from '@/lib/analytics'

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
    trackRecipeOpened(recipe.slug, searchParams.get('zestaw') === '1' ? 'compare_winner' : 'recipe_page', {
      cuisine: recipe.cuisine,
      collection_atelier: recipe.collections.includes('atelier'),
    })
    setHydrated(true)
  }, [recipe.collections, recipe.cuisine, recipe.slug, searchParams])

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
  const pantryLines = ingredientLines.filter((line) => line.pantry)
  const freshLines = ingredientLines.filter((line) => !line.pantry)

  const checked = ingredientLines.filter((line) => shopping[line.id]).length
  const total = ingredientLines.length
  const progress = total === 0 ? 0 : checked / total
  const remaining = Math.max(0, total - checked)
  const allDone = checked === total && total > 0

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
    <main className={`min-h-screen px-4 py-4 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:px-6 lg:px-8 lg:py-8 ${isAtelierRecipe ? 'bg-[radial-gradient(circle_at_top,#25131d_0%,#171317_24%,#fffaf3_62%)]' : 'bg-[#fffaf3]'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={isAtelierRecipe ? '/atelier' : '/katalog'} className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 print:hidden ${isAtelierRecipe ? 'border border-white/10 bg-white/8 text-[#fff7ee] hover:bg-white/12 focus:ring-[#ffcf9f]/35' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7] focus:ring-[#201714]/15'}`}>
            ← {isAtelierRecipe ? 'Wróć do Atelier' : 'Wróć do katalogu'}
          </Link>
          <div className="flex items-center gap-2 print:hidden">
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
          <div className={`overflow-hidden rounded-[2rem] shadow-[0_22px_70px_rgba(32,23,20,0.10)] sm:rounded-[2.4rem] ${isAtelierRecipe ? 'border border-[#8c3341]/10 bg-[linear-gradient(180deg,#fff8f1_0%,#fffdfa_54%,#f7edf4_100%)]' : 'bg-white'}`}>
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[5/4]">
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
                <p className="rounded-[1rem] bg-[#fffaf3] px-4 py-3.5 text-sm leading-6 text-[#201714]/85">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">kiedy to robić</span>
                  <span className="mt-1 block">{recipe.whenToMake}</span>
                </p>
                <p className="rounded-[1rem] bg-[#fff3e7] px-4 py-3.5 text-sm leading-6 text-[#201714]/80">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">dlaczego działa</span>
                  <span className="mt-1 block">Kontrast robi robotę: baza daje komfort, akcent robi napięcie, a tekstura pilnuje, żeby talerz nie był nudny.</span>
                </p>
              </div>
              <div className="mt-4">
                <DietTags tags={recipe.dietTags} />
              </div>
              <p className="mt-5 rounded-[1rem] border border-[#201714]/8 bg-white px-4 py-4 text-sm leading-6 text-[#201714]/80"><strong className="text-[#201714]">Tip:</strong> {recipe.tip}</p>
            </div>
          </div>

          <div className={`rounded-[2rem] p-5 text-[#fff7ee] shadow-[0_26px_80px_rgba(32,23,20,0.20)] sm:rounded-[2.35rem] sm:p-6 lg:sticky lg:top-6 lg:p-8 ${isAtelierRecipe ? 'border border-[#ffcf9f]/10 bg-[linear-gradient(145deg,#201714_0%,#2c1620_52%,#121116_100%)]' : 'bg-[#201714]'}`}>
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
                                  className={`group flex w-full items-start gap-3 rounded-[0.9rem] border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#ffcf9f]/30 ${isChecked ? 'border-[#22a06b]/25 bg-[#22a06b]/10' : 'border-white/8 bg-white/5 hover:bg-white/10'}`}
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
              <div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcf9f]/75">prowadzenie</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#fff7ee]">Kroki</h3>
                </div>
                <ol className="mt-4 space-y-4 text-sm leading-6 text-[#f3dfcf]">
                  {recipe.steps.map((step, index) => {
                    const stepImage = recipe.stepImages?.[index]

                    return (
                      <li key={step} className="group overflow-hidden rounded-[1.45rem] border border-white/8 bg-white/[0.055] transition duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.075]">
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
                          </div>
                        ) : null}
                        <div className="flex gap-3 p-4">
                          {!stepImage ? (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-[#ffcf9f]">{String(index + 1).padStart(2, '0')}</span>
                          ) : null}
                          <span className="text-[15px] leading-7">{step}</span>
                        </div>
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
