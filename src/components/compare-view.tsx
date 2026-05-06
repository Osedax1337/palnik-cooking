"use client"

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { effortLevels, recipes, renderIngredient } from '@/lib/recipes'
import { RecipeVisual } from '@/components/recipe-visual'
import { DietTags } from '@/components/recipe-meta'
import { EffortDots } from '@/components/effort-dots'
import {
  getCompareShopping,
  getPortions,
  setCompare as persistCompare,
  setCompareShopping,
  setPortionFor,
  STORAGE_KEYS,
  toggleCompare as toggleCompareStorage,
} from '@/lib/storage'
import { useStorageValue } from '@/lib/use-storage'

type ComparedRecipe = (typeof recipes)[number]

const starterComparisons = [
  {
    label: 'głód teraz',
    title: 'Trzy szybkie wyjścia awaryjne',
    href: '/porownaj?ids=makaron-cytryna,ryz-smazony-jajko-chilli,quesadilla-kurczak-ser',
  },
  {
    label: 'bez wstydu',
    title: 'Kolacja, która wygląda na większy plan',
    href: '/porownaj?ids=baklazan-miso-daktyle,risotto-grzyby-lesne,kurczak-jogurt-cytryna',
  },
  {
    label: 'jutro też jem',
    title: 'Meal-prep bez smutnego pudełka',
    href: '/porownaj?ids=chili-sin-carne,tagliatelle-ragu-warzywne,pomidorowa-z-pieca',
  },
]

function buildMetricRanks(selected: ComparedRecipe[], getValue: (recipe: ComparedRecipe) => number) {
  return [...selected].sort((a, b) => getValue(a) - getValue(b))
}

function getVerdict(selected: ComparedRecipe[]) {
  if (selected.length < 2) return null

  const speedRank = buildMetricRanks(selected, (recipe) => recipe.minutes)
  const effortRank = buildMetricRanks(selected, (recipe) => effortLevels[recipe.effort].dots)
  const ingredientsRank = buildMetricRanks(selected, (recipe) => recipe.ingredients.length)

  const scored = selected
    .map((recipe) => {
      const speedPosition = speedRank.findIndex((item) => item.slug === recipe.slug)
      const effortPosition = effortRank.findIndex((item) => item.slug === recipe.slug)
      const ingredientsPosition = ingredientsRank.findIndex((item) => item.slug === recipe.slug)

      const score =
        (selected.length - speedPosition) * 3 +
        (selected.length - effortPosition) * 2 +
        (selected.length - ingredientsPosition) * 1.5 +
        (recipe.collections.includes('15-min') ? 0.75 : 0) +
        (recipe.collections.includes('po-pracy') ? 0.5 : 0) +
        (recipe.collections.includes('meal-prep') ? 0.5 : 0)

      const wins: string[] = []
      if (speedPosition === 0) wins.push('najszybszy')
      if (effortPosition === 0) wins.push('najłatwiejszy')
      if (ingredientsPosition === 0) wins.push('najmniej składników')
      if (recipe.collections.includes('meal-prep')) wins.push('działa też jutro')

      let angle = 'solidna alternatywa'
      if (speedPosition === 0) angle = 'gdy liczy się czas'
      if (effortPosition === 0) angle = 'gdy chcesz najmniej tarcia'
      if (ingredientsPosition === 0) angle = 'gdy chcesz najmniej dokupować'
      if (recipe.collections.includes('meal-prep')) angle = 'gdy chcesz mieć też spokój jutro'

      return {
        recipe,
        score,
        wins,
        angle,
      }
    })
    .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes)

  return {
    top: scored[0],
    runnerUp: scored[1] ?? null,
    scored,
  }
}

