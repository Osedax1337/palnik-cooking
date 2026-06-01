import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RecipeDetail } from '@/components/recipe-detail'
import { getRecipeBySlug, recipes, renderIngredient } from '@/lib/recipes'
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'

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

  const description = `${recipe.intro} ${recipe.time}. ${recipe.cuisine}.`
  const image = recipe.image ?? '/og-palnik.png'

  return {
    title: `${recipe.title} — Palnik`,
    description,
    keywords: buildKeywords(recipe),
    alternates: {
      canonical: `/przepisy/${recipe.slug}`,
    },
    openGraph: {
      title: `${recipe.title} — Palnik`,
      description,
      url: `/przepisy/${recipe.slug}`,
      type: 'article',
      siteName: 'Palnik',
      locale: 'pl_PL',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${recipe.title} — Palnik`,
      description,
      images: [image],
    },
  }
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)

  if (!recipe) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': absoluteUrl(`/przepisy/${recipe.slug}#recipe`),
    mainEntityOfPage: absoluteUrl(`/przepisy/${recipe.slug}`),
    name: recipe.title,
    description: recipe.intro,
    image: recipe.image ? [absoluteUrl(recipe.image)] : [absoluteUrl('/og-palnik.png')],
    author: {
      '@type': 'Organization',
      name: 'Palnik',
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Palnik',
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/og-palnik.png'),
      },
    },
    recipeCuisine: recipe.cuisine,
    recipeCategory: recipe.tag,
    totalTime: toIsoDuration(recipe.minutes),
    keywords: buildKeywords(recipe).join(', '),
    recipeYield: `${recipe.servings} porcje`,
    recipeIngredient: recipe.ingredients.map((ingredient) => renderIngredient(ingredient)),
    suitableForDiet: recipe.dietTags.includes('bezmięsne') ? 'https://schema.org/VegetarianDiet' : undefined,
    recipeInstructions: recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      name: `Krok ${index + 1}`,
      text: step,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Palnik', path: '/' },
            { name: recipe.collections.includes('atelier') ? 'Atelier' : 'Katalog', path: recipe.collections.includes('atelier') ? '/atelier' : '/katalog' },
            { name: recipe.title, path: `/przepisy/${recipe.slug}` },
          ])),
        }}
      />
      <RecipeDetail recipe={recipe} />
    </>
  )
}
