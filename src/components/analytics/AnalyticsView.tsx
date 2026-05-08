import { useMemo } from 'react'
import { PieChart as PieChartIcon, Sparkles } from 'lucide-react'
import type { Genre } from '@/types/database'
import type { SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import {
  buildCancellationCandidates,
  buildGenreBreakdown,
} from '@/lib/analytics'
import { GenreBreakdownChart } from '@/components/analytics/GenreBreakdownChart'
import { CancellationCandidates } from '@/components/analytics/CancellationCandidates'

type AnalyticsViewProps = {
  subscriptions: SubscriptionWithGenres[]
  genres: Genre[]
  onSelectCandidate?: (subscriptionId: string) => void
}

export const AnalyticsView = ({
  subscriptions,
  genres,
  onSelectCandidate,
}: AnalyticsViewProps) => {
  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'active'),
    [subscriptions],
  )
  const breakdown = useMemo(
    () => buildGenreBreakdown(activeSubs, genres),
    [activeSubs, genres],
  )
  const candidates = useMemo(
    () => buildCancellationCandidates(activeSubs),
    [activeSubs],
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="mb-3 flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-violet-600" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-900">
            ジャンル別の月額構成
          </h3>
        </header>
        <GenreBreakdownChart data={breakdown} />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
        <header className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-900">
            解約候補（コスパ分析）
          </h3>
        </header>
        <p className="mb-2 text-xs text-slate-500">
          「ほとんど使っていない」または「月額1,000円以上 × 月に数回以下」が対象
        </p>
        <CancellationCandidates
          candidates={candidates}
          onSelect={onSelectCandidate}
        />
      </section>
    </div>
  )
}
