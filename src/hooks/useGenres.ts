import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Genre, GenreInsert, GenreUpdate } from '@/types/database'

type UseGenresResult = {
  genres: Genre[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createGenre: (input: Omit<GenreInsert, 'user_id'>) => Promise<Genre>
  createGenres: (
    inputs: ReadonlyArray<Omit<GenreInsert, 'user_id'>>,
  ) => Promise<Genre[]>
  updateGenre: (id: string, input: GenreUpdate) => Promise<void>
  deleteGenre: (id: string) => Promise<void>
}

export const useGenres = (userId: string): UseGenresResult => {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('genres')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (fetchError) throw fetchError
      setGenres((data ?? []) as Genre[])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ジャンル取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [fetchAll])

  const createGenre = async (
    input: Omit<GenreInsert, 'user_id'>,
  ): Promise<Genre> => {
    const { data, error: insertError } = await supabase
      .from('genres')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (insertError) throw insertError
    await fetchAll()
    return data as Genre
  }

  const createGenres = async (
    inputs: ReadonlyArray<Omit<GenreInsert, 'user_id'>>,
  ): Promise<Genre[]> => {
    if (inputs.length === 0) return []
    const rows = inputs.map((input) => ({ ...input, user_id: userId }))
    const { data, error: insertError } = await supabase
      .from('genres')
      .insert(rows)
      .select()
    if (insertError) throw insertError
    await fetchAll()
    return (data ?? []) as Genre[]
  }

  const updateGenre = async (id: string, input: GenreUpdate): Promise<void> => {
    const { error: updateError } = await supabase
      .from('genres')
      .update(input)
      .eq('id', id)
    if (updateError) throw updateError
    await fetchAll()
  }

  const deleteGenre = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('genres')
      .delete()
      .eq('id', id)
    if (deleteError) throw deleteError
    await fetchAll()
  }

  return {
    genres,
    loading,
    error,
    refresh: fetchAll,
    createGenre,
    createGenres,
    updateGenre,
    deleteGenre,
  }
}
