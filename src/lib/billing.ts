import type { BillingCycle } from '@/types/database'

const startOfDay = (d: Date): Date => {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

const lastDayOfMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate()

const safeDate = (year: number, monthIndex: number, day: number): Date =>
  new Date(year, monthIndex, Math.min(day, lastDayOfMonth(year, monthIndex)))

export const computeNextBilling = (
  storedDate: string,
  cycle: BillingCycle,
  today: Date = new Date(),
): Date | null => {
  const stored = new Date(storedDate)
  if (Number.isNaN(stored.getTime())) return null

  const today0 = startOfDay(today)
  const day = stored.getDate()

  if (cycle === 'yearly') {
    const month = stored.getMonth()
    let candidate = safeDate(today0.getFullYear(), month, day)
    if (candidate < today0) {
      candidate = safeDate(today0.getFullYear() + 1, month, day)
    }
    return candidate
  }

  let candidate = safeDate(today0.getFullYear(), today0.getMonth(), day)
  if (candidate < today0) {
    candidate = safeDate(today0.getFullYear(), today0.getMonth() + 1, day)
  }
  return candidate
}

export const formatBillingPattern = (
  storedDate: string,
  cycle: BillingCycle,
): string => {
  const stored = new Date(storedDate)
  if (Number.isNaN(stored.getTime())) return ''
  const day = stored.getDate()
  if (cycle === 'monthly') return `毎月${day}日`
  const month = stored.getMonth() + 1
  return `毎年${month}月${day}日`
}

export const formatDateIso = (d: Date): string => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
