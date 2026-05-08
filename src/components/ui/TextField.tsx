import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export const TextField = ({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: TextFieldProps) => {
  const inputId = id ?? props.name
  return (
    <label className="flex flex-col gap-1" htmlFor={inputId}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        id={inputId}
        className={cn(
          'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
          className,
        )}
      />
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}
