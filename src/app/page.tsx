import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RecipeCatalogPage } from '@/components/recipe-catalog-page'

export const metadata: Metadata = {
  title: 'Palnik — szybkie przepisy na zwykły dzień',
  description:
    'Palnik pomaga ogarnąć obiad bez spiny: przepisy, tryb lodówki, porównanie dań i szybkie decyzje, co dziś ugotować.',
  keywords: ['przepisy', 'szybki obiad', 'co ugotować', 'gotowanie w domu', 'Palnik'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Palnik — szybkie przepisy na zwykły dzień',
    description:
      'Przepisy, tryb lodówki, porównanie dań i szybkie decyzje, co dziś ugotować.',
    url: '/',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palnik — szybkie przepisy na zwykły dzień',
    description:
      'Przepisy, tryb lodówki, porównanie dań i szybkie decyzje, co dziś ugotować.',
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Palnik',
            url: 'https://palnik-cooking-fresh.vercel.app',
            description:
              'Palnik pomaga ogarnąć obiad bez spiny: przepisy, tryb lodówki, porównanie dań i szybkie decyzje, co dziś ugotować.',
            inLanguage: 'pl-PL',
          }),
        }}
      />
      <Suspense fallback={null}>
        <RecipeCatalogPage />
      </Suspense>
    </>
  )
}
