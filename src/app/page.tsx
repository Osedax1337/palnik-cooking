import Link from 'next/link'
import { RecipeVisual } from '@/components/recipe-visual'
import { recipes } from '@/lib/recipes'
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, siteUrl } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Palnik — gotowanie bez scrollowania w nieskończoność',
  description:
    'Palnik skraca drogę od głodu do decyzji: szybki katalog, tryb lodówki, porównywanie i Atelier bez kulinarnego zadęcia.',
  path: '/',
  keywords: ['przepisy', 'szybki obiad', 'co ugotować', 'gotowanie w domu', 'Palnik'],
})

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
    body: 'Szukasz po składniku, klikasz nastrój, porównujesz 2–3 opcje. Mniej scrollowania, więcej decyzji.',
    cta: 'Wejdź do katalogu',
    tone: 'dark',
  },
  {
    href: '/atelier',
    eyebrow: 'ładniejsze talerze',
    title: 'Atelier',
    body: 'Dania z większym ego: kwas, dym, miso, owoce przy mięsie i talerze, które wyglądają jak plan.',
    cta: 'Otwórz Atelier',
    tone: 'wine',
  },
  {
    href: '/katalog?lodowka=1#lodowka',
    eyebrow: 'mam składniki',
    title: 'Tryb lodówki',
    body: 'Zaznacz rzeczy z kuchni. Palnik pokaże, które przepisy są blisko, a gdzie trzeba dokupić pół sklepu.',
    cta: 'Sprawdź lodówkę',
    tone: 'light',
  },
] as const

const sections = [
  ['szybkie obiady', 'Dania na moment, kiedy głód ma już buty na nogach. Masło, cytryna, patelnia, bez przemówień.'],
  ['gotowanie z lodówki', 'Masz jajka, pół cukinii i coś podejrzanie ambitnego w szufladzie? Palnik składa z tego plan, nie wyrzuty sumienia.'],
  ['Atelier', 'Dania z większym charakterem: ferment, dym, kwas, owoce przy mięsie i talerze, które mówią „usiądź, będzie dobrze”.'],
]

