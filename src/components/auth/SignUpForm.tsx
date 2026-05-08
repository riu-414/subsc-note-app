import { useState, type FormEvent } from 'react'
import { signUpWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

type SignUpFormProps = {
  onSwitchToLogin: () => void
}

export const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      const result = await signUpWithPassword({ email, password })
      if (result.session) {
        return
      }
      setInfo('確認メールを送信しました。メール内のリンクからログインしてください。')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'サインアップに失敗しました'
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
        autoComplete="new-password"
        required
        minLength={6}
        hint="6文字以上"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info}
        </p>
      )}
      <Button type="submit" loading={submitting} className="w-full">
        新規登録
      </Button>
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-center text-sm text-violet-600 hover:underline"
      >
        既にアカウントをお持ちの方はこちら
      </button>
    </form>
  )
}
