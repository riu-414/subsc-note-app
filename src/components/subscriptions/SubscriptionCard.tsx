import {
  Ban,
  CalendarDays,
  CalendarRange,
  Pencil,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { Genre } from '@/types/database'
import type { SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import { formatCurrency, monthlyJpy, toJpy } from '@/lib/currency'
import { USAGE_FREQUENCY_OPTIONS } from '@/lib/constants'
import { daysUntil } from '@/lib/analytics'
import {
  computeNextBilling,
  formatBillingPattern,
  formatDateIso,
} from '@/lib/billing'
import { cn } from '@/lib/utils'
import { GenreBadge } from '@/components/genres/GenreBadge'
import { Button } from '@/components/ui/Button'

type SubscriptionCardProps = {
  subscription: SubscriptionWithGenres
  genres: Genre[]
  onEdit: () => void
  onToggleStatus: () => void
}

export const SubscriptionCard = ({
  subscription,
  genres,
  onEdit,
  onToggleStatus,
}: SubscriptionCardProps) => {
  const monthly = monthlyJpy(
    subscription.price,
    subscription.currency,
    subscription.billing_cycle,
  )
  const usageLabel = USAGE_FREQUENCY_OPTIONS.find(
    (o) => o.value === subscription.usage_frequency,
  )?.label
  const linkedGenres = genres.filter((g) => subscription.genreIds.includes(g.id))
  const isArchived = subscription.status === 'archived'
  const isMonthly = subscription.billing_cycle === 'monthly'
  const isJpy = subscription.currency === 'JPY'
  const jpyAtCycle = toJpy(subscription.price, subscription.currency)
  const trialDaysLeft = subscription.trial_end_date
    ? daysUntil(subscription.trial_end_date)
    : null
  const inTrial = trialDaysLeft !== null && trialDaysLeft >= 0
  const nextBillingDate = subscription.next_billing_date
    ? computeNextBilling(subscription.next_billing_date, subscription.billing_cycle)
    : null
  const billingPattern = subscription.next_billing_date
    ? formatBillingPattern(subscription.next_billing_date, subscription.billing_cycle)
    : null
  const nextBillingDaysLeft = nextBillingDate
    ? daysUntil(formatDateIso(nextBillingDate))
    : null

  return (
    <article
      className={cn(
        'flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        'border-l-4',
        isMonthly ? 'border-l-sky-400' : 'border-l-emerald-500',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {subscription.name}
            </h3>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                isMonthly
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700',
              )}
            >
              {isMonthly ? (
                <CalendarDays className="h-3 w-3" aria-hidden />
              ) : (
                <CalendarRange className="h-3 w-3" aria-hidden />
              )}
              {isMonthly ? '月払い' : '年払い'}
            </span>
          </div>
          {subscription.plan_name && (
            <p className="mt-0.5 text-xs text-slate-500">
              {subscription.plan_name}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-slate-900 tabular-nums whitespace-nowrap">
            {formatCurrency(subscription.price, subscription.currency)}
            <span className="ml-1 text-sm font-normal text-slate-500">
              / {isMonthly ? '月' : '年'}
            </span>
          </p>
          {!isJpy && (
            <p className="text-[11px] text-slate-500 tabular-nums">
              ≈ {jpyAtCycle.toLocaleString()}円 / {isMonthly ? '月' : '年'}
            </p>
          )}
          {!isMonthly && (
            <p className="text-[11px] text-slate-500 tabular-nums">
              月額換算 {monthly.toLocaleString()}円
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {inTrial && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <Sparkles className="h-3 w-3" aria-hidden />
            トライアル中 (終了 {subscription.trial_end_date} ·{' '}
            {trialDaysLeft === 0
              ? '本日'
              : trialDaysLeft === 1
                ? '明日'
                : `${trialDaysLeft}日後`}
            )
          </span>
        )}
        {nextBillingDate && billingPattern && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            <span className="font-medium text-slate-700">{billingPattern}</span>
            <span className="text-slate-400">·</span>
            次回 {formatDateIso(nextBillingDate)}
            {nextBillingDaysLeft !== null && nextBillingDaysLeft <= 31 && (
              <span className="text-slate-500">
                （
                {nextBillingDaysLeft === 0
                  ? '本日'
                  : nextBillingDaysLeft === 1
                    ? '明日'
                    : `${nextBillingDaysLeft}日後`}
                ）
              </span>
            )}
          </span>
        )}
        {usageLabel && (
          <span className="rounded-md bg-violet-50 px-2 py-0.5 text-violet-700">
            利用: {usageLabel}
          </span>
        )}
        {subscription.payment_method && (
          <span className="text-slate-500">{subscription.payment_method}</span>
        )}
      </div>

      {linkedGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedGenres.map((g) => (
            <GenreBadge key={g.id} genre={g} />
          ))}
        </div>
      )}

      {subscription.remarks && (
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {subscription.remarks}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden />
          編集
        </Button>
        {isArchived ? (
          <Button variant="secondary" size="sm" onClick={onToggleStatus}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            再契約
          </Button>
        ) : (
          <Button variant="danger" size="sm" onClick={onToggleStatus}>
            <Ban className="h-4 w-4" aria-hidden />
            解約
          </Button>
        )}
      </div>
    </article>
  )
}
