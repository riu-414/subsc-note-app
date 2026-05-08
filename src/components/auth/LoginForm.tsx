import { useState, type FormEvent } from 'react'
import { signInWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

type LoginFormProps = {
  onSwitchToSignUp: () => void
}

export const LoginForm = ({ onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPassword({ email, password })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="パスワード"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <Button type="submit" loading={submitting} className="w-full">
        ログイン
      </Button>
      <button
        type="button"
        onClick={onSwitchToSignUp}
        className="text-center text-sm text-violet-600 hover:underline"
      >
        アカウントをお持ちでない方はこちら
      </button>
    </form>
  )
}
