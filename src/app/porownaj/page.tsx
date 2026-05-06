import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CompareView } from '@/components/compare-view'
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo'

function CompareFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714]">← Wróć do katalogu</div>
          <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">Palnik / porównaj</span>
        </div>
        <section className="rounded-[2.4rem] bg-[#201714] px-6 py-8 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.16)] sm:px-8 lg:px-10 lg:py-11">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">stół decyzyjny</p>
          <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Porównaj bez excela.</h1>
          <p className="mt-5 max-w-[42ch] text-base leading-7 text-[#f3dfcf]">Składam przepisy, porcje i wspólną listę zakupów w jedną decyzję.</p>
        </section>
        <section className="mt-6 rounded-[2rem] border border-dashed border-[#201714]/15 bg-white/70 p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">szybki start</p>
          <h2 className="mt-2 max-w-[12ch] text-3xl font-semibold leading-tight tracking-[-0.055em]">Dodaj 2–3 przepisy.</h2>
          <p className="mt-3 max-w-[42ch] text-sm leading-6 text-[#201714]/65">
            Jeśli widzisz ten ekran przez sekundę, Palnik jeszcze składa zapisany zestaw. Możesz też od razu wrócić do katalogu i wybrać przepisy ręcznie.
          </p>
          <Link href="/katalog" className="mt-5 inline-flex items-center rounded-full bg-[#201714] px-4 py-2.5 text-sm font-semibold text-[#fff7ee] transition hover:bg-[#372924] focus:outline-none focus:ring-2 focus:ring-[#201714]/20">
            Idź do katalogu →
          </Link>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = pageMetadata({
  title: 'Porównaj przepisy — Palnik',
  description: 'Zobacz dwa lub trzy przepisy obok siebie: czas, składniki, wysiłek, klimat i wspólną listę zakupów.',
  path: '/porownaj',
  keywords: ['porównanie przepisów', 'lista zakupów', 'co ugotować', 'Palnik', 'przepisy'],
})

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Palnik', path: '/' },
            { name: 'Porównaj', path: '/porownaj' },
          ])),
        }}
      />
      <Suspense fallback={<CompareFallback />}>
        <CompareView />
      </Suspense>
    </>
  )
}
