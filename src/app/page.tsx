const dishes = [
  {
    title: 'Makaron z palonym masłem i cytryną',
    time: '15 min',
    tag: 'comfort hit',
    note: 'Słony, maślany, kwaśny. Taki przepis, który ratuje wtorek bez robienia z siebie MasterChefa.',
  },
  {
    title: 'Pomidorowa z pieca',
    time: '40 min',
    tag: 'oven mood',
    note: 'Pomidory robią się same, ty tylko wyglądasz jak osoba, która ma wszystko pod kontrolą.',
  },
  {
    title: 'Tost z grzybami i ricottą',
    time: '12 min',
    tag: 'late brunch',
    note: 'Krótki skład, duży efekt. Trochę kawiarnia, trochę chaos w kuchni, bardzo fair deal.',
  },
]

const principles = [
  {
    title: 'Mniej składników, więcej sensu',
    text: 'Nie dokładamy rzeczy tylko po to, żeby lista zakupów wyglądała ambitnie.',
  },
  {
    title: 'Telefon-friendly flow',
    text: 'Instrukcje są krótkie, czytelne i zrobione pod gotowanie jedną ręką.',
  },
  {
    title: 'Smak przed ego',
    text: 'Nie interesuje nas performance gotowania. Interesuje nas, czy chce ci się brać dokładkę.',
  },
]

const steps = [
  'wybierasz vibe: kremowe / świeże / chrupiące',
  'dostajesz 3 ruchy zamiast ściany tekstu',
  'kończysz z kolacją, nie z kryzysem tożsamości',
]

