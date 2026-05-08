import type { User } from '@supabase/supabase-js'
import { AppHeader } from '@/components/layout/AppHeader'
import { SubscriptionsView } from '@/components/subscriptions/SubscriptionsView'

type DashboardProps = {
  user: User
}

export const Dashboard = ({ user }: DashboardProps) => {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <SubscriptionsView userId={user.id} />
      </main>
    </div>
  )
}
