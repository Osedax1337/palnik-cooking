"use client"

declare global {
  interface Window {
    posthog?: {
      capture?: (event: string, properties?: Record<string, unknown>) => void
    }
  }
}

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_xmqTzBzM9qRJNzwfSPpDcQZ4JgB2zzokTm9yV9vYXUVf'
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

function clean(properties: AnalyticsProperties = {}) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined))
}

export function track(event: string, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined') return
  window.posthog?.capture?.(event, clean(properties))
}

export function trackRecipeOpened(slug: string, source: string, extra: AnalyticsProperties = {}) {
  track('recipe_opened', { slug, source, ...extra })
}

export function trackSearchUsed(query: string, resultCount: number, source = 'catalog') {
  const trimmed = query.trim()
  if (trimmed.length < 2) return
  track('search_used', { query: trimmed.toLowerCase(), result_count: resultCount, source })
}
