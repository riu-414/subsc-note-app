import { useAuth } from '@/hooks/useAuth'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Dashboard } from '@/components/layout/Dashboard'

const App = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-slate-500">
        読み込み中…
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <Dashboard user={user} />
}

export default App
