import type { CurrencyCode } from '@/types/database'

const FALLBACK_RATES_TO_JPY: Record<string, number> = {
  JPY: 1,
  USD: 155,
  EUR: 168,
  GBP: 195,
  KRW: 0.11,
}

type RateSnapshot = {
  rates: Record<string, number>
  updatedAt: number | null
  source: 'fallback' | 'cache' | 'api'
}

let snapshot: RateSnapshot = {
  rates: { ...FALLBACK_RATES_TO_JPY },
  updatedAt: null,
  source: 'fallback',
}

const listeners = new Set<() => void>()

const notify = () => {
  for (const l of listeners) l()
}

export const subscribeToRates = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getRatesSnapshot = (): RateSnapshot => snapshot

export const setRates = (
  rates: Record<string, number>,
  source: RateSnapshot['source'],
  updatedAt: number,
) => {
  snapshot = {
    rates: { ...FALLBACK_RATES_TO_JPY, ...rates, JPY: 1 },
    updatedAt,
    source,
  }
  notify()
}

export const getRateToJpy = (currency: CurrencyCode): number => {
  return snapshot.rates[currency] ?? 1
}
