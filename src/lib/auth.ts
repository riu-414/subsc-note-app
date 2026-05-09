import { supabase } from '@/lib/supabase'

export type AuthCredentials = {
  email: string
  password: string
}

export const signInWithPassword = async ({ email, password }: AuthCredentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

const getEmailRedirectTo = () => {
  if (typeof window === 'undefined') return undefined
  return window.location.origin
}

export const signUpWithPassword = async ({ email, password }: AuthCredentials) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
