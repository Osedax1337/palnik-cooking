import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RecipeDetail } from '@/components/recipe-detail'
import { getRecipeBySlug, recipes } from '@/lib/recipes'

function toIsoDuration(minutes: number) {
  return `PT${minutes}M`
}

function buildKeywords(recipe: NonNullable<ReturnType<typeof getRecipeBySlug>>) {
  return [
    recipe.title,
    recipe.cuisine,
    recipe.tag,
    ...recipe.dietTags,
    ...recipe.collections,
    ...recipe.ingredients.slice(0, 5).map((ingredient) => ingredient.key),
    'przepis',
    'gotowanie',
    'Palnik',
  ]
}

export function generateStaticParams() {
  return recipes.map((recipe) => ({ slug: recipe.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)

  if (!recipe) {
    return {
      title: 'Przepis nie znaleziony — Palnik',
    }
  }

  return {
    title: `${recipe.title} — Palnik`,
    description: `${recipe.intro} ${recipe.time}. ${recipe.cuisine}.`,
    keywords: buildKeywords(recipe),
    alternates: {
      canonical: `/przepisy/${recipe.slug}`,
    },
    openGraph: {
      title: `${recipe.title} — Palnik`,
      description: `${recipe.intro} ${recipe.time}. ${recipe.cuisine}.`,
      url: `/przepisy/${recipe.slug}`,
      type: 'article',
      siteName: 'Palnik',
      locale: 'pl_PL',
      images: recipe.image
        ? [
            {
              url: recipe.image,
              alt: recipe.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.title} — Palnik`,
      description: `${recipe.intro} ${recipe.time}. ${recipe.cuisine}.`,
      images: recipe.image ? [recipe.image] : undefined,
    },
  }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)

  if (!recipe) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.intro,
    image: recipe.image ? [`https://palnik-cooking-fresh.vercel.app${recipe.image}`] : undefined,
    recipeCuisine: recipe.cuisine,
    recipeCategory: recipe.tag,
    totalTime: toIsoDuration(recipe.minutes),
    keywords: buildKeywords(recipe).join(', '),
    recipeYield: `${recipe.servings} porcje`,
    recipeIngredient: recipe.ingredients.map((ingredient) => ingredient.name),
    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      text: step,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <RecipeDetail recipe={recipe} />
      </Suspense>
    </>
  )
}
