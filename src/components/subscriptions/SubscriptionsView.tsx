import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarRange, Plus } from 'lucide-react'
import { useGenres } from '@/hooks/useGenres'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useSubscriptions, type SubscriptionWithGenres } from '@/hooks/useSubscriptions'
import { DEFAULT_GENRE_PRESETS } from '@/lib/constants'
import { computeNextBilling, formatDateIso } from '@/lib/billing'
import { monthlyJpy, toJpy } from '@/lib/currency'
import { daysUntil } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  SubscriptionForm,
  type SubscriptionFormValue,
} from '@/components/subscriptions/SubscriptionForm'
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard'
import { SubscriptionToolbar } from '@/components/subscriptions/SubscriptionToolbar'
import type { SortKey } from '@/components/subscriptions/sort'
import { ReminderBanner } from '@/components/reminders/ReminderBanner'
import { OnboardingCard } from '@/components/onboarding/OnboardingCard'
import { GenreManager } from '@/components/genres/GenreManager'

const AnalyticsView = lazy(() =>
  import('@/components/analytics/AnalyticsView').then((m) => ({
    default: m.AnalyticsView,
  })),
)

const AnalyticsFallback = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
    <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
  </div>
)

const ONBOARDING_DISMISSED_KEY = 'subsc-note-app:onboarding-dismissed'

type SubscriptionsViewProps = {
  userId: string
}

type FilterTab = 'active' | 'archived'

const matchesSearch = (sub: SubscriptionWithGenres, query: string): boolean => {
  if (!query) return true
  const q = query.toLowerCase()
  return [sub.name, sub.plan_name, sub.remarks, sub.payment_method]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(q))
}

const sortSubscriptions = (
  list: SubscriptionWithGenres[],
  sortKey: SortKey,
): SubscriptionWithGenres[] => {
  const copy = [...list]
  const monthly = (s: SubscriptionWithGenres) =>
    monthlyJpy(s.price, s.currency, s.billing_cycle)
  switch (sortKey) {
    case 'monthlyDesc':
      return copy.sort((a, b) => monthly(b) - monthly(a))
    case 'monthlyAsc':
      return copy.sort((a, b) => monthly(a) - monthly(b))
    case 'nextBillingAsc':
      return copy.sort((a, b) => {
        const nextA = a.next_billing_date
          ? computeNextBilling(a.next_billing_date, a.billing_cycle)
          : null
        const nextB = b.next_billing_date
          ? computeNextBilling(b.next_billing_date, b.billing_cycle)
          : null
        const da = nextA
          ? daysUntil(formatDateIso(nextA))
          : Number.POSITIVE_INFINITY
        const db = nextB
          ? daysUntil(formatDateIso(nextB))
          : Number.POSITIVE_INFINITY
        return da - db
      })
    case 'nameAsc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    case 'createdDesc':
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }
}

