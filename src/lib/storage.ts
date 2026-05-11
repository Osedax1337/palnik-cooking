"use client"

const RECENT_KEY = 'palnik:recent'
const FRIDGE_KEY = 'palnik:fridge'
const COMPARE_KEY = 'palnik:compare'
const FAVORITES_KEY = 'palnik:favorites'
const SHOPPING_KEY = 'palnik:shopping'
const COMPARE_SHOPPING_KEY = 'palnik:compare-shopping'
const PORTIONS_KEY = 'palnik:portions'
const PANTRY_MEMORY_KEY = 'palnik:pantry-memory'
const TASTE_MEMORY_KEY = 'palnik:taste-memory'
const MAX_RECENT = 6

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / privacy errors
  }
}

export function getRecent(): string[] {
  return safeRead<string[]>(RECENT_KEY, [])
}

export function pushRecent(slug: string) {
  const current = getRecent()
  const next = [slug, ...current.filter((entry) => entry !== slug)].slice(0, MAX_RECENT)
  safeWrite(RECENT_KEY, next)
  notify(RECENT_KEY)
}

export function getFridge(): string[] {
  return safeRead<string[]>(FRIDGE_KEY, [])
}

export function setFridge(keys: string[]) {
  safeWrite(FRIDGE_KEY, keys)
  notify(FRIDGE_KEY)
}

export function getCompare(): string[] {
  return safeRead<string[]>(COMPARE_KEY, [])
}

export function setCompare(slugs: string[]) {
  safeWrite(COMPARE_KEY, slugs.slice(0, 3))
  notify(COMPARE_KEY)
}

export function toggleCompare(slug: string) {
  const current = getCompare()
  const next = current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug].slice(0, 3)
  safeWrite(COMPARE_KEY, next)
  notify(COMPARE_KEY)
  return next
}

export function getFavorites(): string[] {
  return safeRead<string[]>(FAVORITES_KEY, [])
}

export function setFavorites(slugs: string[]) {
  safeWrite(FAVORITES_KEY, slugs)
  notify(FAVORITES_KEY)
}

export function toggleFavorite(slug: string) {
  const current = getFavorites()
  const next = current.includes(slug) ? current.filter((entry) => entry !== slug) : [slug, ...current]
  setFavorites(next)
  return next
}

export function clearFavorites() {
  setFavorites([])
}

export type ShoppingState = Record<string, Record<string, boolean>>

export function getShopping(): ShoppingState {
  return safeRead<ShoppingState>(SHOPPING_KEY, {})
}

export function setShoppingFor(slug: string, state: Record<string, boolean>) {
  const all = getShopping()
  all[slug] = state
  safeWrite(SHOPPING_KEY, all)
  notify(SHOPPING_KEY)
}

export type CompareShoppingState = Record<string, boolean>

export function getCompareShopping(): CompareShoppingState {
  return safeRead<CompareShoppingState>(COMPARE_SHOPPING_KEY, {})
}

export function setCompareShopping(state: CompareShoppingState) {
  safeWrite(COMPARE_SHOPPING_KEY, state)
  notify(COMPARE_SHOPPING_KEY)
}

export type PortionState = Record<string, number>

export function getPortions(): PortionState {
  return safeRead<PortionState>(PORTIONS_KEY, {})
}

export function setPortionFor(slug: string, portions: number) {
  const all = getPortions()
  all[slug] = portions
  safeWrite(PORTIONS_KEY, all)
  notify(PORTIONS_KEY)
}

export type MemoryCounts = Record<string, number>

export function getPantryMemory(): MemoryCounts {
  return safeRead<MemoryCounts>(PANTRY_MEMORY_KEY, {})
}

export function clearPantryMemory() {
  safeWrite(PANTRY_MEMORY_KEY, {})
  notify(PANTRY_MEMORY_KEY)
}

export function bumpPantryKeys(keys: string[]) {
  const current = getPantryMemory()
  keys.filter(Boolean).forEach((key) => {
    current[key] = (current[key] ?? 0) + 1
  })
  safeWrite(PANTRY_MEMORY_KEY, current)
  notify(PANTRY_MEMORY_KEY)
}

export function getTasteMemory(): MemoryCounts {
  return safeRead<MemoryCounts>(TASTE_MEMORY_KEY, {})
}

export function clearTasteMemory() {
  safeWrite(TASTE_MEMORY_KEY, {})
  notify(TASTE_MEMORY_KEY)
}

export function bumpTasteSignal(signal: string, weight = 1) {
  if (!signal) return
  const current = getTasteMemory()
  current[signal] = (current[signal] ?? 0) + weight
  safeWrite(TASTE_MEMORY_KEY, current)
  notify(TASTE_MEMORY_KEY)
}

export function clearPalnikMemory() {
  clearPantryMemory()
  clearTasteMemory()
}

const listeners = new Map<string, Set<() => void>>()

function notify(key: string) {
  const set = listeners.get(key)
  if (set) set.forEach((fn) => fn())
}

export function subscribe(key: string, fn: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(fn)
  return () => listeners.get(key)?.delete(fn)
}

export const STORAGE_KEYS = {
  RECENT: RECENT_KEY,
  FRIDGE: FRIDGE_KEY,
  COMPARE: COMPARE_KEY,
  FAVORITES: FAVORITES_KEY,
  SHOPPING: SHOPPING_KEY,
  COMPARE_SHOPPING: COMPARE_SHOPPING_KEY,
  PORTIONS: PORTIONS_KEY,
  PANTRY_MEMORY: PANTRY_MEMORY_KEY,
  TASTE_MEMORY: TASTE_MEMORY_KEY,
}
