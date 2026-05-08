export type SortKey =
  | 'createdDesc'
  | 'monthlyDesc'
  | 'monthlyAsc'
  | 'nextBillingAsc'
  | 'nameAsc'

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'createdDesc', label: '登録が新しい順' },
  { value: 'monthlyDesc', label: '月額が高い順' },
  { value: 'monthlyAsc', label: '月額が安い順' },
  { value: 'nextBillingAsc', label: '次回引落日が近い順' },
  { value: 'nameAsc', label: 'サービス名 (A→Z)' },
]
