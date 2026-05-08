import { useMemo, useState, type FormEvent } from 'react'
import {
  BILLING_CYCLE_OPTIONS,
  SUPPORTED_CURRENCIES,
  USAGE_FREQUENCY_OPTIONS,
} from '@/lib/constants'
import { monthlyJpy, yearlyJpy } from '@/lib/currency'
import type {
  BillingCycle,
  CurrencyCode,
  Genre,
  PaymentMethod,
  Subscription,
  SubscriptionInsert,
  UsageFrequency,
} from '@/types/database'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { GenrePicker } from '@/components/genres/GenrePicker'
import { PaymentMethodPicker } from '@/components/payment-methods/PaymentMethodPicker'

export type SubscriptionFormValue = Omit<
  SubscriptionInsert,
  'user_id' | 'id' | 'created_at' | 'updated_at'
>

type SubscriptionFormProps = {
  initialValue?: Partial<Subscription>
  initialGenreIds?: string[]
  genres: Genre[]
  paymentMethods: PaymentMethod[]
  submitting: boolean
  submitLabel: string
  onSubmit: (value: SubscriptionFormValue, genreIds: string[]) => Promise<void>
  onCancel: () => void
  onCreateGenre: (name: string, color: string) => Promise<Genre>
  onCreatePaymentMethod: (name: string) => Promise<PaymentMethod>
}

const blank = (initial?: Partial<Subscription>): SubscriptionFormValue => ({
  name: initial?.name ?? '',
  plan_name: initial?.plan_name ?? null,
  price: initial?.price ?? 0,
  currency: (initial?.currency as CurrencyCode | undefined) ?? 'JPY',
  billing_cycle: (initial?.billing_cycle as BillingCycle | undefined) ?? 'monthly',
  payment_method: initial?.payment_method ?? null,
  next_billing_date: initial?.next_billing_date ?? null,
  trial_end_date: initial?.trial_end_date ?? null,
  usage_frequency: (initial?.usage_frequency as UsageFrequency | undefined) ?? null,
  remarks: initial?.remarks ?? null,
})

export const SubscriptionForm = ({
  initialValue,
  initialGenreIds,
  genres,
  paymentMethods,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
  onCreateGenre,
  onCreatePaymentMethod,
}: SubscriptionFormProps) => {
  const [value, setValue] = useState<SubscriptionFormValue>(() => blank(initialValue))
  const [priceInput, setPriceInput] = useState<string>(
    initialValue?.price !== undefined ? String(initialValue.price) : '',
  )
  const [genreIds, setGenreIds] = useState<string[]>(initialGenreIds ?? [])
  const [error, setError] = useState<string | null>(null)

  const numericPrice = Number(priceInput)
  const previewPrice =
    priceInput !== '' && !Number.isNaN(numericPrice) ? numericPrice : 0

  const monthlyJpyAmount = useMemo(
    () => monthlyJpy(previewPrice, value.currency ?? 'JPY', value.billing_cycle),
    [previewPrice, value.currency, value.billing_cycle],
  )
  const yearlyJpyAmount = useMemo(
    () => yearlyJpy(previewPrice, value.currency ?? 'JPY', value.billing_cycle),
    [previewPrice, value.currency, value.billing_cycle],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (priceInput.trim() === '' || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError('価格は0以上の数値で入力してください')
      return
    }

    try {
      await onSubmit(
        {
          ...value,
          name: value.name.trim(),
          plan_name: value.plan_name?.trim() || null,
          payment_method: value.payment_method?.trim() || null,
          remarks: value.remarks?.trim() || null,
          next_billing_date: value.next_billing_date || null,
          trial_end_date: value.trial_end_date || null,
          price: numericPrice,
        },
        genreIds,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        label="サービス名"
        name="name"
        required
        value={value.name}
        onChange={(e) => setValue((prev) => ({ ...prev, name: e.target.value }))}
      />
      <TextField
        label="プラン名"
        name="plan_name"
        value={value.plan_name ?? ''}
        onChange={(e) =>
          setValue((prev) => ({ ...prev, plan_name: e.target.value }))
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="価格"
          name="price"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">通貨</span>
          <select
            value={value.currency ?? 'JPY'}
            onChange={(e) =>
              setValue((prev) => ({
                ...prev,
                currency: e.target.value as CurrencyCode,
              }))
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">支払いサイクル</span>
          <select
            value={value.billing_cycle}
            onChange={(e) =>
              setValue((prev) => ({
                ...prev,
                billing_cycle: e.target.value as BillingCycle,
              }))
            }
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            {BILLING_CYCLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        日本円換算：
        <span className="ml-1 font-semibold text-slate-900">
          {monthlyJpyAmount.toLocaleString()}円 / 月
        </span>
        <span className="mx-2 text-slate-300">·</span>
        <span className="font-semibold text-slate-900">
          {yearlyJpyAmount.toLocaleString()}円 / 年
        </span>
      </div>

      <PaymentMethodPicker
        methods={paymentMethods}
        selectedName={value.payment_method ?? null}
        onChange={(name) =>
          setValue((prev) => ({ ...prev, payment_method: name }))
        }
        onCreate={onCreatePaymentMethod}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="引き落とし日"
          name="next_billing_date"
          type="date"
          hint={
            value.billing_cycle === 'monthly'
              ? '日付の「日」だけが使われ、毎月◯日として自動計算されます'
              : '日付の「月日」が使われ、毎年◯月◯日として自動計算されます'
          }
          value={value.next_billing_date ?? ''}
          onChange={(e) =>
            setValue((prev) => ({ ...prev, next_billing_date: e.target.value }))
          }
        />
        <TextField
          label="無料トライアル終了日"
          name="trial_end_date"
          type="date"
          hint="トライアル中のみ設定。リマインダー対象になります"
          value={value.trial_end_date ?? ''}
          onChange={(e) =>
            setValue((prev) => ({ ...prev, trial_end_date: e.target.value }))
          }
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">使用頻度</span>
        <select
          value={value.usage_frequency ?? ''}
          onChange={(e) =>
            setValue((prev) => ({
              ...prev,
              usage_frequency: (e.target.value || null) as UsageFrequency | null,
            }))
          }
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="">未設定</option>
          {USAGE_FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.description})
            </option>
          ))}
        </select>
      </label>

      <GenrePicker
        genres={genres}
        selectedIds={genreIds}
        onChange={setGenreIds}
        onCreateGenre={onCreateGenre}
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">備考</span>
        <textarea
          rows={3}
          value={value.remarks ?? ''}
          onChange={(e) =>
            setValue((prev) => ({ ...prev, remarks: e.target.value }))
          }
          className="rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </label>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
