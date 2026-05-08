import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  getRatesSnapshot,
  setRates,
  subscribeToRates,
} from '@/lib/exchangeRates'

const CACHE_KEY = 'subsc-note-app:exchange-rates'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const PRIMARY_URL = 'https://open.er-api.com/v6/latest/JPY'
const FALLBACK_URL = 'https://api.frankfurter.app/latest?from=JPY'

type ErApiResponse = {
  result: 'success' | 'error'
  base_code?: string
  rates: Record<string, number>
  'error-type'?: string
}

type FrankfurterResponse = {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

type CachedPayload = {
  rates: Record<string, number>
  updatedAt: number
}

const invertToJpyRates = (
  jpyToOther: Record<string, number>,
): Record<string, number> => {
  const out: Record<string, number> = { JPY: 1 }
  for (const [code, rate] of Object.entries(jpyToOther)) {
    if (rate > 0) out[code] = 1 / rate
  }
  return out
}

const fetchPrimary = async (): Promise<Record<string, number>> => {
  const res = await fetch(PRIMARY_URL)
  if (!res.ok) throw new Error(`open.er-api.com (${res.status})`)
  const json = (await res.json()) as ErApiResponse
  if (json.result !== 'success') {
    throw new Error(`open.er-api.com error: ${json['error-type'] ?? 'unknown'}`)
  }
  return invertToJpyRates(json.rates)
}

const fetchFallback = async (): Promise<Record<string, number>> => {
  const res = await fetch(FALLBACK_URL)
  if (!res.ok) throw new Error(`frankfurter.app (${res.status})`)
  const json = (await res.json()) as FrankfurterResponse
  return invertToJpyRates(json.rates)
}

const readCache = (): CachedPayload | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedPayload
    if (
      typeof parsed.updatedAt !== 'number' ||
      typeof parsed.rates !== 'object'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const writeCache = (payload: CachedPayload) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode failures
  }
}

export const useExchangeRates = () => {
  const snapshot = useSyncExternalStore(
    subscribeToRates,
    getRatesSnapshot,
    getRatesSnapshot,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let inverted: Record<string, number>
      try {
        inverted = await fetchPrimary()
      } catch (primaryErr) {
        console.warn('プライマリAPI失敗、フォールバックを試行:', primaryErr)
        inverted = await fetchFallback()
      }
      const updatedAt = Date.now()
      setRates(inverted, 'api', updatedAt)
      writeCache({ rates: inverted, updatedAt })
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = readCache()
    const fresh = cached && Date.now() - cached.updatedAt < CACHE_TTL_MS
    if (cached && fresh) {
      setRates(cached.rates, 'cache', cached.updatedAt)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  return {
    rates: snapshot.rates,
    updatedAt: snapshot.updatedAt,
    source: snapshot.source,
    loading,
    error,
    refresh,
  }
}
