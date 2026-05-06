import type { MetadataRoute } from 'next'
import { recipes } from '@/lib/recipes'

const baseUrl = 'https://palnik-cooking-fresh.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/katalog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/atelier`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/porownaj`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ulubione`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...recipes.map((recipe) => ({
      url: `${baseUrl}/przepisy/${recipe.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: recipe.collections.includes('atelier') ? 0.7 : 0.6,
    })),
  ]
}
