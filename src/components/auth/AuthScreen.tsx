import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'

type Mode = 'login' | 'signup'

export const AuthScreen = () => {
  const [mode, setMode] = useState<Mode>('login')

  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white">
            <Wallet className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold text-slate-900">Subsc Note</h1>
          <p className="text-sm text-slate-500">
            サブスクリプションを一元管理して支出を最適化
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-center text-base font-medium text-slate-800">
            {mode === 'login' ? 'ログイン' : '新規アカウント登録'}
          </h2>
          {mode === 'login' ? (
            <LoginForm onSwitchToSignUp={() => setMode('signup')} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
