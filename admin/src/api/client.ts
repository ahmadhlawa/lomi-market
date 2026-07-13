import type { ApiErrorBody } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const STORAGE_KEY = 'lomi:admin-session'

type Session = { accessToken: string; refreshToken: string }

export const sessionStore = {
  get(): Session | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY)
      return value ? (JSON.parse(value) as Session) : null
    } catch {
      return null
    }
  },
  set(value: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string[]>

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code || 'request_failed'
    this.fields = body.field_errors
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  const current = sessionStore.get()
  if (!current?.refreshToken) return false
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: current.refreshToken }),
  })
  if (!response.ok) {
    sessionStore.clear()
    return false
  }
  const data = (await response.json()) as { access_token: string; refresh_token: string }
  sessionStore.set({ accessToken: data.access_token, refreshToken: data.refresh_token })
  return true
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    return new ApiError(response.status, (await response.json()) as ApiErrorBody)
  } catch {
    return new ApiError(response.status, { detail: `Request failed (${response.status})`, code: 'request_failed' })
  }
}

export async function api<T>(path: string, init: RequestInit = {}, canRefresh = true): Promise<T> {
  const session = sessionStore.get()
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (response.status === 401 && canRefresh && session?.refreshToken) {
    refreshPromise ??= refreshSession().finally(() => { refreshPromise = null })
    if (await refreshPromise) return api<T>(path, init, false)
  }
  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const jsonBody = (value: unknown): Pick<RequestInit, 'body' | 'headers'> => ({
  body: JSON.stringify(value),
  headers: { 'Content-Type': 'application/json' },
})
