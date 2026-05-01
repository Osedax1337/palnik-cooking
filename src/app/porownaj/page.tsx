import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CompareView } from '@/components/compare-view'

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
    <Suspense fallback={null}>
      <CompareView />
    </Suspense>
  )
}
