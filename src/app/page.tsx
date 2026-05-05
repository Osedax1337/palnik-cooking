import type { Metadata } from 'next'
import Link from 'next/link'
import { RecipeVisual } from '@/components/recipe-visual'
import { recipes } from '@/lib/recipes'

export const metadata: Metadata = {
  title: 'Palnik — gotowanie bez scrollowania w nieskończoność',
  description:
    'Palnik pomaga wybrać, co dziś ugotować: katalog przepisów, tryb lodówki, Atelier i szybkie wejścia bez kulinarnego zadęcia.',
  keywords: ['przepisy', 'szybki obiad', 'co ugotować', 'gotowanie w domu', 'Palnik'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Palnik — gotowanie bez scrollowania w nieskończoność',
    description: 'Katalog przepisów, tryb lodówki, Atelier i szybkie decyzje bez kulinarnego zadęcia.',
    url: '/',
    siteName: 'Palnik',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palnik — gotowanie bez scrollowania w nieskończoność',
    description: 'Katalog przepisów, tryb lodówki, Atelier i szybkie decyzje bez kulinarnego zadęcia.',
  },
}

const heroRecipes = [
  recipes.find((recipe) => recipe.slug === 'baklazan-miso-daktyle') ?? recipes[0],
  recipes.find((recipe) => recipe.slug === 'makaron-cytryna') ?? recipes[1],
  recipes.find((recipe) => recipe.slug === 'przegrzebki-kimchi-beurre-blanc') ?? recipes[2],
]

const routes = [
  {
    href: '/katalog',
    eyebrow: 'pełny katalog',
    title: 'Przepisy na dziś',
    body: 'Filtry, szybkie wybory, lodówka i porównywanie. Cały silnik Palnika w jednym miejscu.',
    cta: 'Wejdź do katalogu',
    tone: 'dark',
  },
  {
    href: '/atelier',
    eyebrow: 'ładniejsze talerze',
    title: 'Atelier',
    body: 'Ferment, kwas, dym, owoce przy mięsie i trochę prywatnej degustacji bez restauracyjnej pozy.',
    cta: 'Otwórz Atelier',
    tone: 'wine',
  },
  {
    href: '/katalog#lodowka',
    eyebrow: 'mam składniki',
    title: 'Tryb lodówki',
    body: 'Zaznacz, co masz. Palnik pokaże, jak daleko jesteś od sensownego obiadu.',
    cta: 'Sprawdź lodówkę',
    tone: 'light',
  },
] as const

