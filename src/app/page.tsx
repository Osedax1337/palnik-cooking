import Link from 'next/link'
import { RecipeVisual } from '@/components/recipe-visual'
import { recipes } from '@/lib/recipes'
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, siteUrl } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Palnik — obiad z czasu i składników',
  description:
    'Powiedz, ile masz czasu i co leży w lodówce. Palnik wybierze trzy sensowne przepisy bez scrollowania katalogu.',
  path: '/',
  keywords: ['przepisy', 'szybki obiad', 'co ugotować', 'gotowanie w domu', 'Palnik', 'przepisy z lodówki'],
})

const quickRecipes = [
  recipes.find((recipe) => recipe.slug === 'makaron-cytryna') ?? recipes[0],
  recipes.find((recipe) => recipe.slug === 'pesto-bazylia-orzechy') ?? recipes[1],
  recipes.find((recipe) => recipe.slug === 'makaron-tahini-pomidor') ?? recipes[2],
]

const proofPoints = [
  ['czas', '15 / 25 / 40 min', 'Najpierw limit, potem decyzja. Nie odwrotnie.'],
  ['lodówka', '3–5 składników', 'Klikasz to, co masz. Palnik premiuje mniej braków.'],
  ['wynik', '3 przepisy', 'Krótka lista z powodem wyboru i brakującymi składnikami.'],
] as const

const secondaryRoutes = [
  {
    href: '/katalog?lodowka=1#lodowka',
    title: 'Tryb lodówki',
    body: 'Gdy chcesz dokładniej zaznaczyć składniki i zobaczyć pełne dopasowanie.',
    cta: 'Otwórz lodówkę',
  },
  {
    href: '/atelier',
    title: 'Atelier',
    body: 'Gdy obiad ma być bardziej popisowy: ferment, kwas, dym, owoce przy mięsie.',
    cta: 'Wejdź do Atelier',
  },
] as const

const homeFridgeBase = ['makaron', 'cytryna', 'parmezan'] as const
const homeIngredientChips = ['makaron', 'cytryna', 'parmezan', 'jajko', 'sos sojowy', 'pomidor'] as const

function catalogFridgeHref(keys: readonly string[]) {
  return `/katalog?fridge=${keys.map(encodeURIComponent).join(',')}#katalog`
}

