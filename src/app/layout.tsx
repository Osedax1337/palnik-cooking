import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://palnik-cooking-fresh.vercel.app'),
  title: 'Palnik — gotowanie bez spiny',
  description: 'Mobile-first strona o prostym, zmysłowym gotowaniu w domu. Mniej zadęcia, więcej smaku.',
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
