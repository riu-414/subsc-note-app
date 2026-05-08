import { AlertTriangle } from 'lucide-react'
import type { CancellationCandidate } from '@/lib/analytics'

type CancellationCandidatesProps = {
  candidates: CancellationCandidate[]
  onSelect?: (subscriptionId: string) => void
}

export const CancellationCandidates = ({
  candidates,
  onSelect,
}: CancellationCandidatesProps) => {
  if (candidates.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        現在の登録内容では、解約候補に該当するサブスクはありません。
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-amber-100">
      {candidates.map(({ subscription, monthlyJpyAmount, reason }) => (
        <li key={subscription.id} className="py-3">
          <button
            type="button"
            onClick={() => onSelect?.(subscription.id)}
            className="flex w-full items-start justify-between gap-3 text-left"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 text-amber-500"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {subscription.name}
                  {subscription.plan_name && (
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      / {subscription.plan_name}
                    </span>
                  )}
                </p>
                <p className="text-xs text-amber-700">{reason}</p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
              {monthlyJpyAmount.toLocaleString()}円
              <span className="ml-1 text-xs font-normal text-slate-500">
                / 月
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
