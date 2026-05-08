import { useState, type KeyboardEvent } from 'react'
import { CreditCard, Plus, X } from 'lucide-react'
import type { PaymentMethod } from '@/types/database'
import { PAYMENT_METHOD_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

type PaymentMethodPickerProps = {
  methods: PaymentMethod[]
  selectedName: string | null
  onChange: (name: string | null) => void
  onCreate: (name: string) => Promise<PaymentMethod>
}

export const PaymentMethodPicker = ({
  methods,
  selectedName,
  onChange,
  onCreate,
}: PaymentMethodPickerProps) => {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const select = (name: string) => {
    onChange(selectedName === name ? null : name)
  }

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await onCreate(trimmed)
      onChange(created.name)
      setNewName('')
      setAdding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '追加に失敗しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const cancel = () => {
    setAdding(false)
    setNewName('')
    setError(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleCreate()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  const isOrphan =
    selectedName !== null &&
    selectedName !== '' &&
    !methods.some((m) => m.name === selectedName)

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">支払い方法</span>
      <div className="flex flex-wrap gap-2">
        {isOrphan && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500 bg-violet-600 px-3 py-1 text-xs font-medium text-white"
            title="マスタ未登録の支払い方法"
          >
            <CreditCard className="h-3 w-3" aria-hidden />
            {selectedName}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-white/30 hover:bg-white/50"
              aria-label="選択解除"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        )}
        {methods.map((method) => {
          const isSelected = selectedName === method.name
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => select(method.name)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isSelected
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <CreditCard className="h-3 w-3" aria-hidden />
              {method.name}
            </button>
          )
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" aria-hidden />
            新規追加
          </button>
        )}
      </div>

      {adding && (
        <div
          role="group"
          aria-label="新規支払い方法"
          className="mt-2 flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex-1">
            <TextField
              label="支払い方法名"
              name="payment-method-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              autoFocus
              placeholder="例: クレジットカード(Visa)"
              list="payment-method-presets"
            />
            <datalist id="payment-method-presets">
              {PAYMENT_METHOD_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>
          <Button
            type="button"
            size="sm"
            loading={submitting}
            onClick={() => void handleCreate()}
          >
            追加
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            キャンセル
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {methods.length === 0 && !adding && !isOrphan && (
        <p className="text-xs text-slate-500">
          まだ支払い方法が登録されていません。「新規追加」から登録してください。
        </p>
      )}
    </div>
  )
}
