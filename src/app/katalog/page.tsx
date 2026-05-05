import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RecipeCatalogPage } from '@/components/recipe-catalog-page'

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
    <Suspense fallback={null}>
      <RecipeCatalogPage />
    </Suspense>
  )
}
