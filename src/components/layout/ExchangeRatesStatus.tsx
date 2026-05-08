import { useEffect, useRef, useState } from 'react'
import { ExternalLink, RefreshCcw } from 'lucide-react'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { SUPPORTED_CURRENCIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const formatRate = (rate: number): string => {
  const fractionDigits = rate < 1 ? 4 : 2
  return new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate)
}

const formatTime = (ts: number | null): string => {
  if (!ts) return '未取得'
  return new Date(ts).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sourceLabel = (source: 'fallback' | 'cache' | 'api'): string => {
  switch (source) {
    case 'api':
      return '最新'
    case 'cache':
      return '保存済み'
    default:
      return '参考値'
  }
}

const sourceDescription = (source: 'fallback' | 'cache' | 'api'): string => {
  switch (source) {
    case 'api':
      return '今取得したばかりのレート'
    case 'cache':
      return '前回取得して保存しておいたレート'
    default:
      return 'API取得に失敗しているため概算値で動作中'
  }
}

export const ExchangeRatesStatus = () => {
  const { rates, updatedAt, source, loading, error, refresh } = useExchangeRates()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const otherCurrencies = SUPPORTED_CURRENCIES.filter((c) => c !== 'JPY')

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 text-xs sm:gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'rounded-md px-2 py-0.5 font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-violet-300',
          source === 'api'
            ? 'bg-emerald-50 text-emerald-700'
            : source === 'cache'
              ? 'bg-slate-100 text-slate-700'
              : 'bg-amber-50 text-amber-700',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">為替: </span>
        {sourceLabel(source)}
      </button>
      <span className="hidden text-slate-500 md:inline">
        {formatTime(updatedAt)}
      </span>
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={loading}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        aria-label="為替レートを再取得"
      >
        <RefreshCcw
          className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <header className="mb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              為替レート（円換算）
            </h3>
            <p className="text-[11px] text-slate-500">
              1 通貨単位あたりの日本円
            </p>
          </header>
          <ul className="divide-y divide-slate-100">
            {otherCurrencies.map((code) => {
              const rate = rates[code]
              return (
                <li
                  key={code}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="font-medium text-slate-700">1 {code}</span>
                  <span className="text-slate-900 tabular-nums">
                    ={' '}
                    <span className="font-semibold">
                      ¥{rate !== undefined ? formatRate(rate) : '—'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          <footer className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <p>
              <span>状態: </span>
              <span
                className={cn(
                  'font-medium',
                  source === 'api'
                    ? 'text-emerald-700'
                    : source === 'cache'
                      ? 'text-slate-700'
                      : 'text-amber-700',
                )}
              >
                {sourceLabel(source)}
              </span>
              <span className="ml-2">{formatTime(updatedAt)}</span>
            </p>
            <p className="text-slate-500">{sourceDescription(source)}</p>
            <p className="leading-relaxed">
              提供元:{' '}
              <a
                href="https://www.exchangerate-api.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-0.5 text-violet-700 hover:underline"
              >
                ExchangeRate-API
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
              （フォールバック:{' '}
              <a
                href="https://www.frankfurter.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-0.5 text-violet-700 hover:underline"
              >
                Frankfurter / ECB
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
              ）
            </p>
            {error && (
              <p className="text-rose-600">取得エラー: {error}</p>
            )}
          </footer>
        </div>
      )}
    </div>
  )
}