const moods = [
  {
    name: 'po pracy',
    description: 'Szybkie, ciepłe, bez myślenia. Jedzenie ma cię odratować, nie testować.',
    accent: 'bg-[#201714] text-[#fff7ee]',
  },
  {
    name: 'dla ludzi',
    description: 'Coś, co wygląda jak effort, choć realnie ogarniasz to bez potu na czole.',
    accent: 'bg-[#ffcf9f] text-[#201714]',
  },
  {
    name: 'solo i dobrze',
    description: 'Nie musisz nikogo impressować. Tylko siebie, i to uczciwie.',
    accent: 'bg-white text-[#201714]',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#201714] selection:bg-[#201714] selection:text-[#fff7ee]">
      <section className="relative overflow-hidden px-5 pb-10 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ffd7b5]/70 blur-3xl lg:left-[22%] lg:top-12 lg:h-96 lg:w-96" />
        <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-[#e66a3d]/20 blur-3xl lg:h-80 lg:w-80" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between gap-4 lg:mb-12">
            <span className="rounded-full border border-[#201714]/10 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a4b2a] backdrop-blur">
              Palnik
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#201714]/45">
              gotowanie bez spiny
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
            <article className="relative overflow-hidden rounded-[2rem] bg-[#201714] px-6 pb-6 pt-7 text-[#fff7ee] shadow-[0_25px_90px_rgba(32,23,20,0.18)] sm:px-7 sm:pb-7 sm:pt-8 lg:rounded-[2.75rem] lg:px-10 lg:pb-10 lg:pt-10">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffb36b] blur-2xl lg:h-40 lg:w-40" />
              <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-[#e66a3d]/50 blur-2xl lg:h-36 lg:w-36" />

              <div className="relative max-w-xl space-y-6">
                <p className="max-w-[28ch] text-sm uppercase tracking-[0.24em] text-[#ffcf9f]">
                  dla ludzi, którzy chcą dobrze zjeść, a nie robić z kolacji projektu strategicznego
                </p>

                <div className="space-y-4">
                  <h1 className="max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:max-w-[12ch] lg:text-7xl">
                    Proste jedzenie.
                    <br />
                    Duży vibe.
                  </h1>
                  <p className="max-w-[32ch] text-base leading-7 text-[#f3dfcf] sm:text-lg">
                    Przepisy pod prawdziwe życie: mało czasu, średnio czysta kuchnia, konkretny apetyt
                    i zerowa ochota na gastro-teatr.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center rounded-full bg-[#fff7ee] px-5 py-3 text-sm font-semibold text-[#201714] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fff7ee] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    Zobacz menu
                  </a>
                  <a
                    href="#flow"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#ffcf9f] focus:ring-offset-2 focus:ring-offset-[#201714]"
                  >
                    Jak to działa
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1 text-center text-[#201714]">
                  <div className="rounded-[1.35rem] bg-[#fff7ee] px-3 py-4 shadow-sm">
                    <p className="text-2xl font-semibold tracking-[-0.05em]">12</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#201714]/50">min avg</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-[#ffd9b7] px-3 py-4 shadow-sm">
                    <p className="text-2xl font-semibold tracking-[-0.05em]">1</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#201714]/50">patelnia</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-[#f4e6d8] px-3 py-4 shadow-sm">
                    <p className="text-2xl font-semibold tracking-[-0.05em]">0</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#201714]/50">napinki</p>
                  </div>
                </div>
              </div>
            </article>

            <aside className="grid gap-4 lg:pb-3">
              <div className="rounded-[1.9rem] bg-white p-5 shadow-[0_18px_50px_rgba(32,23,20,0.08)] lg:rotate-[-2deg] lg:p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">dzisiaj na palniku</p>
                <h2 className="mt-3 max-w-[12ch] text-3xl font-semibold leading-[1] tracking-[-0.05em]">
                  Kremowy makaron z cytryną i pieprzem.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#201714]/72">
                  Gdy nie masz siły myśleć, ale nadal masz standardy. Masło robi większość roboty,
                  cytryna robi resztę.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-[#201714]/55">
                  <span className="rounded-full bg-[#fff3e7] px-3 py-2">15 min</span>
                  <span className="rounded-full bg-[#f5f1eb] px-3 py-2">4 składniki bazowe</span>
                  <span className="rounded-full bg-[#fff3e7] px-3 py-2">weeknight approved</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:rotate-[1.2deg]">
                <div className="rounded-[1.7rem] bg-[#ffeddc] p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">smak &amp; rytm</p>
                  <p className="mt-3 text-lg font-medium leading-7 tracking-[-0.03em]">
                    Kuchnia, która ma swoje tempo. Nie krzyczy. Nie pozuje. Po prostu dobrze działa.
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[#f2eee8] p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">micro-win</p>
                  <p className="mt-3 text-sm leading-6 text-[#201714]/72">
                    Mobile-first serio, nie na papierze — duże klikalne CTA, czytelne bloki, zero ściany tekstu.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="flow" className="px-5 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] bg-[#f2eee8] p-6 lg:sticky lg:top-8 lg:rounded-[2.4rem] lg:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">jak to działa</p>
            <h2 className="mt-3 max-w-[12ch] text-3xl font-semibold leading-[1] tracking-[-0.05em] sm:text-4xl">
              Od "co dziś jem" do "o, to było dobre".
            </h2>
            <p className="mt-4 max-w-[29ch] text-sm leading-6 text-[#201714]/72 sm:text-base">
              Zero elaboratów. Zero historii o podróży pomidora przez Toskanię. Tylko szybka droga do czegoś,
              co naprawdę chcesz zjeść.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <article
                key={step}
                className={`rounded-[1.8rem] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 ${
                  index === 1 ? 'bg-[#201714] text-[#fff7ee]' : 'bg-white text-[#201714]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 1 ? 'bg-white/10 text-[#ffcf9f]' : 'bg-[#fff3e7] text-[#8a4b2a]'
                    }`}
                  >
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] opacity-55">flow</p>
                    <h3 className="mt-2 max-w-[24ch] text-xl font-semibold leading-7 tracking-[-0.04em]">{step}</h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="menu" className="px-5 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">dzisiejszy zestaw</p>
              <h2 className="max-w-[12ch] text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                Dania, od których chce się zacząć.
              </h2>
            </div>
            <p className="max-w-[34ch] text-sm leading-6 text-[#201714]/62 sm:text-base">
              Każde ma inny mood, ale wszystkie mają wspólną cechę: nie marnują twojego czasu.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {dishes.map((dish, index) => (
              <article
                key={dish.title}
                className={`group flex h-full flex-col rounded-[1.9rem] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(32,23,20,0.10)] lg:p-6 ${
                  index === 1 ? 'bg-[#e66a3d] text-white lg:-translate-y-3' : 'bg-white text-[#201714]'
                }`}
              >
                <div className="mb-8 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.22em] opacity-60">0{index + 1}</span>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] opacity-70">
                    <span className="rounded-full border border-current/10 px-3 py-1.5">{dish.time}</span>
                    <span className="rounded-full border border-current/10 px-3 py-1.5">{dish.tag}</span>
                  </div>
                </div>
                <h3 className="max-w-[13ch] text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-[2rem]">
                  {dish.title}
                </h3>
                <p className="mt-4 max-w-[28ch] text-sm leading-6 opacity-82 sm:text-[15px]">{dish.note}</p>
                <div className="mt-auto pt-8 text-sm font-medium opacity-85 transition group-hover:translate-x-1">
                  Zapisz na później →
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.2rem] bg-[#fff0df] p-6 shadow-sm lg:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">gotowanie według nastroju</p>
            <h2 className="mt-3 max-w-[11ch] text-3xl font-semibold leading-[1] tracking-[-0.05em] sm:text-4xl">
              Nie zawsze chcesz tego samego. I bardzo dobrze.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {moods.map((mood, index) => (
                <article
                  key={mood.name}
                  className={`rounded-[1.6rem] p-5 ${mood.accent} ${index === 1 ? 'sm:-translate-y-2 lg:translate-y-0' : ''}`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] opacity-60">{mood.name}</p>
                  <p className="mt-3 max-w-[22ch] text-base font-medium leading-7 tracking-[-0.03em]">
                    {mood.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2.2rem] bg-[#201714] p-6 text-[#fff7ee] shadow-[0_22px_70px_rgba(32,23,20,0.18)] lg:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ffcf9f]">dlaczego to działa</p>
            <div className="mt-5 space-y-4">
              {principles.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#f3dfcf]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="mx-auto max-w-4xl rounded-[2.4rem] bg-white p-6 shadow-[0_18px_60px_rgba(32,23,20,0.08)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8a4b2a]">na koniec konkretnie</p>
              <h2 className="mt-3 max-w-[13ch] text-3xl font-semibold leading-[1] tracking-[-0.05em] sm:text-4xl">
                Chcesz jeść lepiej bez robienia z tego projektu życia?
              </h2>
              <p className="mt-4 max-w-[34ch] text-sm leading-6 text-[#201714]/72 sm:text-base">
                To właśnie to. Ma być smacznie, szybko i trochę sexy. Reszta to marketing garnków.
              </p>
            </div>

            <a
              href="#menu"
              className="inline-flex items-center justify-center rounded-full bg-[#201714] px-6 py-3.5 text-sm font-semibold text-[#fff7ee] transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#201714] focus:ring-offset-2 focus:ring-offset-white"
            >
              Wejdź do kuchni
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
