import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RecipeCatalogPage } from '@/components/recipe-catalog-page'

function CatalogFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">Palnik</div>
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714]/55">Katalog</div>
        </div>
        <section className="overflow-hidden rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_48%,#f6efe8_100%)] p-5 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-6 lg:p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">katalog Palnika</p>
          <h1 className="mt-2 max-w-[12ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Wybierz danie bez kopania w ścianie treści.</h1>
          <p className="mt-4 max-w-[42ch] text-sm leading-6 text-[#201714]/65">Ładuję filtry, lodówkę i szybkie wybory. Za sekundę będzie pełny silnik Palnika.</p>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Katalog przepisów — Palnik',
  description:
    'Pełny katalog Palnika: filtry, tryb lodówki, szybkie decyzje, porównywanie i przepisy na zwykły dzień bez spiny.',
  alternates: {
    canonical: '/katalog',
  },
  openGraph: {
    title: 'Katalog przepisów — Palnik',
    description: 'Przepisy, filtry, lodówka i szybkie wybory obiadu w jednym miejscu.',
    url: '/katalog',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <RecipeCatalogPage />
    </Suspense>
  )
}
