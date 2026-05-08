import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { DEFAULT_GENRE_PRESETS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

type OnboardingCardProps = {
  onAddPresets: () => Promise<void>
  onStartCreating: () => void
  onDismiss: () => void
}

export const OnboardingCard = ({
  onAddPresets,
  onStartCreating,
  onDismiss,
}: OnboardingCardProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPresets = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onAddPresets()
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white/60 hover:text-slate-600"
        aria-label="閉じる"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            まずはジャンルを準備しましょう
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            よく使われるジャンルを一括追加してすぐ分類を始められます。後から自由に編集・削除できます。
          </p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {DEFAULT_GENRE_PRESETS.map((preset) => (
              <li
                key={preset.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/70 px-2.5 py-0.5 text-xs font-medium text-slate-700"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: preset.color }}
                  aria-hidden
                />
                {preset.name}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={handleAddPresets} loading={submitting}>
              <Sparkles className="h-4 w-4" aria-hidden />
              プリセットを一括追加
            </Button>
            <Button variant="secondary" onClick={onStartCreating}>
              新規サブスクから登録
            </Button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:underline"
            >
              スキップ
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
