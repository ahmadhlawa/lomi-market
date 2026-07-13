import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

test('submits admin credentials and shows API errors accessibly', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ detail: 'Invalid email or password', code: 'invalid_credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider><LoginPage /></AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/email/i), 'admin@lomi.ps')
  await user.type(screen.getByLabelText(/password/i), 'wrong-password')
  await user.click(screen.getByRole('button', { name: /sign in/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
})
