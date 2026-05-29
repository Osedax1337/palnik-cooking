import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RecipeCatalogPage } from '@/components/recipe-catalog-page'
import { breadcrumbJsonLd, collectionJsonLd, pageMetadata } from '@/lib/seo'

function AtelierFallback() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#2a1622_0%,#171317_34%,#fffaf3_78%)] px-4 py-4 text-[#fff7ee] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd7b5] sm:text-xs">Palnik / Atelier</div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd7b5] sm:text-xs">Menu</div>
        </div>
        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#181116] p-5 shadow-[0_34px_110px_rgba(8,5,8,0.46)] sm:p-7 lg:p-9">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#ffcf9f]">Atelier Palnika</p>
          <h1 className="mt-4 max-w-[8.2ch] text-[4rem] font-semibold leading-[0.84] tracking-[-0.08em] sm:text-7xl">Ciemniej.<br />Kwaśniej.<br />Lepiej.</h1>
          <p className="mt-6 max-w-[34ch] text-base leading-7 text-[#f3dfcf]">Ładuję selekcję Atelier: ferment, dym, owoce przy mięsie i sosy z napięciem.</p>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = pageMetadata({
  title: 'Atelier — orientalne sztosy z Palnika',
  description:
    'Atelier to selekcja bardziej wysublimowanych dań Palnika: ferment, dym, kwas, fine dining energy i nieoczywiste połączenia smaków.',
  path: '/atelier',
  image: '/recipes/baklazan-miso-daktyle.webp',
  keywords: ['Atelier Palnika', 'fine dining w domu', 'orientalne przepisy', 'ferment', 'nieoczywiste przepisy'],
})

export default function AtelierPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd({
            name: 'Atelier Palnika',
            description: 'Selekcja ciemniejszych, kwaśniejszych i bardziej popisowych dań Palnika.',
            path: '/atelier',
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Palnik', path: '/' },
            { name: 'Atelier', path: '/atelier' },
          ])),
        }}
      />
      <Suspense fallback={<AtelierFallback />}>
        <RecipeCatalogPage forcedCollection="atelier" variant="atelier" />
      </Suspense>
    </>
  )
}