export const SubscriptionsView = ({ userId }: SubscriptionsViewProps) => {
  const {
    subscriptions,
    loading,
    error,
    createSubscription,
    updateSubscription,
    setStatus,
  } = useSubscriptions(userId)
  const { genres, createGenre, createGenres, updateGenre, deleteGenre } =
    useGenres(userId)
  const { methods: paymentMethods, createMethod: createPaymentMethod } =
    usePaymentMethods(userId)

  const [tab, setTab] = useState<FilterTab>('active')
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOnboardingDismissed(
        localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1',
      )
    } catch {
      // ignore
    }
  }, [])

  const showOnboarding =
    !loading &&
    !onboardingDismissed &&
    subscriptions.length === 0 &&
    genres.length === 0

  const dismissOnboarding = () => {
    setOnboardingDismissed(true)
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }

  const handleAddPresets = async () => {
    await createGenres(
      DEFAULT_GENRE_PRESETS.map((p) => ({ name: p.name, color: p.color })),
    )
    dismissOnboarding()
  }

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdDesc')
  const [filterGenreIds, setFilterGenreIds] = useState<string[]>([])
  const [editing, setEditing] = useState<SubscriptionWithGenres | null>(null)
  const [creating, setCreating] = useState(false)
  const [managingGenres, setManagingGenres] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    const base = subscriptions.filter((s) => s.status === tab)
    const searched = base.filter((s) => matchesSearch(s, search))
    const byGenre =
      filterGenreIds.length === 0
        ? searched
        : searched.filter((s) =>
            filterGenreIds.every((id) => s.genreIds.includes(id)),
          )
    return sortSubscriptions(byGenre, sortKey)
  }, [subscriptions, tab, search, filterGenreIds, sortKey])

  const groups = useMemo(() => {
    const monthly = filtered.filter((s) => s.billing_cycle === 'monthly')
    const yearly = filtered.filter((s) => s.billing_cycle === 'yearly')
    return [
      { cycle: 'monthly' as const, label: '月払い', items: monthly },
      { cycle: 'yearly' as const, label: '年払い', items: yearly },
    ].filter((g) => g.items.length > 0)
  }, [filtered])

  const { monthlyTotal, yearlyTotal, monthlyCount, yearlyCount } = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'active')
    let monthlySum = 0
    let monthlyCnt = 0
    let yearlySum = 0
    let yearlyCnt = 0
    for (const sub of active) {
      const jpy = toJpy(sub.price, sub.currency)
      if (sub.billing_cycle === 'monthly') {
        monthlySum += jpy
        monthlyCnt += 1
        continue
      }
      yearlySum += jpy
      yearlyCnt += 1
    }
    return {
      monthlyTotal: Math.round(monthlySum),
      yearlyTotal: Math.round(yearlySum),
      monthlyCount: monthlyCnt,
      yearlyCount: yearlyCnt,
    }
  }, [subscriptions])

  const openEditById = (id: string) => {
    const target = subscriptions.find((s) => s.id === id)
    if (target) setEditing(target)
  }

  const handleCreate = async (
    value: SubscriptionFormValue,
    genreIds: string[],
  ) => {
    setSubmitting(true)
    try {
      await createSubscription(value, genreIds)
      setCreating(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (
    value: SubscriptionFormValue,
    genreIds: string[],
  ) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await updateSubscription(editing.id, value, genreIds)
      setEditing(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (sub: SubscriptionWithGenres) => {
    if (sub.status === 'active') {
      const confirmed = window.confirm(
        `「${sub.name}」を解約済みにします。「解約」タブに移動します。よろしいですか？`,
      )
      if (!confirmed) return
      try {
        await setStatus(sub.id, 'archived')
      } catch (err) {
        console.error('解約処理に失敗しました', err)
      }
      return
    }

    try {
      await setStatus(sub.id, 'active')
    } catch (err) {
      console.error('再契約処理に失敗しました', err)
    }
  }

  const handleCreateGenre = async (name: string, color: string) => {
    return createGenre({ name, color })
  }

  const toggleFilterGenre = (id: string) => {
    setFilterGenreIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const clearFilters = () => {
    setSearch('')
    setFilterGenreIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              月払い合計（日本円換算）
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {monthlyTotal.toLocaleString()}円
              <span className="ml-2 text-sm font-normal text-slate-500">
                / 月
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{monthlyCount}件</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              年払い合計（日本円換算）
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {yearlyTotal.toLocaleString()}円
              <span className="ml-2 text-sm font-normal text-slate-500">
                / 年
              </span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{yearlyCount}件</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          新規登録
        </Button>
      </section>

      {showOnboarding && (
        <OnboardingCard
          onAddPresets={handleAddPresets}
          onStartCreating={() => {
            dismissOnboarding()
            setCreating(true)
          }}
          onDismiss={dismissOnboarding}
        />
      )}

      <ReminderBanner subscriptions={subscriptions} onSelect={openEditById} />

      <Suspense fallback={<AnalyticsFallback />}>
        <AnalyticsView
          subscriptions={subscriptions}
          genres={genres}
          onSelectCandidate={openEditById}
        />
      </Suspense>

      <SubscriptionToolbar
        search={search}
        onSearchChange={setSearch}
        sortKey={sortKey}
        onSortChange={setSortKey}
        genres={genres}
        selectedGenreIds={filterGenreIds}
        onToggleGenre={toggleFilterGenre}
        onClearFilters={clearFilters}
        onManageGenres={() => setManagingGenres(true)}
      />

      <div className="flex items-center gap-2">
        {(['active', 'archived'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              tab === value
                ? 'border-violet-500 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {value === 'active' ? '契約中' : '解約'}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">読み込み中…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {search || filterGenreIds.length > 0
            ? '条件に一致するサブスクが見つかりませんでした。'
            : tab === 'active'
              ? 'まだサブスクリプションが登録されていません。「新規登録」から追加してください。'
              : '解約済みのサブスクはありません。各カードの「解約」ボタンから移動できます。'}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.cycle} className="flex flex-col gap-3">
              <header className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold',
                    group.cycle === 'monthly'
                      ? 'border-sky-200 bg-sky-50 text-sky-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                >
                  {group.cycle === 'monthly' ? (
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {group.label}
                </span>
                <span className="text-xs text-slate-500">
                  {group.items.length}件
                </span>
                <span
                  className={cn(
                    'h-px flex-1',
                    group.cycle === 'monthly' ? 'bg-sky-100' : 'bg-emerald-100',
                  )}
                  aria-hidden
                />
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    genres={genres}
                    onEdit={() => setEditing(sub)}
                    onToggleStatus={() => handleToggleStatus(sub)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        title="サブスクリプションを登録"
        onClose={() => setCreating(false)}
      >
        <SubscriptionForm
          genres={genres}
          paymentMethods={paymentMethods}
          submitting={submitting}
          submitLabel="登録"
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          onCreateGenre={handleCreateGenre}
          onCreatePaymentMethod={createPaymentMethod}
        />
      </Modal>

      <Modal
        open={!!editing}
        title="サブスクリプションを編集"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <SubscriptionForm
            initialValue={editing}
            initialGenreIds={editing.genreIds}
            genres={genres}
            paymentMethods={paymentMethods}
            submitting={submitting}
            submitLabel="保存"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            onCreateGenre={handleCreateGenre}
            onCreatePaymentMethod={createPaymentMethod}
          />
        )}
      </Modal>

      <GenreManager
        open={managingGenres}
        onClose={() => setManagingGenres(false)}
        genres={genres}
        subscriptions={subscriptions}
        onUpdate={(id, input) => updateGenre(id, input)}
        onDelete={(id) => deleteGenre(id)}
      />
    </div>
  )
}
