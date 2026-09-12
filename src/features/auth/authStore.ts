import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'

interface AuthState {
  session: Session | null
  initialized: boolean
  init: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initialized: true })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, initialized: true })
    })
  },
}))
