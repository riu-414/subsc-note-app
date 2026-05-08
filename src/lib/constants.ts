import type { BillingCycle, CurrencyCode, UsageFrequency } from '@/types/database'

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['JPY', 'USD', 'EUR', 'GBP', 'KRW']

export const BILLING_CYCLE_OPTIONS: ReadonlyArray<{ value: BillingCycle; label: string }> = [
  { value: 'monthly', label: '月払い' },
  { value: 'yearly', label: '年払い' },
]

export const USAGE_FREQUENCY_OPTIONS: ReadonlyArray<{
  value: UsageFrequency
  label: string
  description: string
}> = [
  { value: 'high', label: '毎日', description: '日常的に利用' },
  { value: 'medium', label: '週に数回', description: '定期的に利用' },
  { value: 'low', label: '月に数回', description: 'たまに利用' },
  { value: 'none', label: 'ほとんど使っていない', description: '解約候補' },
]

export const PAYMENT_METHOD_PRESETS: readonly string[] = [
  'クレジットカード',
  '銀行振込',
  'PayPal',
  'Apple Pay',
  'Google Pay',
  'キャリア決済',
]

export const DEFAULT_GENRE_PRESETS: ReadonlyArray<{ name: string; color: string }> = [
  { name: '動画', color: '#ef4444' },
  { name: '音楽', color: '#f97316' },
  { name: '健康', color: '#22c55e' },
  { name: '仕事 (AI)', color: '#8b5cf6' },
  { name: '学習', color: '#0ea5e9' },
]
