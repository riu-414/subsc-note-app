import { useMemo, useState } from 'react'
import { BellRing, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import { upcomingReminders, type ReminderItem } from '@/lib/analytics'

type ReminderBannerProps = {
  subscriptions: SubscriptionWithGenres[]
  billingWithinDays?: number
  trialWithinDays?: number
  onSelect?: (subscriptionId: string) => void
}

const dayLabel = (daysLeft: number): string => {
  if (daysLeft === 0) return '本日'
  if (daysLeft === 1) return '明日'
  return `${daysLeft}日後`
}

const accentClasses = (item: ReminderItem): string => {
  if (item.kind === 'trial') {
    if (item.daysLeft <= 1) return 'text-rose-700'
    if (item.daysLeft <= 3) return 'text-amber-700'
    return 'text-emerald-700'
  }
  if (item.daysLeft <= 3) return 'text-rose-700'
  if (item.daysLeft <= 7) return 'text-amber-700'
  return 'text-slate-600'
}

const kindLabel = (kind: ReminderItem['kind']): string =>
  kind === 'trial' ? 'トライアル終了' : '次回引落'

export const ReminderBanner = ({
  subscriptions,
  billingWithinDays = 30,
  trialWithinDays = 14,
  onSelect,
}: ReminderBannerProps) => {
  const items = useMemo(
    () =>
      upcomingReminders(subscriptions, {
        billingWithinDays,
        trialWithinDays,
      }),
    [subscriptions, billingWithinDays, trialWithinDays],
  )
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const visible = expanded ? items : items.slice(0, 3)
  const closest = items[0]
  const trialCount = items.filter((i) => i.kind === 'trial').length
  const billingCount = items.filter((i) => i.kind === 'billing').length

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white">
            <BellRing className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">
              {trialCount > 0 && `トライアル終了 ${trialCount}件`}
              {trialCount > 0 && billingCount > 0 && ' / '}
              {billingCount > 0 && `引き落とし予定 ${billingCount}件`}
            </p>
            <p className={accentClasses(closest)}>
              最短: {kindLabel(closest.kind)} - {closest.subscription.name} (
              {dayLabel(closest.daysLeft)})
            </p>
          </div>
        </div>
        {items.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-violet-700 hover:underline"
          >
            {expanded ? '閉じる' : 'すべて表示'}
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden />
            )}
          </button>
        )}
      </header>

      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {visible.map((item) => (
          <li key={`${item.kind}-${item.subscription.id}`}>
            <button
              type="button"
              onClick={() => onSelect?.(item.subscription.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-left transition-colors hover:bg-white"
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.kind === 'trial' && (
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                )}
                <span className="truncate font-medium text-slate-800">
                  {item.subscription.name}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  · {kindLabel(item.kind)}
                </span>
              </span>
              <span
                className={`shrink-0 text-xs font-semibold tabular-nums ${accentClasses(item)}`}
              >
                {dayLabel(item.daysLeft)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
