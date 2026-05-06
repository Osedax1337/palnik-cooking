import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CompareView } from '@/components/compare-view'

function CompareFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[#201714]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#201714]">← Wróć do katalogu</div>
          <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]">Palnik / porównaj</span>
        </div>
        <section className="rounded-[2.4rem] bg-[#201714] px-6 py-8 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.16)] sm:px-8 lg:px-10 lg:py-11">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffcf9f]">decision table</p>
          <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Porównaj bez excela.</h1>
          <p className="mt-5 max-w-[42ch] text-base leading-7 text-[#f3dfcf]">Ładuję zapisane przepisy, porcje i listę zakupów.</p>
        </section>
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Porównaj przepisy — Palnik',
  description: 'Zobacz dwa lub trzy przepisy obok siebie: czas, składniki, wysiłek i klimat.',
  keywords: ['porównanie przepisów', 'co ugotować', 'Palnik', 'przepisy'],
  alternates: {
    canonical: '/porownaj',
  },
  openGraph: {
    title: 'Porównaj przepisy — Palnik',
    description: 'Zobacz dwa lub trzy przepisy obok siebie: czas, składniki, wysiłek i klimat.',
    url: '/porownaj',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Porównaj przepisy — Palnik',
    description: 'Zobacz dwa lub trzy przepisy obok siebie: czas, składniki, wysiłek i klimat.',
  },
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareView />
    </Suspense>
  )
}
