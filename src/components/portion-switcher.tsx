"use client"

const PORTION_OPTIONS = [1, 2, 4] as const

export function PortionSwitcher({
  value,
  onChange,
  tone = 'dark',
}: {
  value: number
  onChange: (next: number) => void
  tone?: 'dark' | 'light'
}) {
  const trackBase =
    tone === 'light'
      ? 'border border-white/15 bg-white/5'
      : 'border border-[#201714]/12 bg-[#fff3e7]/60'
  const inactive = tone === 'light' ? 'text-[#fff7ee]/70 hover:text-[#fff7ee]' : 'text-[#201714]/65 hover:text-[#201714]'
  const active = tone === 'light' ? 'bg-[#fff7ee] text-[#201714] shadow-sm' : 'bg-[#201714] text-[#fff7ee] shadow-sm'

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`text-[11px] uppercase tracking-[0.22em] ${tone === 'light' ? 'text-[#ffcf9f]' : 'text-[#8a4b2a]'}`}>porcje</span>
      <div className={`inline-flex items-center gap-1 rounded-full p-1 ${trackBase}`}>
        {PORTION_OPTIONS.map((portion) => {
          const isActive = portion === value
          return (
            <button
              key={portion}
              type="button"
              onClick={() => onChange(portion)}
              aria-pressed={isActive}
              aria-label={`Ustaw ${portion === 1 ? '1 porcję' : `${portion} porcje`}`}
              className={`min-w-[2.25rem] rounded-full px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#8a4b2a]/30 ${isActive ? active : inactive}`}
            >
              {portion}
            </button>
          )
        })}
      </div>
    </div>
  )
}
