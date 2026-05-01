import { effortLevels, type Effort } from '@/lib/recipes'

export function EffortDots({ effort, label = true, tone = 'dark' }: { effort: Effort; label?: boolean; tone?: 'dark' | 'light' }) {
  const config = effortLevels[effort]
  const filled = tone === 'light' ? 'bg-[#ffcf9f]' : 'bg-[#201714]'
  const empty = tone === 'light' ? 'bg-white/15' : 'bg-[#201714]/15'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {[0, 1, 2].map((index) => (
          <span key={index} className={`h-1.5 w-1.5 rounded-full ${index < config.dots ? filled : empty}`} />
        ))}
      </span>
      {label ? <span className="text-[11px] uppercase tracking-[0.18em] opacity-75">{config.label}</span> : null}
    </span>
  )
}