function formatAmount(value: number): string {
  if (Math.abs(value - 0.25) < 0.01) return '¼'
  if (Math.abs(value - 0.5) < 0.01) return '½'
  if (Math.abs(value - 0.75) < 0.01) return '¾'
  if (Math.abs(value - 1.5) < 0.01) return '1½'
  if (Math.abs(value - 2.5) < 0.01) return '2½'
  if (Number.isInteger(value)) return String(value)
  const rounded = Math.round(value * 4) / 4
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(2).replace('.', ',').replace(/,?0+$/, '')
}

function buildCombinedShoppingList(selected: ComparedRecipe[], portionState: Record<string, number>) {
  const grouped = new Map<
    string,
    {
      id: string
      key: string
      name: string
      pantry: boolean
      totalAmount?: number
      unit?: string
      canSum: boolean
      lines: { recipeSlug: string; recipeTitle: string; text: string }[]
    }
  >()

  for (const recipe of selected) {
    const portions = portionState[recipe.slug] ?? recipe.servings
    const ratio = portions / recipe.servings

    for (const ingredient of recipe.ingredients) {
      const existing = grouped.get(ingredient.key)
      const text = renderIngredient(ingredient, ratio)
      const scaledAmount = ingredient.scalable && ingredient.amount != null ? ingredient.amount * ratio : undefined

      if (!existing) {
        grouped.set(ingredient.key, {
          id: ingredient.key,
          key: ingredient.key,
          name: ingredient.name,
          pantry: !!ingredient.pantry,
          totalAmount: scaledAmount,
          unit: ingredient.unit,
          canSum: Boolean(ingredient.scalable && ingredient.amount != null),
          lines: [{ recipeSlug: recipe.slug, recipeTitle: recipe.title, text }],
        })
        continue
      }

      existing.lines.push({ recipeSlug: recipe.slug, recipeTitle: recipe.title, text })
      existing.pantry = existing.pantry && !!ingredient.pantry

      const compatible =
        existing.canSum &&
        Boolean(ingredient.scalable && ingredient.amount != null) &&
        existing.unit === ingredient.unit &&
        existing.name === ingredient.name

      if (compatible) {
        existing.totalAmount = (existing.totalAmount ?? 0) + (scaledAmount ?? 0)
      } else {
        existing.canSum = false
        existing.totalAmount = undefined
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.pantry !== b.pantry) return a.pantry ? 1 : -1
    if (a.lines.length !== b.lines.length) return b.lines.length - a.lines.length
    return a.name.localeCompare(b.name, 'pl')
  })
}

function parsePortionParam(raw: string | null) {
  if (!raw) return {}

  return raw
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, chunk) => {
      const [slug, value] = chunk.split(':')
      const portions = Number(value)
      if (slug && [1, 2, 4].includes(portions)) acc[slug] = portions
      return acc
    }, {})
}

function parseCheckedParam(raw: string | null) {
  if (!raw) return {}

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = true
      return acc
    }, {})
}

