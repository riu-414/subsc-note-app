import { LogOut, Wallet } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { ExchangeRatesStatus } from '@/components/layout/ExchangeRatesStatus'

type AppHeaderProps = {
  user: User
}

export const AppHeader = ({ user }: AppHeaderProps) => {
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('サインアウトに失敗しました', err)
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
          <Wallet className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-slate-900">Subsc Note</p>
          <p
            className="max-w-[60vw] truncate text-xs text-slate-500 sm:max-w-none"
            title={user.email ?? undefined}
          >
            {user.email}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ExchangeRatesStatus />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSignOut}
          aria-label="サインアウト"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">サインアウト</span>
        </Button>
      </div>
    </header>
  )
}
