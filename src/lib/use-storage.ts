"use client"

import { useEffect, useState } from 'react'
import { subscribe } from './storage'

export function useStorageValue<T>(key: string, read: () => T): T {
  const [value, setValue] = useState<T>(() => read())

  useEffect(() => {
    setValue(read())
    const unsubscribe = subscribe(key, () => setValue(read()))
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) setValue(read())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      unsubscribe?.()
      window.removeEventListener('storage', onStorage)
    }
  }, [key, read])

  return value
}
