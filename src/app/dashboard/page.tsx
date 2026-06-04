import type { Metadata } from 'next'
import Link from 'next/link'
import { getDashboardData, RANGE_DAYS, type CountRow } from '@/lib/posthog-insights'
import { pageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Dashboard użycia — Palnik',
    description: 'Podgląd realnego użycia Palnika: odsłony, otwarte przepisy, tryb lodówki, wyszukiwania i porównania.',
    path: '/dashboard',
  }),
  robots: { index: false, follow: false },
}

const numberFormat = new Intl.NumberFormat('pl-PL')

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen bg-[#fffaf3] px-5 py-5 text-[#201714] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a]"
          >
            Palnik
          </Link>
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#201714]/55">
            Dashboard
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}

function StatCard({ row }: { row: CountRow }) {
  return (
    <div className="rounded-2xl border border-[#201714]/8 bg-white p-4 shadow-[0_10px_30px_rgba(32,23,20,0.05)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#201714]/50">{row.label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{numberFormat.format(row.count)}</p>
    </div>
  )
}

function RankList({ title, rows, empty }: { title: string; rows: CountRow[]; empty: string }) {
  const max = rows.reduce((acc, row) => Math.max(acc, row.count), 0)
  return (
    <section className="rounded-[1.75rem] border border-[#201714]/8 bg-white p-5 shadow-[0_14px_40px_rgba(32,23,20,0.06)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a4b2a]">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#201714]/55">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <li key={`${row.label}-${index}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-[#201714]/85">
                  <span className="mr-2 text-[#201714]/35">{index + 1}.</span>
                  {row.label}
                </span>
                <span className="shrink-0 tabular-nums text-[#201714]/60">{numberFormat.format(row.count)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#201714]/8">
                <div
                  className="h-full rounded-full bg-[#c2683a]"
                  style={{ width: `${max > 0 ? Math.max(4, (row.count / max) * 100) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#201714]/8 bg-[linear-gradient(135deg,#fff7ed_0%,#fffaf3_48%,#f6efe8_100%)] p-6 shadow-[0_18px_50px_rgba(32,23,20,0.07)] sm:p-8">
      <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">dashboard użycia</p>
      <h1 className="mt-2 max-w-[18ch] text-3xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-4xl">{title}</h1>
      <div className="mt-4 max-w-[52ch] space-y-3 text-sm leading-6 text-[#201714]/70">{children}</div>
    </section>
  )
}

export default async function DashboardPage() {
  const result = await getDashboardData()

  if (result.status === 'not_configured') {
    return (
      <Shell>
        <Notice title="Dashboard czeka na klucz do PostHog.">
          <p>
            Eventy lecą już do PostHog, ale odczyt statystyk wymaga dwóch sekretów po stronie serwera. Ustaw je
            w środowisku (np. w Vercel → Project → Settings → Environment Variables):
          </p>
          <ul className="list-disc space-y-1 pl-5 font-mono text-[13px] text-[#201714]/75">
            <li>POSTHOG_PROJECT_ID</li>
            <li>POSTHOG_PERSONAL_API_KEY</li>
          </ul>
          <p>
            <code className="font-mono text-[13px]">POSTHOG_PERSONAL_API_KEY</code> to <em>personal API key</em> z PostHog
            (Settings → Personal API keys), inny niż publiczny klucz <code className="font-mono text-[13px]">phc_…</code>.
            Project ID znajdziesz w Settings → Project. Host bierzemy z{' '}
            <code className="font-mono text-[13px]">NEXT_PUBLIC_POSTHOG_HOST</code> (domyślnie eu.i.posthog.com).
          </p>
        </Notice>
      </Shell>
    )
  }

  if (result.status === 'error') {
    return (
      <Shell>
        <Notice title="Nie udało się pobrać danych z PostHog.">
          <p>Zapytanie do PostHog zwróciło błąd. Sprawdź klucz, project ID i host.</p>
          <pre className="overflow-x-auto rounded-xl bg-[#201714]/5 p-3 font-mono text-[12px] text-[#8a4b2a]">
            {result.message}
          </pre>
        </Notice>
      </Shell>
    )
  }

  const { data } = result

  return (
    <Shell>
      <Notice title="Co dziś realnie robią ludzie w Palniku.">
        <p>Realne użycie z ostatnich {RANGE_DAYS} dni, prosto z PostHog. Dane odświeżają się co ~5 minut.</p>
      </Notice>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data.overview.map((row) => (
          <StatCard key={row.label} row={row} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankList
          title="Top przepisy (otwarcia)"
          rows={data.topRecipes}
          empty="Brak otwartych przepisów w tym okresie."
        />
        <RankList
          title="Skąd wchodzą w przepis"
          rows={data.entrySources}
          empty="Brak danych o źródłach wejść."
        />
        <RankList
          title="Top wyszukiwania"
          rows={data.topSearches}
          empty="Nikt jeszcze nic nie wyszukał."
        />
        <RankList
          title="Top składniki z lodówki"
          rows={data.fridgeIngredients}
          empty="Tryb lodówki nie był jeszcze używany."
        />
      </div>
    </Shell>
  )
}
