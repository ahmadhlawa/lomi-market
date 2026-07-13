import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { z } from 'zod'

import { ApiError } from '../api/client'
import { useAuth } from './AuthProvider'

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(10, 'Password must contain at least 10 characters'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setServerError('')
    try {
      await auth.login(values.email, values.password)
      const target = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(target, { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'Unable to connect to Lomi Market')
    }
  })

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">LOMI</div>
        <p className="eyebrow">STORE OPERATIONS</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Sign in to manage orders, products and delivery.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="email">Email</label>
          <div className="input-wrap"><Mail size={18} /><input id="email" type="email" autoComplete="username" {...register('email')} /></div>
          {errors.email && <p className="field-error">{errors.email.message}</p>}
          <label htmlFor="password">Password</label>
          <div className="input-wrap"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="current-password" {...register('password')} /></div>
          {errors.password && <p className="field-error">{errors.password.message}</p>}
          {serverError && <div className="alert error" role="alert">{serverError}</div>}
          <button className="primary full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="login-note">Development account credentials are defined by the backend environment.</p>
      </section>
      <aside className="login-art" aria-label="Lomi Market brand statement">
        <span>RAMALLAH · PALESTINE</span>
        <h2>Fresh operations.<br />Beautifully controlled.</h2>
        <p>One workspace for the catalog, orders, customers, delivery and store settings.</p>
      </aside>
    </main>
  )
}
