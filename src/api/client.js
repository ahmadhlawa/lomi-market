import { clearSession, getSession, saveSession } from './storage';

const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
let session = null;
let refreshPromise = null;
let sessionExpiredHandler = null;

export class ApiError extends Error {
  constructor(message, status, code, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

export function setApiSession(next) {
  session = next;
}

export async function restoreApiSession() {
  session = await getSession();
  return session;
}

async function refreshSession() {
  if (!session?.refreshToken) return false;
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) {
    session = null;
    await clearSession();
    sessionExpiredHandler?.();
    return false;
  }
  const data = await response.json();
  session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };
  await saveSession(session);
  return true;
}

async function toError(response) {
  try {
    const data = await response.json();
    return new ApiError(data.detail || 'Request failed', response.status, data.code, data.field_errors);
  } catch {
    return new ApiError(`Request failed (${response.status})`, response.status, 'request_failed');
  }
}

export async function api(path, options = {}, canRefresh = true) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (response.status === 401 && canRefresh && session?.refreshToken) {
    refreshPromise ||= refreshSession().finally(() => { refreshPromise = null; });
    if (await refreshPromise) return api(path, options, false);
  }
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return null;
  return response.json();
}

export const jsonOptions = (method, body) => ({ method, body: JSON.stringify(body) });

