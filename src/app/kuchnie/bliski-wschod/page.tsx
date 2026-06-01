import Link from 'next/link'
import { RecipeVisual } from '@/components/recipe-visual'
import { recipes, type Cuisine, type Recipe } from '@/lib/recipes'
import { breadcrumbJsonLd, collectionJsonLd, pageMetadata } from '@/lib/seo'

const path = '/kuchnie/bliski-wschod'

export const metadata = pageMetadata({
  title: 'Kuchnia bliskowschodnia — Palnik',
  description:
    'Smakowy pokój Palnika: libańskie, tureckie, izraelskie i bliskowschodnie przepisy ułożone przez kwas, zioła, kremowość i przypieczenie.',
  path,
  keywords: [
    'kuchnia bliskowschodnia',
    'przepisy bliski wschód',
    'libańskie przepisy',
    'tureckie przepisy',
    'izraelskie przepisy',
    'Palnik',
  ],
})

const middleEasternCuisines: Cuisine[] = ['bliskowschodnia', 'libańska', 'turecka', 'izraelska']

const roomRecipes = recipes.filter((recipe) => middleEasternCuisines.includes(recipe.cuisine))

const heroSlugs = ['hummus-msabbaha', 'fattoush-granat', 'shakshuka-harissa', 'kofte-sumak-cebula']
const heroRecipes = pickRecipes(heroSlugs)
const spotlightRecipes = pickRecipes([
  'sabich-baklazan',
  'menemen-papryka',
  'tabbouleh-mieta-cytryna',
  'imam-bayildi',
  'manakish-zaatar',
  'manti-jogurt',
  'jerusalem-mixed-grill',
  'muhallabieh-pistacje',
])

const pathways = [
  {
    label: 'Mezze',
    title: 'Małe miski, dużo kontrastu',
    body: 'Hummus, fattoush, tabbouleh, matbucha. Dobry start, kiedy chcesz stół do dzielenia.',
    href: '/katalog?q=hummus#katalog',
  },
  {
    label: 'Ciepły talerz',
    title: 'Bakłażan, mięso, ryż, patelnia',
    body: 'Sabich, mixed grill, imam bayildi, kofte. Więcej sytości, dalej bez ciężkiej logistyki.',
    href: '/katalog?q=bakłażan#katalog',
  },
  {
    label: 'Jogurt / tahini',
    title: 'Kremowość, która spina ostrość',
    body: 'Sosy, jogurt, tahini i kwaśny finisz. Najlepsze, kiedy danie ma mieć głębię bez kombinowania.',
    href: '/katalog?q=tahini#katalog',
  },
] as const

const flavorMap = [
  ['kwas', 'cytryna, jogurt, granat', 'podnosi cięższe rzeczy i robi miejsce na kolejny kęs'],
  ['zioła', 'mięta, pietruszka, kolendra', 'dają świeżość zamiast sałatkowego smutku'],
  ['kremowość', 'tahini, hummus, labneh', 'łączy ostre, kwaśne i przypieczone elementy'],
  ['dym', 'bakłażan, grill, harissa', 'robi głębię bez udawania fine diningu'],
] as const

const ingredientChips = ['sumak', 'zaatar', 'tahini', 'granat', 'harissa', 'bakłażan', 'ciecierzyca', 'jogurt'] as const

const cuisineLinks = [
  ['libańska', '/katalog?cuisine=liba%C5%84ska#katalog'],
  ['turecka', '/katalog?cuisine=turecka#katalog'],
  ['izraelska', '/katalog?cuisine=izraelska#katalog'],
  ['bliskowschodnia', '/katalog?cuisine=bliskowschodnia#katalog'],
] as const

function pickRecipes(slugs: string[]) {
  return slugs
    .map((slug) => recipes.find((recipe) => recipe.slug === slug))
    .filter((recipe): recipe is Recipe => Boolean(recipe))
}

