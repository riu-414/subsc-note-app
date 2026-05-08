import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
} from '@/types/database'

export type SubscriptionWithGenres = Subscription & {
  genreIds: string[]
}

type UseSubscriptionsResult = {
  subscriptions: SubscriptionWithGenres[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createSubscription: (
    input: Omit<SubscriptionInsert, 'user_id'>,
    genreIds: string[],
  ) => Promise<Subscription>
  updateSubscription: (
    id: string,
    input: SubscriptionUpdate,
    genreIds: string[],
  ) => Promise<void>
  setStatus: (id: string, status: 'active' | 'archived') => Promise<void>
}

export const useSubscriptions = (userId: string): UseSubscriptionsResult => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithGenres[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*, subscription_genres(genre_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const rows = (data ?? []).map((row) => {
        const { subscription_genres, ...rest } = row as Subscription & {
          subscription_genres: { genre_id: string }[] | null
        }
        return {
          ...rest,
          genreIds: subscription_genres?.map((sg) => sg.genre_id) ?? [],
        }
      })
      setSubscriptions(rows)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [fetchAll])

  const replaceGenres = async (subscriptionId: string, genreIds: string[]) => {
    const { error: deleteError } = await supabase
      .from('subscription_genres')
      .delete()
      .eq('subscription_id', subscriptionId)
    if (deleteError) throw deleteError

    if (genreIds.length === 0) return

    const rows = genreIds.map((genreId) => ({
      subscription_id: subscriptionId,
      genre_id: genreId,
    }))
    const { error: insertError } = await supabase
      .from('subscription_genres')
      .insert(rows)
    if (insertError) throw insertError
  }

  const createSubscription = async (
    input: Omit<SubscriptionInsert, 'user_id'>,
    genreIds: string[],
  ): Promise<Subscription> => {
    const { data, error: insertError } = await supabase
      .from('subscriptions')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (insertError) throw insertError

    const created = data as Subscription
    if (genreIds.length > 0) {
      await replaceGenres(created.id, genreIds)
    }
    await fetchAll()
    return created
  }

  const updateSubscription = async (
    id: string,
    input: SubscriptionUpdate,
    genreIds: string[],
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(input)
      .eq('id', id)
    if (updateError) throw updateError

    await replaceGenres(id, genreIds)
    await fetchAll()
  }

  const setStatus = async (
    id: string,
    status: 'active' | 'archived',
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', id)
    if (updateError) throw updateError
    await fetchAll()
  }

  return {
    subscriptions,
    loading,
    error,
    refresh: fetchAll,
    createSubscription,
    updateSubscription,
    setStatus,
  }
}
