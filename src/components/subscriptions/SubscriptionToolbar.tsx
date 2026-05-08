import { Search, Settings2, X } from 'lucide-react'
import type { Genre } from '@/types/database'
import { cn } from '@/lib/utils'
import { SORT_OPTIONS, type SortKey } from '@/components/subscriptions/sort'

type SubscriptionToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  sortKey: SortKey
  onSortChange: (value: SortKey) => void
  genres: Genre[]
  selectedGenreIds: string[]
  onToggleGenre: (genreId: string) => void
  onClearFilters: () => void
  onManageGenres: () => void
}

export const SubscriptionToolbar = ({
  search,
  onSearchChange,
  sortKey,
  onSortChange,
  genres,
  selectedGenreIds,
  onToggleGenre,
  onClearFilters,
  onManageGenres,
}: SubscriptionToolbarProps) => {
  const hasFilter = search.length > 0 || selectedGenreIds.length > 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[200px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="サービス名・プラン名・備考で検索"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilter && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-xs text-slate-500 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            条件クリア
          </button>
        )}
        <button
          type="button"
          onClick={onManageGenres}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          ジャンル管理
        </button>
      </div>

      {genres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">ジャンル:</span>
          {genres.map((genre) => {
            const active = selectedGenreIds.includes(genre.id)
            const color = genre.color ?? '#64748b'
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => onToggleGenre(genre.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  active
                    ? 'border-transparent text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                )}
                style={
                  active
                    ? { backgroundColor: color, borderColor: color }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: active ? '#fff' : color }}
                  aria-hidden
                />
                {genre.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
