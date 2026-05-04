import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FavoritesPage } from '@/components/favorites-page'

export const metadata: Metadata = {
  title: 'Ulubione przepisy — Palnik',
  description: 'Twoja lokalna półka zapisanych przepisów w Palniku.',
  alternates: {
    canonical: '/ulubione',
  },
  openGraph: {
    title: 'Ulubione przepisy — Palnik',
    description: 'Twoja lokalna półka zapisanych przepisów w Palniku.',
    url: '/ulubione',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function FavoritesRoute() {
  return (
    <Suspense fallback={null}>
      <FavoritesPage />
    </Suspense>
  )
}
