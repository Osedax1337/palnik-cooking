import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { defaultOgImage, siteUrl } from '@/lib/seo'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Palnik — gotowanie bez spiny',
    template: '%s',
  },
  description: 'Mobile-first strona o prostym, zmysłowym gotowaniu w domu. Mniej zadęcia, więcej smaku.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Palnik',
  appleWebApp: {
    capable: true,
    title: 'Palnik',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/palnik-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/palnik-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/palnik-icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'theme-color': '#201714',
  },
  openGraph: {
    title: 'Palnik — co dziś realnie ugotować?',
    description: 'Przepisy, tryb lodówki, Atelier i szybkie decyzje bez scrollowania w nieskończoność.',
    url: '/',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: '/og-palnik.png',
        width: 1200,
        height: 630,
        alt: 'Palnik — co dziś realnie ugotować?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palnik — co dziś realnie ugotować?',
    description: 'Przepisy, tryb lodówki, Atelier i szybkie decyzje bez scrollowania w nieskończoność.',
    images: [defaultOgImage],
  },
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
