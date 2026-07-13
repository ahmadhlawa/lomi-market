import { api, sessionStore } from './client'

test('refreshes an expired access token once and retries the request', async () => {
  sessionStore.set({ accessToken: 'old', refreshToken: 'refresh' })
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  fetchMock
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'new', refresh_token: 'new-refresh' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ total_orders: 4 }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

  const result = await api<{ total_orders: number }>('/admin/dashboard')
  expect(result.total_orders).toBe(4)
  expect(sessionStore.get()?.accessToken).toBe('new')
  expect(fetchMock).toHaveBeenCalledTimes(3)
})