const principles = [
  ['mniej scrolla', 'Homepage ma prowadzić, nie zasypywać. Ciężkie narzędzia mieszkają w katalogu.'],
  ['więcej obrazu', 'Duże zdjęcia, mocne karty i sekcje, które mają rytm magazynu, nie formularza.'],
  ['zero zadęcia', 'Palnik może wyglądać dobrze, ale dalej mówi ludzkim językiem: co zjeść, kiedy, po co.'],
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf3] text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Palnik',
            url: 'https://palnik-cooking-fresh.vercel.app',
            description:
              'Palnik pomaga wybrać, co dziś ugotować: katalog przepisów, tryb lodówki, Atelier i szybkie wejścia bez kulinarnego zadęcia.',
            inLanguage: 'pl-PL',
          }),
        }}
      />

      <section className="relative px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#ffd7b5]/75 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-[#c9572d]/20 blur-3xl" />
        <div className="absolute bottom-0 left-[-8rem] h-80 w-80 rounded-full bg-[#7c2433]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="mb-8 flex items-center justify-between gap-4">
            <Link href="/" className="rounded-full border border-[#201714]/10 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">
              Palnik
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Link href="/katalog" className="rounded-full px-3 py-2 text-[#201714]/58 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                Katalog
              </Link>
              <Link href="/atelier" className="rounded-full px-3 py-2 text-[#201714]/58 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                Atelier
              </Link>
            </div>
          </nav>

          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <article className="relative overflow-hidden rounded-[2.1rem] bg-[#201714] px-6 pb-7 pt-7 text-[#fff7ee] shadow-[0_28px_90px_rgba(32,23,20,0.18)] sm:rounded-[2.8rem] sm:px-8 sm:pb-9 sm:pt-9 lg:px-11 lg:pb-11 lg:pt-11">
              <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-[#ffb36b]/70 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#8c3341]/50 blur-3xl" />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#ffcf9f]">co dziś realnie ugotować</p>
                <h1 className="mt-5 max-w-[9.5ch] text-[4.1rem] font-semibold leading-[0.86] tracking-[-0.075em] sm:text-7xl lg:text-8xl">
                  Mniej scrolla.
                  <br />
                  Więcej obiadu.
                </h1>
                <p className="mt-6 max-w-[39ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                  Palnik nie udaje kulinarnej encyklopedii. To ładny skrót do decyzji: szybki obiad, lodówka, coś popisowego albo pełny katalog, gdy masz ochotę pogrzebać.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/katalog" className="inline-flex items-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]">
                    Otwórz katalog
                  </Link>
                  <Link href="/atelier" className="inline-flex items-center rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:-translate-y-0.5 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]">
                    Zobacz Atelier
                  </Link>
                </div>
              </div>
            </article>

            <div className="grid min-h-[34rem] gap-3 sm:grid-cols-2 lg:grid-cols-[0.92fr_1.08fr]">
              <Link href={`/przepisy/${heroRecipes[0].slug}`} className="group relative overflow-hidden rounded-[2rem] bg-[#201714] shadow-[0_24px_70px_rgba(32,23,20,0.16)] sm:col-span-2 lg:col-span-1 lg:row-span-2">
                <RecipeVisual recipe={heroRecipes[0]} large />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201714]/86 via-[#201714]/12 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-[#fff7ee] sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcf9f]">dzisiejszy talerz</p>
                  <h2 className="mt-2 max-w-[13ch] text-3xl font-semibold leading-[0.95] tracking-[-0.055em]">{heroRecipes[0].title}</h2>
                  <p className="mt-2 max-w-[32ch] text-sm leading-6 text-[#f3dfcf]">{heroRecipes[0].intro}</p>
                </div>
              </Link>

              {heroRecipes.slice(1).map((recipe, index) => (
                <Link key={recipe.slug} href={`/przepisy/${recipe.slug}`} className={`group relative overflow-hidden rounded-[2rem] bg-[#201714] shadow-[0_18px_50px_rgba(32,23,20,0.12)] ${index === 1 ? 'sm:min-h-[16rem]' : ''}`}>
                  <RecipeVisual recipe={recipe} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#201714]/78 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-[#fff7ee]">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#ffcf9f]">{recipe.time} · {recipe.cuisine}</p>
                    <h2 className="mt-1 text-xl font-semibold leading-tight tracking-[-0.04em]">{recipe.title}</h2>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-3">
          {routes.map((route, index) => (
            <Link
              key={route.href}
              href={route.href}
              className={`group min-h-[20rem] overflow-hidden rounded-[2rem] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(32,23,20,0.14)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 sm:p-6 ${
                route.tone === 'dark'
                  ? 'border-transparent bg-[#201714] text-[#fff7ee]'
                  : route.tone === 'wine'
                    ? 'border-transparent bg-[linear-gradient(135deg,#6e1f1f_0%,#2f1b27_60%,#171217_100%)] text-[#fff7ee]'
                    : 'border-[#201714]/10 bg-white text-[#201714]'
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${route.tone === 'light' ? 'text-[#8a4b2a]' : 'text-[#ffcf9f]'}`}>{route.eyebrow}</p>
                    <span className="rounded-full border border-current/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">0{index + 1}</span>
                  </div>
                  <h2 className="mt-5 max-w-[11ch] text-4xl font-semibold leading-[0.9] tracking-[-0.07em]">{route.title}</h2>
                  <p className={`mt-4 max-w-[34ch] text-sm leading-6 ${route.tone === 'light' ? 'text-[#201714]/64' : 'text-[#f3dfcf]'}`}>{route.body}</p>
                </div>
                <span className={`mt-8 inline-flex w-fit items-center rounded-full px-4 py-2.5 text-sm font-semibold transition group-hover:translate-x-1 ${route.tone === 'light' ? 'bg-[#201714] text-[#fff7ee]' : 'bg-white/10 text-[#fff7ee]'}`}>{route.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_54%,#f7efe7_100%)] p-5 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">nowy układ</p>
              <h2 className="mt-2 max-w-[12ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Strona startowa ma oddychać.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {principles.map(([title, body]) => (
                <article key={title} className="rounded-[1.45rem] border border-[#201714]/8 bg-white p-4">
                  <h3 className="text-lg font-semibold tracking-[-0.04em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#201714]/62">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
