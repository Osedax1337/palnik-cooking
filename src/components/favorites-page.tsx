"use client"

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { RecipeVisual } from '@/components/recipe-visual'
import { DietTags } from '@/components/recipe-meta'
import { clearFavorites, getFavorites, STORAGE_KEYS, toggleFavorite as toggleFavoriteStorage } from '@/lib/storage'
import { recipes } from '@/lib/recipes'
import { useStorageValue } from '@/lib/use-storage'

type FavoriteFilter = 'all' | 'quick' | 'atelier' | 'meal-prep'

const filters: { id: FavoriteFilter; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'quick', label: 'Szybkie' },
  { id: 'atelier', label: 'Atelier' },
  { id: 'meal-prep', label: 'Na jutro' },
]

export function FavoritesPage() {
  const [filter, setFilter] = useState<FavoriteFilter>('all')
  const favoriteSlugs = useStorageValue<string[]>(STORAGE_KEYS.FAVORITES, getFavorites)
  const favoriteRecipes = favoriteSlugs
    .map((slug) => recipes.find((recipe) => recipe.slug === slug))
    .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe))

  const visibleRecipes = useMemo(() => {
    if (filter === 'quick') return favoriteRecipes.filter((recipe) => recipe.minutes <= 20 || recipe.collections.includes('15-min'))
    if (filter === 'atelier') return favoriteRecipes.filter((recipe) => recipe.collections.includes('atelier'))
    if (filter === 'meal-prep') return favoriteRecipes.filter((recipe) => recipe.collections.includes('meal-prep'))
    return favoriteRecipes
  }, [favoriteRecipes, filter])

  const latest = favoriteRecipes.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
            ← Wróć do Palnika
          </Link>
          <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">Palnik / ulubione</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.4rem] bg-[#201714] px-6 py-8 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.16)] sm:px-8 lg:px-10 lg:py-11">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#ffb36b]/60 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">twoja szybka półka</p>
              <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Ulubione bez kopania.</h1>
              <p className="mt-5 max-w-[42ch] text-base leading-7 text-[#f3dfcf]">Zapisane lokalnie, bez konta. Najnowsze są na górze, bo tak działa normalna pamięć, a nie muzeum przepisów.</p>
            </div>
            {favoriteRecipes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/8 p-3 text-center">
                <div><p className="text-2xl font-semibold">{favoriteRecipes.length}</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">razem</p></div>
                <div><p className="text-2xl font-semibold">{favoriteRecipes.filter((r) => r.minutes <= 20 || r.collections.includes('15-min')).length}</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">szybkie</p></div>
                <div><p className="text-2xl font-semibold">{favoriteRecipes.filter((r) => r.collections.includes('atelier')).length}</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">atelier</p></div>
              </div>
            ) : null}
          </div>
        </section>

        {favoriteRecipes.length === 0 ? (
          <section className="mt-6 rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/70 p-8 text-center sm:p-12">
            <p className="text-4xl">♡</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Jeszcze nic nie zapisane</h2>
            <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-6 text-[#201714]/65">Wejdź w katalog i kliknij “zapisz” przy przepisie. Ta strona zacznie wtedy robić robotę.</p>
            <Link href="/#katalog" className="mt-5 inline-flex rounded-full bg-[#201714] px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
              Idź do katalogu
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-[2rem] border border-[#201714]/8 bg-white/70 p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">filtry</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Szybciej znajdź zapisane</h2>
                </div>
                <button type="button" onClick={clearFavorites} className="rounded-full border border-[#c9572d]/20 bg-[#fff3e7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9572d] transition hover:bg-[#ffe4d2] focus:outline-none focus:ring-2 focus:ring-[#c9572d]/20">
                  Wyczyść wszystko
                </button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {filters.map((item) => (
                  <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${filter === item.id ? 'bg-[#201714] text-[#fff7ee]' : 'border border-[#201714]/10 bg-white text-[#201714] hover:bg-[#fff3e7]'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {latest.length > 0 ? (
              <section className="mt-5 rounded-[2rem] bg-[#fff3e7] p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">ostatnio zapisane</p>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {latest.map((recipe) => (
                    <Link key={recipe.slug} href={`/przepisy/${recipe.slug}`} className="min-w-[220px] rounded-[1.3rem] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a4b2a]">{recipe.time}</p>
                      <p className="mt-2 text-lg font-semibold leading-tight tracking-[-0.04em]">{recipe.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {visibleRecipes.length === 0 ? (
              <section className="mt-6 rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/70 p-8 text-center">
                <h2 className="text-2xl font-semibold tracking-[-0.04em]">Tu pusto</h2>
                <p className="mt-2 text-sm text-[#201714]/65">Masz ulubione, ale żadne nie pasuje do tego filtra.</p>
              </section>
            ) : (
              <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleRecipes.map((recipe) => (
                  <article key={recipe.slug} className="group flex h-full flex-col overflow-hidden rounded-[1.9rem] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(32,23,20,0.14)]">
                    <Link href={`/przepisy/${recipe.slug}`} className="relative block aspect-[4/3] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#201714]/30">
                      <RecipeVisual recipe={recipe} />
                    </Link>
                    <div className="flex flex-1 flex-col p-5 lg:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#201714]/60">
                        <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.time}</span>
                        <span className="rounded-full border border-current/10 px-3 py-1.5">{recipe.cuisine}</span>
                      </div>
                      <h2 className="max-w-[13ch] text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-[2rem]">{recipe.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-[#201714]/72">{recipe.intro}</p>
                      <div className="mt-3"><DietTags tags={recipe.dietTags.slice(0, 3)} /></div>
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Link href={`/przepisy/${recipe.slug}`} className="inline-flex rounded-full bg-[#8a4b2a] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#724022] focus:outline-none focus:ring-2 focus:ring-[#8a4b2a]/30">
                          Otwórz
                        </Link>
                        <button type="button" onClick={() => toggleFavoriteStorage(recipe.slug)} className="inline-flex rounded-full border border-[#201714]/12 px-4 py-2.5 text-sm font-semibold text-[#201714] transition hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
                          Usuń
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