const storyBeats = [
  ['01', 'Głód', 'Nie zaczynasz od 40 kart. Zaczynasz od sytuacji: szybko, z lodówki, dla ludzi albo z efektem wow.'],
  ['02', 'Decyzja', 'Palnik zawęża opcje, pozwala porównać talerze i nie każe udawać, że masz czas na doktorat z obiadu.'],
  ['03', 'Ogień', 'Otwierasz przepis, skalujesz porcje, odhaczasz składniki i gotujesz bez wracania do ściany tekstu.'],
]

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-[#fffaf3] pb-44 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Palnik',
            url: siteUrl,
            description:
              'Palnik skraca drogę od głodu do decyzji: szybki katalog, tryb lodówki, porównywanie i Atelier bez kulinarnego zadęcia.',
            inLanguage: 'pl-PL',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${absoluteUrl('/katalog')}?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Palnik', path: '/' }])),
        }}
      />

      <section className="relative px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7 animate-fade-up-soft">
        <div className="ember-drift absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#ffd7b5]/75 blur-3xl" />
        <div className="ember-drift absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-[#c9572d]/20 blur-3xl [animation-delay:1.4s]" />
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
                  Palnik nie jest encyklopedią przepisów. To skrót od „jestem głodny” do „wiem, co robię”: szybki obiad, lodówka, porównanie albo coś z efektem wow.
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

            <div className="grid gap-3 sm:grid-cols-2 lg:min-h-[34rem] lg:grid-cols-[0.92fr_1.08fr]">
              <Link href={`/przepisy/${heroRecipes[0].slug}`} className="group float-slow relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-[#201714] shadow-[0_24px_70px_rgba(32,23,20,0.16)] sm:col-span-2 sm:min-h-[28rem] lg:col-span-1 lg:row-span-2 lg:min-h-0">
                <RecipeVisual recipe={heroRecipes[0]} large />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201714]/96 via-[#201714]/48 to-[#201714]/8" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-[#fff7ee] sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcf9f]">dzisiejszy talerz</p>
                  <h2 className="mt-2 max-w-[13ch] text-3xl font-semibold leading-[0.95] tracking-[-0.055em]">{heroRecipes[0].title}</h2>
                  <p className="mt-2 line-clamp-3 max-w-[32ch] text-sm leading-6 text-[#f3dfcf]">{heroRecipes[0].intro}</p>
                </div>
              </Link>

              {heroRecipes.slice(1).map((recipe) => (
                <Link key={recipe.slug} href={`/przepisy/${recipe.slug}`} className="group float-slower relative min-h-[14rem] overflow-hidden rounded-[2rem] bg-[#201714] shadow-[0_18px_50px_rgba(32,23,20,0.12)] sm:min-h-[16rem]">
                  <RecipeVisual recipe={recipe} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#201714]/92 via-[#201714]/42 to-transparent" />
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

      <section className="scroll-reveal px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-3">
          {routes.map((route, index) => (
            <Link
              key={route.href}
              href={route.href}
              className={`group sheen-on-hover min-h-[20rem] overflow-hidden rounded-[2rem] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(32,23,20,0.14)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 sm:p-6 ${
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

      <section className="scroll-reveal px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] bg-[#201714] p-5 text-[#fff7ee] shadow-[0_28px_90px_rgba(32,23,20,0.16)] sm:p-7 lg:p-9">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#ffcf9f]">jak to płynie</p>
              <h2 className="mt-2 max-w-[11ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Od głodu do ognia.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {storyBeats.map(([number, title, body], index) => (
                <article key={title} className="rounded-[1.45rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur" style={{ animationDelay: `${index * 90}ms` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffcf9f]">{number}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.045em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#f3dfcf]/78">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal px-4 pb-14 sm:px-6 lg:px-8 lg:pb-10">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_54%,#f7efe7_100%)] p-5 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">w Palniku</p>
              <h2 className="mt-2 max-w-[12ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Od szybkiej patelni po mały spektakl.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {sections.map(([title, body]) => (
                <article key={title} className="rounded-[1.45rem] border border-[#201714]/8 bg-white p-4">
                  <h3 className="text-lg font-semibold tracking-[-0.04em]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#201714]/62">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 overflow-hidden rounded-[2.2rem] border border-[#201714]/8 bg-[#201714] p-6 text-[#fff7ee] shadow-[0_28px_90px_rgba(32,23,20,0.16)] sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ffcf9f]">następny ruch</p>
            <h2 className="mt-2 max-w-[12ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Nie czytaj dalej. Gotuj.</h2>
            <p className="mt-4 max-w-[48ch] text-sm leading-6 text-[#f3dfcf]/78">Wejdź do katalogu, odpal lodówkę albo idź w Atelier. Palnik ma skracać drogę do talerza, nie robić z obiadu spotkania zarządu.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/katalog" className="tap-pop inline-flex rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]">Otwórz katalog</Link>
            <Link href="/katalog?lodowka=1#lodowka" className="tap-pop inline-flex rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:-translate-y-0.5 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]">Mam składniki</Link>
          </div>
        </div>
      </section>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1.5 rounded-full border border-[#201714]/10 bg-[#fffaf3]/92 p-1.5 shadow-[0_18px_60px_rgba(32,23,20,0.18)] backdrop-blur sm:hidden">
        <Link href="/katalog" className="rounded-full bg-[#201714] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#fff7ee]">
          Katalog
        </Link>
        <Link href="/katalog?lodowka=1#lodowka" className="rounded-full bg-white px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4b2a]">
          Lodówka
        </Link>
        <Link href="/atelier" className="rounded-full bg-white px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#8a4b2a]">
          Atelier
        </Link>
      </nav>
    </main>
  )
}
