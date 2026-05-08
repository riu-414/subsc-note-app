import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PaymentMethod } from '@/types/database'

type UsePaymentMethodsResult = {
  methods: PaymentMethod[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createMethod: (name: string) => Promise<PaymentMethod>
  updateMethod: (id: string, name: string) => Promise<void>
  deleteMethod: (id: string) => Promise<void>
}

export const usePaymentMethods = (userId: string): UsePaymentMethodsResult => {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (fetchError) throw fetchError
      setMethods((data ?? []) as PaymentMethod[])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '支払い方法の取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [fetchAll])

  const createMethod = async (name: string): Promise<PaymentMethod> => {
    const { data, error: insertError } = await supabase
      .from('payment_methods')
      .insert({ name, user_id: userId })
      .select()
      .single()
    if (insertError) throw insertError
    await fetchAll()
    return data as PaymentMethod
  }

  const updateMethod = async (id: string, name: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from('payment_methods')
      .update({ name })
      .eq('id', id)
    if (updateError) throw updateError
    await fetchAll()
  }

  const deleteMethod = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
    if (deleteError) throw deleteError
    await fetchAll()
  }

  return {
    methods,
    loading,
    error,
    refresh: fetchAll,
    createMethod,
    updateMethod,
    deleteMethod,
  }
}
