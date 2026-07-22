import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState } from '../lib/types'

/**
 * Session fields as returned by the auth endpoints. Passed as an object rather
 * than positionally: the list grew past the point where four bare arguments at
 * a call site said anything about which was which.
 */
export interface AuthSession {
  token: string
  workspaceId: string
  email: string
  role: string
  workspaceName?: string | null
}

interface AuthStore extends AuthState {
  setAuth: (session: AuthSession) => void
  clearAuth: () => void
}

const EMPTY: AuthState = {
  token: null,
  workspaceId: null,
  email: null,
  role: null,
  workspaceName: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...EMPTY,

      setAuth: ({ token, workspaceId, email, role, workspaceName = null }) =>
        set({ token, workspaceId, email, role, workspaceName }),

      clearAuth: () => set({ ...EMPTY }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
