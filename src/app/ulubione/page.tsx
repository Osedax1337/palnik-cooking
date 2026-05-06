import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FavoritesPage } from '@/components/favorites-page'
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo'

function FavoritesFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714]">← Wróć do Palnika</div>
          <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">Palnik / ulubione</span>
        </div>
        <section className="relative overflow-hidden rounded-[2.4rem] bg-[#201714] px-6 py-8 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.16)] sm:px-8 lg:px-10 lg:py-11">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#ffb36b]/60 blur-3xl" />
          <p className="relative text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">twoja szybka półka</p>
          <h1 className="relative mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Ładuję ulubione.</h1>
          <p className="relative mt-5 max-w-[42ch] text-base leading-7 text-[#f3dfcf]">Sprawdzam lokalnie zapisane przepisy i ostatnie wybory.</p>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = pageMetadata({
  title: 'Ulubione przepisy — Palnik',
  description: 'Twoja lokalna półka zapisanych przepisów w Palniku — szybki powrót do dań, które naprawdę chcesz ugotować ponownie.',
  path: '/ulubione',
  keywords: ['ulubione przepisy', 'zapisane przepisy', 'Palnik', 'gotowanie w domu'],
})

export default function FavoritesRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Palnik', path: '/' },
            { name: 'Ulubione', path: '/ulubione' },
          ])),
        }}
      />
      <Suspense fallback={<FavoritesFallback />}>
        <FavoritesPage />
      </Suspense>
    </>
  )
}