function toggleHomeIngredientHref(ingredient: string) {
  const next = homeFridgeBase.includes(ingredient as (typeof homeFridgeBase)[number])
    ? homeFridgeBase.filter((key) => key !== ingredient)
    : [...homeFridgeBase, ingredient]

  return next.length > 0 ? catalogFridgeHref(next) : '/katalog#katalog'
}

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-[#fffaf3] pb-36 text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee] sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Palnik',
            url: siteUrl,
            description:
              'Powiedz, ile masz czasu i co leży w lodówce. Palnik wybierze trzy sensowne przepisy bez scrollowania katalogu.',
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

      <section className="relative px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
        <div className="ember-drift absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#ffd7b5]/75 blur-3xl" />
        <div className="absolute right-[-9rem] top-32 h-80 w-80 rounded-full bg-[#c9572d]/16 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-80 w-80 rounded-full bg-[#7c2433]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Główna nawigacja" className="mb-7 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-[#201714]/10 bg-white/80 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">
              Palnik
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Link href="/katalog" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#201714]/75 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                Katalog
              </Link>
              <Link href="/atelier" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#201714]/75 transition hover:bg-white hover:text-[#201714] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">
                Atelier
              </Link>
            </div>
          </nav>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <article className="relative overflow-hidden rounded-[2.1rem] bg-[#201714] px-6 pb-7 pt-7 text-[#fff7ee] shadow-[0_28px_90px_rgba(32,23,20,0.18)] sm:rounded-[2.8rem] sm:px-8 sm:pb-9 sm:pt-9 lg:px-11 lg:pb-11 lg:pt-11">
              <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-[#ffb36b]/70 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#8c3341]/50 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between gap-10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#ffcf9f]">obiad bez zgadywania</p>
                  <h1 className="mt-5 max-w-none text-[2.25rem] font-semibold leading-[0.98] sm:max-w-[10ch] sm:text-7xl sm:leading-[0.86] sm:tracking-[-0.075em] lg:text-8xl">
                    Czas.
                    <br />
                    Składniki.
                    <br />
                    Palnik.
                  </h1>
                  <p className="mt-6 max-w-[42ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                    Wybierz, czy masz 15, 25 czy 40 minut. Kliknij kilka rzeczy z lodówki. Dostajesz trzy przepisy, które mają sens teraz — nie katalog do przekopania.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/katalog#katalog" className="inline-flex items-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]">
                    Wybierz obiad teraz
                  </Link>
                  <Link href="/katalog?lodowka=1#lodowka" className="inline-flex items-center rounded-full border border-white/16 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:-translate-y-0.5 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]">
                    Mam składniki
                  </Link>
                </div>
              </div>
            </article>

            <div className="grid gap-3 rounded-[2.2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_48%,#f6efe8_100%)] p-4 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-5 lg:p-6">
              <div className="flex flex-wrap gap-2" aria-label="Wybierz limit czasu w katalogu">
                {[15, 25, 40].map((limit) => {
                  const active = limit === 25
                  return (
                    <Link key={limit} href={`/katalog?czas=${limit}&fridge=makaron%2Ccytryna%2Cparmezan#katalog`} aria-current={active ? 'true' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#201714] text-[#fff7ee]' : 'border border-[#201714]/10 bg-white text-[#8a4b2a] hover:border-[#201714]/20'}`}>
                      do {limit} min
                    </Link>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Kliknij składniki, żeby otworzyć katalog z tym wyborem">
                {homeIngredientChips.map((ingredient) => {
                  const active = homeFridgeBase.includes(ingredient as (typeof homeFridgeBase)[number])
                  return (
                    <Link key={ingredient} href={toggleHomeIngredientHref(ingredient)} aria-current={active ? 'true' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#201714]/20 ${active ? 'bg-[#18623b] text-white shadow-[0_8px_20px_rgba(24,98,59,0.24)]' : 'border border-[#201714]/14 bg-white text-[#8a4b2a] hover:border-[#201714]/24 hover:bg-[#fff7ee]'}`}>
                      {active ? '✓ ' : '+ '}{ingredient}
                    </Link>
                  )
                })}
              </div>

              <div className="grid gap-3">
                {quickRecipes.map((recipe, index) => (
                  <Link key={recipe.slug} href={`/przepisy/${recipe.slug}?fridge=makaron%2Ccytryna%2Cparmezan`} className="group grid gap-3 rounded-[1.55rem] border border-[#201714]/8 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(32,23,20,0.12)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 sm:grid-cols-[108px_1fr]">
                    <div className="relative min-h-[92px] overflow-hidden rounded-[1.15rem] bg-[#201714]/8">
                      <RecipeVisual recipe={recipe} />
                      <span className="absolute left-2 top-2 rounded-full bg-[#201714]/88 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffcf9f]">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a4b2a]">{recipe.time} · {recipe.cuisine}</p>
                      <h2 className="mt-1 text-xl font-semibold leading-tight tracking-[-0.045em] group-hover:underline">{recipe.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#201714]/62">
                        {index === 0 ? 'Najbliżej tego, co masz. Brakuje tylko dwóch rzeczy.' : index === 1 ? 'Szybkie, lekkie i dalej blisko lodówki.' : 'Trochę więcej roboty, ale nadal mieści się w czasie.'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-3">
          {proofPoints.map(([eyebrow, title, body], index) => (
            <article key={eyebrow} className={`rounded-[2rem] border p-5 shadow-sm sm:p-6 ${index === 1 ? 'border-transparent bg-[#201714] text-[#fff7ee]' : 'border-[#201714]/8 bg-white text-[#201714]'}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${index === 1 ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>0{index + 1} · {eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-[0.92] tracking-[-0.06em]">{title}</h2>
              <p className={`mt-3 text-sm leading-6 ${index === 1 ? 'text-[#f3dfcf]' : 'text-[#201714]/62'}`}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-6xl gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-[2.2rem] border border-[#201714]/8 bg-white p-5 shadow-[0_18px_50px_rgba(32,23,20,0.06)] sm:p-7 lg:p-9">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">główna ścieżka</p>
            <h2 className="mt-2 max-w-[13ch] text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-5xl">Nie wybierasz przepisu. Wybierasz sytuację.</h2>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[#201714]/66">
              Palnik zaczyna od ograniczeń, które naprawdę masz: czas, lodówka, energia po pracy. Dopiero potem pokazuje przepisy. To jest różnica między aplikacją kucharską a czymś, co pomaga zjeść dziś.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/katalog#katalog" className="tap-pop inline-flex rounded-full bg-[#201714] px-5 py-3 text-sm font-semibold text-[#fff7ee] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#201714]/20">Przejdź do wyboru</Link>
              <Link href="/atelier" className="tap-pop inline-flex rounded-full border border-[#201714]/12 bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition hover:-translate-y-0.5 hover:bg-[#fff3e7] focus:outline-none focus:ring-2 focus:ring-[#201714]/15">Zobacz Atelier</Link>
            </div>
          </article>

          <div className="grid gap-3">
            {secondaryRoutes.map((route) => (
              <Link key={route.href} href={route.href} className="group rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_52%,#f6efe8_100%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(32,23,20,0.1)] focus:outline-none focus:ring-2 focus:ring-[#201714]/15 sm:p-6">
                <h2 className="text-2xl font-semibold tracking-[-0.055em]">{route.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#201714]/62">{route.body}</p>
                <span className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#8a4b2a] transition group-hover:translate-x-1">{route.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <nav aria-label="Skróty mobilne" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1.5 rounded-full border border-[#201714]/10 bg-[#fffaf3]/92 p-1.5 shadow-[0_18px_60px_rgba(32,23,20,0.18)] backdrop-blur sm:hidden">
        <Link href="/katalog#katalog" className="rounded-full bg-[#201714] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#fff7ee]">
          Wybierz
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
