import Image from 'next/image'
import { categoryStyles, type Recipe } from '@/lib/recipes'
import { RecipeGallery } from '@/components/recipe-gallery'

export function RecipeVisual({ recipe, large = false }: { recipe: Recipe; large?: boolean }) {
  if (recipe.gallery && recipe.gallery.length > 0) {
    return <RecipeGallery images={recipe.gallery} alt={recipe.title} large={large} />
  }

  if (recipe.image) {
    return (
      <Image
        src={recipe.image}
        alt={recipe.title}
        fill
        className="object-cover transition duration-700 ease-out animate-fade-up-soft group-hover:scale-[1.06]"
        sizes={large ? '(max-width: 1024px) 100vw, 45vw' : '(max-width: 1024px) 100vw, 33vw'}
        priority={large}
        quality={large ? 88 : 78}
      />
    )
  }

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${categoryStyles[recipe.mood]}`}>
      <div className="flex h-full flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-full border border-current/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-80">{recipe.cuisine}</span>
          <span className="w-fit rounded-full border border-current/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] opacity-70">{recipe.tag}</span>
        </div>
        <div>
          <p className="max-w-[12ch] text-2xl font-semibold leading-tight tracking-[-0.05em] sm:text-3xl">{recipe.title}</p>
          <p className="mt-2 text-sm opacity-75">{recipe.time}</p>
        </div>
      </div>
    </div>
  )
}
