import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState } from '../lib/types'

interface AuthStore extends AuthState {
  setAuth: (token: string, workspaceId: string, email: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      workspaceId: null,
      email: null,
      role: null,

      setAuth: (token, workspaceId, email, role) =>
        set({ token, workspaceId, email, role }),

      clearAuth: () =>
        set({ token: null, workspaceId: null, email: null, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
