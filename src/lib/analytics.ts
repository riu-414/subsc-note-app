import type { Genre, UsageFrequency } from '@/types/database'
import type { SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import { computeNextBilling, formatDateIso } from '@/lib/billing'
import { monthlyJpy } from '@/lib/currency'

export type GenreBreakdown = {
  genreId: string | null
  name: string
  color: string
  monthlyJpy: number
  ratio: number
}

const UNCATEGORIZED_COLOR = '#94a3b8'

export const buildGenreBreakdown = (
  subscriptions: SubscriptionWithGenres[],
  genres: Genre[],
): GenreBreakdown[] => {
  const totals = new Map<string | null, number>()

  for (const sub of subscriptions) {
    const monthly = monthlyJpy(sub.price, sub.currency, sub.billing_cycle)
    if (sub.genreIds.length === 0) {
      totals.set(null, (totals.get(null) ?? 0) + monthly)
      continue
    }
    const share = monthly / sub.genreIds.length
    for (const genreId of sub.genreIds) {
      totals.set(genreId, (totals.get(genreId) ?? 0) + share)
    }
  }

  const grand = Array.from(totals.values()).reduce((a, b) => a + b, 0)
  if (grand === 0) return []

  const genreById = new Map(genres.map((g) => [g.id, g]))

  return Array.from(totals.entries())
    .map(([id, total]): GenreBreakdown => {
      const genre = id ? genreById.get(id) : null
      return {
        genreId: id,
        name: genre?.name ?? '未分類',
        color: genre?.color ?? UNCATEGORIZED_COLOR,
        monthlyJpy: Math.round(total),
        ratio: total / grand,
      }
    })
    .sort((a, b) => b.monthlyJpy - a.monthlyJpy)
}

const HIGH_COST_THRESHOLD_JPY = 1000
const LOW_USAGE: ReadonlyArray<UsageFrequency> = ['low', 'none']

export type CancellationCandidate = {
  subscription: SubscriptionWithGenres
  monthlyJpyAmount: number
  reason: string
}

export const buildCancellationCandidates = (
  subscriptions: SubscriptionWithGenres[],
): CancellationCandidate[] => {
  return subscriptions
    .filter((s) => s.status === 'active')
    .map((s): CancellationCandidate | null => {
      const monthly = monthlyJpy(s.price, s.currency, s.billing_cycle)
      const usage = s.usage_frequency
      if (!usage) return null
      const lowUsage = LOW_USAGE.includes(usage)
      const highCost = monthly >= HIGH_COST_THRESHOLD_JPY

      if (usage === 'none') {
        return {
          subscription: s,
          monthlyJpyAmount: monthly,
          reason: 'ほとんど使っていない',
        }
      }
      if (lowUsage && highCost) {
        return {
          subscription: s,
          monthlyJpyAmount: monthly,
          reason: '利用頻度に対して月額が高め',
        }
      }
      return null
    })
    .filter((x): x is CancellationCandidate => x !== null)
    .sort((a, b) => b.monthlyJpyAmount - a.monthlyJpyAmount)
}

export const daysUntil = (isoDate: string): number => {
  const target = new Date(isoDate)
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffMs = target.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export type ReminderKind = 'billing' | 'trial'

export type ReminderItem = {
  subscription: SubscriptionWithGenres
  daysLeft: number
  kind: ReminderKind
  date: string
}

export const upcomingBillings = (
  subscriptions: SubscriptionWithGenres[],
  withinDays = 30,
): ReminderItem[] => {
  return subscriptions
    .filter((s) => s.status === 'active' && s.next_billing_date)
    .map((s): ReminderItem | null => {
      const next = computeNextBilling(
        s.next_billing_date as string,
        s.billing_cycle,
      )
      if (!next) return null
      const dateStr = formatDateIso(next)
      return {
        subscription: s,
        daysLeft: daysUntil(dateStr),
        kind: 'billing',
        date: dateStr,
      }
    })
    .filter((x): x is ReminderItem => x !== null)
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export const upcomingTrials = (
  subscriptions: SubscriptionWithGenres[],
  withinDays = 14,
): ReminderItem[] => {
  return subscriptions
    .filter((s) => s.status === 'active' && s.trial_end_date)
    .map((s): ReminderItem => ({
      subscription: s,
      daysLeft: daysUntil(s.trial_end_date as string),
      kind: 'trial',
      date: s.trial_end_date as string,
    }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export const upcomingReminders = (
  subscriptions: SubscriptionWithGenres[],
  options: { billingWithinDays?: number; trialWithinDays?: number } = {},
): ReminderItem[] => {
  const { billingWithinDays = 30, trialWithinDays = 14 } = options
  return [
    ...upcomingTrials(subscriptions, trialWithinDays),
    ...upcomingBillings(subscriptions, billingWithinDays),
  ].sort((a, b) => a.daysLeft - b.daysLeft)
}
