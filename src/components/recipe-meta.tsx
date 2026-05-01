import { dietTagLabels, type DietTag } from '@/lib/recipes'

export function DietTags({ tags, tone = 'dark' }: { tags: DietTag[]; tone?: 'dark' | 'light' }) {
  if (tags.length === 0) return null
  const base =
    tone === 'light'
      ? 'border border-white/15 bg-white/5 text-[#fff7ee]/85'
      : 'border border-[#201714]/10 bg-[#fff3e7] text-[#8a4b2a]'
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${base}`}>
          {dietTagLabels[tag]}
        </span>
      ))}
    </div>
  )
}
