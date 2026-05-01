import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RecipeCatalogPage } from '@/components/recipe-catalog-page'

export const metadata: Metadata = {
  title: 'Atelier — orientalne sztosy z Palnika',
  description:
    'Atelier to selekcja bardziej wysublimowanych dań Palnika: ferment, dym, kwas, fine dining energy i nieoczywiste połączenia smaków.',
  alternates: {
    canonical: '/atelier',
  },
  openGraph: {
    title: 'Atelier — orientalne sztosy z Palnika',
    description:
      'Osobna kolekcja Palnika dla dań z większym ego: oriental fine dining, dziwne kontrasty i kontrolowany chaos.',
    url: '/atelier',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function AtelierPage() {
  return (
    <Suspense fallback={null}>
      <RecipeCatalogPage forcedCollection="atelier" variant="atelier" />
    </Suspense>
  )
}
