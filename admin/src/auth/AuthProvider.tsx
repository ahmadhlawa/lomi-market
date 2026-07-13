import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { api, jsonBody, sessionStore } from '../api/client'
import type { Tokens, User } from '../types'

type AuthValue = {
  user: User | null
  authenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const USER_KEY = 'lomi:admin-user'
const AuthContext = createContext<AuthValue | null>(null)

function storedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storedUser())

  const value = useMemo<AuthValue>(() => ({
    user,
    authenticated: Boolean(user && sessionStore.get()),
    async login(email, password) {
      const result = await api<Tokens>('/auth/admin/login', { method: 'POST', ...jsonBody({ email, password }) }, false)
      sessionStore.set({ accessToken: result.access_token, refreshToken: result.refresh_token })
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      setUser(result.user)
    },
    async logout() {
      const session = sessionStore.get()
      if (session) {
        try { await api('/auth/logout', { method: 'POST', ...jsonBody({ refresh_token: session.refreshToken }) }, false) } catch { /* local logout still succeeds */ }
      }
      sessionStore.clear()
      localStorage.removeItem(USER_KEY)
      setUser(null)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth.authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
