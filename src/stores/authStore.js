import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
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
