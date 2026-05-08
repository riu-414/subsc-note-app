import type { BillingCycle, CurrencyCode } from '@/types/database'
import { getRateToJpy } from '@/lib/exchangeRates'

export { getRateToJpy }

export const toJpy = (price: number, currency: CurrencyCode): number => {
  return Math.round(price * getRateToJpy(currency))
}

export const toMonthly = (price: number, cycle: BillingCycle): number => {
  return cycle === 'yearly' ? price / 12 : price
}

export const toYearly = (price: number, cycle: BillingCycle): number => {
  return cycle === 'monthly' ? price * 12 : price
}

export const monthlyJpy = (
  price: number,
  currency: CurrencyCode,
  cycle: BillingCycle,
): number => {
  return toJpy(toMonthly(price, cycle), currency)
}

export const yearlyJpy = (
  price: number,
  currency: CurrencyCode,
  cycle: BillingCycle,
): number => {
  return toJpy(toYearly(price, cycle), currency)
}

export const formatCurrency = (amount: number, currency: CurrencyCode): string => {
  try {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}