export default function MiddleEasternCuisinePage() {
  const totalMinutes = roomRecipes.reduce((sum, recipe) => sum + recipe.minutes, 0)
  const averageMinutes = Math.round(totalMinutes / Math.max(roomRecipes.length, 1))

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7ea] text-[#211712] selection:bg-[#321019] selection:text-[#fff4e4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd({
            name: 'Kuchnia bliskowschodnia w Palniku',
            description:
              'Libańskie, tureckie, izraelskie i bliskowschodnie przepisy ułożone jako smakowy pokój Palnika.',
            path,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Palnik', path: '/' },
            { name: 'Bliski Wschód', path },
          ])),
        }}
      />

      <section className="relative border-b border-[#321019]/10 px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">
        <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(135deg,rgba(112,107,58,0.28)_25%,transparent_25%),linear-gradient(225deg,rgba(112,107,58,0.18)_25%,transparent_25%),linear-gradient(45deg,rgba(122,24,43,0.14)_25%,transparent_25%),linear-gradient(315deg,rgba(122,24,43,0.11)_25%,#fff7ea_25%)] [background-position:18px_0,18px_0,0_0,0_0] [background-size:36px_36px]" />
        <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[#7a182b]/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-10 h-80 w-80 rounded-full bg-[#d99a2b]/26 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Nawigacja kuchni" className="mb-8 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-[#321019]/10 bg-[#fffaf3]/82 px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#7a182b] backdrop-blur">
              Palnik
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <Link href="/katalog" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#321019]/72 transition hover:bg-white hover:text-[#321019] focus:outline-none focus:ring-2 focus:ring-[#321019]/15">
                Katalog
              </Link>
              <Link href="/atelier" className="inline-flex min-h-11 items-center rounded-full px-3 text-[#321019]/72 transition hover:bg-white hover:text-[#321019] focus:outline-none focus:ring-2 focus:ring-[#321019]/15">
                Atelier
              </Link>
            </div>
          </nav>

          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <article className="relative overflow-hidden rounded-[2.2rem] bg-[#2b1118] px-6 py-7 text-[#fff4e4] shadow-[0_28px_80px_rgba(43,17,24,0.2)] sm:rounded-[2.8rem] sm:px-8 sm:py-10 lg:px-11 lg:py-12">
              <div className="absolute -right-20 top-8 h-56 w-56 rounded-full border border-[#d99a2b]/25" />
              <div className="absolute -right-12 top-20 h-32 w-32 rounded-full bg-[#d99a2b]/60 blur-3xl" />
              <div className="absolute bottom-[-4rem] left-[-3rem] h-48 w-48 rounded-full bg-[#69713c]/65 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between gap-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e6bd68]">smakowy pokój</p>
                  <h1 className="mt-5 max-w-[10ch] text-[3.05rem] font-semibold leading-[0.86] tracking-[-0.075em] sm:text-7xl lg:text-[6.6rem]">
                    Bliski Wschód
                  </h1>
                  <p className="mt-6 max-w-[43ch] text-base leading-7 text-[#f4ddc4] sm:text-lg">
                    Kwas, zioła, tahini, jogurt, przypieczony bakłażan i granat. Ten pokój nie opowiada o kuchni. On pomaga wejść w konkretny apetyt.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                    <p className="text-3xl font-semibold tracking-[-0.06em]">{roomRecipes.length}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#e6bd68]">przepisów</p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                    <p className="text-3xl font-semibold tracking-[-0.06em]">{averageMinutes}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#e6bd68]">średnio min</p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                    <p className="text-3xl font-semibold tracking-[-0.06em]">4</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#e6bd68]">kuchnie</p>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroRecipes.map((recipe, index) => (
                <Link key={recipe.slug} href={`/przepisy/${recipe.slug}`} className="group relative aspect-[4/3] min-h-[14rem] overflow-hidden rounded-[2rem] bg-[#201714] text-white shadow-[0_18px_50px_rgba(43,17,24,0.16)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(43,17,24,0.22)] focus:outline-none focus:ring-2 focus:ring-[#7a182b]/35">
                  <RecipeVisual recipe={recipe} large />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b0d10]/92 via-[#1b0d10]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0c96e]">{recipe.time} · {recipe.cuisine}</p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.055em] group-hover:underline">{recipe.title}</h2>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 lg:grid-cols-3">
            {pathways.map((item) => (
              <Link key={item.label} href={item.href} className="group rounded-[2rem] border border-[#321019]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(43,17,24,0.12)] focus:outline-none focus:ring-2 focus:ring-[#7a182b]/20 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a182b]">{item.label}</p>
                <h2 className="mt-3 text-3xl font-semibold leading-[0.92] tracking-[-0.06em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#211712]/64">{item.body}</p>
                <span className="mt-5 inline-flex rounded-full bg-[#fff2d9] px-4 py-2 text-sm font-semibold text-[#7a182b] transition group-hover:translate-x-1">Wejdź w ten apetyt →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#321019]/10 bg-[#291016] px-4 py-11 text-[#fff4e4] sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e6bd68]">schemat smaku</p>
            <h2 className="mt-4 max-w-[11ch] text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl">
              Cztery ruchy, zero turystycznej waty.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {ingredientChips.map((ingredient) => (
                <Link key={ingredient} href={`/katalog?q=${encodeURIComponent(ingredient)}#katalog`} className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f4ddc4] transition hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-[#e6bd68]/40">
                  {ingredient}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {flavorMap.map(([name, examples, role], index) => (
              <article key={name} className={`rounded-[1.8rem] border p-5 ${index === 0 ? 'border-[#e6bd68]/35 bg-[#e6bd68] text-[#211712]' : 'border-white/12 bg-white/8'}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${index === 0 ? 'text-[#7a182b]' : 'text-[#e6bd68]'}`}>0{index + 1}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{name}</h3>
                <p className={`mt-2 text-sm font-semibold ${index === 0 ? 'text-[#211712]/72' : 'text-[#f4ddc4]'}`}>{examples}</p>
                <p className={`mt-3 text-sm leading-6 ${index === 0 ? 'text-[#211712]/72' : 'text-[#f4ddc4]/72'}`}>{role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a182b]">przepisy z pokoju</p>
              <h2 className="mt-3 max-w-[13ch] text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl">
                Konkret zamiast katalogowego morza.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {cuisineLinks.map(([label, href]) => (
                <Link key={label} href={href} className="inline-flex min-h-10 items-center rounded-full border border-[#321019]/10 bg-white px-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#7a182b] transition hover:-translate-y-0.5 hover:border-[#7a182b]/28 focus:outline-none focus:ring-2 focus:ring-[#7a182b]/18">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {spotlightRecipes.map((recipe) => (
              <Link key={recipe.slug} href={`/przepisy/${recipe.slug}`} className="group overflow-hidden rounded-[1.8rem] border border-[#321019]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(43,17,24,0.12)] focus:outline-none focus:ring-2 focus:ring-[#7a182b]/18">
                <div className="relative aspect-[4/3] bg-[#211712]/8">
                  <RecipeVisual recipe={recipe} />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a182b]">{recipe.time} · {recipe.cuisine}</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.045em] group-hover:underline">{recipe.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#211712]/62">{recipe.intro}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#321019]/10 bg-[#fff2d9] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a182b]">pełna ścieżka</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Chcesz całą listę bez klimatycznej scenografii?</h2>
              </div>
              <Link href="/katalog?cuisine=liba%C5%84ska#katalog" className="inline-flex w-fit rounded-full bg-[#2b1118] px-5 py-3 text-sm font-semibold text-[#fff4e4] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2b1118]/20">
                Otwórz katalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