export function CompareView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [shoppingMode, setShoppingMode] = useState(false)
  const [shopping, setShopping] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle')
  const ids = (searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const selected = useMemo(() => {
    const list = ids
      .map((slug) => recipes.find((recipe) => recipe.slug === slug))
      .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))
    return list.slice(0, 3)
  }, [ids])

  // Sync with persisted compare state for nav consistency.
  useEffect(() => {
    persistCompare(selected.map((recipe) => recipe.slug))
  }, [selected])

  useEffect(() => {
    setShopping(getCompareShopping())
    setHydrated(true)
  }, [])

  useEffect(() => {
    const portionOverrides = parsePortionParam(searchParams.get('porcje'))
    const checkedOverrides = parseCheckedParam(searchParams.get('odhaczone'))
    const shoppingModeParam = searchParams.get('lista')

    Object.entries(portionOverrides).forEach(([slug, portions]) => {
      setPortionFor(slug, portions)
    })

    if (Object.keys(checkedOverrides).length > 0) {
      setShopping(checkedOverrides)
      setCompareShopping(checkedOverrides)
    }

    if (shoppingModeParam === '1') {
      setShoppingMode(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (hydrated) setCompareShopping(shopping)
  }, [hydrated, shopping])

  const portionState = useStorageValue<Record<string, number>>(STORAGE_KEYS.PORTIONS, getPortions)

  const fastest = selected.length > 0 ? Math.min(...selected.map((r) => r.minutes)) : 0
  const fewest = selected.length > 0 ? Math.min(...selected.map((r) => r.ingredients.length)) : 0
  const easiest =
    selected.length > 0 ? Math.min(...selected.map((r) => effortLevels[r.effort].dots)) : 0
  const verdict = useMemo(() => getVerdict(selected), [selected])
  const combinedShopping = useMemo(() => buildCombinedShoppingList(selected, portionState), [selected, portionState])
  const checkedShopping = combinedShopping.filter((item) => shopping[item.id]).length
  const shoppingProgress = combinedShopping.length === 0 ? 0 : checkedShopping / combinedShopping.length

  const toggleShopping = (id: string) => {
    setShopping((current) => ({ ...current, [id]: !current[id] }))
  }

  const resetShopping = () => {
    setShopping({})
  }

  const shoppingExportText = useMemo(() => {
    if (selected.length === 0) return ''

    const lines = [
      `Palnik — lista zakupów`,
      ``,
      `Przepisy: ${selected.map((recipe) => recipe.title).join(' • ')}`,
      ``,
      `Do kupienia:`,
      ...combinedShopping.map((item) => {
        const headline = item.canSum && item.totalAmount != null
          ? `${formatAmount(item.totalAmount)}${item.unit ? ` ${item.unit}` : ''} ${item.name}`
          : item.name
        const source = item.lines.map((line) => line.recipeTitle).join(' • ')
        const detail = !item.canSum ? ` (${item.lines.map((line) => line.text).join(' · ')})` : ''
        const pantry = item.pantry ? ' [spiżarnia]' : ''
        return `- ${headline}${pantry} — ${source}${detail}`
      }),
    ]

    return lines.join('\n')
  }, [combinedShopping, selected])

  const deepShareUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('ids', selected.map((recipe) => recipe.slug).join(','))

    const portionEntries = selected
      .map((recipe) => {
        const portions = portionState[recipe.slug] ?? recipe.servings
        return portions !== recipe.servings ? `${recipe.slug}:${portions}` : null
      })
      .filter(Boolean) as string[]

    if (portionEntries.length > 0) {
      params.set('porcje', portionEntries.join('|'))
    }

    const checkedEntries = combinedShopping.filter((item) => shopping[item.id]).map((item) => item.id)
    if (checkedEntries.length > 0) {
      params.set('odhaczone', checkedEntries.join(','))
    }

    if (shoppingMode) {
      params.set('lista', '1')
    }

    const query = params.toString()
    if (typeof window === 'undefined') return query ? `${pathname}?${query}` : pathname
    return `${window.location.origin}${pathname}${query ? `?${query}` : ''}`
  }, [combinedShopping, pathname, portionState, selected, shopping, shoppingMode])

  const winnerRecipeUrl = useMemo(() => {
    if (!verdict) return null

    const params = new URLSearchParams()
    const winner = verdict.top.recipe
    const winnerPortions = portionState[winner.slug] ?? winner.servings
    params.set('porcje', String(winnerPortions))

    const checkedKeys = combinedShopping.filter((item) => shopping[item.id]).map((item) => item.key)
    if (checkedKeys.length > 0) {
      params.set('odhaczone', checkedKeys.join(','))
    }

    params.set('lista', '1')
    params.set('zestaw', '1')

    return `/przepisy/${winner.slug}?${params.toString()}`
  }, [combinedShopping, portionState, shopping, verdict])

  const handleCopyShopping = async () => {
    if (!shoppingExportText) return

    try {
      await navigator.clipboard.writeText(`${shoppingExportText}\n\nDeep link: ${deepShareUrl}`)
      setShareState('copied')
    } catch {
      setShareState('error')
    }
  }

  const handleShareShopping = async () => {
    if (!shoppingExportText) return

    const sharePayload = {
      title: 'Palnik — lista zakupów',
      text: shoppingExportText,
      url: deepShareUrl,
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(sharePayload)
        setShareState('shared')
        return
      }

      await navigator.clipboard.writeText(`${shoppingExportText}\n\n${sharePayload.url ?? ''}`.trim())
      setShareState('copied')
    } catch {
      setShareState('error')
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-6 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/katalog" className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714] transition duration-200 hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
            ← Wróć do katalogu
          </Link>
          <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">Palnik / porównaj</span>
        </div>

        <section className="mb-7 overflow-hidden rounded-[2.35rem] bg-[#201714] p-5 text-[#fff7ee] shadow-[0_26px_80px_rgba(32,23,20,0.16)] sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#ffcf9f]">stół decyzyjny</p>
              <h1 className="mt-3 max-w-[10ch] text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">Co dziś gotujemy?</h1>
              <p className="mt-5 max-w-[48ch] text-sm leading-6 text-[#f3dfcf] sm:text-base">
                Dwa albo trzy przepisy obok siebie. Nie ranking dla sportu — tylko szybka odpowiedź: co ma sens teraz, z tym głodem i tą lodówką.
              </p>
            </div>
            {selected.length > 0 ? (
              <div className="grid gap-2 rounded-[1.6rem] border border-white/10 bg-white/8 p-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[1.1rem] bg-[#fff7ee] px-4 py-3 text-[#201714]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">w zestawie</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{selected.length} przepisy</p>
                </div>
                <div className="rounded-[1.1rem] border border-white/10 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">najszybciej</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{fastest} min</p>
                </div>
                <div className="rounded-[1.1rem] border border-white/10 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffcf9f]">mniej tarcia</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{fewest} skład.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {selected.length < 2 ? (
          <section className="rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/70 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <div>
                <p className="text-3xl">⚖️</p>
                <h2 className="mt-3 max-w-[12ch] text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-4xl">Dodaj 2–3 przepisy.</h2>
                <p className="mt-3 max-w-[42ch] text-sm leading-6 text-[#201714]/65">
                  W katalogu kliknij &quot;+ porównaj&quot;. Albo weź jeden z gotowych zestawów poniżej i od razu zobacz, co Palnik by wybrał.
                </p>
                <Link href="/katalog" className="mt-5 inline-flex items-center rounded-full bg-[#201714] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
                  Idź do katalogu →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {starterComparisons.map((item) => (
                  <Link key={item.href} href={item.href} className="group rounded-[1.45rem] border border-[#201714]/8 bg-[#fffaf3] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#fff3e7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#201714]/25">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold leading-tight tracking-[-0.04em] text-[#201714]">{item.title}</p>
                    <p className="mt-4 text-sm font-semibold text-[#8a4b2a] transition group-hover:translate-x-1">Porównaj →</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">wspólna lista zakupów</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#201714]">Jedna lista dla całego porównania</h2>
                  <p className="mt-2 max-w-[56ch] text-sm leading-6 text-[#201714]/65">
                    Zamiast skakać między przepisami, masz jedną listę składników zebranych z całego zestawu. Powtórki łapią się razem.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShoppingMode((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      shoppingMode ? 'border-transparent bg-[#201714] text-[#fff7ee]' : 'border-[#201714]/10 bg-[#fffaf3] text-[#201714] hover:bg-[#fff3e7]'
                    }`}
                  >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${shoppingMode ? 'bg-[#22a06b]' : 'bg-[#8a4b2a]'}`} />
                    {shoppingMode ? 'Tryb listy aktywny' : 'Włącz checklistę'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyShopping}
                    className="inline-flex items-center gap-2 rounded-full border border-[#201714]/10 bg-[#fffaf3] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714] transition hover:bg-[#fff3e7]"
                  >
                    Kopiuj listę
                  </button>
                  <button
                    type="button"
                    onClick={handleShareShopping}
                    className="inline-flex items-center gap-2 rounded-full border border-[#201714]/10 bg-[#fffaf3] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714] transition hover:bg-[#fff3e7]"
                  >
                    Share / export
                  </button>
                  {shoppingMode ? (
                    <button type="button" onClick={resetShopping} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a] underline-offset-4 hover:underline">
                      Wyzeruj
                    </button>
                  ) : null}
                </div>
              </div>

              {shareState !== 'idle' ? (
                <p className={`mt-3 text-xs ${shareState === 'error' ? 'text-[#c9572d]' : 'text-[#8a4b2a]'}`}>
                  {shareState === 'copied' ? 'Lista skopiowana.' : shareState === 'shared' ? 'Lista udostępniona.' : 'Nie udało się wyeksportować listy.'}
                </p>
              ) : null}

              {shoppingMode ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#201714]/65">
                    <span>{checkedShopping}/{combinedShopping.length} ogarnięte</span>
                    <span>{Math.round(shoppingProgress * 100)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f2eee8]">
                    <div className="h-full rounded-full bg-[#22a06b] transition-[width] duration-500" style={{ width: `${Math.round(shoppingProgress * 100)}%` }} />
                  </div>
                </>
              ) : null}

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {[
                  { title: 'Do kupienia', hint: 'rzeczy, które zwykle lądują w koszyku', items: combinedShopping.filter((item) => !item.pantry) },
                  { title: 'Spiżarnia', hint: 'prawdopodobnie masz, ale warto sprawdzić', items: combinedShopping.filter((item) => item.pantry) },
                ].map((section) => (
                  section.items.length > 0 ? (
                    <section key={section.title} className="rounded-[1.5rem] border border-[#201714]/8 bg-white/60 p-3">
                      <div className="mb-3 flex items-end justify-between gap-3 px-1">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a4b2a]">{section.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-[#201714]/55">{section.hint}</p>
                        </div>
                        <span className="rounded-full bg-[#fff3e7] px-2.5 py-1 text-xs font-semibold text-[#8a4b2a]">{section.items.length}</span>
                      </div>
                      <ul className="grid gap-3">
                        {section.items.map((item) => {
                          const isChecked = !!shopping[item.id]
                          const headline = item.canSum && item.totalAmount != null
                            ? `${formatAmount(item.totalAmount)}${item.unit ? ` ${item.unit}` : ''} ${item.name}`
                            : item.name

                          return (
                            <li key={item.id}>
                              {shoppingMode ? (
                                <button
                                  type="button"
                                  onClick={() => toggleShopping(item.id)}
                                  className="group flex w-full items-start gap-3 rounded-[1.2rem] border border-[#201714]/8 bg-[#fffaf3] p-4 text-left transition hover:bg-[#fff3e7]"
                                >
                                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${isChecked ? 'border-[#22a06b] bg-[#22a06b] text-white' : 'border-[#201714]/20 bg-white text-transparent group-hover:border-[#201714]/45'}`}>
                                    ✓
                                  </span>
                                  <span className="flex-1">
                                    <span className={`block text-sm font-semibold leading-6 ${isChecked ? 'text-[#201714]/40 line-through' : 'text-[#201714]'}`}>{headline}</span>
                                    <span className="mt-1 block text-xs leading-5 text-[#201714]/55">
                                      {item.lines.map((line) => line.recipeTitle).join(' • ')}
                                    </span>
                                    {!item.canSum ? (
                                      <span className="mt-2 block text-xs leading-5 text-[#8a4b2a]">
                                        {item.lines.map((line) => line.text).join(' · ')}
                                      </span>
                                    ) : null}
                                  </span>
                                </button>
                              ) : (
                                <div className="rounded-[1.2rem] border border-[#201714]/8 bg-[#fffaf3] p-4">
                                  <p className="text-sm font-semibold leading-6 text-[#201714]">{headline}</p>
                                  <p className="mt-1 text-xs leading-5 text-[#201714]/55">{item.lines.map((line) => line.recipeTitle).join(' • ')}</p>
                                  {!item.canSum ? (
                                    <p className="mt-2 text-xs leading-5 text-[#8a4b2a]">{item.lines.map((line) => line.text).join(' · ')}</p>
                                  ) : null}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ) : null
                ))}
              </div>
            </section>

            {verdict ? (
              <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="rounded-[2rem] bg-[#201714] px-5 py-5 text-[#fff7ee] shadow-[0_22px_60px_rgba(32,23,20,0.14)] sm:px-6 sm:py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ffcf9f]">werdykt palnika</p>
                  <h2 className="mt-2 max-w-[14ch] text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">
                    {verdict.top.recipe.title} wygrywa na dziś.
                  </h2>
                  <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[#f3dfcf] sm:text-base">
                    To najlepszy wybór, jeśli chcesz domknąć decyzję bez zbędnego mielnia w głowie. {verdict.top.wins.length > 0 ? `Wygrywa, bo jest ${verdict.top.wins.join(', ')}.` : 'Ma najlepszy balans czasu, wysiłku i liczby składników.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#ffcf9f]">
                    {verdict.top.wins.map((win) => (
                      <span key={win} className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5">
                        {win}
                      </span>
                    ))}
                  </div>
                  {winnerRecipeUrl ? (
                    <div className="mt-5">
                      <Link
                        href={winnerRecipeUrl}
                        className="inline-flex items-center rounded-full bg-[#fff7ee] px-4 py-2.5 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        One click → otwórz zwycięzcę z kontekstem
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[2rem] bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">kiedy nie brać zwycięzcy</p>
                  {verdict.runnerUp ? (
                    <>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#201714]">
                        Weź <span className="text-[#8a4b2a]">{verdict.runnerUp.recipe.title}</span>, jeśli potrzebujesz wariantu: {verdict.runnerUp.angle}.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#201714]/65">
                        Czyli: zwycięzca jest najbardziej opłacalny ogólnie, ale runner-up ma sens, kiedy priorytet jest bardziej konkretny niż „najmniej tarcia overall”.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[#201714]/65">Tu i tak masz sensowny zwycięski wybór bez większych gwiazdek.</p>
                  )}
                </div>
              </section>
            ) : null}

            <div className={`grid gap-4 ${selected.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
              {selected.map((recipe) => {
                const isFastest = recipe.minutes === fastest
                const isFewest = recipe.ingredients.length === fewest
                const isEasiest = effortLevels[recipe.effort].dots === easiest
                const recipeVerdict = verdict?.scored.find((item) => item.recipe.slug === recipe.slug)
                const isWinner = verdict?.top.recipe.slug === recipe.slug
                return (
                  <article key={recipe.slug} className="group flex flex-col overflow-hidden rounded-[1.9rem] bg-white shadow-sm">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Link
                        href={`/przepisy/${recipe.slug}`}
                        aria-label={`Otwórz przepis: ${recipe.title}`}
                        className="absolute inset-0 z-10 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#201714]/40"
                      >
                        <RecipeVisual recipe={recipe} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => persistCompare(toggleCompareStorage(recipe.slug))}
                        className="absolute right-3 top-3 z-20 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#201714] transition hover:bg-white"
                      >
                        usuń
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col p-5 lg:p-6">
                      {recipeVerdict ? (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isWinner ? 'bg-[#201714] text-[#fff7ee]' : 'bg-[#fff3e7] text-[#8a4b2a]'}`}>
                            {isWinner ? 'werdykt: bierz to' : recipeVerdict.angle}
                          </span>
                          {!isWinner && recipeVerdict.wins.length > 0 ? (
                            <span className="text-[11px] uppercase tracking-[0.18em] text-[#201714]/45">
                              plus: {recipeVerdict.wins[0]}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em]">{recipe.title}</h2>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a4b2a]">{recipe.cuisine} · {recipe.tag}</p>

                      {recipeVerdict ? (
                        <p className={`mt-4 rounded-[1rem] px-3 py-3 text-sm leading-6 ${isWinner ? 'bg-[#201714] text-[#f8eee5]' : 'bg-[#fff3e7] text-[#201714]/80'}`}>
                          <span className={`block text-[10px] font-semibold uppercase tracking-[0.22em] ${isWinner ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>krótki werdykt</span>
                          <span className="mt-1 block">
                            {isWinner
                              ? 'Najlepszy balans na dziś: najmniej tarcia między „chcę coś zjeść” a „siadam do talerza”.'
                              : `To ma sens, ${recipeVerdict.angle}. Nie wygrywa overall, ale może wygrać pod twój konkretny priorytet.`}
                          </span>
                        </p>
                      ) : null}

                      <dl className="mt-4 space-y-3 text-sm text-[#201714]/85">
                        <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[#fffaf3] px-3 py-2.5">
                          <dt className="text-[11px] uppercase tracking-[0.18em] text-[#201714]/55">czas</dt>
                          <dd className="flex items-center gap-2 font-semibold">
                            {recipe.time}
                            {isFastest ? <span className="rounded-full bg-[#22a06b] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white">najszybszy</span> : null}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[#fffaf3] px-3 py-2.5">
                          <dt className="text-[11px] uppercase tracking-[0.18em] text-[#201714]/55">wysiłek</dt>
                          <dd className="flex items-center gap-2 font-semibold">
                            <EffortDots effort={recipe.effort} />
                            {isEasiest ? <span className="rounded-full bg-[#22a06b] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white">najłatwiejszy</span> : null}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[#fffaf3] px-3 py-2.5">
                          <dt className="text-[11px] uppercase tracking-[0.18em] text-[#201714]/55">składniki</dt>
                          <dd className="flex items-center gap-2 font-semibold">
                            {recipe.ingredients.length}
                            {isFewest ? <span className="rounded-full bg-[#22a06b] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white">najmniej</span> : null}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[#fffaf3] px-3 py-2.5">
                          <dt className="text-[11px] uppercase tracking-[0.18em] text-[#201714]/55">porcje (baza)</dt>
                          <dd className="font-semibold">{recipe.servings}</dd>
                        </div>
                      </dl>

                      <div className="mt-4">
                        <DietTags tags={recipe.dietTags} />
                      </div>

                      <p className="mt-4 rounded-[1rem] bg-[#fff3e7] px-3 py-3 text-sm leading-6 text-[#201714]/80">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a4b2a]">kiedy</span>
                        <span className="mt-1 block">{recipe.whenToMake}</span>
                      </p>

                      <details className="mt-4 rounded-[1rem] border border-[#201714]/8 bg-[#fffaf3] px-3 py-2.5">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">Składniki ({recipe.ingredients.length})</summary>
                        <ul className="mt-2 space-y-1 text-sm text-[#201714]/85">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={`${ingredient.key}-${index}`} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8a4b2a]" />
                              <span>{renderIngredient(ingredient)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>

                      <div className="mt-auto pt-5">
                        <Link href={`/przepisy/${recipe.slug}`} className="inline-flex items-center rounded-full bg-[#201714] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924]">
                          Otwórz przepis →
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {selected.length === 2 ? (
              <p className="mt-5 rounded-[1.4rem] border border-dashed border-[#201714]/12 bg-white/60 px-4 py-3 text-sm text-[#201714]/65">
                Możesz dodać jeszcze jeden przepis (max 3) — kliknij &quot;+ porównaj&quot; w katalogu.
              </p>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}
